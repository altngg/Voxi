from schemas.test_results import TestResultsRequest, TestResultsResponse
from clients.ollama_client import OllamaClient
import pydantic
from fastapi import HTTPException

async def evaluate_test_results(request: TestResultsRequest) -> TestResultsResponse:
    prompt = convert_test_results_to_prompt(request)

    try:
        response = await OllamaClient().generate(prompt)
    except Exception as e:
        print(f"Error details: {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

    try:
        test_results = TestResultsResponse.model_validate_json(response)
    except pydantic.ValidationError as e:
        print(f"Error details: {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

    return test_results

def convert_test_results_to_prompt(request: TestResultsRequest) -> str:
    levels_str = ", ".join(request.levels)
    topics_str = ", ".join(request.topics)

    tasks = request.tasks_results

    tasks_results_str = ""
    for task in tasks:
        tasks_results_str += f"Задание: {task.name}\n"
        tasks_results_str += f"Правильный ответ: {task.answer}\n"
        tasks_results_str += f"Тема задания: {task.topic}\n"
        tasks_results_str += f"Ответ пользователя: {task.user_answer}\n"
        tasks_results_str += f"--------------------------------\n"

    print(tasks_results_str)
    
    prompt = f"""
        Вы профессиональный преподаватель {request.language} языка.
        Вам нужно проверить результаты теста и оценить уровень владения языком.

        ВХОДНЫЕ ДАННЫЕ:
            - Язык: {request.language}
            - Возможные уровни языка: {levels_str}
            - Возможные темы заданий: {topics_str}
            - Результаты прохождения заданий: {tasks_results_str}
        
        ПРАВИЛА ОЦЕНКИ:
            - Если ответ пользователя совпадает с правильным ответом, то задание считается выполненным.
            - Если ответ пользователя не совпадает с правильным ответом, но соответствует грамматическим правилам языка и подходит по смыслу, то задание считается выполненным частично.
            - Если ответ пользователя не совпадает с правильным ответом, то задание считается не выполненным.
            - Общий уровень владения языком (overall_level) должен быть одним из возможных уровней языка {levels_str}.
            - Оценка по грамматике (grammar_score) должна быть в диапазоне от 0 до 100.
            - Оценка по словарю (vocabulary_score) должна быть в диапазоне от 0 до 100.
            - Оценка по теме (topic_scores) должна быть в диапазоне от 0 до 12, все топики должны соответствовать предложенным {topics_str}

        ФОРМАТ ОТВЕТА: STRICT JSON
            overall_level: str;
            grammar_score: int;
            vocabulary_score: int;
            topic_scores: 
                topic: str;
                score: int;
    """
    return prompt
