// Browser-only DSP demonstration. Synthetic input is not a hardware recording.
export const PREVIEW_RATES = [2000, 4000];
export function biquad(type, frequency, sampleRate, q = Math.SQRT1_2) {
  if (!(frequency > 0 && frequency < sampleRate / 2 && q > 0)) throw new RangeError('Invalid filter configuration');
  const omega = 2 * Math.PI * frequency / sampleRate;
  const cosine = Math.cos(omega), alpha = Math.sin(omega) / (2 * q), a0 = 1 + alpha;
  let b;
  if (type === 'notch') b = [1, -2 * cosine, 1];
  else if (type === 'highpass') b = [(1 + cosine) / 2, -(1 + cosine), (1 + cosine) / 2];
  else if (type === 'lowpass') b = [(1 - cosine) / 2, 1 - cosine, (1 - cosine) / 2];
  else throw new RangeError('Unknown filter type');
  const [b0, b1, b2] = b.map(value => value / a0), a1 = -2 * cosine / a0, a2 = (1 - alpha) / a0;
  let z1 = 0, z2 = 0;
  return input => { const output = b0 * input + z1; z1 = b1 * input - a1 * output + z2; z2 = b2 * input - a2 * output; return output; };
}
export function features(samples) {
  if (!samples.length) return {rms: 0, mav: 0};
  let squares = 0, absolute = 0;
  for (const value of samples) { squares += value * value; absolute += Math.abs(value); }
  return {rms: Math.sqrt(squares / samples.length), mav: absolute / samples.length};
}
export function makePreview(sampleRate) {
  if (!PREVIEW_RATES.includes(sampleRate)) throw new RangeError('Unsupported preview rate');
  const count = sampleRate * 8, raw = new Float32Array(count), filtered = new Float32Array(count);
  // LPF is 500 Hz, matching the firmware spec. Requires a preview rate of at least 2 kHz (below Nyquist).
  const highpass = biquad('highpass', 20, sampleRate), lowpass = biquad('lowpass', 500, sampleRate), notch = biquad('notch', 50, sampleRate, 30);
  let seed = 2026;
  for (let i = 0; i < count; i++) {
    const t = i / sampleRate;
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const noise = seed / 4294967296 - .5;
    const envelope = .06 + .4 * Math.pow(.5 + .5 * Math.sin(2 * Math.PI * .8 * t), 4);
    const muscle = envelope * (Math.sin(2 * Math.PI * 91 * t) + .45 * Math.sin(2 * Math.PI * 143 * t + .3) + .2 * noise);
    raw[i] = muscle + .18 * Math.sin(2 * Math.PI * 50 * t) + .07 * Math.sin(2 * Math.PI * 3 * t) + .11 * noise;
    filtered[i] = notch(lowpass(highpass(raw[i])));
  }
  return {raw, filtered, sampleRate};
}
const ROLES = ['Embedded Systems / Firmware', 'Electronics / Hardware', 'Testing / Industrial Automation', 'Internship / Other'];
export function validateContact(data) {
  const errors = {};
  if (!data.name?.trim() || data.name.trim().length > 100) errors.name = 'Enter your name, up to 100 characters.';
  if (!data.email || data.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Enter a valid email address.';
  if (!ROLES.includes(data.role)) errors.role = 'Select a role category.';
  if (!data.message || data.message.trim().length < 10 || data.message.length > 2000) errors.message = 'Write 10–2000 characters about the opportunity.';
  return errors;
}
export function contactDraft(data) {
  if (Object.keys(validateContact(data)).length) throw new TypeError('Invalid contact details');
  const name = data.name.trim().replace(/[\r\n]/g, ' ');
  const subject = `Portfolio enquiry: ${data.role}`;
  const body = `Name: ${name}\nEmail: ${data.email}\nRole: ${data.role}\n\n${data.message.trim()}`;
  return `mailto:ardhyasan@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
