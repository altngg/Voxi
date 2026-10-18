# Voxi

Веб сервис для изучения языков

- `frontend` - React + Vite - `http://localhost/api`
- `backend/java-service` - Java SpringBoot
- `backend/python-service` - FastAPI, генерация через Ollama
- Postgres и nginx запускаются в Docker

## Запуск и работа с проектом

Нужны Docker Desktop и Node.js 22. Порт 80 должен быть свободен.
В корне репозитория `.env`:

Первый запуск:

```powershell
docker compose up -d --build
```

Дальше образы заново не собираются:

```powershell
docker compose up -d --no-build
```

Фронтенд пока что во втором терминале: TODO

```powershell
cd frontend
npm install
npm run dev
```

Локально проект на http://localhost:5173.

Правки в `backend/python-service` подхватываются сами: папка смонтирована в контейнер, uvicorn запущен с `--reload`. Пересобирать Python нужно только после изменения `requirements.txt`:

```powershell
docker compose up -d --build voxi-python
```
