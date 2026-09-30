import re

# Symptoms that should stop the conversation and send the user to a clinician.
# Checked before the message ever reaches Gemini, so the reply never depends on the model.
RED_FLAGS = [
    ("dizziness", r"\b(dizzy|dizziness|light[- ]?headed|vertigo|room (is )?spinning)\b"),
    ("fainting", r"\b(faint(ed|ing)?|pass(ed)? out|black(ed)? out|blacking out)\b"),
    ("chest pain", r"\bchest (pain|tightness|pressure)|\b(pain|tightness|pressure) in (my )?chest\b"),
    ("trouble breathing", r"\b(short(ness)? of breath|breathless|can'?t breathe|cannot breathe|trouble breathing|difficulty breathing)\b"),
    ("numbness or tingling", r"\b(numb|numbness|tingling|pins and needles)\b"),
    ("weakness", r"\b(weak(ness)? in (my )?(arm|arms|hand|hands|leg|legs)|can'?t (lift|feel|move) my)\b"),
    ("severe or sudden pain", r"\b(severe|sharp|shooting|sudden|unbearable|excruciating|intense|stabbing) (neck |back |shoulder |head )?(pain|ache|headache)\b"),
    ("vision changes", r"\b(blurr?(y|ed) vision|double vision|vision (went|goes|is) (blurry|dark))\b"),
]

SAFETY_REPLY = """**Please stop exercising for now.** You mentioned {symptom}, which can be a warning sign. It needs a check by a professional, not advice from an app.

- Sit or lie down somewhere safe until it settles.
- Speak to a doctor or physiotherapist before your next session.
- **If it is severe, sudden, or comes with chest pain, trouble breathing or fainting, call 112 now.**

I can't assess symptoms, but I'm happy to help with your exercises once you've been checked."""


def find_red_flag(message: str):
    """Returns a short name for the first warning sign found in the message, or None."""
    text = message.lower()
    for name, pattern in RED_FLAGS:
        if re.search(pattern, text):
            return name
    return None


def safety_reply(symptom: str) -> str:
    return SAFETY_REPLY.format(symptom=symptom)
