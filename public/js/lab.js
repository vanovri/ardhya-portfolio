import {generateSignal,windowFeatures,consumeChunk} from './lab-model.js';
const canvas=document.getElementById('lab-canvas'),ctx=canvas.getContext('2d');
const rate=document.getElementById('lab-rate'),mains=document.getElementById('lab-mains');
const hp=document.getElementById('lab-hp'),lp=document.getElementById('lab-lp'),notch=document.getElementById('lab-notch');
const windowSize=document.getElementById('lab-window'),play=document.getElementById('lab-play');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let trace,offset=0,playing=false,frame=0,last=0,inView=true;
function stop(){playing=false;cancelAnimationFrame(frame);play.textContent='Play preview';play.setAttribute('aria-pressed','false');}
function draw(){
  const w=canvas.clientWidth,h=canvas.clientHeight,dpr=Math.min(devicePixelRatio,2);
  if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);}
  ctx.clearRect(0,0,w,h);ctx.lineWidth=1;ctx.strokeStyle='#ececf0';
  for(let i=1;i<5;i++){ctx.beginPath();ctx.moveTo(0,h*i/5);ctx.lineTo(w,h*i/5);ctx.stroke();}
  for(let i=1;i<8;i++){ctx.beginPath();ctx.moveTo(w*i/8,0);ctx.lineTo(w*i/8,h);ctx.stroke();}
  const visible=trace.rate*.65;
  function line(values,color,width){ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=width;const points=Math.min(w,1000);for(let x=0;x<points;x++){const index=(offset+Math.floor(x/points*visible))%values.length;const y=h/2-values[index]*(h*.58);if(x)ctx.lineTo(x/(points-1)*w,y);else ctx.moveTo(0,y);}ctx.stroke();}
  line(trace.raw,'#a9abb4',1);line(trace.filtered,'#0067c8',1.6);
  const metrics=windowFeatures(trace,offset+visible-trace.rate*Number(windowSize.value)/1000,Number(windowSize.value));
  document.getElementById('lab-rms').textContent=metrics.rms.toFixed(3);
  document.getElementById('lab-mav').textContent=metrics.mav.toFixed(3);
  document.getElementById('lab-samples').textContent=String(metrics.count);
}
function refresh(){trace=generateSignal({rate:Number(rate.value),mains:Number(mains.value),highpass:hp.checked,lowpass:lp.checked,notch:notch.checked});offset=trace.rate;document.getElementById('lab-mains-label').textContent=Number(mains.value).toFixed(2)+' a.u.';draw();}
function tick(time){if(!playing)return;const dt=last?Math.min(time-last,60):0;last=time;offset=(offset+Math.round(dt/1000*trace.rate))%(trace.raw.length-trace.rate);draw();frame=requestAnimationFrame(tick);}
play.addEventListener('click',()=>{if(playing){stop();return;}playing=true;last=0;play.textContent='Pause preview';play.setAttribute('aria-pressed','true');frame=requestAnimationFrame(tick);});
for(const input of [rate,mains,hp,lp,notch])input.addEventListener('input',refresh);
windowSize.addEventListener('change',draw);
document.getElementById('lab-reset').addEventListener('click',()=>{stop();rate.value='4000';mains.value='.18';hp.checked=lp.checked=notch.checked=true;windowSize.value='100';refresh();});
document.getElementById('lab-export').addEventListener('click',()=>{
  const lines=['time_s,input_au,filtered_au'];for(let i=0;i<trace.raw.length;i++)lines.push(`${(i/trace.rate).toFixed(6)},${trace.raw[i].toFixed(6)},${trace.filtered[i].toFixed(6)}`);
  const url=URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/csv;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='ardhya-synthetic-signal.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
reduced.addEventListener('change',event=>{if(event.matches)stop();});
new ResizeObserver(draw).observe(canvas);
new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;if(!inView)stop();}).observe(canvas);
refresh();

const chunks=['RMS=0.22,','MAV=0.18\nR','MS=0.31,MAV=','0.25\nRMS=0.','19,MAV=0.15','\n'];
let chunkIndex=0,buffer='',records=[];
const next=document.getElementById('serial-next');
function serialDisplay(incoming){document.getElementById('serial-chunk').textContent=incoming?JSON.stringify(incoming):'Waiting for a chunk';document.getElementById('serial-buffer').textContent=buffer||'Empty';document.getElementById('serial-records').textContent=records.length?records.join('\n'):'No complete records yet';document.getElementById('serial-progress').textContent=`${chunkIndex} of ${chunks.length} chunks`;next.disabled=chunkIndex===chunks.length;}
next.addEventListener('click',()=>{const incoming=chunks[chunkIndex++];const result=consumeChunk(buffer,incoming);buffer=result.buffer;records.push(...result.records);serialDisplay(incoming);});
document.getElementById('serial-reset').addEventListener('click',()=>{chunkIndex=0;buffer='';records=[];serialDisplay('');});
