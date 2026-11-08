import re


def extract_json(text: str) -> str:
    json_match = re.search(r"\{.*\}", text, re.DOTALL)
    if json_match:
        return json_match.group()
    return text
