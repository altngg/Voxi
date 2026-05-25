from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    ollama_url: str
    ollama_model: str
    ollama_num_ctx: int = 1024
    ollama_num_predict: int = 300
    ollama_keep_alive: str = "30m"

settings = Settings()