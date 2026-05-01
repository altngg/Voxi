from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional
from routes import router

from clients.ollama_client import OllamaClient


app = FastAPI(title="Python AI Service")

ollama_client = OllamaClient()

app.include_router(router)