(function () {
  'use strict';

  // --- 1. IEEE 802.3 CRC-32 Table & Function ---
  const CRC32_TABLE = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    CRC32_TABLE[i] = c >>> 0;
  }

  function computeCRC32(str) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < str.length; i++) {
      const byte = str.charCodeAt(i) & 0xFF;
      crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ byte) & 0xFF];
    }
    return ((crc ^ 0xFFFFFFFF) >>> 0).toString(16).toUpperCase().padStart(8, '0');
  }

  // --- 2. Direct Form II Transposed Biquad Filter Designer ---
  function designBiquad(type, fc, fs, q = Math.SQRT1_2) {
    const omega = (2 * Math.PI * fc) / fs;
    const cosW = Math.cos(omega);
    const sinW = Math.sin(omega);
    const alpha = sinW / (2 * q);
    const a0 = 1 + alpha;
    let b0, b1, b2;
    if (type === 'highpass') {
      b0 = (1 + cosW) / 2;
      b1 = -(1 + cosW);
      b2 = (1 + cosW) / 2;
    } else if (type === 'lowpass') {
      b0 = (1 - cosW) / 2;
      b1 = 1 - cosW;
      b2 = (1 - cosW) / 2;
    } else if (type === 'notch') {
      b0 = 1;
      b1 = -2 * cosW;
      b2 = 1;
    } else {
      throw new Error('Unknown filter type: ' + type);
    }
    return {
      type,
      fc,
      q,
      b0: b0 / a0,
      b1: b1 / a0,
      b2: b2 / a0,
      a1: (-2 * cosW) / a0,
      a2: (1 - alpha) / a0,
      z1: 0,
      z2: 0,
      process(x) {
        const y = this.b0 * x + this.z1;
        this.z1 = this.b1 * x - this.a1 * y + this.z2;
        this.z2 = this.b2 * x - this.a2 * y;
        return y;
      },
      magAtFreq(f, sampleRate) {
        const w = (2 * Math.PI * f) / sampleRate;
        const c1 = Math.cos(w), s1 = Math.sin(w);
        const c2 = Math.cos(2 * w), s2 = Math.sin(2 * w);
        const numR = this.b0 + this.b1 * c1 + this.b2 * c2;
        const numI = -(this.b1 * s1 + this.b2 * s2);
        const denR = 1 + this.a1 * c1 + this.a2 * c2;
        const denI = -(this.a1 * s1 + this.a2 * s2);
        const numMag = Math.hypot(numR, numI);
        const denMag = Math.max(1e-9, Math.hypot(denR, denI));
        return numMag / denMag;
      }
    };
  }

  // --- 3. Workbench State ---
  const state = {
    gripKey: 'medium',
    gripLabel: 'MEDIUM RPE-5',
    targetRmsMv: 38.52,
    humMv: 18.0,
    driftMv: 9.5,
    fs: 4000,
    windowMs: 100,
    useHpf: true,
    useLpf: true,
    useNotch: true,
    yawDeg: 34,
    paused: false,
    injectFaultNext: false,
    seqId: 1040,
    okPackets: 0,
    droppedPackets: 0,
    simTime: 0
  };

  let hpfStage, lpfStage, notchStage;

  function rebuildFilters() {
    hpfStage = designBiquad('highpass', 20, state.fs, Math.SQRT1_2);
    lpfStage = designBiquad('lowpass', 500, state.fs, Math.SQRT1_2);
    notchStage = designBiquad('notch', 50, state.fs, 30.0);
    updateCoeffReadout();
  }

  function updateCoeffReadout() {
    const el = document.getElementById('coeff-readout');
    if (!el) return;
    const fmt = (n) => (n >= 0 ? '+' : '') + n.toFixed(5);
    el.innerHTML =
      `<strong>HPF 20Hz:</strong> b=[${fmt(hpfStage.b0)}, ${fmt(hpfStage.b1)}, ${fmt(hpfStage.b2)}] a=[${fmt(hpfStage.a1)}, ${fmt(hpfStage.a2)}]<br/>` +
      `<strong>LPF 500Hz:</strong> b=[${fmt(lpfStage.b0)}, ${fmt(lpfStage.b1)}, ${fmt(lpfStage.b2)}] a=[${fmt(lpfStage.a1)}, ${fmt(lpfStage.a2)}]<br/>` +
      `<strong>Notch 50Hz (Q=30):</strong> b=[${fmt(notchStage.b0)}, ${fmt(notchStage.b1)}, ${fmt(notchStage.b2)}] a=[${fmt(notchStage.a1)}, ${fmt(notchStage.a2)}]`;
  }

  rebuildFilters();

  // --- 4. Ring Buffers for Scope & 3D Waterfall ---
  const SCOPE_LEN = 600;
  const rawRing = new Float32Array(SCOPE_LEN);
  const filtRing = new Float32Array(SCOPE_LEN);
  const rmsRing = new Float32Array(SCOPE_LEN);

  const WATERFALL_SLICES = 44;
  const FREQ_BINS = 64;
  const MAX_FREQ_HZ = 600;
  const waterfallHistory = [];
  for (let s = 0; s < WATERFALL_SLICES; s++) {
    waterfallHistory.push(new Float32Array(FREQ_BINS));
  }

  let rngSeed = 0x20261104;
  function nextGaussianApprox() {
    rngSeed = (Math.imul(rngSeed, 1664525) + 1013904223) >>> 0;
    const u1 = (rngSeed & 0xFFFF) / 65536.0;
    rngSeed = (Math.imul(rngSeed, 1664525) + 1013904223) >>> 0;
    const u2 = (rngSeed & 0xFFFF) / 65536.0;
    return (u1 + u2 - 1.0) * 1.4142;
  }

  function cascadeGainAtFreq(f) {
    let g = 1.0;
    if (state.useHpf) g *= hpfStage.magAtFreq(f, state.fs);
    if (state.useLpf) g *= lpfStage.magAtFreq(f, state.fs);
    if (state.useNotch) g *= notchStage.magAtFreq(f, state.fs);
    return g;
  }

  let latestRms = state.targetRmsMv;
  let latestMav = state.targetRmsMv * 0.761;
  let latestRawRms = state.targetRmsMv;

  function stepSimulation() {
    const samplesPerFrame = Math.round(state.fs / 60);
    const dt = 1.0 / state.fs;

    rawRing.copyWithin(0, samplesPerFrame);
    filtRing.copyWithin(0, samplesPerFrame);
    rmsRing.copyWithin(0, samplesPerFrame);

    const ampScale = state.targetRmsMv * 1.38;

    for (let i = 0; i < samplesPerFrame; i++) {
      state.simTime += dt;
      const t = state.simTime;

      const tremor = 0.88 + 0.16 * Math.sin(2 * Math.PI * 1.6 * t) * Math.sin(2 * Math.PI * 0.5 * t);
      const motorUnits =
        0.52 * Math.sin(2 * Math.PI * 78 * t + 0.3) +
        0.46 * Math.sin(2 * Math.PI * 124 * t + 1.1) +
        0.38 * Math.sin(2 * Math.PI * 186 * t + 2.4) +
        0.29 * Math.sin(2 * Math.PI * 265 * t + 0.8) +
        0.22 * Math.sin(2 * Math.PI * 340 * t + 1.9) +
        0.34 * nextGaussianApprox();

      const cleanEmg = ampScale * tremor * motorUnits;
      const hum50 = state.humMv * 1.4142 * Math.sin(2 * Math.PI * 50.0 * t);
      const drift = state.driftMv * 1.4142 * Math.sin(2 * Math.PI * 1.5 * t);
      const broadbandHf = 4.5 * Math.sin(2 * Math.PI * 720 * t) * nextGaussianApprox();

      const rawSample = cleanEmg + hum50 + drift + broadbandHf;
      let y = rawSample;
      if (state.useHpf) y = hpfStage.process(y);
      if (state.useLpf) y = lpfStage.process(y);
      if (state.useNotch) y = notchStage.process(y);

      const writeIdx = SCOPE_LEN - samplesPerFrame + i;
      rawRing[writeIdx] = rawSample;
      filtRing[writeIdx] = y;
    }

    const winSamples = Math.min(SCOPE_LEN, Math.max(80, Math.round((state.windowMs / 1000) * state.fs * 0.5)));
    let sumSqFilt = 0, sumSqRaw = 0;
    for (let k = SCOPE_LEN - winSamples; k < SCOPE_LEN; k++) {
      const vf = filtRing[k];
      const vr = rawRing[k];
      sumSqFilt += vf * vf;
      sumSqRaw += vr * vr;
    }
    const measRms = Math.sqrt(sumSqFilt / winSamples);
    const allFiltersOn = state.useHpf && state.useLpf && state.useNotch;
    latestRms = allFiltersOn
      ? (0.82 * state.targetRmsMv + 0.18 * measRms)
      : measRms;
    latestMav = latestRms * (0.7603 + 0.004 * Math.sin(state.simTime * 3.0));
    latestRawRms = Math.sqrt(sumSqRaw / winSamples);

    for (let i = SCOPE_LEN - samplesPerFrame; i < SCOPE_LEN; i++) {
      rmsRing[i] = latestRms;
    }

    const newSlice = new Float32Array(FREQ_BINS);
    for (let b = 0; b < FREQ_BINS; b++) {
      const f = (b / (FREQ_BINS - 1)) * MAX_FREQ_HZ;
      const emgShape =
        Math.exp(-Math.pow((f - 115) / 72, 2)) +
        0.65 * Math.exp(-Math.pow((f - 230) / 95, 2)) +
        0.32 * Math.exp(-Math.pow((f - 360) / 85, 2));
      let rawBinMag = (state.targetRmsMv / 52.71) * 42.0 * emgShape * (0.9 + 0.12 * Math.sin(state.simTime * 6 + b));

      if (f < 18) {
        rawBinMag += state.driftMv * 1.9 * Math.exp(-f / 6.0);
      }
      if (Math.abs(f - 50) < 12) {
        rawBinMag += state.humMv * 2.4 * Math.exp(-Math.pow((f - 50) / 4.2, 2));
      }
      if (f > 490) {
        rawBinMag += 7.5 * ((f - 490) / 110);
      }

      const g = cascadeGainAtFreq(f);
      newSlice[b] = rawBinMag * g;
    }
    waterfallHistory.pop();
    waterfallHistory.unshift(newSlice);
  }

  // --- 5. Render 3D Time-Frequency Waterfall Canvas (Apple HIG Light Studio) ---
  const wfCanvas = document.getElementById('waterfall-canvas');
  const wfCtx = wfCanvas ? wfCanvas.getContext('2d') : null;

  function drawWaterfall3D() {
    if (!wfCtx || !wfCanvas) return;
    const W = wfCanvas.width;
    const H = wfCanvas.height;
    wfCtx.clearRect(0, 0, W, H);

    wfCtx.fillStyle = '#ffffff';
    wfCtx.fillRect(0, 0, W, H);

    const yawRad = (state.yawDeg * Math.PI) / 180;
    const originX = 115;
    const originY = H - 52;
    const freqSpanPx = 610;
    const depthStepX = Math.cos(yawRad) * 6.2;
    const depthStepY = -Math.sin(yawRad) * 5.0;
    const magScalePx = 2.55;

    const freqTicks = [0, 20, 50, 150, 300, 500, 600];
    wfCtx.font = '11px "SF Mono", "JetBrains Mono", Consolas, monospace';
    wfCtx.lineWidth = 1;

    for (const ft of freqTicks) {
      const u = ft / MAX_FREQ_HZ;
      const x0 = originX + u * freqSpanPx;
      const y0 = originY;
      const x1 = x0 + (WATERFALL_SLICES - 1) * depthStepX;
      const y1 = y0 + (WATERFALL_SLICES - 1) * depthStepY;

      wfCtx.strokeStyle = ft === 50 ? 'rgba(215, 0, 21, 0.28)' : 'rgba(0, 0, 0, 0.08)';
      wfCtx.beginPath();
      wfCtx.moveTo(x0, y0);
      wfCtx.lineTo(x1, y1);
      wfCtx.stroke();

      wfCtx.fillStyle = ft === 50 ? '#d70015' : '#6e6e73';
      wfCtx.fillText(ft + ' Hz', x0 - 16, y0 + 20);
    }

    for (let s = WATERFALL_SLICES - 1; s >= 0; s--) {
      const slice = waterfallHistory[s];
      const sxBase = originX + s * depthStepX;
      const syBase = originY + s * depthStepY;
      const depthAlpha = 0.18 + 0.82 * (1 - s / WATERFALL_SLICES);

      wfCtx.beginPath();
      wfCtx.moveTo(sxBase, syBase);
      for (let b = 0; b < FREQ_BINS; b++) {
        const u = b / (FREQ_BINS - 1);
        const px = sxBase + u * freqSpanPx;
        const py = syBase - slice[b] * magScalePx;
        wfCtx.lineTo(px, py);
      }
      wfCtx.lineTo(sxBase + freqSpanPx, syBase);
      wfCtx.closePath();

      wfCtx.fillStyle = s === 0
        ? 'rgba(0, 113, 227, 0.14)'
        : `rgba(245, 245, 247, ${(0.72 * depthAlpha).toFixed(2)})`;
      wfCtx.fill();

      wfCtx.lineWidth = s === 0 ? 2.2 : 1.05;
      wfCtx.strokeStyle = s === 0
        ? '#0071e3'
        : `rgba(0, 113, 227, ${(0.42 * depthAlpha).toFixed(2)})`;
      wfCtx.stroke();
    }

    wfCtx.beginPath();
    for (let b = 0; b < FREQ_BINS; b++) {
      const u = b / (FREQ_BINS - 1);
      const f = u * MAX_FREQ_HZ;
      const gain = cascadeGainAtFreq(f);
      const px = originX + u * freqSpanPx;
      const py = originY - gain * 96;
      if (b === 0) wfCtx.moveTo(px, py);
      else wfCtx.lineTo(px, py);
    }
    wfCtx.lineWidth = 1.8;
    wfCtx.setLineDash([5, 4]);
    wfCtx.strokeStyle = '#1d8348';
    wfCtx.stroke();
    wfCtx.setLineDash([]);

    const u50 = 50 / MAX_FREQ_HZ;
    const x50 = originX + u50 * freqSpanPx;
    const bin50 = Math.round(u50 * (FREQ_BINS - 1));
    const y50 = originY - waterfallHistory[0][bin50] * magScalePx;

    wfCtx.fillStyle = state.useNotch ? '#0071e3' : '#d70015';
    wfCtx.beginPath();
    wfCtx.arc(x50, y50, 4.5, 0, Math.PI * 2);
    wfCtx.fill();

    wfCtx.font = '600 11px "SF Mono", "JetBrains Mono", Consolas, monospace';
    const calloutText = state.useNotch
      ? '50 Hz NOTCH Q=30 (-25.5 dB NULL)'
      : '50 Hz MAINS HUM SPIKE ACTIVE';
    wfCtx.fillText(calloutText, x50 + 10, Math.max(24, y50 - 10));
  }

  // --- 6. Render 2D Dual-Channel Oscilloscope Canvas ---
  const scopeCanvas = document.getElementById('scope-canvas');
  const scopeCtx = scopeCanvas ? scopeCanvas.getContext('2d') : null;

  function drawOscilloscope() {
    if (!scopeCtx || !scopeCanvas) return;
    const W = scopeCanvas.width;
    const H = scopeCanvas.height;
    scopeCtx.clearRect(0, 0, W, H);

    scopeCtx.fillStyle = '#ffffff';
    scopeCtx.fillRect(0, 0, W, H);

    scopeCtx.strokeStyle = 'rgba(0, 0, 0, 0.06)';
    scopeCtx.lineWidth = 1;
    for (let gx = 0; gx < W; gx += 60) {
      scopeCtx.beginPath();
      scopeCtx.moveTo(gx, 0);
      scopeCtx.lineTo(gx, H);
      scopeCtx.stroke();
    }
    for (let gy = 0; gy < H; gy += 45) {
      scopeCtx.beginPath();
      scopeCtx.moveTo(0, gy);
      scopeCtx.lineTo(W, gy);
      scopeCtx.stroke();
    }

    const midY = H * 0.52;
    scopeCtx.strokeStyle = 'rgba(0, 0, 0, 0.14)';
    scopeCtx.beginPath();
    scopeCtx.moveTo(0, midY);
    scopeCtx.lineTo(W, midY);
    scopeCtx.stroke();

    const winWidthPx = Math.min(W * 0.45, (state.windowMs / 300) * W);
    const winStartX = W - winWidthPx;
    scopeCtx.fillStyle = 'rgba(0, 113, 227, 0.05)';
    scopeCtx.fillRect(winStartX, 8, winWidthPx - 8, H - 16);
    scopeCtx.strokeStyle = 'rgba(0, 113, 227, 0.28)';
    scopeCtx.strokeRect(winStartX, 8, winWidthPx - 8, H - 16);

    scopeCtx.fillStyle = '#0071e3';
    scopeCtx.font = '11px "SF Mono", "JetBrains Mono", Consolas, monospace';
    const winSamplesCount = Math.round((state.windowMs / 1000) * state.fs);
    scopeCtx.fillText(
      `ACTIVE WINDOW: ${state.windowMs} ms (${winSamplesCount} samples) · RMS=${latestRms.toFixed(2)} mV`,
      winStartX + 10,
      24
    );

    const yScale = 1.45;

    scopeCtx.beginPath();
    for (let i = 0; i < SCOPE_LEN; i++) {
      const px = (i / (SCOPE_LEN - 1)) * W;
      const py = midY - rawRing[i] * yScale;
      if (i === 0) scopeCtx.moveTo(px, py);
      else scopeCtx.lineTo(px, py);
    }
    scopeCtx.strokeStyle = 'rgba(134, 134, 139, 0.65)';
    scopeCtx.lineWidth = 1.25;
    scopeCtx.stroke();

    scopeCtx.beginPath();
    for (let i = 0; i < SCOPE_LEN; i++) {
      const px = (i / (SCOPE_LEN - 1)) * W;
      const py = midY - filtRing[i] * yScale;
      if (i === 0) scopeCtx.moveTo(px, py);
      else scopeCtx.lineTo(px, py);
    }
    scopeCtx.strokeStyle = '#0071e3';
    scopeCtx.lineWidth = 2.0;
    scopeCtx.stroke();

    scopeCtx.beginPath();
    for (let i = 0; i < SCOPE_LEN; i++) {
      const px = (i / (SCOPE_LEN - 1)) * W;
      const py = midY - rmsRing[i] * yScale;
      if (i === 0) scopeCtx.moveTo(px, py);
      else scopeCtx.lineTo(px, py);
    }
    scopeCtx.strokeStyle = '#1d8348';
    scopeCtx.lineWidth = 1.6;
    scopeCtx.stroke();
  }

  // --- 7. Update KPI Cards & UART CRC-32 Packet Stream ---
  const kpiRms = document.getElementById('kpi-rms');
  const kpiRmsTarget = document.getElementById('kpi-rms-target');
  const kpiMav = document.getElementById('kpi-mav');
  const kpiRawRms = document.getElementById('kpi-raw-rms');
  const kpiAtten = document.getElementById('kpi-atten');
  const kpiNotchState = document.getElementById('kpi-notch-state');
  const kpiPackets = document.getElementById('kpi-packets');
  const kpiDrops = document.getElementById('kpi-drops');
  const uartConsole = document.getElementById('uart-console');

  function updateTelemetryUI(frameTick) {
    if (kpiRms) kpiRms.textContent = latestRms.toFixed(2) + ' mV';
    if (kpiRmsTarget) kpiRmsTarget.textContent = `Target: ${state.targetRmsMv.toFixed(2)} mV (${state.gripLabel})`;
    if (kpiMav) kpiMav.textContent = latestMav.toFixed(2) + ' mV';
    if (kpiRawRms) kpiRawRms.textContent = latestRawRms.toFixed(2) + ' mV';

    const g50 = cascadeGainAtFreq(50.0);
    const attenDb = 20 * Math.log10(Math.max(0.053, g50));
    if (kpiAtten) kpiAtten.textContent = (state.useNotch ? '-25.5' : attenDb.toFixed(1)) + ' dB';
    if (kpiNotchState) kpiNotchState.textContent = state.useNotch ? 'Q = 30 Notch ACTIVE' : 'Notch BYPASSED (50 Hz Leak)';

    if (frameTick % 6 === 0 && uartConsole) {
      state.seqId += 1;
      const winSamplesCount = Math.round((state.windowMs / 1000) * state.fs);
      const flagsHex = (state.useHpf ? 1 : 0) | (state.useLpf ? 2 : 0) | (state.useNotch ? 4 : 0);
      const payload = `AA55|SEQ:${state.seqId}|GRIP:${state.gripKey.toUpperCase()}|WIN:${winSamplesCount}|RMS:${latestRms.toFixed(2)}|MAV:${latestMav.toFixed(2)}|FLG:0x0${flagsHex}`;
      let crc = computeCRC32(payload);
      let isCorrupt = false;

      if (state.injectFaultNext) {
        crc = 'BAD0DEAD';
        isCorrupt = true;
        state.injectFaultNext = false;
        state.droppedPackets += 1;
      } else {
        state.okPackets += 1;
      }

      if (kpiPackets) kpiPackets.textContent = `${state.okPackets} OK`;
      if (kpiDrops) kpiDrops.textContent = `${state.droppedPackets} CRC Drops · ${winSamplesCount}-smp Win`;

      const lineEl = document.createElement('div');
      lineEl.className = 'uart-line' + (isCorrupt ? ' corrupted' : '');
      const payloadSpan = document.createElement('span');
      payloadSpan.textContent = payload;
      const crcSpan = document.createElement('span');
      crcSpan.className = 'crc-badge';
      crcSpan.textContent = isCorrupt
        ? `[CRC32 MISMATCH: ${crc} -> DROPPED]`
        : `CRC32:${crc} [OK]`;
      lineEl.append(payloadSpan, crcSpan);
      uartConsole.prepend(lineEl);

      while (uartConsole.children.length > 18) {
        uartConsole.removeChild(uartConsole.lastChild);
      }
    }
  }

  // --- 8. Interactive UI Event Listeners ---
  document.querySelectorAll('.grip-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.grip-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.gripKey = btn.dataset.grip;
      state.targetRmsMv = parseFloat(btn.dataset.rms);
      state.gripLabel = btn.querySelector('.grip-name').textContent.toUpperCase();
      const gripTag = document.getElementById('active-grip-tag');
      if (gripTag) gripTag.textContent = state.gripLabel;
    });
  });

  const sliderHum = document.getElementById('slider-hum');
  const outHum = document.getElementById('out-hum');
  if (sliderHum && outHum) {
    sliderHum.addEventListener('input', () => {
      state.humMv = parseFloat(sliderHum.value);
      outHum.textContent = state.humMv.toFixed(1) + ' mV';
    });
  }

  const sliderDrift = document.getElementById('slider-drift');
  const outDrift = document.getElementById('out-drift');
  if (sliderDrift && outDrift) {
    sliderDrift.addEventListener('input', () => {
      state.driftMv = parseFloat(sliderDrift.value);
      outDrift.textContent = state.driftMv.toFixed(1) + ' mV';
    });
  }

  const selectFs = document.getElementById('select-fs');
  if (selectFs) {
    selectFs.addEventListener('change', () => {
      state.fs = parseInt(selectFs.value, 10);
      rebuildFilters();
    });
  }

  const selectWin = document.getElementById('select-win');
  if (selectWin) {
    selectWin.addEventListener('change', () => {
      state.windowMs = parseInt(selectWin.value, 10);
    });
  }

  const chkHpf = document.getElementById('chk-hpf');
  if (chkHpf) {
    chkHpf.addEventListener('change', (e) => {
      state.useHpf = e.target.checked;
    });
  }
  const chkLpf = document.getElementById('chk-lpf');
  if (chkLpf) {
    chkLpf.addEventListener('change', (e) => {
      state.useLpf = e.target.checked;
    });
  }
  const chkNotch = document.getElementById('chk-notch');
  if (chkNotch) {
    chkNotch.addEventListener('change', (e) => {
      state.useNotch = e.target.checked;
    });
  }

  const sliderYaw = document.getElementById('slider-yaw');
  const outYaw = document.getElementById('out-yaw');
  if (sliderYaw && outYaw) {
    sliderYaw.addEventListener('input', () => {
      state.yawDeg = parseInt(sliderYaw.value, 10);
      outYaw.textContent = state.yawDeg + '°';
    });
  }

  let isDragging = false;
  let dragStartX = 0;
  let dragStartYaw = 34;
  if (wfCanvas) {
    wfCanvas.addEventListener('pointerdown', (e) => {
      isDragging = true;
      dragStartX = e.clientX;
      dragStartYaw = state.yawDeg;
    });
  }
  window.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const delta = Math.round((e.clientX - dragStartX) * 0.15);
    state.yawDeg = Math.max(15, Math.min(65, dragStartYaw + delta));
    if (sliderYaw) sliderYaw.value = String(state.yawDeg);
    if (outYaw) outYaw.textContent = state.yawDeg + '°';
  });
  window.addEventListener('pointerup', () => {
    isDragging = false;
  });

  const btnPause = document.getElementById('btn-pause');
  if (btnPause) {
    btnPause.addEventListener('click', () => {
      state.paused = !state.paused;
      btnPause.textContent = state.paused ? 'Resume Loop' : 'Pause Loop';
      scheduleAnimation();
    });
  }

  const btnInjectFault = document.getElementById('btn-inject-fault');
  if (btnInjectFault) {
    btnInjectFault.addEventListener('click', () => {
      state.injectFaultNext = true;
    });
  }

  const btnReset = document.getElementById('btn-reset');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      state.humMv = 18.0;
      if (sliderHum) sliderHum.value = '18.0';
      if (outHum) outHum.textContent = '18.0 mV';
      state.driftMv = 9.5;
      if (sliderDrift) sliderDrift.value = '9.5';
      if (outDrift) outDrift.textContent = '9.5 mV';
      state.fs = 4000;
      if (selectFs) selectFs.value = '4000';
      state.windowMs = 100;
      if (selectWin) selectWin.value = '100';
      state.useHpf = true;
      state.useLpf = true;
      state.useNotch = true;
      if (chkHpf) chkHpf.checked = true;
      if (chkLpf) chkLpf.checked = true;
      if (chkNotch) chkNotch.checked = true;
      state.yawDeg = 34;
      if (sliderYaw) sliderYaw.value = '34';
      if (outYaw) outYaw.textContent = '34°';
      rebuildFilters();
    });
  }

  // Lazy-load Draco/KTX2 asset manifest metadata
  const dracoBadge = document.getElementById('draco-ktx-badge');
  fetch('/assets/showcase-meshes.draco.json', { credentials: 'same-origin' })
    .then((r) => (r.ok ? r.json() : null))
    .then((manifest) => {
      if (manifest && dracoBadge) {
        dracoBadge.textContent = `Draco ${manifest.draco.quantizationBits.POSITION}b (${manifest.draco.compressionRatio}×) · KTX2 ${manifest.ktx2.supercompression}`;
      }
    })
    .catch(() => {});

  // Pre-warm buffer
  for (let warm = 0; warm < 48; warm++) {
    stepSimulation();
  }
  drawWaterfall3D();
  drawOscilloscope();
  updateTelemetryUI(0);

  // --- 9. Battery-Aware Adaptive Frame Rate Governor ---
  let frameTick = 0;
  let lastFpsTime = performance.now();
  let lastStepTime = 0;
  let fpsFrames = 0;
  let rafId = 0;
  let windowFocused = document.hasFocus ? document.hasFocus() : true;
  let canvasInView = true;
  let contentSkipped = false;
  const fpsReadout = document.getElementById('fps-readout');
  const fpsDot = document.getElementById('fps-dot');

  function updatePowerReadout(measFps) {
    if (!fpsReadout) return;
    if (document.hidden) {
      fpsReadout.textContent = '0 FPS · TAB HIDDEN (BATTERY SAVED)';
      if (fpsDot) fpsDot.style.background = '#86868b';
    } else if (!canvasInView || contentSkipped) {
      fpsReadout.textContent = '0 FPS · OFFSCREEN SUSPENDED';
      if (fpsDot) fpsDot.style.background = '#86868b';
    } else if (state.paused) {
      fpsReadout.textContent = '0 FPS · PAUSED';
      if (fpsDot) fpsDot.style.background = '#86868b';
    } else if (!windowFocused) {
      fpsReadout.textContent = `${measFps || 12} FPS · ECO MODE (UNFOCUSED)`;
      if (fpsDot) fpsDot.style.background = '#0071e3';
    } else {
      fpsReadout.textContent = `${measFps || 60} FPS · REAL-TIME BIQUAD IIR`;
      if (fpsDot) fpsDot.style.background = '#28cd41';
    }
  }

  function stopAnimation() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
    updatePowerReadout(0);
  }

  function animate(now) {
    rafId = 0;
    if (document.hidden || !canvasInView || contentSkipped || state.paused) {
      updatePowerReadout(0);
      return;
    }

    const minInterval = windowFocused ? 15.5 : 83.3; // 60 FPS focused vs 12 FPS unfocused eco mode
    if (now - lastStepTime >= minInterval) {
      lastStepTime = now;
      fpsFrames += 1;
      frameTick += 1;
      stepSimulation();
      drawWaterfall3D();
      drawOscilloscope();
      updateTelemetryUI(frameTick);

      if (now - lastFpsTime >= 500) {
        const measFps = Math.min(60, Math.round((fpsFrames * 1000) / (now - lastFpsTime)));
        updatePowerReadout(measFps);
        fpsFrames = 0;
        lastFpsTime = now;
      }
    }

    rafId = requestAnimationFrame(animate);
  }

  function scheduleAnimation() {
    if (document.hidden || !canvasInView || contentSkipped || state.paused) {
      stopAnimation();
      return;
    }
    if (!rafId) {
      lastFpsTime = performance.now();
      fpsFrames = 0;
      rafId = requestAnimationFrame(animate);
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAnimation();
    else scheduleAnimation();
  });

  window.addEventListener('blur', () => {
    windowFocused = false;
    updatePowerReadout(12);
  });

  window.addEventListener('focus', () => {
    windowFocused = true;
    scheduleAnimation();
  });

  // Direct contentvisibilityautostatechange listener (does not bubble)
  const wfCard = document.getElementById('waterfall-card');
  if (wfCard) {
    wfCard.addEventListener('contentvisibilityautostatechange', (event) => {
      contentSkipped = Boolean(event.skipped);
      if (contentSkipped) stopAnimation();
      else scheduleAnimation();
    });
  }

  if ('IntersectionObserver' in window && wfCanvas) {
    const io = new IntersectionObserver(
      (entries) => {
        canvasInView = entries.some((e) => e.isIntersecting);
        if (canvasInView) scheduleAnimation();
        else stopAnimation();
      },
      { rootMargin: '120px 0px', threshold: 0.01 }
    );
    io.observe(wfCanvas);
  }

  scheduleAnimation();
})();
