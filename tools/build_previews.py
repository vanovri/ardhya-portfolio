"""Generate source-grounded editorial diagrams. No benchmark values are synthesized."""
from pathlib import Path
import html
import math

OUT = Path(__file__).resolve().parents[1] / 'public/img/previews'

def text(x,y,value,size=22,fill='#17242e',weight=400):
    return f'<text x="{x}" y="{y}" fill="{fill}" font-size="{size}" font-weight="{weight}">{html.escape(value)}</text>'
def line(x1,y1,x2,y2,stroke='#a3b2c0',width=2):
    return f'<path d="M{x1} {y1} L{x2} {y2}" stroke="{stroke}" stroke-width="{width}" fill="none"/>'
def box(x,y,w,h,label,sub='',fill='#fff'):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="16" fill="{fill}" stroke="#d6dfe6"/>'+text(x+22,y+39,label,23,weight=600)+(text(x+22,y+70,sub,17,'#556775') if sub else '')
def wave(x,y,w,h,color='#0878d1',phase=0,style='wave'):
    points=[]
    for i in range(301):
        t=i/300
        v=math.sin(t*math.pi*12+phase)*(0.35+0.65*math.sin(t*math.pi)**2)
        if style=='spectrum':v=math.exp(-((t-.28)/.055)**2)+.65*math.exp(-((t-.62)/.07)**2)-.5
        points.append(f'{x+t*w:.2f},{y+h*.5-v*h*.38:.2f}')
    return f'<polyline points="{" ".join(points)}" fill="none" stroke="{color}" stroke-width="3"/>'
def panel(x,y,w,h):
    s=f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="18" fill="#fff" stroke="#d6dfe6"/>'
    for i in range(1,6):s+=line(x+20,y+i*h/6,x+w-20,y+i*h/6,'#edf1f4',1)
    return s
def drawing(slug):
    s=''
    if slug=='aether-core-engine':
        s+=panel(64,185,520,390)+text(90,225,'Spectral rendering',23,weight=600)
        for r,c in [(112,'#e7f1f9'),(88,'#c3deef'),(60,'#4597c6')]:s+=f'<circle cx="335" cy="397" r="{r}" fill="{c}"/>'
        for k in range(9):s+=line(100,286+k*24,258,350+k*10,'#326d93',2)+line(335,365+k*8,548,288+k*31,'#9cb9ce',1)
        s+=box(628,185,505,92,'Fluid field','Staggered grid and pressure solve')
        for i in range(10):
            for j in range(4):s+=f'<rect x="{655+i*44}" y="{310+j*42}" width="36" height="34" rx="5" fill="hsl({200+i*4},55%,{45+j*9}%)"/>'
        s+=wave(650,500,460,90)+text(650,615,'Procedural audio waveform',20,'#556775')
    elif slug=='ferrum-kv':
        s+=text(65,214,'Replication',22,weight=600)
        for x,y in [(130,310),(375,280),(300,510)]:s+=f'<circle cx="{x}" cy="{y}" r="54" fill="#e1effa" stroke="#0878d1" stroke-width="2"/>'+text(x-24,y+8,'Node',19)
        s+=line(183,304,321,286,'#0878d1',3)+line(355,333,319,456,'#0878d1',3)+line(255,478,160,355,'#0878d1',3)
        s+=line(432,355,590,355,'#0878d1',3)
        s+=box(600,210,510,90,'RESP command processing','Parse, dispatch and storage operations')
        s+=box(600,340,240,100,'HNSW index','Vector search')+box(870,340,240,100,'BM25 index','Text search')
        s+=box(600,480,510,100,'Persistence','Append-only recovery and LSM storage')
    elif slug=='agy-codex-video-studio':
        s+=panel(65,185,1070,295)+text(90,225,'Transcript and edit timeline',23,weight=600)
        for i,(label,w) in enumerate([('Words',180),('Cuts',230),('Captions',290),('PCM audio',180)]):
            x=95+sum([180,230,290,180][:i])+i*30
            s+=f'<rect x="{x}" y="270" width="{w}" height="76" rx="12" fill="{["#d8eafb","#cce5df","#dfddf5","#f0ddcc"][i]}"/>'+text(x+18,315,label,22,weight=600)
        s+=wave(95,365,1005,80)
        s+=box(65,525,300,100,'Timestamp contracts','Validated media intervals')+box(425,525,300,100,'Composition','Caption and audio stages')+box(785,525,350,100,'FFmpeg planning','External renderer integration')
        s+=line(365,575,425,575,'#0878d1',3)+line(725,575,785,575,'#0878d1',3)
    elif slug=='aether-synth-flow':
        s+=panel(65,185,685,240)+text(90,225,'Audio synthesis and analysis',23,weight=600)+wave(90,255,630,125)
        s+=panel(65,455,685,190)+wave(90,495,630,120,style='spectrum')
        s+=box(805,185,330,100,'Swift DSP kernels','Signal and audio experiments')+box(805,355,330,100,'Metal graphics','Procedural visual surfaces')+box(805,525,330,100,'Numerical checks','Synthetic fixtures and bounds')
        s+=line(750,305,805,235,'#0878d1',3)+line(750,355,805,405,'#0878d1',3)+line(750,550,805,575,'#0878d1',3)
    elif slug=='argus-terminal':
        s+=panel(65,185,680,415)+text(90,225,'Synthetic market view',23,weight=600)
        for i in range(22):
            x=100+i*27;y=390+60*math.sin(i*.42);c='#14866d' if i%3 else '#d36e61'
            s+=line(x,y-45,x,y+45,c,2)+f'<rect x="{x-7}" y="{y-22}" width="14" height="44" rx="3" fill="{c}"/>'
        s+=box(785,185,350,415,'Order book','Simulated matching')
        for i in range(8):s+=f'<rect x="{810}" y="{300+i*31}" width="{110+(i*37)%180}" height="18" rx="4" fill="{"#d6e9e2" if i>3 else "#f0dbd6"}"/>'
        s+=text(65,650,'Node.js server     SQLite records     WebSocket interface',22,'#556775')
    elif slug=='redflag-loop':
        s+=box(65,200,320,160,'Chat fixture','Labelled marketplace examples')
        for i,w in enumerate([215,160,230]):s+=f'<rect x="90" y="{390+i*50}" width="{w}" height="30" rx="15" fill="{["#d9eafa","#e3e9ee","#d9eafa"][i]}"/>'
        s+=box(450,200,300,145,'Rule engine','Regex and proximity checks')+box(450,435,300,145,'Candidate patches','Preauthored repair stages')
        s+=box(815,200,320,145,'Validation gate','Accept or reject a candidate')+box(815,435,320,145,'Evaluation report','Evidence and rollback record')
        for a,b,c,d in [(385,280,450,280),(750,280,815,280),(600,345,600,435),(750,505,815,505),(975,345,975,435)]:s+=line(a,b,c,d,'#0878d1',3)
    elif slug=='career-test-arena':
        s+=panel(65,185,620,420)+text(95,235,'Engineering practice',27,weight=600)
        for i,label in enumerate(['Question bank','Engineering calculators','Interview prompts']):
            s+=f'<circle cx="125" cy="{310+i*95}" r="23" fill="#dfedf9" stroke="#0878d1"/>'+text(170,319+i*95,label,24)
        s+=panel(735,185,400,420)+text(765,235,'Offline interface',24,weight=600)
        for i in range(4):s+=f'<rect x="765" y="{275+i*64}" width="340" height="47" rx="9" fill="{["#edf3f8","#d9eafa","#edf3f8","#edf3f8"][i]}"/>'
        s+=text(760,648,'Practice content, not official exams',18,'#556775')
    else:
        s+=f'<rect x="65" y="185" width="1070" height="440" rx="20" fill="#182938"/>'
        for i in range(13):s+=line(90+i*78,610,600,300,'#334a5c',1)
        for i in range(5):s+=line(90,390+i*45,1110,390+i*45,'#334a5c',1)
        s+='<path d="M310 500 L310 340 L610 270 L880 365 L880 540 L610 610 Z" fill="#294153" stroke="#6fa7b4" stroke-width="3"/><path d="M310 340 L610 410 L880 365 M610 410 L610 610" fill="none" stroke="#6fa7b4" stroke-width="3"/>'
        for i in range(5):s+=f'<rect x="{365+i*94}" y="{350+i*15}" width="60" height="12" rx="4" fill="{["#64dfdf","#f0a8ce"][i%2]}" transform="rotate(13 {365+i*94} {350+i*15})"/>'
        s+=text(90,660,'Procedural scene, export and software-rendering toolkit',22,'#556775')
    return s

