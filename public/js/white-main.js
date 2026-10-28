import searchIndex from './search-index.js';

const doc = document.documentElement;
doc.dataset.theme = 'light';
doc.classList.add('js');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const header = document.querySelector('.site-header');
addEventListener('scroll', () => header?.classList.toggle('scrolled', scrollY > 12), {passive:true});

const sheet = document.getElementById('menu-sheet');
const menuButton = document.querySelector('[data-menu-open]');
const closeButton = sheet?.querySelector('[data-menu-close]');
function closeMenu(){
  sheet?.classList.remove('open'); sheet?.setAttribute('inert','');
  menuButton?.setAttribute('aria-expanded','false'); document.body.style.overflow='';
  menuButton?.focus();
}
menuButton?.addEventListener('click',()=>{
  sheet.classList.add('open'); sheet.removeAttribute('inert');
  menuButton.setAttribute('aria-expanded','true'); document.body.style.overflow='hidden';
  closeButton.focus();
});
closeButton?.addEventListener('click',closeMenu);
sheet?.querySelector('nav')?.addEventListener('click',event=>{if(event.target.closest('a'))closeMenu();});
sheet?.addEventListener('keydown',event=>{
  if(event.key==='Escape'){event.preventDefault();closeMenu();}
  if(event.key==='Tab'){
    const controls=[...sheet.querySelectorAll('a,button')].filter(node=>node.getClientRects().length);
    const first=controls[0],last=controls.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  }
});
matchMedia('(min-width:1101px)').addEventListener('change',event=>{if(event.matches&&sheet?.classList.contains('open'))closeMenu();});

const reveals=[...document.querySelectorAll('.reveal')];
if(motion.matches||!('IntersectionObserver' in window))reveals.forEach(node=>node.classList.add('in'));
else{
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting){entry.target.classList.add('in');observer.unobserve(entry.target);}
  }),{threshold:.03,rootMargin:'0px 0px -20px 0px'});
  reveals.forEach(node=>observer.observe(node));
}
motion.addEventListener('change',event=>{if(event.matches)reveals.forEach(node=>node.classList.add('in'));});

// All results are local page records, rendered as text rather than trusted HTML.
const searchDialog=document.querySelector('.search-dialog');
const searchInput=document.getElementById('site-search');
const results=document.querySelector('[data-search-results]');
const searchStatus=document.querySelector('[data-search-status]');
let searchOpener;
function renderSearch(){
  const query=searchInput.value.trim().toLowerCase();
  const terms=query.split(/\s+/).filter(Boolean);
  const candidates=query?searchIndex.filter(entry=>terms.every(term=>(entry.title+' '+entry.text).toLowerCase().includes(term))):searchIndex.filter(entry=>entry.category==='Page');
  if(query)candidates.sort((a,b)=>Number(terms.every(term=>b.title.toLowerCase().includes(term)))-Number(terms.every(term=>a.title.toLowerCase().includes(term))));
  const found=candidates.slice(0,10);
  results.replaceChildren();
  for(const entry of found){
    const link=document.createElement('a');link.href=entry.url;
    const title=document.createElement('span');title.textContent=entry.title;
    const category=document.createElement('small');category.textContent=entry.category;
    link.append(title,category);results.append(link);
  }
  searchStatus.textContent=found.length?`${found.length} ${query?'matching results':'pages'}`:'No matching results. Try a project, organization or year.';
}
function openSearch(opener){
  if(searchDialog.open)return;
  searchOpener=opener||document.activeElement;
  searchDialog.showModal();renderSearch();searchInput.focus();
}
document.querySelector('[data-search-open]')?.addEventListener('click',event=>openSearch(event.currentTarget));
document.querySelector('[data-search-close]')?.addEventListener('click',()=>searchDialog.close());
searchDialog?.addEventListener('close',()=>searchOpener?.focus());
searchDialog?.addEventListener('click',event=>{if(event.target===searchDialog){const r=searchDialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)searchDialog.close();}});
searchInput?.addEventListener('input',renderSearch);
results?.addEventListener('click',event=>{if(event.target.closest('a'))searchDialog.close();});
searchDialog?.addEventListener('keydown',event=>{
  const links=[...results.querySelectorAll('a')];
  const current=links.indexOf(document.activeElement);
  if(event.key==='ArrowDown'&&links.length){event.preventDefault();links[(current+1)%links.length].focus();}
  if(event.key==='ArrowUp'&&links.length){event.preventDefault();links[current<=0?links.length-1:current-1].focus();}
  if(event.key==='Enter'&&document.activeElement===searchInput&&links.length){event.preventDefault();links[0].click();}
});
document.addEventListener('keydown',event=>{
  const typing=event.target.closest('input,textarea,[contenteditable]');
  if((event.key.toLowerCase()==='k'&&(event.ctrlKey||event.metaKey))||(event.key==='/'&&!typing)){
    event.preventDefault();if(!sheet?.classList.contains('open'))openSearch(document.querySelector('[data-search-open]'));
  }
});

