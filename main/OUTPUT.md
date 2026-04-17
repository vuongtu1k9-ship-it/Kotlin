# OUTPUT CONTRACT (CRITICAL)

## Rule 1
All agents MUST output ONLY string-safe data.

---

## Rule 2
Allowed output formats:
- string
- { text: string }

---

## Rule 3
Before output:

normalize(p):
- if string → return
- if object → extract text/message/data
- else → ""

---

## Rule 4 (STRICT)
Never output:
- raw object
- array of objects
- heartbeat messages
- undefined/null

---

## Rule 5
Final system output MUST be:

string only