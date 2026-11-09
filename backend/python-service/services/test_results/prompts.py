from guardrails.prompt_injection import security_rules, untrusted_field
from schemas.test_results import TestResultsRequest


def convert_test_results_to_prompt(request: TestResultsRequest) -> str:
    tasks_count = len(request.tasks_results)
    topics_str = ", ".join(request.topics)

    tasks_results_str = ""
    for i, task in enumerate(request.tasks_results, 1):
        tasks_results_str += f"\n{i}. task: {untrusted_field(task.name, 'task_name')}\n"
        tasks_results_str += f"   topic: {task.topic}\n"
        tasks_results_str += f"   correct answer: {untrusted_field(task.answer, 'correct_answer')}\n"
        tasks_results_str += f"   user answer: {untrusted_field(task.user_answer, 'user_answer')}\n"

    return f"""
        Check if each task in {request.language} is correct. Do not merge tasks.
        {security_rules()}

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
