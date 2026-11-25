from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit
import json
import re
import hashlib
from xml.etree import ElementTree

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

gallery_text = (ROOT / 'projects.html').read_text(encoding='utf-8')
cards = [attrs for tag, attrs in Page(gallery_text).nodes if tag in ('a', 'article') and 'card' in attrs.get('class', '').split()]
assert len(cards) == len({card.get('href') or card.get('id') for card in cards}) == 20
assert sum('flagship' in card.get('data-tags', '').split() for card in cards) == 9
assert sum('collection' in card.get('data-tags', '').split() for card in cards) == 11
lab_page = 'projects/engineering-labs.html'
assert sum(card.get('href') == lab_page for card in cards) == 1
lab_nodes = Page((ROOT / lab_page).read_text(encoding='utf-8')).nodes
assert {'systems', 'signal', 'lab-canvas', 'labs-bento', 'earlier-prototypes'} <= {attrs.get('id') for _, attrs in lab_nodes}
assert len({attrs['href'] for _, attrs in lab_nodes if 'data-studio-launch' in attrs}) == 6
home_nodes = Page((ROOT / 'index.html').read_text(encoding='utf-8')).nodes
assert {'about', 'contact'} <= {attrs.get('id') for _, attrs in home_nodes}
for source in html:
    menus = re.findall(r'<nav aria-label="(?:Primary|Mobile)">(.*?)</nav>', source.read_text(encoding='utf-8'), re.S)
    for menu in menus:
        links = [Path(attrs['href']).name for tag, attrs in Page(menu).nodes if tag == 'a']
        assert links == ['index.html', 'projects.html', 'experience.html', 'credentials.html'], source
webgl_hub = (ROOT / 'projects/suite-3d-media-web.html').read_text(encoding='utf-8')
assert webgl_hub.count('data-webgl-showcase') == 1 and 'id="interactive-3d"' in webgl_hub
assert sum('open-source' in card.get('data-tags', '').split() for card in cards) == 19
for slug in ('benchmind', 'self-rag', 'hermes-cloud-gateway'):
    assert not (ROOT / 'projects' / (slug + '.html')).exists()
    assert not any(slug in card.get('href', '') for card in cards)
assert not list(ROOT.rglob('*.pdf'))
assert not (ROOT / '.vercel').exists()
index = (ROOT / 'js/search-index.js').read_text(encoding='utf-8').strip().removeprefix('export default ').rstrip(';')
assert isinstance(json.loads(index), list)
publication = json.loads((ROOT.parent / 'PUBLICATION.json').read_text(encoding='utf-8'))
assert publication['gallery_cards'] == len(cards)
assert publication['curated_flagships'] == 9
assert publication['collection_hubs'] == 11
assert publication['indexed_projects'] == 65
assert publication['public_files'] == sum(path.is_file() for path in ROOT.rglob('*'))
evidence = json.loads((ROOT / 'project-evidence.json').read_text(encoding='utf-8'))
projects = evidence['projects']
assert len(projects) == len({project['name'] for project in projects})
assert publication['project_repositories'] == len(projects)
assert publication['open_source_tagged_cards'] == sum('open-source' in card.get('data-tags', '').split() for card in cards)
previews = json.loads((ROOT / 'preview-assets.json').read_text(encoding='utf-8'))['previews']
assert len(previews) == len({p['card'] for p in previews}) == len(cards)
assert publication['tracked_preview_assets'] == len(previews)
for preview in previews:
    image = ROOT / preview['preview']
    assert image.is_file() and hashlib.sha256(image.read_bytes()).hexdigest() == preview['sha256'], image
    if image.suffix == '.svg':
        ElementTree.parse(image)
card_blocks = re.findall(r'<a\b[^>]*class="card[^\"]*"[^>]*>.*?</a>', gallery_text, re.S)
assert len(card_blocks) == len(cards) and all('<img ' in block and 'Source and scope reviewed' not in block for block in card_blocks)
for suite_card in [c for c in cards if 'collection' in c.get('data-tags', '').split()]:
    suite_path = ROOT / suite_card['href']
    assert suite_path.is_file(), suite_path
    assert 'class="suite-grid"' in suite_path.read_text(encoding='utf-8'), suite_path
assert 'https://enviid.web.id' in (ROOT / 'projects/suite-enviid-dmrv.html').read_text(encoding='utf-8')
for project in projects:
    assert re.fullmatch(r'[0-9a-f]{40}', project['sourceCommit']), project['name']
    assert project['sourceFiles'] and project['description'], project['name']
    assert project['name'] not in ('benchmind', 'self-rag', 'hermes-cloud-gateway')
    if project['page']:
        assert (ROOT / project['page']).is_file(), project['page']
    for source in project['sourceFiles']:
        assert not source.startswith(('/', '\\')) and '..' not in source.split('/'), source
print(f'PASS: {len(html)} HTML pages, four primary links, Home anchors, six studio links, {len(cards)} gallery cards, verified preview hashes and {len(projects)} source records.')
