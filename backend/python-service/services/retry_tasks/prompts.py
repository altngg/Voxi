from guardrails.output_validation import CORRECT_ANSWER_LABEL
from guardrails.prompt_injection import security_rules, untrusted_field


def convert_incorrect_task_to_explanation_prompt(
    task_name: str, task_topic: str, task_type: str, language: str
):
    prompt = f"""
        Write a short teacher comment in Russian about a {language} exercise the learner got wrong.
        {security_rules()}

        input data:
        - language: {language}
        - topic: {task_topic}
        - task type: {task_type}
        - exercise: {untrusted_field(task_name, "exercise")}

        You see only the exercise, not the option or word the learner chose.
        Do not invent their wrong answer and do not mention that you cannot see it.
        Work out the correct answer from the exercise and the topic "{task_topic}".

        HOW TO WRITE:
        - Russian only (Cyrillic). {language} is allowed inside the comment only
          for words taken from the exercise and for grammar terms.
        - Explain the {language} point. Do not compare it with Russian grammar.
        - 3 or 4 sentences, one continuous comment, under 500 characters.
        - Order: what this exercise is about, how the "{task_topic}" rule works
          here, why the correct form fits this sentence or question.
        - Link the sentences so the next one follows from the previous one.
        - Plain words a learner can follow. No greeting, no apology, no "во-первых",
          no bullet list, no arrows, no "Поэтому X → Y".
        - Do not open with a label ("Правило:", "Объяснение:", "Ошибка:").
        - The last sentence is only "{CORRECT_ANSWER_LABEL} <correct_answer>."
          Nothing after it. The text after the colon is the same as "correct_answer".

        FIELD RULES:
        - "correct_answer": the answer itself, not a sentence about it.
        - "explanation": the full Russian comment, including the last sentence.
    """

    match task_type:
        case "MULTIPLE_CHOICE":
            prompt += f"""
                THIS EXERCISE:
                - A question, or a sentence with a blank written as "_".
                - Several options exist; only one is right. You do not see the options.
                - Name the form or word that belongs here and why the usual wrong forms
                  do not fit this sentence.
                - "correct_answer" is that word or phrase, not the whole sentence.

                GOOD EXAMPLE for "She _ to school yesterday.", topic "Past Simple":
                    {{"correct_answer": "went", "explanation": "В предложении есть yesterday, поэтому речь о действии, которое уже закончилось. В Past Simple здесь нужна вторая форма глагола, и go меняется на went. Формы go, going и gone относятся к другим временам и в этот пропуск не встают. {CORRECT_ANSWER_LABEL} went."}}
            """
        case "TRUE_FALSE":
            prompt += f"""
                THIS EXERCISE:
                - One statement. It is clearly true or clearly false.
                - Say what the statement claims, then what the "{task_topic}" rule
                  actually says, then why the statement matches or contradicts it.
                - "correct_answer" is exactly "true" or "false".
                - The last sentence uses that same word: "{CORRECT_ANSWER_LABEL} true."
                  or "{CORRECT_ANSWER_LABEL} false."

                GOOD EXAMPLE for "The article an is used before consonant sounds.", topic "Articles":
                    {{"correct_answer": "false", "explanation": "Утверждение говорит, что артикль an ставят перед согласным звуком. На самом деле an стоит перед гласным звуком, как в an apple, а перед согласным нужен a. Значит, утверждение неверно. {CORRECT_ANSWER_LABEL} false."}}
            """
        case "GAP_FILLING":
            prompt += f"""
                THIS EXERCISE:
                - One sentence with a missing word. The gap is "_",
                  or the sentence starts with "Complete:".
                - Explain which word the gap needs and how the "{task_topic}" rule
                  or the set phrase decides it.
                - "correct_answer" is only the missing word or short phrase.

                GOOD EXAMPLE for "Complete: To be or _ to be.", topic "Grammar":
                    {{"correct_answer": "not", "explanation": "Это устойчивая фраза to be or not to be, и пропуск стоит между or и to be. Без not получается другое сочетание, и цитата распадается. В пропуск входит именно отрицание. {CORRECT_ANSWER_LABEL} not."}}
            """
        case _:
            prompt += f"""
                THIS EXERCISE:
                - Decide the correct answer from the exercise and the topic.
                - Show the rule on this exact example, then close with the answer.

                GOOD EXAMPLE:
                    {{"correct_answer": "went", "explanation": "В предложении есть yesterday, поэтому действие уже закончилось и глагол стоит в Past Simple. От go это форма went. {CORRECT_ANSWER_LABEL} went."}}
            """

    return prompt


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
