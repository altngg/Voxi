from guardrails.output_validation import EXPLANATION_PREFIX
from guardrails.prompt_injection import security_rules, untrusted_field


def convert_incorrect_task_to_explanation_prompt(
    task_name: str, task_topic: str, task_type: str, language: str
):
    return f"""
        Explain in Russian why the learner's answer is wrong.
        {security_rules()}

        input data:
        - language: {language}
        - topic: {task_topic}
        - task type: {task_type}
        - exercise, learner's answers are in parentheses: {untrusted_field(task_name, "exercise")}

        FIELD RULES:
        - "correct_answer": the correct {language} word or phrase for the wrong part.
        - "explanation": 2-3 short sentences, no greetings.
          Start with "{EXPLANATION_PREFIX}", state the "{task_topic}" rule the learner broke,
          end with "Поэтому <wrong> → <correct_answer>."
        - Write the explanation ONLY in Russian (Cyrillic). {language} is allowed only
          for quoted words and grammar terms.
        - Explain {language} rules only, do not compare with Russian grammar.

        GOOD EXAMPLE for "(Have) you ever (ate) sushi?", topic "Present Perfect":
            {{"correct_answer": "eaten", "explanation": "{EXPLANATION_PREFIX} в Present Perfect после have/has используется V3 (Past Participle), а не Past Simple. У глагола eat три формы: eat – ate – eaten. Поэтому ate → eaten."}}
    """


def convert_retry_task_to_prompt(
    task_name: str, task_topic: str, task_type: str, language: str, topic_score: int
):
    prompt = f"""
        Generate a new task to replace the existing one.
        {security_rules()}

        input data:
        - language: {language}
        - existing task: {untrusted_field(task_name, "existing_task")}
        - new task topic: {task_topic}
        - new task type: {task_type}
        - user's score for this topic: {topic_score}

        GENERAL RULES:
        - The new exercise MUST be different from the original exercise.
        - The exercise must match the requested topic and exercise type.
        - The exercise should sound natural and grammatically correct.

        FIELD RULES:
        - "name" - the actual exercise content, NOT a description or title
        - "answer" - the correct answer to the exercise
        - "topic" - must be exactly "{task_topic}"
        - "task_type" - must be exactly "{task_type}"
        - "options" - required for all task types
    """

    match task_type:
        case "MULTIPLE_CHOICE":
            prompt += f"""
                MORE RULES:
                - Create a question with EXACTLY 4 answer options in the "options" field
                - Only ONE option must be correct
                - The other 3 must be clearly incorrect
                - The correct option must exactly match the "answer" field
                
                GOOD EXAMPLE:
                    {{
                    "name": "What is the opposite of 'tiny'?",
                    "answer": "huge",
                    "options": ["small", "tiny", "huge", "miniature"],
                    "topic": "Vocabulary",
                    "task_type": "MULTIPLE_CHOICE"
                    }}
            """
        case "TRUE_FALSE":
            prompt += f"""
                MORE RULES:
                - Create ONE clear factual statement.
                - The statement must be obviously true or obviously false.
                - "answer" must be exactly "true" or "false".
                - "options" must be an empty array [].
                
                GOOD EXAMPLE:
                    {{
                    "name": "Water boils at 100 degrees Celsius.",
                    "answer": "true",
                    "options": [],
                    "topic": "Science",
                    "task_type": "TRUE_FALSE"
                    }}
            """
        case "GAP_FILLING":
            prompt += f"""
                MORE RULES:
                - Create ONE sentence with EXACTLY ONE missing word.
                - Use EXACTLY ONE underscore character: _
                - "answer" must contain only the missing word.
                - "options" must be an empty array [].
                - The sentence must sound natural.
                GOOD EXAMPLE:
                    {{
                    "name": "She _ to school every day.",
                    "answer": "goes",
                    "options": [],
                    "topic": "Science",
                    "task_type": "GAP_FILLING"
                    }}
            """

    return prompt
