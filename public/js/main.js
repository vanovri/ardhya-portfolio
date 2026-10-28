const doc=document.documentElement;
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
doc.classList.add('js');
/* theme */
const themeBtn=document.querySelectorAll('[data-theme-toggle]');
const setTheme=t=>{doc.dataset.theme=t;try{localStorage.setItem('theme',t)}catch{} themeBtn.forEach(b=>b.setAttribute('aria-label',t==='dark'?'Switch to light theme':'Switch to dark theme'));};
themeBtn.forEach(b=>b.addEventListener('click',()=>setTheme(doc.dataset.theme==='dark'?'light':'dark')));
/* dark is the default; the toggle stores an explicit choice */
/* header */
const header=document.querySelector('.site-header');
const onScroll=()=>header&&header.classList.toggle('scrolled',scrollY>16);
addEventListener('scroll',onScroll,{passive:true});onScroll();
/* mobile sheet */
const sheet=document.getElementById('menu-sheet'),openBtn=document.querySelector('[data-menu-open]');
if(sheet&&openBtn){
  const closeBtn=sheet.querySelector('[data-menu-close]');
  const focusables=()=>[...sheet.querySelectorAll('a,button')];
  const open=()=>{sheet.classList.add('open');sheet.removeAttribute('inert');openBtn.setAttribute('aria-expanded','true');document.body.style.overflow='hidden';closeBtn.focus();};
  const close=()=>{sheet.classList.remove('open');sheet.setAttribute('inert','');openBtn.setAttribute('aria-expanded','false');document.body.style.overflow='';openBtn.focus();};
  openBtn.addEventListener('click',open);closeBtn.addEventListener('click',close);
  sheet.addEventListener('keydown',e=>{if(e.key==='Escape')close();if(e.key==='Tab'){const f=focusables(),a=f[0],z=f[f.length-1];if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}}});
  matchMedia('(min-width: 768px)').addEventListener('change',e=>{if(e.matches&&sheet.classList.contains('open'))close();});
}
/* reveal */
const reveals=document.querySelectorAll('.reveal');
if(reduce||!('IntersectionObserver' in window))reveals.forEach(el=>el.classList.add('in'));
else{
  document.querySelectorAll('[data-stagger]').forEach(g=>[...g.querySelectorAll(':scope > .reveal')].forEach((el,i)=>el.style.setProperty('--i',i%8)));
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{rootMargin:'0px 0px -8% 0px',threshold:.08});
  reveals.forEach(el=>io.observe(el));
}
/* count-up */
const counters=document.querySelectorAll('[data-count]');
const runCount=el=>{const end=parseFloat(el.dataset.count),dec=(el.dataset.count.split('.')[1]||'').length;if(reduce){el.textContent=end.toFixed(dec);return}const t0=performance.now(),dur=1100;const step=t=>{const p=Math.min(1,(t-t0)/dur),v=end*(1-Math.pow(1-p,3));el.textContent=v.toFixed(dec);if(p<1)requestAnimationFrame(step)};requestAnimationFrame(step);};
if(counters.length){const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){runCount(e.target);io.unobserve(e.target)}}),{threshold:.6});counters.forEach(c=>io.observe(c));}
/* toast + copy */
let toastTimer;
const toast=msg=>{let t=document.querySelector('.toast');if(!t){t=document.createElement('div');t.className='toast';t.setAttribute('role','status');t.setAttribute('aria-live','polite');document.body.append(t)}t.innerHTML='<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span></span>';t.querySelector('span').textContent=msg;requestAnimationFrame(()=>t.classList.add('show'));clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),2400);};
document.querySelectorAll('[data-copy]').forEach(b=>b.addEventListener('click',async()=>{const v=b.dataset.copy;try{await navigator.clipboard.writeText(v);toast('Email copied to clipboard')}catch{const r=document.createRange();const s=document.querySelector('[data-copy-target]');if(s){r.selectNodeContents(s);getSelection().removeAllRanges();getSelection().addRange(r)}toast('Press Ctrl+C to copy')}}));
/* project filters */
const grid=document.querySelector('[data-project-grid]');
if(grid){
  const cards=[...grid.querySelectorAll('.card')],chips=[...document.querySelectorAll('[data-filter]')],search=document.querySelector('[data-search]'),empty=document.querySelector('.empty'),count=document.querySelector('[data-count-label]');
  const readHash=()=>{const m=location.hash.match(/tags=([^&]+)/);return new Set(m?decodeURIComponent(m[1]).split(',').filter(Boolean):[])};
  let active=readHash();
  const apply=(animate=true)=>{
    const q=(search?.value||'').trim().toLowerCase();
    const first=new Map(cards.map(c=>[c,c.getBoundingClientRect()]));
    let shown=0;
    cards.forEach(c=>{const tags=c.dataset.tags.split(' ');const okTag=!active.size||[...active].some(t=>tags.includes(t));const okQ=!q||c.dataset.text.includes(q);const show=okTag&&okQ;c.hidden=!show;if(show)shown++;});
    chips.forEach(ch=>ch.setAttribute('aria-pressed',ch.dataset.filter==='all'?String(!active.size):String(active.has(ch.dataset.filter))));
    empty.classList.toggle('show',shown===0);if(count)count.textContent=`${shown} of ${cards.length} projects`;
    if(animate&&!reduce)cards.forEach(c=>{if(c.hidden)return;const a=first.get(c),b=c.getBoundingClientRect();if(!a.width){c.animate([{opacity:0,transform:'scale(.96)'},{opacity:1,transform:'none'}],{duration:320,easing:'cubic-bezier(.22,1,.36,1)'});return}const dx=a.left-b.left,dy=a.top-b.top;if(dx||dy)c.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:'none'}],{duration:420,easing:'cubic-bezier(.22,1,.36,1)'});});
  };
  const writeHash=()=>{const v=[...active].join(',');history.replaceState(null,'',v?`#tags=${encodeURIComponent(v)}`:location.pathname+location.search)};
  chips.forEach(ch=>ch.addEventListener('click',()=>{const f=ch.dataset.filter;if(f==='all')active.clear();else active.has(f)?active.delete(f):active.add(f);writeHash();apply()}));
  search?.addEventListener('input',()=>apply());
  document.querySelector('[data-reset]')?.addEventListener('click',()=>{active.clear();if(search)search.value='';writeHash();apply()});
  addEventListener('hashchange',()=>{active=readHash();apply()});
  cards.forEach(c=>c.classList.add('in'));apply(false);
}
/* lightbox */
const lb=document.querySelector('dialog.lightbox');
if(lb){
  const items=[...document.querySelectorAll('[data-lightbox]')],img=lb.querySelector('img'),cap=lb.querySelector('[data-lb-caption]'),pos=lb.querySelector('[data-lb-pos]');let idx=0,opener=null;
  const show=i=>{idx=(i+items.length)%items.length;const it=items[idx];img.src=it.dataset.lightbox;img.alt=it.dataset.alt||'';cap.textContent=it.dataset.caption||'';pos.textContent=`${idx+1} / ${items.length}`;};
  items.forEach((it,i)=>it.addEventListener('click',()=>{opener=it;show(i);lb.showModal();lb.querySelector('[data-lb-close]').focus()}));
  lb.querySelector('[data-lb-prev]').addEventListener('click',()=>show(idx-1));
  lb.querySelector('[data-lb-next]').addEventListener('click',()=>show(idx+1));
  lb.querySelector('[data-lb-close]').addEventListener('click',()=>lb.close());
  lb.addEventListener('click',e=>{if(e.target===lb)lb.close()});
  lb.addEventListener('close',()=>opener?.focus());
  lb.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();show(idx+1)}else if(e.key==='ArrowLeft'){e.preventDefault();show(idx-1)}else if(e.key==='Tab'){const f=[...lb.querySelectorAll('button')],a=f[0],z=f[f.length-1];if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}}});
}
/* toc */
const toc=document.querySelectorAll('.toc a');
if(toc.length){const map=new Map([...toc].map(a=>[a.getAttribute('href').slice(1),a]));const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){toc.forEach(a=>a.classList.remove('active'));map.get(e.target.id)?.classList.add('active')}}),{rootMargin:'-30% 0px -60% 0px'});map.forEach((a,id)=>{const s=document.getElementById(id);if(s)io.observe(s)});}
document.querySelectorAll('[data-year]').forEach(e=>e.textContent=new Date().getFullYear());

/* card hover tilt + glow (skipped for touch and reduced motion) */
if(!reduce&&matchMedia('(hover: hover) and (pointer: fine)').matches){
  document.querySelectorAll('.card').forEach(c=>{
    c.addEventListener('pointermove',e=>{const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;c.style.setProperty('--ry',((x-.5)*10).toFixed(2)+'deg');c.style.setProperty('--rx',((.5-y)*10).toFixed(2)+'deg');c.style.setProperty('--mx',(x*100).toFixed(1)+'%');c.style.setProperty('--my',(y*100).toFixed(1)+'%');c.classList.add('tilting')});
    c.addEventListener('pointerleave',()=>{c.classList.remove('tilting');c.style.removeProperty('--rx');c.style.removeProperty('--ry')});
  });
}
