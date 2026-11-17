import re
import shutil
from typing import Callable, List, Optional

from guardrails.output_validation import OutputValidationError
from schemas.common import TaskType
from schemas.retry_tasks import NewCorrectTask

_BLANK = re.compile(r"_+")
_QUOTED_BLANK = re.compile(r"[\"']([^\"']*_[^\"']*)[\"']")

_SKIP_ISSUE_TYPES = {"style", "typographical", "whitespace", "locale-violation"}
_SKIP_RULES = {
    "WHITESPACE_RULE",
    "EN_QUOTES",
    "DASH_RULE",
    "COMMA_PARENTHESIS_WHITESPACE",
    "UNLIKELY_OPENING_PUNCTUATION",
    "PUNCTUATION_PARAGRAPH_END",
}

_tool = None
_check_text: Optional[Callable[[str], List[str]]] = None


class _ToolUnavailable(RuntimeError):
    pass


def validate_answer_and_grammar(task: NewCorrectTask) -> None:
    try:
        errors = _grammar_errors_for_task(task)
    except _ToolUnavailable as e:
        print(f"Skipping LanguageTool checks: {e}")
        return
    if errors:
        raise OutputValidationError("; ".join(errors))


def _grammar_errors_for_task(task: NewCorrectTask) -> List[str]:
    sentence = _exercise_sentence(task.name)
    errors: List[str] = []

    if task.task_type == TaskType.TRUE_FALSE:
        if task.answer == "true":
            issues = _issues(sentence)
            if issues:
                errors.append(
                    f"TRUE_FALSE statement is not grammatical: {issues[0]}"
                )
        else:
            stem_issues = _issues(sentence)
            if _looks_broken_english(stem_issues, sentence):
                errors.append(
                    f"TRUE_FALSE statement is not readable English: {stem_issues[0]}"
                )
        return errors

    if _BLANK.search(sentence):
        filled_answer = _fill_blank(sentence, task.answer)
        answer_issues = _issues(filled_answer)
        if answer_issues:
            errors.append(
                "answer does not produce a grammatical sentence: "
                f"{answer_issues[0]}"
            )

        if task.task_type == TaskType.MULTIPLE_CHOICE:
            errors.extend(_multiple_choice_option_errors(task, sentence, answer_issues))
        return errors

    stem_issues = _issues(sentence)
    if stem_issues:
        errors.append(f"exercise is not grammatical: {stem_issues[0]}")
    return errors


def _multiple_choice_option_errors(
    task: NewCorrectTask, sentence: str, answer_issues: List[str]
) -> List[str]:
    option_issues = []
    for option in task.options:
        filled = _fill_blank(sentence, option)
        option_issues.append((option, _issues(filled)))

    grammatical = [option for option, issues in option_issues if not issues]
    if not grammatical:
        if answer_issues:
            return []
        return ["no multiple-choice option produces a grammatical sentence"]

    if len(grammatical) != 1:
        extras = ", ".join(grammatical)
        return [
            "MULTIPLE_CHOICE must have exactly one grammatical option, "
            f"got {len(grammatical)}: {extras}"
        ]

    winner = grammatical[0]
    if winner.casefold() != task.answer.casefold():
        return [
            f'the grammatical option is "{winner}", but answer is "{task.answer}"'
        ]
    return []


def _exercise_sentence(name: str) -> str:
    quoted = _QUOTED_BLANK.search(name)
    if quoted:
        return quoted.group(1).strip()
    return name.strip()


def _fill_blank(name: str, insertion: str) -> str:
    if _BLANK.search(name):
        return _BLANK.sub(insertion, name, count=1)
    return name


def _issues(text: str) -> List[str]:
    if _check_text is not None:
        return _check_text(text)

    try:
        tool = _language_tool()
        matches = tool.check(text)
    except _ToolUnavailable:
        raise
    except Exception as e:
        raise _ToolUnavailable(f"{type(e).__name__}: {e}") from e

    messages = []
    for match in matches:
        issue_type = (getattr(match, "ruleIssueType", None) or "").lower()
        rule_id = getattr(match, "ruleId", "") or ""
        if issue_type in _SKIP_ISSUE_TYPES or rule_id in _SKIP_RULES:
            continue
        messages.append(match.message)
    return messages


def _looks_broken_english(issues: List[str], text: str) -> bool:
    if len(issues) >= 3:
        return True
    letters = re.findall(r"[A-Za-z]", text)
    return (not letters) and bool(issues)


def _language_tool():
    global _tool
    if _tool is not None:
        return _tool

    try:
        import language_tool_python
    except ImportError as e:
        raise _ToolUnavailable("language-tool-python is not installed") from e

    try:
        if shutil.which("java"):
            _tool = language_tool_python.LanguageTool("en-US")
        else:
            print("Java not found; using LanguageTool public API")
            _tool = language_tool_python.LanguageToolPublicAPI("en-US")
    except Exception as e:
        print(f"Local LanguageTool failed ({e}); using public API")
        try:
            _tool = language_tool_python.LanguageToolPublicAPI("en-US")
        except Exception as api_error:
            raise _ToolUnavailable(str(api_error)) from api_error
    return _tool
