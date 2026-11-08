# Propose where each archived discussion (src/community-data.json) was written up in the newspaper, using the
# newspaper's public search API and scoring how much of the archive's own text each hit's excerpt repeats.
# Usage: python3 -I scripts/match-discussion-sources.py src/community-data.json matches.json
# The output is a list of candidates, not the answer: read each one against the archive and copy only the
# confirmed ones into src/discussion-sources.json. A topic on the same subject is not the same discussion.
import json, re, subprocess, sys
data = json.load(open(sys.argv[1]))['discussions']
API = 'https://agenthub-feedback.haoqingeric.workers.dev/content/search'

def grams(text):
    text = text.lower()
    latin = set(re.findall(r'[a-z0-9][a-z0-9.\-]{1,}', text))
    han = re.sub(r'[^一-鿿]', '', text)
    return latin | {han[i:i + 2] for i in range(len(han) - 1)}

def search(query):
    out = subprocess.run(['curl', '-fsSG', API, '--data-urlencode', f'q={query}', '-d', 'limit=8'], capture_output=True, text=True, timeout=60)
    return json.loads(out.stdout).get('items', []) if out.returncode == 0 else []

rows = []
for index, item in enumerate(data):
    source = grams(item['detail'] + item['quote'] + item['conclusion'])
    seen, best = set(), []
    for query in (item['question'], item['quote'], item['detail'][:60]):
        for hit in search(query):
            if hit['id'] in seen: continue
            seen.add(hit['id'])
            target = grams(hit.get('title', '') + hit.get('excerpt', ''))
            score = len(source & target) / max(1, len(source))
            best.append((score, hit))
    best.sort(key=lambda pair: -pair[0])
    top = best[0] if best else (0, {})
    daily = next(((s, h) for s, h in best if h.get('kind') == 'daily' and s >= top[0] - .03), None)
    pick = daily or top
    rows.append({'id': index + 1, 'question': item['question'], 'score': round(pick[0], 3), 'kind': pick[1].get('kind'),
                 'date': pick[1].get('date'), 'title': pick[1].get('title'), 'url': pick[1].get('url'),
                 'runner_up': round(best[1][0], 3) if len(best) > 1 else 0})
    print(index + 1, rows[-1]['score'], rows[-1]['kind'], rows[-1]['date'], '|', item['question'][:28], '=>', (rows[-1]['title'] or '')[:40], flush=True)
json.dump(rows, open(sys.argv[2], 'w'), ensure_ascii=False, indent=1)
