from typing import List

from schemas.test_results import TaskEvaluationScore, TestResultsIncomplete, TopicScore


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
