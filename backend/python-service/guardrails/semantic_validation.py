import json
import re
from typing import List

from clients.ollama_client import OllamaClient
from core.json_extract import extract_json
from core.languages import LANGUAGE_KEYS
from guardrails.grammar import validate_answer_and_grammar
from guardrails.output_validation import OutputValidationError
from guardrails.prompt_injection import security_rules, untrusted_field
from schemas.retry_tasks import NewCorrectTask

_NON_LATIN = re.compile(r"[\u0400-\u04FF\u0600-\u06FF\u3040-\u30FF\u4E00-\u9FFF]")
_LATIN_WORD = re.compile(r"[A-Za-z']+")
_ENGLISH_MARKERS = {
    "the", "a", "an", "is", "are", "was", "were", "be", "to", "of", "and",
    "in", "on", "for", "with", "she", "he", "they", "we", "you", "i",
    "what", "does", "do", "not", "true", "false", "choose", "complete",
    "synonym", "antonym", "opposite", "every", "yesterday", "now",
}

_VOCAB_NAME_MARKERS = (
    "synonym", "antonym", "opposite", "means", "meaning", "define", "word for",
)
_ARTICLE_ANSWERS = {"a", "an", "the", "-", "no article"}
_TO_BE_ANSWERS = {"am", "is", "are", "was", "were", "be"}
_THERE_PATTERN = re.compile(r"\bthere\b", re.IGNORECASE)

_JUDGE_SCHEMA = {
    "type": "object",
    "properties": {
        "matches_topic": {"type": "boolean"},
        "reason": {"type": "string"},
    },
    "required": ["matches_topic", "reason"],
    "additionalProperties": False,
}


async def validate_retry_task_semantics(task: NewCorrectTask, language: str) -> None:
    errors = _language_errors(task, language)
    if errors:
        raise OutputValidationError("; ".join(errors))

    topic_verdict, topic_errors = _topic_verdict(task)
    if topic_verdict == "fail":
        raise OutputValidationError("; ".join(topic_errors))
    if topic_verdict == "uncertain":
        topic_errors = await _judge_topic(task)
        if topic_errors:
            raise OutputValidationError("; ".join(topic_errors))

    validate_answer_and_grammar(task)


def _task_text(task: NewCorrectTask) -> str:
    parts = [task.name, task.answer, *(task.options or [])]
    return " ".join(part for part in parts if part)


def _language_errors(task: NewCorrectTask, language: str) -> List[str]:
    if LANGUAGE_KEYS.get(language.strip().casefold()) != "en":
        return [f'unsupported language for semantic check: "{language}"']

    text = _task_text(task)
    letters = re.findall(r"[^\W\d_]", text, flags=re.UNICODE)
    if not letters:
        return ["task text has no letters"]

    non_latin = _NON_LATIN.findall(text)
    if len(non_latin) / len(letters) > 0.15:
        return ["task must be in English, found non-Latin script"]

    words = [word.casefold() for word in _LATIN_WORD.findall(text)]
    marker_hits = sum(1 for word in words if word in _ENGLISH_MARKERS)
    if marker_hits >= 2:
        return []
    if marker_hits == 1 and len(words) <= 8:
        return []

    return ['task does not look like English']


def _normalize_topic(name: str) -> str:
    return " ".join(name.casefold().replace("/", " ").replace("-", " ").split())


def _is_vocabulary_topic(name: str) -> bool:
    normalized = _normalize_topic(name)
    return "vocabulary" in normalized or normalized == "vocab"


def _topic_verdict(task: NewCorrectTask) -> tuple[str, List[str]]:
    topic = _normalize_topic(task.topic)
    name = task.name.casefold()
    answer = task.answer.casefold().strip()

    if _is_vocabulary_topic(task.topic):
        if _looks_like_form_drill(task) and not _has_vocab_framing(name):
            return "fail", [f'task tests grammar form, not "{task.topic}"']
        return "pass", []

    if topic == "grammar":
        if _has_vocab_framing(name) and not _looks_like_form_drill(task):
            return "fail", [f'task tests vocabulary, not "{task.topic}"']
        return "pass", []

    if "article" in topic:
        if _THERE_PATTERN.search(task.name) and answer not in _ARTICLE_ANSWERS:
            return "fail", [f'task tests there is/are, not "{task.topic}"']
        if answer in _ARTICLE_ANSWERS or "article" in name:
            return "pass", []
        return "fail", [f'task does not appear to test "{task.topic}"']

    if topic in {"to be", "verb to be"}:
        if answer in _TO_BE_ANSWERS:
            return "pass", []
        return "fail", [f'task does not appear to test "{task.topic}"']

    if "present simple" in topic:
        if any(marker in name for marker in ("now", "right now", "at the moment", "look!")):
            return "fail", [f'task looks like Present Continuous, not "{task.topic}"']
        return "uncertain", []

    return "uncertain", []


def _has_vocab_framing(name: str) -> bool:
    return any(marker in name for marker in _VOCAB_NAME_MARKERS)


def _looks_like_form_drill(task: NewCorrectTask) -> bool:
    options = [option.casefold().strip() for option in task.options]
    if not options:
        return False
    if set(options) <= _TO_BE_ANSWERS | {"been", "being"}:
        return True
    if set(options) <= _ARTICLE_ANSWERS:
        return True
    verb_like = 0
    for option in options:
        if " " in option:
            continue
        if option.endswith(("ing", "ed", "s", "es")) or option in {
            "go", "went", "gone", "do", "did", "done", "have", "had", "has",
        }:
            verb_like += 1
    return verb_like >= 3


async def _judge_topic(task: NewCorrectTask) -> List[str]:
    options = ", ".join(task.options) if task.options else "(none)"
    prompt = f"""
        Decide if this exercise really tests the declared topic.
        {security_rules()}

        Declared topic: {task.topic}
        Exercise: {untrusted_field(task.name, "exercise")}
        Answer: {untrusted_field(task.answer, "answer")}
        Options: {untrusted_field(options, "options")}

        matches_topic is true only if a learner would practice "{task.topic}"
        by solving this exercise. If it tests a different skill or grammar point,
        matches_topic is false.
        reason: one short sentence.
    """

    try:
        async with OllamaClient() as client:
            raw = await client.generate(prompt, format=_JUDGE_SCHEMA, num_predict=80)
    except Exception as e:
        print(f"Topic judge error: {type(e).__name__}: {e}")
        raise OutputValidationError(f"topic judge failed: {e}") from e

    if not raw or not raw.strip():
        raise OutputValidationError("topic judge returned an empty response")

    try:
        data = json.loads(extract_json(raw))
    except Exception as e:
        raise OutputValidationError(f"topic judge returned invalid JSON: {e}") from e

    if data.get("matches_topic") is True:
        return []

    reason = str(data.get("reason") or "topic mismatch").strip()
    return [f'task does not match topic "{task.topic}": {reason}']
