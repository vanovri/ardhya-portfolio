import {biquad,features} from '../signal.mjs';

export function generateSignal({rate=4000,mains=.18,highpass=true,lowpass=true,notch=true}={}){
  if(![2000,4000].includes(rate)||!Number.isFinite(mains)||mains<0||mains>.4)throw new RangeError('Invalid signal settings');
  const hp=biquad('highpass',20,rate),lp=biquad('lowpass',500,rate),nf=biquad('notch',50,rate,30);
  const raw=new Float32Array(rate*4),filtered=new Float32Array(rate*4);let seed=2026;
  for(let i=0;i<raw.length;i++){
    const t=i/rate;seed=(Math.imul(seed,1664525)+1013904223)>>>0;const noise=seed/4294967296-.5;
    const envelope=.08+.32*Math.pow(.5+.5*Math.sin(2*Math.PI*.8*t),4);
    const muscle=envelope*(Math.sin(2*Math.PI*91*t)+.45*Math.sin(2*Math.PI*143*t+.3));
    raw[i]=muscle+mains*Math.sin(2*Math.PI*50*t)+.07*Math.sin(2*Math.PI*3*t)+.07*noise;
    let value=raw[i];if(highpass)value=hp(value);if(lowpass)value=lp(value);if(notch)value=nf(value);filtered[i]=value;
  }
  return {raw,filtered,rate};
}
export function windowFeatures(trace,start,milliseconds){
  if(![100,200,500].includes(milliseconds)||!Number.isFinite(start))throw new RangeError('Invalid feature window');
  const count=trace.rate*milliseconds/1000;
  const offset=Math.max(0,Math.min(trace.filtered.length-count,Math.floor(start)));
  return {...features(trace.filtered.subarray(offset,offset+count)),count,offset};
}
export function consumeChunk(buffer,chunk){
  const parts=(buffer+chunk).split('\n');return {buffer:parts.pop(),records:parts.map(line=>line.replace(/\r$/,''))};
}
