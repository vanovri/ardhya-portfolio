import {makePreview, features, validateContact, contactDraft} from './signal.mjs';

document.documentElement.classList.add('js');
const menu = document.querySelector('.menu-toggle'), nav = document.querySelector('#primary-nav');
menu.hidden = false;
function closeMenu() { menu.setAttribute('aria-expanded', 'false'); nav.classList.remove('menu-open'); }
menu.addEventListener('click', () => { const opened = menu.getAttribute('aria-expanded') === 'true'; menu.setAttribute('aria-expanded', String(!opened)); nav.classList.toggle('menu-open', !opened); });
nav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && nav.classList.contains('menu-open')) { closeMenu(); menu.focus(); } });

const tabs = [...document.querySelectorAll('[role=tab]')];
function activateTab(tab, focus = false, sync = true) {
  for (const candidate of tabs) {
    const selected = candidate === tab;
    candidate.setAttribute('aria-selected', String(selected)); candidate.tabIndex = selected ? 0 : -1;
    document.getElementById(candidate.getAttribute('aria-controls')).hidden = !selected;
  }
  if (focus) tab.focus();
  if (sync) { const url = new URL(location.href); url.searchParams.set('skills', tab.id.replace('tab-', '')); history.replaceState(null, '', url); }
}
function restoreTab() { const wanted = new URL(location.href).searchParams.get('skills'); activateTab(tabs.find(tab => tab.id === `tab-${wanted}`) || tabs[0], false, false); }
for (const [index, tab] of tabs.entries()) {
  tab.addEventListener('click', () => activateTab(tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index + tabs.length - 1) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next !== undefined) { event.preventDefault(); activateTab(tabs[next], true); }
  });
}
restoreTab(); window.addEventListener('popstate', restoreTab);

