import html
import re

CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")


def sanitize_name(value: str) -> str:
    cleaned = CONTROL_CHARS.sub("", value).strip()
    return re.sub(r"\s+", " ", html.escape(cleaned))


def sanitize_message(value: str) -> str:
    cleaned = CONTROL_CHARS.sub("", value).strip()
    return html.escape(cleaned)

