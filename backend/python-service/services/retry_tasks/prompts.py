def convert_retry_task_to_prompt(
    task_name: str, task_topic: str, task_type: str, language: str, topic_score: int
):
    prompt = f"""
        Generate a new task to replace the existing one.

        input data:
        - language: {language}
        - existing task: "{task_name}"
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