const grid=document.querySelector('[data-project-grid]');
if(grid){
  const cards=[...grid.querySelectorAll('.card')];
  const chips=[...document.querySelectorAll('[data-filter]')];
  const input=document.querySelector('[data-search]');
  const empty=document.querySelector('.empty');
  const counter=document.querySelector('[data-count-label]');
  let active=new Set();
  try{const raw=location.hash.match(/tags=([^&]+)/)?.[1];if(raw)active=new Set(decodeURIComponent(raw).split(','));}catch{}
  function apply(){
    const query=input.value.trim().toLowerCase();let shown=0;
    for(const card of cards){
      const tags=(card.dataset.tags||'').split(' ');
      const show=(!active.size||[...active].some(tag=>tags.includes(tag)))&&(!query||(card.dataset.text||card.textContent).toLowerCase().includes(query));
      card.hidden=!show;if(show)shown++;
    }
    chips.forEach(chip=>chip.setAttribute('aria-pressed',String(chip.dataset.filter==='all'?!active.size:active.has(chip.dataset.filter))));
    empty?.classList.toggle('show',shown===0);
    if(counter)counter.textContent=`${shown} of ${cards.length} projects`;
  }
  function sync(){
    const url=new URL(location.href);url.hash=active.size?'tags='+encodeURIComponent([...active].join(',')):'';
    history.replaceState(null,'',url);
  }
  chips.forEach(chip=>chip.addEventListener('click',()=>{
    const tag=chip.dataset.filter;if(tag==='all')active.clear();else if(active.has(tag))active.delete(tag);else active.add(tag);
    sync();apply();
  }));
  input.addEventListener('input',apply);
  document.querySelector('[data-reset]')?.addEventListener('click',()=>{active.clear();input.value='';sync();apply();input.focus();});
  const layoutButtons=[...document.querySelectorAll('[data-layout]')];
  function setLayout(value){
    grid.dataset.layout=value==='list'?'list':'grid';
    layoutButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.layout===grid.dataset.layout)));
  }
  layoutButtons.forEach(button=>button.addEventListener('click',()=>{
    setLayout(button.dataset.layout);const url=new URL(location.href);url.searchParams.set('view',grid.dataset.layout);history.replaceState(null,'',url);
  }));
  setLayout(new URL(location.href).searchParams.get('view'));cards.forEach(card=>card.classList.add('in'));apply();
}

const recordControls=document.querySelector('[data-record-controls]');
if(recordControls){
  const records=[...document.querySelectorAll('[data-record]')];
  const input=recordControls.querySelector('[data-record-search]');
  const status=recordControls.querySelector('[data-record-count]');
  function applyRecords(){
    const terms=input.value.toLowerCase().trim().split(/\s+/).filter(Boolean);let shown=0;
    const selected=recordControls.querySelector('[data-record-category][aria-pressed="true"]')?.dataset.recordCategory||'all';
    for(const record of records){const match=terms.every(term=>record.textContent.toLowerCase().includes(term))&&(selected==='all'||record.dataset.category===selected);record.hidden=!match;if(match){shown++;record.classList.add('in');}}
    status.textContent=terms.length||selected!=='all'?`${shown} matching ${shown===1?'entry':'entries'}`:`${records.length} entries`;
  }
  input.addEventListener('input',applyRecords);
  const categoryButtons=[...recordControls.querySelectorAll('[data-record-category]')];
  categoryButtons.forEach(button=>button.addEventListener('click',()=>{categoryButtons.forEach(other=>other.setAttribute('aria-pressed',String(other===button)));applyRecords();}));
  recordControls.querySelector('[data-record-reset]').addEventListener('click',()=>{input.value='';categoryButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.recordCategory==='all')));applyRecords();input.focus();});
  applyRecords();
}

const viewer=document.querySelector('dialog.lightbox');
if(viewer){
  const items=[...document.querySelectorAll('[data-lightbox]')];
  const image=viewer.querySelector('img');const caption=viewer.querySelector('[data-lb-caption]');
  const position=viewer.querySelector('[data-lb-pos]');let selected=0,opener;
  function show(index){
    selected=(index+items.length)%items.length;
    const item=items[selected];image.src=item.dataset.lightbox;image.alt=item.dataset.alt||item.querySelector('img')?.alt||'Project image';
    caption.textContent=item.dataset.caption||'';position.textContent=`${selected+1} / ${items.length}`;
  }
  items.forEach((item,index)=>item.addEventListener('click',event=>{
    opener=item;viewer.dataset.input=event.detail===0?'keyboard':'pointer';show(index);viewer.showModal();viewer.querySelector('[data-lb-close]').focus();
  }));
  viewer.querySelector('[data-lb-prev]')?.addEventListener('click',()=>show(selected-1));
  viewer.querySelector('[data-lb-next]')?.addEventListener('click',()=>show(selected+1));
  viewer.querySelector('[data-lb-close]')?.addEventListener('click',()=>viewer.close());
  viewer.addEventListener('close',()=>opener?.focus());
  viewer.addEventListener('keydown',event=>{if(event.key==='ArrowRight'){event.preventDefault();show(selected+1);}if(event.key==='ArrowLeft'){event.preventDefault();show(selected-1);}});
  viewer.addEventListener('click',event=>{if(event.target===viewer){const r=viewer.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)viewer.close();}});
}

let toast;
function feedback(message){
  if(!toast){toast=document.createElement('div');toast.className='toast';toast.setAttribute('role','status');document.body.append(toast);}
  toast.textContent=message;toast.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>toast.classList.remove('show'),2200);
}
document.querySelectorAll('[data-copy]').forEach(button=>button.addEventListener('click',async()=>{
  try{await navigator.clipboard.writeText(button.dataset.copy);feedback('Email copied');}
  catch{feedback('Copy the email address directly, or open your mail app.');}
}));
const toc=[...document.querySelectorAll('.toc a')];
if(toc.length){
  const map=new Map(toc.map(link=>[link.hash.slice(1),link]));
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){toc.forEach(link=>link.classList.remove('active'));map.get(entry.target.id)?.classList.add('active');}}),{rootMargin:'-15% 0px -55% 0px'});
  map.forEach((link,id)=>{const section=document.getElementById(id);if(section)observer.observe(section);});
}
document.querySelectorAll('[data-year]').forEach(node=>node.textContent=new Date().getFullYear());
