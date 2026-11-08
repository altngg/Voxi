from typing import List

from fastapi import HTTPException

from schemas.test_results import TestResultsIncomplete, TestResultsResponse
from services.test_results.language import LANGUAGE_CONFIG, LANGUAGE_KEYS, LEVELS_CONFIG
from services.test_results.topics import matched_topic_scores


def resolve_language_key(language: str) -> str:
    key = LANGUAGE_KEYS.get(language.strip().casefold())
    if key is None or key not in LANGUAGE_CONFIG:
        raise HTTPException(status_code=400, detail=f"Unsupported language: {language}")
    return key


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
