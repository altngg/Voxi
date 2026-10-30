from schemas.test_results import TaskEvaluationScore, TestResultsIncomplete, TestResultsRequest, TestResultsResponse, TopicScore
from clients.ollama_client import OllamaClient
import pydantic
from fastapi import HTTPException
import json
import re
from typing import Dict, List


LANGUAGE_KEYS = {
    "en": "en",
    "english": "en",
}

LEVELS_CONFIG = [ "A1", "A2", "B1", "B2", "C1", "C2" ]

LANGUAGE_CONFIG = {
    "en": {
        "grammar_topics" : [ "Present Simple", "Present Continuous", "Present Perfect", "Present Perfect Continuous" ],
        "levels_criteria" : {
            "A1": {
                "grammar_min": 40,
                "vocabulary_min": 40,
                "topics": {
                    "Present Simple": 8,
                    "to be": 8,
                    "Articles": 6,
                    "Pronouns": 6,
                    "There is / There are": 6,
                },
            },
            "A2": {
                "grammar_min": 50,
                "vocabulary_min": 50,
                "topics": {
                    "Present Simple": 8,
                    "Present Continuous": 8,
                    "Past Simple": 7,
                    "Articles": 7,
                    "Countable / Uncountable nouns": 7,
                    "Comparatives and Superlatives": 7,
                },
            },
            "B1": {
                "grammar_min": 60,
                "vocabulary_min": 60,
                "topics": {
                    "Present Simple": 8,
                    "Present Continuous": 8,
                    "Past Simple": 8,
                    "Present Perfect": 8,
                    "Future forms": 8,
                    "Modal verbs": 8,
                    "First Conditional": 7,
                },
            },
            "B2": {
                "grammar_min": 70,
                "vocabulary_min": 70,
                "topics": {
                    "Present Perfect": 9,
                    "Present Perfect Continuous": 8,
                    "Passive Voice": 8,
                    "Reported Speech": 8,
                    "Second Conditional": 8,
                    "Third Conditional": 7,
                    "Relative clauses": 8,
                },
            },
            "C1": {
                "grammar_min": 80,
                "vocabulary_min": 80,
                "topics": {
                    "Mixed Conditionals": 9,
                    "Inversion": 8,
                    "Cleft sentences": 8,
                    "Advanced modal verbs": 9,
                    "Advanced participle clauses": 8,
                },
            },
            "C2": {
                "grammar_min": 90,
                "vocabulary_min": 90,
                "topics": {
                    "Advanced conditionals": 10,
                    "Inversion": 10,
                    "Complex clause structures": 10,
                    "Advanced tense and aspect contrasts": 10,
                    "Advanced modal and pragmatic usage": 10,
                },
            },
        }
    }
}


