// Systems Lab Hub Runtime: Hardware WASM Probe, Fail-Closed Provenance Hydration, and 150ms Hash-Aware Real/Probe .wasm Hover Prefetcher
// Strict-CSP compliant: Pure textContent & DOM APIs (zero innerHTML)

// 29-byte valid WASM module probing SIMD128 (`i8x16.splat`)
const SIMD128_PROBE = new Uint8Array([
  0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
  0x01, 0x05, 0x01, 0x60, 0x00, 0x01, 0x7b,
  0x03, 0x02, 0x01, 0x00,
  0x0a, 0x08, 0x01, 0x06, 0x00, 0x41, 0x00, 0xfd, 0x0f, 0x0b,
]);

// 38-byte valid WASM module probing Bulk Memory (`memory.fill`)
const BULK_MEMORY_PROBE = new Uint8Array([
  0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
  0x01, 0x04, 0x01, 0x60, 0x00, 0x00,
  0x03, 0x02, 0x01, 0x00,
  0x05, 0x03, 0x01, 0x00, 0x01,
  0x0a, 0x0d, 0x01, 0x0b, 0x00, 0x41, 0x00, 0x41, 0x00, 0x41, 0x00, 0xfc, 0x0b, 0x00, 0x0b,
]);

let cachedManifest = null;
const prefetchedSlugs = new Set();

function probeWasmFeature(bytes) {
  try {
    return typeof WebAssembly === 'object' && WebAssembly.validate(bytes);
  } catch {
    return false;
  }
}

function runHardwareDiagnostics() {
  const simdEl = document.getElementById('probe-simd');
  const bulkEl = document.getElementById('probe-bulk');
  const coiEl = document.getElementById('probe-coi');
  const coresEl = document.getElementById('probe-cores');

  const hasSimd = probeWasmFeature(SIMD128_PROBE);
  const hasBulk = probeWasmFeature(BULK_MEMORY_PROBE);
  const isolated = Boolean(window.crossOriginIsolated);

  if (simdEl) {
    simdEl.textContent = hasSimd ? 'Supported (v128)' : 'Scalar Fallback';
    simdEl.dataset.ok = String(hasSimd);
  }
  if (bulkEl) {
    bulkEl.textContent = hasBulk ? 'Supported' : 'Unavailable';
    bulkEl.dataset.ok = String(hasBulk);
  }
  if (coiEl) {
    coiEl.textContent = isolated ? 'Active (COOP+COEP)' : 'Scoped to /labs/*';
    coiEl.dataset.ok = 'true';
  }
  if (coresEl) {
    const cores = navigator.hardwareConcurrency || 4;
    coresEl.textContent = `${cores} Threads`;
  }
}

function setCardText(card, selector, value) {
  const node = card.querySelector(selector);
  if (node && typeof value === 'string') {
    node.textContent = value;
  }
}

