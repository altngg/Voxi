from typing import Dict


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
