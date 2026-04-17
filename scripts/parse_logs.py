import os
import json

logs = []
for root, dirs, files in os.walk("./logs"):
    for f in files:
        if f.endswith(".txt"):
            with open(os.path.join(root, f), "r", encoding="utf-8", errors="ignore") as fp:
                logs.append({"file": f, "content": fp.read()[:5000]})

with open("parsed_logs.json", "w") as f:
    json.dump(logs, f)