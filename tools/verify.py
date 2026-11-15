from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit
import json
import re

ROOT = Path(__file__).resolve().parent.parent / 'public'

class Page(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.nodes = []
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        self.nodes.append((tag, dict(attrs)))

def check_reference(raw, source):
    parsed = urlsplit(raw)
    if not parsed.path or parsed.scheme or parsed.netloc:
        return
    relative = unquote(urlsplit(urljoin('https://local.test/' + source.relative_to(ROOT).as_posix(), raw)).path).lstrip('/')
    path = ROOT / relative
    assert path.is_file() or path.with_suffix('.html').is_file() or (path / 'index.html').is_file(), (str(source), raw)

html = list(ROOT.rglob('*.html'))
for source in html:
    text = source.read_text(encoding='utf-8')
    assert '\ufffd' not in text, source
    for tag, attrs in Page(text).nodes:
        for attribute in ('src', 'href', 'poster', 'data-lightbox'):
            if attrs.get(attribute):
                check_reference(attrs[attribute], source)
        if attrs.get('srcset'):
            for entry in attrs['srcset'].split(','):
                check_reference(entry.strip().split()[0], source)

for source in ROOT.rglob('*.css'):
    for _, url in re.findall(r'url\(([\'"]?)([^)\'"\s]+)\1\)', source.read_text(encoding='utf-8')):
        check_reference(url, source)

cards = [attrs for tag, attrs in Page((ROOT / 'projects.html').read_text(encoding='utf-8')).nodes if tag == 'a' and 'card' in attrs.get('class', '').split()]
assert len(cards) == len({card['href'] for card in cards}) == 55
assert sum('open-source' in card.get('data-tags', '').split() for card in cards) == 46
for slug in ('benchmind', 'self-rag', 'hermes-cloud-gateway'):
    assert not (ROOT / 'projects' / (slug + '.html')).exists()
    assert not any(slug in card['href'] for card in cards)
assert not list(ROOT.rglob('*.pdf'))
assert not (ROOT / '.vercel').exists()
index = (ROOT / 'js/search-index.js').read_text(encoding='utf-8').strip().removeprefix('export default ').rstrip(';')
assert isinstance(json.loads(index), list)
publication = json.loads((ROOT.parent / 'PUBLICATION.json').read_text(encoding='utf-8'))
assert publication['gallery_cards'] == len(cards)
assert publication['public_files'] == sum(path.is_file() for path in ROOT.rglob('*'))
evidence = json.loads((ROOT / 'project-evidence.json').read_text(encoding='utf-8'))
projects = evidence['projects']
assert len(projects) == len({project['name'] for project in projects})
assert publication['project_repositories'] == len(projects)
assert publication['open_source_tagged_cards'] == sum('open-source' in card.get('data-tags', '').split() for card in cards)
for project in projects:
    assert re.fullmatch(r'[0-9a-f]{40}', project['sourceCommit']), project['name']
    assert project['sourceFiles'] and project['description'], project['name']
    assert project['name'] not in ('benchmind', 'self-rag', 'hermes-cloud-gateway')
    if project['page']:
        assert (ROOT / project['page']).is_file(), project['page']
    for source in project['sourceFiles']:
        assert not source.startswith(('/', '\\')) and '..' not in source.split('/'), source
print(f'PASS: {len(html)} HTML pages, internal HTML/CSS links, 55 unique gallery cards, 46 open-source tags, publication counts, {len(projects)} source records, and publication exclusions.')
