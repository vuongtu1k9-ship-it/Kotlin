import json
import os

d = json.load(open("decisions.json"))
content = d.get("content", "")
comment = "## Build Analysis\n\n" + content[:1000] + "\n\n_Automated_"
pr_number = os.environ.get('PR_NUMBER', '')
if pr_number:
    os.system(f'gh pr comment {pr_number} -b "{comment}"')