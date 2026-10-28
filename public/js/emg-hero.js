// Preview runs at 2 kHz so the 500 Hz low-pass matches the firmware spec (20 Hz HPF · 500 Hz LPF · 50 Hz notch).
import {makePreview,features} from '/signal.mjs';
const canvas=document.querySelector('[data-emg]');
if(canvas){
  const ctx=canvas.getContext('2d'),reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const {raw,filtered,sampleRate}=makePreview(2000);
  const rmsEl=document.querySelector('[data-rms]'),mavEl=document.querySelector('[data-mav]'),btn=document.querySelector('[data-emg-toggle]');
  let offset=0,running=!reduce,last=0,visible=true,raf;
  const win=1200;
  const size=()=>{const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);canvas.width=r.width*d;canvas.height=r.height*d;ctx.setTransform(d,0,0,d,0,0);draw();};
  const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  function line(arr,color,width,dash){const w=canvas.clientWidth,h=canvas.clientHeight;ctx.beginPath();ctx.setLineDash(dash||[]);ctx.lineWidth=width;ctx.strokeStyle=color;for(let i=0;i<win;i++){const v=arr[(offset+i)%arr.length];const x=i/(win-1)*w,y=h/2-v*h*.62;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke();}
  function draw(){const w=canvas.clientWidth,h=canvas.clientHeight;ctx.clearRect(0,0,w,h);ctx.strokeStyle=css('--rule');ctx.lineWidth=1;ctx.setLineDash([]);for(let i=1;i<6;i++){const x=i*w/6;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}ctx.beginPath();ctx.moveTo(0,h/2);ctx.lineTo(w,h/2);ctx.stroke();line(raw,css('--ink-3'),1,[3,3]);line(filtered,css('--accent'),1.6);
    const seg=[];for(let i=0;i<800;i++)seg.push(filtered[(offset+win-800+i)%filtered.length]);const f=features(seg);if(rmsEl)rmsEl.textContent=(f.rms*1000).toFixed(0);if(mavEl)mavEl.textContent=(f.mav*1000).toFixed(0);}
  function tick(t){if(running&&visible&&t-last>33){offset=(offset+Math.round(sampleRate*.033))%raw.length;last=t;draw()}raf=requestAnimationFrame(tick)}
  new ResizeObserver(size).observe(canvas);
  new IntersectionObserver(([e])=>visible=e.isIntersecting).observe(canvas);
  document.addEventListener('visibilitychange',()=>visible=!document.hidden);
  btn?.addEventListener('click',()=>{running=!running;btn.textContent=running?'Pause':'Play';btn.setAttribute('aria-pressed',String(!running))});
  if(btn)btn.textContent=running?'Pause':'Play';
  raf=requestAnimationFrame(tick);
}