TITLES={'aether-core-engine':('AetherCoreEngine','Rendering, fluid simulation and audio'),
 'ferrum-kv':('FerrumKV','Storage and replication architecture'),
 'agy-codex-video-studio':('AGY x Codex Video Studio','Transcript to composed media'),
 'aether-synth-flow':('AetherSynth & Flow','Spatial audio and numerical experiments'),
 'argus-terminal':('Argus Terminal','Local trading-terminal simulation'),
 'redflag-loop':('RedFlag Loop','Fixture-based rule repair'),
 'career-test-arena':('Career Test Arena','Questions, calculators and preparation'),
 'cyberpunk-floating-ramen-stall':('Cyberpunk Floating Ramen Stall','Procedural Blender and graphics pipeline')}
def main():
    OUT.mkdir(parents=True,exist_ok=True)
    curated = {'aether-core-engine', 'ferrum-kv', 'agy-codex-video-studio', 'aether-synth-flow', 'cyberpunk-floating-ramen-stall'}
    for slug,(title,subtitle) in TITLES.items():
        # Preserve the original AGY compositions restored for the gallery.
        if slug in curated:
            assert (OUT/(slug+'.svg')).is_file()
            continue
        body=f'<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1200 750" role="img" aria-label="{html.escape(title)} architecture illustration"><rect width="1200" height="750" fill="#f2f5f7"/><g font-family="Arial, Helvetica, sans-serif">'+text(65,84,title,38,weight=600)+text(65,124,subtitle,21,'#556775')+line(65,150,1135,150,'#cbd6de')+drawing(slug)+text(65,716,'Source-grounded illustration. No measured performance implied.',16,'#637582')+'</g></svg>'
        assert '<path' in body and len(body)>1500
        (OUT/(slug+'.svg')).write_text(body,encoding='utf-8')
    print(f'Generated {len(TITLES)-len(curated)} vector previews; preserved {len(curated)} curated AGY illustrations')
if __name__=='__main__':main()