async def evaluate_tasks_results(request: TestResultsRequest) -> TaskEvaluationScore:
    prompt = convert_test_results_to_prompt(request)
    tasks_count = len(request.tasks_results)

    json_schema = {
        "type": "object",
        "properties": {
            "vocabulary_score": {
                "type": "integer",
                "minimum": 0,
                "maximum": 100,
            },
            "tasks_scores": {
                "type": "array",
                "minItems": tasks_count,
                "maxItems": tasks_count,
                "items": {
                    "type": "object",
                    "properties": {
                        "topic": {
                            "type": "string",
                            "enum": request.topics, # topics can repeat, can't fix it here
                        },
                        "is_correct": {
                            "type": "boolean",
                        },
                    },
                    "required": ["topic", "is_correct"],
                },
            },
        },
        "required": [
            "vocabulary_score",
            "tasks_scores",
        ],
    }

    try:
        async with OllamaClient() as client:
            raw_response = await client.generate(prompt, format=json_schema)
    except Exception as e:
        print(f"Error details: {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

    if not raw_response or not raw_response.strip():
        raise HTTPException(status_code=500, detail="Empty response from Ollama")

    json_str = extract_json(raw_response)

    try:
        return TaskEvaluationScore.model_validate_json(json_str)
    except pydantic.ValidationError as e:
        print(f"Validation error: {e}\nRaw response: {raw_response}")
        raise HTTPException(
            status_code=500, detail=f"Invalid response format: {str(e)}"
        )
    except json.JSONDecodeError as e:
        print(f"JSON decode error: {e}\nRaw response: {raw_response}")
        raise HTTPException(
            status_code=500, detail=f"Invalid JSON in response: {str(e)}"
        )


def extract_json(text: str) -> str:
    json_match = re.search(r"\{.*\}", text, re.DOTALL)
    if json_match:
        return json_match.group()
    return text


def convert_test_results_to_prompt(request: TestResultsRequest) -> str:
    tasks_count = len(request.tasks_results)
    topics_str = ", ".join(request.topics)

    tasks_results_str = ""
    for i, task in enumerate(request.tasks_results, 1):
        tasks_results_str += f"\n{i}. task: {task.name}\n"
        tasks_results_str += f"   topic: {task.topic}\n"
        tasks_results_str += f"   correct answer: {task.answer}\n"
        tasks_results_str += f"   user answer: {task.user_answer}\n"

    return f"""
        Check if each task in {request.language} is correct. Do not merge tasks.

        Tasks, in order:
        {tasks_results_str}

        Allowed topic names: {topics_str}

        For each task set is_correct by the target of that task, not by whether the sentence is grammatical English.

        is_correct is true only when the user answer is an acceptable form of the correct answer:
        - the same answer, ignoring letter case and extra spaces
        - the same grammar and meaning in another written form: doesn't / does not, it's / it is, no article / "-" when the correct answer is "no article"
        - the user answer makes sense grammatically and semantically, even if does not match the correct answer exactly

        is_correct is false when:
        - the user answer is missing
        - the user entered a random string
        - the required grammar or word is wrong

        tasks_scores: an array of exactly {tasks_count} objects, one per task, in the same order as the list above.
        Object number i belongs to task number i. Do not skip a task and do not add a task.
        Each object has:
        - topic: the topic of that task, copied exactly from the list
        - is_correct: true or false

        vocabulary_score: an integer from 0 to 100
        - evaluate vocabulary knowledge only
        - if the task tests a specific word, phrase, or meaning, check whether the user demonstrates knowledge of that particular vocabulary item

    """


def evaluate_tasks_score(tasks_evaluation_score: TaskEvaluationScore, topics: List[str]) -> TestResultsIncomplete:
    tasks_scores = tasks_evaluation_score.tasks_scores

    correct_by_topic = {topic: 0 for topic in topics}
    total_by_topic = {topic: 0 for topic in topics}

    for task in tasks_scores:
        if task.topic not in total_by_topic:
            correct_by_topic[task.topic] = 0
            total_by_topic[task.topic] = 0

        total_by_topic[task.topic] += 1
        if task.is_correct:
            correct_by_topic[task.topic] += 1

    ordered_topics = []
    seen = set()
    for topic in list(topics) + [task.topic for task in tasks_scores]:
        if topic not in seen:
            seen.add(topic)
            ordered_topics.append(topic)

    topics_scores = []
    correct_total = 0
    tasks_total = 0

    for topic in ordered_topics:
        correct = correct_by_topic.get(topic, 0)
        total = total_by_topic.get(topic, 0)

        score = 0 if total == 0 else round(12 * correct / total)
        topics_scores.append(TopicScore(topic=topic, score=score))

        correct_total += correct
        tasks_total += total

    grammar_score = 0 if tasks_total == 0 else round(100 * correct_total / tasks_total)

    return TestResultsIncomplete(
        grammar_score=grammar_score,
        vocabulary_score=tasks_evaluation_score.vocabulary_score,
        topics_scores=topics_scores,
    )


def resolve_language_key(language: str) -> str:
    key = LANGUAGE_KEYS.get(language.strip().casefold())
    if key is None or key not in LANGUAGE_CONFIG:
        raise HTTPException(status_code=400, detail=f"Unsupported language: {language}")
    return key


def normalize_topic(name: str) -> str:
    return " ".join(name.casefold().replace("/", " ").replace("-", " ").split())


def is_vocabulary_topic(name: str) -> bool:
    normalized = normalize_topic(name)
    return "vocabulary" in normalized or normalized == "vocab"


def topics_match(user_topic: str, config_topic: str) -> bool:
    if is_vocabulary_topic(user_topic):
        return False

    user = normalize_topic(user_topic)
    config = normalize_topic(config_topic)
    if user == config or config in user:
        return True
    if user in config and (config.startswith(user + " ") or config.endswith(" " + user)):
        return True
    if user in {"conditional", "conditionals"} and config in {
        "first conditional",
        "second conditional",
        "third conditional",
    }:
        return True
    if user in {"modal", "modals"} and config == "modal verbs":
        return True
    return False


def matched_topic_scores(criteria_topics: Dict[str, int], topic_scores: Dict[str, int]) -> Dict[str, int]:
    matched = {}
    for config_topic in criteria_topics:
        scores = [
            score
            for user_topic, score in topic_scores.items()
            if topics_match(user_topic, config_topic)
        ]
        if scores:
            matched[config_topic] = max(scores)
    return matched


def evaluate_full_score(scores: TestResultsIncomplete, language: str, levels: List[str]) -> TestResultsResponse:
    criteria_by_level = LANGUAGE_CONFIG[resolve_language_key(language)]["levels_criteria"]
    requested_levels = {level.strip().upper() for level in levels}
    ordered_levels = [
        level
        for level in LEVELS_CONFIG
        if level in requested_levels and level in criteria_by_level
    ]

    topic_scores = {item.topic: item.score for item in scores.topics_scores}
    achieved = None

    for level in ordered_levels:
        criteria = criteria_by_level[level]
        matched = matched_topic_scores(criteria["topics"], topic_scores)
        if not matched:
            continue

        failing = [
            score
            for topic, score in matched.items()
            if score < criteria["topics"][topic]
        ]
        if not failing:
            achieved = level
            continue
        if all(score > 0 for score in failing):
            achieved = level
        break

    if achieved is None and ordered_levels:
        achieved = ordered_levels[0]

    return TestResultsResponse(
        overall_level=achieved or "",
        grammar_score=scores.grammar_score,
        vocabulary_score=scores.vocabulary_score,
        topic_scores=scores.topics_scores,
    )