#!/bin/sh
set -e

ollama serve &
sleep 5
ollama pull "${OLLAMA_MODEL:-qwen2.5:7b}"
wait