const canvas = document.getElementById('waveform'), ctx = canvas.getContext('2d');
const rateSelect = document.getElementById('sample-rate'), toggle = document.getElementById('wave-toggle'), stateLabel = document.getElementById('wave-state');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const metricNodes = {rms: document.getElementById('rms-value').firstChild, mav: document.getElementById('mav-value').firstChild};
const filterLabel = document.getElementById('preview-filter');
const theme = getComputedStyle(document.documentElement);
const plotColors = {grid: theme.getPropertyValue('--color-grid').trim(), zero: theme.getPropertyValue('--color-zero').trim(), raw: theme.getPropertyValue('--color-accent').trim(), filtered: theme.getPropertyValue('--color-signal').trim()};
const previewCache = new Map();
let paused = reducedMotion.matches, visible = false, animationId = 0, lastFrame = 0, lastMetrics = 0, phase = 1.2, preview = null, width = 640, height = 240;
function preparePreview() {
  if (!ctx) return false;
  const rate = Number(rateSelect.value);
  if (!previewCache.has(rate)) previewCache.set(rate, makePreview(rate));
  preview = previewCache.get(rate);
  rateSelect.disabled = false; toggle.disabled = false;
  return true;
}
function updateState() { toggle.textContent = paused ? 'Resume preview' : 'Pause preview'; toggle.setAttribute('aria-pressed', String(paused)); stateLabel.textContent = paused ? 'Paused' : 'Running'; }
function draw(forceMetrics = false) {
  if (!ctx || !preview) return;
  ctx.clearRect(0, 0, width, height); ctx.strokeStyle = plotColors.grid; ctx.lineWidth = 1;
  for (let x = 0; x <= width; x += width / 10) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
  for (let y = 0; y <= height; y += height / 6) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
  ctx.strokeStyle = plotColors.zero; ctx.setLineDash([3, 5]); ctx.beginPath(); ctx.moveTo(0, height / 2); ctx.lineTo(width, height / 2); ctx.stroke(); ctx.setLineDash([]);
  const start = Math.floor(phase * preview.sampleRate), count = preview.sampleRate / 2;
  function trace(samples, color, lineWidth, dashed) {
    ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = lineWidth; ctx.setLineDash(dashed ? [3, 2] : []);
    const points = Math.max(2, Math.min(count, Math.round(width * 1.5)));
    for (let i = 0; i < points; i++) {
      const index = start + Math.floor(i * count / (points - 1));
      const x = i * width / (points - 1), y = height / 2 - samples[index] * height * .65;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke(); ctx.setLineDash([]);
  }
  trace(preview.raw, plotColors.raw, 1, true); trace(preview.filtered, plotColors.filtered, 1.4, false);
  if (forceMetrics || performance.now() - lastMetrics > 250) {
    const end = start + count, values = features(preview.filtered.subarray(end - preview.sampleRate / 10, end));
    for (const key of ['rms', 'mav']) metricNodes[key].textContent = values[key].toFixed(3) + ' ';
    lastMetrics = performance.now();
  }
}
function stop() { cancelAnimationFrame(animationId); animationId = 0; lastFrame = 0; }
function animate(time) {
  if (paused || !visible || document.hidden) { stop(); return; }
  if (!lastFrame || time - lastFrame >= 1000 / 24) { phase += lastFrame ? Math.min((time - lastFrame) / 1000, .1) : 0; if (phase > 6.5) phase = 1; lastFrame = time; draw(); }
  animationId = requestAnimationFrame(animate);
}
function start() { if (!animationId && !paused && visible && !document.hidden && ctx && preview) animationId = requestAnimationFrame(animate); }
new ResizeObserver(entries => {
  const rectangle = entries[0].contentRect; width = Math.max(1, rectangle.width); height = Math.max(1, rectangle.height);
  const ratio = Math.min(devicePixelRatio || 1, 2); canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio); ctx?.setTransform(ratio, 0, 0, ratio, 0, 0); draw(true);
}).observe(canvas);
new IntersectionObserver(entries => {
  visible = entries[0].isIntersecting;
  if (visible && !preview && preparePreview()) { updateState(); draw(true); }
  if (visible) start(); else stop();
}, {threshold:.1}).observe(canvas);
toggle.addEventListener('click', () => { paused = !paused; updateState(); if (paused) stop(); else start(); });
rateSelect.addEventListener('change', () => { if (!preparePreview()) return; filterLabel.textContent = `20–${Math.min(500, preview.sampleRate * .4)} Hz bandpass. 50 Hz notch.`; draw(true); });
document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
reducedMotion.addEventListener('change', event => { if (event.matches) { paused = true; stop(); updateState(); } });
if (!ctx) {
  const error = document.getElementById('preview-error'); error.hidden = false;
  error.textContent = 'The signal preview is unavailable in this browser. Project details and configuration are still available.';
  stateLabel.textContent = 'Unavailable';
}

const form = document.getElementById('contact-form'), formStatus = document.getElementById('form-status');
let draftPrepared = false;
form.addEventListener('submit', event => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form)), errors = validateContact(data);
  if (!form.elements.email.validity.valid) errors.email = 'Enter a valid email address.';
  for (const name of ['name', 'email', 'role', 'message']) { const field = form.elements[name]; field.setAttribute('aria-invalid', String(Boolean(errors[name]))); document.getElementById(`${name}-error`).textContent = errors[name] || ''; }
  const first = Object.keys(errors)[0];
  if (first) { formStatus.textContent = 'Please check the highlighted fields.'; form.elements[first].focus(); return; }
  const draft = contactDraft(data); draftPrepared = true;
  formStatus.replaceChildren(document.createTextNode('Draft prepared. If your email app did not open, '));
  const link = document.createElement('a'); link.href = draft; link.textContent = 'open the draft again'; link.style.textDecoration = 'underline'; formStatus.append(link, document.createTextNode('. No message has been sent.'));
  location.href = draft;
});
form.addEventListener('input', event => { draftPrepared = false; formStatus.textContent = ''; if (event.target.name) { event.target.removeAttribute('aria-invalid'); const error = document.getElementById(`${event.target.name}-error`); if (error) error.textContent = ''; } });
window.addEventListener('beforeunload', event => { if (!draftPrepared && [...new FormData(form).values()].some(value => value.trim())) { event.preventDefault(); event.returnValue = ''; } });
