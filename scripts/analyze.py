import json
import os
import urllib.request

with open('parsed_logs.json', 'r') as f:
    logs = json.load(f)

logs_text = '\n\n'.join([l['file'] + '\n' + l['content'][:3000] for l in logs[:3]])

prompt = "Analyze this GitHub Actions build failure. Root cause, fix, action (comment_pr/retry/create_fix_branch/alert):\n\n" + logs_text[:4000]

data = json.dumps({
    'model': 'gpt-4',
    'messages': [{'role': 'user', 'content': prompt}],
    'max_tokens': 500
}).encode('utf-8')

req = urllib.request.Request(
    'https://api.openai.com/v1/chat/completions',
    data=data,
    headers={
        'Authorization': 'Bearer ' + os.environ.get('OPENAI_API_KEY', ''),
        'Content-Type': 'application/json'
    }
)

result = json.loads(urllib.request.urlopen(req).read().decode())
content = result.get('choices', [{}])[0].get('message', {}).get('content', '')

decisions = []
cl = content.lower()
if 'comment' in cl: decisions.append('comment_pr')
if 'retry' in cl: decisions.append('retry')
if 'fix' in cl or 'branch' in cl: decisions.append('create_fix_branch')
if 'alert' in cl: decisions.append('alert')

with open('decisions.json', 'w') as f:
    json.dump({'decisions': decisions, 'content': content}, f)

print(content[:500])