async function hydratePortfolioProvenance() {
  let manifest = null;
  try {
    const res = await fetch('/labs/telemetry-manifest.json', {
      cache: 'no-cache',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      manifest = await res.json();
    }
  } catch {
    return null;
  }

  if (!manifest || !manifest.zones) {
    return null;
  }

  cachedManifest = manifest;
  const total = Object.keys(manifest.zones).length;
  const summaryText = `${manifest.liveCount}/${total} VERIFIED LIVE · ${manifest.probeCount}/${total} STANDBY PROBE`;

  const summaryEl = document.getElementById('labs-provenance-summary');
  if (summaryEl) {
    summaryEl.textContent = summaryText;
    summaryEl.dataset.liveCount = String(manifest.liveCount);
  }

  const syncEl = document.getElementById('probe-sync');
  if (syncEl) {
    syncEl.textContent = `${manifest.liveCount}/${total} Verified Live`;
    syncEl.dataset.ok = String(manifest.liveCount > 0);
  }

  for (const card of document.querySelectorAll('article[data-zone-slug]')) {
    const slug = card.getAttribute('data-zone-slug');
    const entry = slug ? manifest.zones[slug] : null;
    if (!entry) continue;

    card.setAttribute('data-provenance', entry.provenance);
    card.setAttribute('data-runtime-mode', entry.runtimeMode);

    const badge = card.querySelector('[data-provenance-badge]');
    if (badge) {
      badge.setAttribute('data-provenance', entry.provenance);
      badge.textContent =
        entry.provenance === 'VERIFIED_LIVE'
          ? `VERIFIED LIVE · ${entry.commitSha}`
          : 'STANDBY PROBE';
    }

    const wasmPill = card.querySelector('[data-wasm-pill]');
    if (wasmPill && !prefetchedSlugs.has(slug)) {
      wasmPill.textContent =
        entry.runtimeMode === 'REAL_ENGINE_WASM'
          ? `Real WASM (${entry.wasmSizeKb} KB)`
          : `Probe WASM (${entry.wasmSizeKb} KB)`;
    }

    setCardText(card, '[data-wasm-size]', `WASM: ${entry.wasmSizeKb} KB`);
    setCardText(card, '[data-commit-sha]', entry.commitSha ? `SHA: ${entry.commitSha}` : 'SHA: standby');

    if (entry.provenance === 'VERIFIED_LIVE' && Array.isArray(entry.headlineMetrics) && entry.headlineMetrics.length === 3) {
      const [m0, m1, m2] = entry.headlineMetrics;
      setCardText(card, '[data-hero-label]', m0.label);
      setCardText(card, '[data-hero-value]', m0.value);
      setCardText(card, '[data-hero-unit]', '');
      setCardText(card, '[data-hero-note]', `Verified live (${entry.commitSha}) · Real ${entry.wasmSizeKb} KB WASM`);

      setCardText(card, '[data-m0-label]', m0.label);
      setCardText(card, '[data-m0-value]', m0.value);
      setCardText(card, '[data-m1-label]', m1.label);
      setCardText(card, '[data-m1-value]', m1.value);
      setCardText(card, '[data-m2-label]', m2.label);
      setCardText(card, '[data-m2-value]', m2.value);
    }
  }

  return manifest;
}

function injectPrefetchLink(href, asType) {
  if (!href || document.head.querySelector(`link[rel="prefetch"][href="${CSS.escape(href)}"]`)) {
    return;
  }
  const link = document.createElement('link');
  link.rel = 'prefetch';
  if (asType) link.as = asType;
  link.crossOrigin = 'anonymous';
  link.href = href;
  document.head.append(link);
}

async function prefetchZoneWasm(slug, manifest, cardEl) {
  if (!slug || prefetchedSlugs.has(slug)) return;

  const connection = navigator.connection;
  if (connection && (connection.saveData || /2g/.test(connection.effectiveType || ''))) {
    return;
  }

  const entry = manifest?.zones?.[slug];
  if (!entry) return;

  prefetchedSlugs.add(slug);
  const pill = cardEl.querySelector('[data-wasm-pill]');
  if (pill) {
    pill.textContent = 'Warming .wasm…';
    pill.dataset.state = 'warming';
  }

  try {
    const urls = [entry.wasmAssetPath];
    injectPrefetchLink(entry.wasmAssetPath, 'fetch');
    if (entry.glueAssetPath) {
      urls.push(entry.glueAssetPath);
      injectPrefetchLink(entry.glueAssetPath, 'script');
    }

    const responses = await Promise.all(urls.map((u) => fetch(u, { credentials: 'same-origin' })));
    if (!responses.every((r) => r.ok)) {
      throw new Error('Prefetch returned non-OK status');
    }

    if (pill) {
      pill.textContent =
        entry.runtimeMode === 'REAL_ENGINE_WASM'
          ? `Real WASM Cached (${entry.wasmSizeKb} KB)`
          : `Probe WASM Cached (${entry.wasmSizeKb} KB)`;
      pill.dataset.state = 'ready';
    }
  } catch {
    prefetchedSlugs.delete(slug);
    if (pill) {
      pill.textContent =
        entry.runtimeMode === 'REAL_ENGINE_WASM'
          ? `Real WASM (${entry.wasmSizeKb} KB)`
          : `Probe WASM (${entry.wasmSizeKb} KB)`;
      delete pill.dataset.state;
    }
  }
}

function bindHoverPrewarmAndFilters() {
  const cards = [...document.querySelectorAll('article[data-zone-slug]')];
  for (const card of cards) {
    const slug = card.getAttribute('data-zone-slug');
    let hoverTimer = null;
    card.addEventListener('pointerenter', () => {
      hoverTimer = window.setTimeout(() => {
        void prefetchZoneWasm(slug, cachedManifest, card);
      }, 150);
    });
    card.addEventListener('pointerleave', () => {
      if (hoverTimer !== null) {
        clearTimeout(hoverTimer);
        hoverTimer = null;
      }
    });
    const launchBtn = card.querySelector('[data-studio-launch]');
    launchBtn?.addEventListener('focus', () => {
      if (launchBtn.matches(':focus-visible')) {
        void prefetchZoneWasm(slug, cachedManifest, card);
      }
    });
  }

  const filterBtns = [...document.querySelectorAll('[data-lab-filter]')];
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const selected = btn.dataset.labFilter || 'ALL';
      filterBtns.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      cards.forEach((card) => {
        const match = selected === 'ALL' || card.dataset.category === selected;
        card.hidden = !match;
      });
    });
  });
}

runHardwareDiagnostics();
bindHoverPrewarmAndFilters();
void hydratePortfolioProvenance();
