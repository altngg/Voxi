import asyncio
import hashlib
import json
import time
import uuid
from collections.abc import Awaitable, Callable
from contextlib import asynccontextmanager
from typing import Any, AsyncIterator, TypeVar

from core.config import settings

# One Ollama call times out at 120s and validation retries twice, so a holder
# can outlive a single lock TTL. The holder keeps refreshing; waiters follow the lock.
_LOCK_TTL_SECONDS = 30
_LOCK_RENEW_SECONDS = 10
_LOCK_WAIT_SECONDS = 300
_LOCK_WAIT_INTERVAL_SECONDS = 0.25
_REDIS_SOCKET_TIMEOUT_SECONDS = 1.0

_RENEW_LOCK_SCRIPT = """
if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("expire", KEYS[1], tonumber(ARGV[2]))
end
return 0
"""

_RELEASE_LOCK_SCRIPT = """
if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
end
return 0
"""

_redis = None
_redis_publish_lock = asyncio.Lock()
T = TypeVar("T")


def _canonical_json(payload: Any) -> str:
    return json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def cache_key(kind: str, payload: Any) -> str:
    digest = hashlib.sha256(_canonical_json(payload).encode("utf-8")).hexdigest()
    return f"voxi:{kind}:{digest}"


def _lock_key(kind: str, payload: Any) -> str:
    digest = hashlib.sha256(_canonical_json(payload).encode("utf-8")).hexdigest()
    return f"voxi:lock:{kind}:{digest}"


def _redis_url() -> str | None:
    url = (settings.redis_url or "").strip()
    return url or None


async def _close_client(client) -> None:
    try:
        await client.aclose()
    except Exception:
        pass


async def _invalidate(client) -> None:
    global _redis
    if _redis is client:
        _redis = None
    await _close_client(client)


async def _client():
    global _redis
    url = _redis_url()
    if not url:
        return None
    if _redis is not None:
        return _redis

    client = None
    try:
        from redis.asyncio import Redis

        client = Redis.from_url(
            url,
            decode_responses=True,
            socket_connect_timeout=_REDIS_SOCKET_TIMEOUT_SECONDS,
            socket_timeout=_REDIS_SOCKET_TIMEOUT_SECONDS,
        )
        await client.ping()
    except Exception as e:
        print(f"Ollama cache: redis unavailable: {e}")
        if client is not None:
            await _close_client(client)
        return None

    async with _redis_publish_lock:
        if _redis is None:
            _redis = client
            return _redis
    await _close_client(client)
    return _redis


def _safe_parse(parse: Callable[[Any], T | None], raw: Any) -> T | None:
    if raw is None:
        return None
    try:
        return parse(raw)
    except Exception:
        return None


async def get_json(
    kind: str, payload: Any, *, log: bool = True
) -> dict[str, Any] | None:
    client = await _client()
    if client is None:
        return None
    key = cache_key(kind, payload)
    try:
        raw = await client.get(key)
    except Exception as e:
        print(f"Ollama cache get error: {e}")
        await _invalidate(client)
        return None
    if raw is None:
        if log:
            print(f"Ollama cache miss: {kind} {key}")
        return None
    try:
        value = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"Ollama cache invalid JSON for {key}: {e}")
        return None
    if not isinstance(value, dict):
        print(f"Ollama cache skip non-object for {key}")
        return None
    if log:
        print(f"Ollama cache hit: {kind} {key}")
    return value


async def set_json(kind: str, payload: Any, value: dict[str, Any]) -> None:
    if not isinstance(value, dict):
        return
    client = await _client()
    if client is None:
        return
    key = cache_key(kind, payload)
    try:
        await client.set(
            key,
            json.dumps(value, ensure_ascii=False, separators=(",", ":")),
            ex=settings.ollama_cache_ttl_seconds,
        )
        print(f"Ollama cache set: {kind} {key}")
    except Exception as e:
        print(f"Ollama cache set error: {e}")
        await _invalidate(client)


async def _renew_lock(lock_key: str, token: str) -> None:
    while True:
        await asyncio.sleep(_LOCK_RENEW_SECONDS)
        client = await _client()
        if client is None:
            continue
        try:
            renewed = await client.eval(
                _RENEW_LOCK_SCRIPT, 1, lock_key, token, str(_LOCK_TTL_SECONDS)
            )
        except Exception as e:
            print(f"Ollama cache lock renew error: {e}")
            await _invalidate(client)
            continue
        if int(renewed or 0) != 1:
            return


async def _release_lock(lock_key: str, token: str) -> None:
    client = await _client()
    if client is None:
        return
    try:
        await client.eval(_RELEASE_LOCK_SCRIPT, 1, lock_key, token)
    except Exception as e:
        print(f"Ollama cache unlock error: {e}")
        await _invalidate(client)


@asynccontextmanager
async def inflight(kind: str, payload: Any) -> AsyncIterator[None]:
    client = await _client()
    if client is None:
        yield
        return

    lock_key = _lock_key(kind, payload)
    token = uuid.uuid4().hex
    try:
        acquired = await client.set(lock_key, token, nx=True, ex=_LOCK_TTL_SECONDS)
    except Exception as e:
        print(f"Ollama cache lock error: {e}")
        await _invalidate(client)
        yield
        return

    if acquired:
        renew_task = asyncio.create_task(_renew_lock(lock_key, token))
        try:
            yield
        finally:
            renew_task.cancel()
            try:
                await renew_task
            except asyncio.CancelledError:
                pass
            await _release_lock(lock_key, token)
        return

    deadline = time.monotonic() + _LOCK_WAIT_SECONDS
    while time.monotonic() < deadline:
        cached = await get_json(kind, payload, log=False)
        if cached is not None:
            break
        current = await _client()
        if current is None:
            break
        try:
            if not await current.exists(lock_key):
                break
        except Exception as e:
            print(f"Ollama cache lock wait error: {e}")
            await _invalidate(current)
            break
        await asyncio.sleep(_LOCK_WAIT_INTERVAL_SECONDS)
    yield


async def get_or_fill(
    kind: str,
    payload: dict[str, Any],
    *,
    parse: Callable[[Any], T | None],
    compute: Callable[[], Awaitable[T]],
    dump: Callable[[T], dict[str, Any]],
) -> T:
    cached = _safe_parse(parse, await get_json(kind, payload))
    if cached is not None:
        return cached

    async with inflight(kind, payload):
        cached = _safe_parse(parse, await get_json(kind, payload))
        if cached is not None:
            return cached
        value = await compute()
        dumped = dump(value)
        if isinstance(dumped, dict):
            await set_json(kind, payload, dumped)
        return value
