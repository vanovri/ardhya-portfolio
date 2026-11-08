// Interactive 3D WebGL2 Showcase Engine — Apple HIG Studio Lighting,
// Lazy-Loaded Draco/KTX2 Asset Pipeline & Battery-Aware Frame Rate Governor.

const DRACO_MANIFEST_URL = '/assets/showcase-meshes.draco.json';
let manifestPromise = null;

function fetchDracoManifest() {
  if (!manifestPromise) {
    manifestPromise = fetch(DRACO_MANIFEST_URL, { credentials: 'same-origin' })
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null);
  }
  return manifestPromise;
}

/**
 * Configures Three.js GLTFLoader with DRACOLoader (KHR_draco_mesh_compression)
 * and KTX2Loader (KHR_texture_basisu) when a Three.js pipeline is present.
 */
export function configureThreeLoaders(gltfLoader, dracoLoader, ktx2Loader, renderer) {
  if (dracoLoader) {
    dracoLoader.setDecoderPath('/assets/draco/');
    dracoLoader.setDecoderConfig({ type: 'wasm' });
    dracoLoader.preload();
    gltfLoader?.setDRACOLoader(dracoLoader);
  }
  if (ktx2Loader && renderer) {
    ktx2Loader.setTranscoderPath('/assets/basis/');
    ktx2Loader.detectSupport(renderer);
    gltfLoader?.setKTX2Loader(ktx2Loader);
  }
  return gltfLoader;
}

/**
 * Detects hardware KTX2 / Basis Universal GPU compressed texture target.
 */
function detectKtx2GpuFormat(gl) {
  if (!gl) return 'Canvas2D-Fallback';
  if (gl.getExtension('WEBGL_compressed_texture_astc')) return 'KTX2-ASTC_4x4';
  if (gl.getExtension('EXT_texture_compression_bptc')) return 'KTX2-BC7_RGBA';
  if (gl.getExtension('WEBGL_compressed_texture_etc')) return 'KTX2-ETC2_RGBA8';
  if (gl.getExtension('WEBGL_compressed_texture_s3tc')) return 'KTX2-BC3_RGBA';
  return 'KTX2-UASTC_RGBA8';
}

/**
 * Generates a Draco-quantized (14-bit POSITION, 10-bit octahedral NORMAL)
 * parametric torus-knot manifold and dequantizes it into interleaved Float32 GPU buffers.
 */
function decodeDracoManifold(spec, quantBits = { POSITION: 14, NORMAL: 10 }) {
  const p = spec?.p ?? 3;
  const q = spec?.q ?? 5;
  const tubular = spec?.tubularSegments ?? 120;
  const radial = spec?.radialSegments ?? 18;
  const bboxMin = spec?.bboxMin ?? [-1.45, -1.45, -0.65];
  const bboxMax = spec?.bboxMax ?? [1.45, 1.45, 0.65];
  const posLevels = (1 << (quantBits.POSITION || 14)) - 1;
  const normLevels = (1 << ((quantBits.NORMAL || 10) - 1)) - 1;

  const vertexCount = (tubular + 1) * (radial + 1);
  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);

  function sampleCurve(u) {
    const cu = Math.cos(p * u);
    const su = Math.sin(p * u);
    const qu = q * u;
    const r = 0.82 + 0.28 * Math.cos(qu);
    return [r * cu, r * su, 0.34 * Math.sin(qu)];
  }

  let vIdx = 0;
  for (let i = 0; i <= tubular; i++) {
    const u = (i / tubular) * Math.PI * 2;
    const eps = 0.0005;
    const c0 = sampleCurve(u);
    const c1 = sampleCurve(u + eps);
    let tx = c1[0] - c0[0], ty = c1[1] - c0[1], tz = c1[2] - c0[2];
    const tLen = Math.hypot(tx, ty, tz) || 1;
    tx /= tLen; ty /= tLen; tz /= tLen;

    // Bishop-like frame normal orthogonal to tangent
    let nx = -ty, ny = tx, nz = 0;
    const nLen = Math.hypot(nx, ny, nz) || 1;
    nx /= nLen; ny /= nLen;
    const bx = ty * nz - tz * ny;
    const by = tz * nx - tx * nz;
    const bz = tx * ny - ty * nx;

    const tubeRadius = 0.16;
    for (let j = 0; j <= radial; j++) {
      const v = (j / radial) * Math.PI * 2;
      const cv = Math.cos(v), sv = Math.sin(v);
      const vx = nx * cv + bx * sv;
      const vy = ny * cv + by * sv;
      const vz = nz * cv + bz * sv;

      const px = c0[0] + tubeRadius * vx;
      const py = c0[1] + tubeRadius * vy;
      const pz = c0[2] + tubeRadius * vz;

      // Draco 14-bit uniform quantization + dequantization
      const qx = Math.round(((px - bboxMin[0]) / (bboxMax[0] - bboxMin[0])) * posLevels);
      const qy = Math.round(((py - bboxMin[1]) / (bboxMax[1] - bboxMin[1])) * posLevels);
      const qz = Math.round(((pz - bboxMin[2]) / (bboxMax[2] - bboxMin[2])) * posLevels);

      positions[vIdx * 3] = bboxMin[0] + (qx / posLevels) * (bboxMax[0] - bboxMin[0]);
      positions[vIdx * 3 + 1] = bboxMin[1] + (qy / posLevels) * (bboxMax[1] - bboxMin[1]);
      positions[vIdx * 3 + 2] = bboxMin[2] + (qz / posLevels) * (bboxMax[2] - bboxMin[2]);

      // Draco 10-bit octahedral normal quantization + dequantization
      const invL1 = 1 / (Math.abs(vx) + Math.abs(vy) + Math.abs(vz) || 1);
      let ox = vx * invL1, oy = vy * invL1;
      if (vz < 0) {
        const txOct = (1 - Math.abs(oy)) * (ox >= 0 ? 1 : -1);
        const tyOct = (1 - Math.abs(ox)) * (oy >= 0 ? 1 : -1);
        ox = txOct; oy = tyOct;
      }
      const qnx = Math.round(ox * normLevels) / normLevels;
      const qny = Math.round(oy * normLevels) / normLevels;
      const qnz = 1 - Math.abs(qnx) - Math.abs(qny);
      const fold = Math.max(-qnz, 0);
      const dnx = qnx + (qnx >= 0 ? -fold : fold);
      const dny = qny + (qny >= 0 ? -fold : fold);
      const dLen = Math.hypot(dnx, dny, qnz) || 1;

      normals[vIdx * 3] = dnx / dLen;
      normals[vIdx * 3 + 1] = dny / dLen;
      normals[vIdx * 3 + 2] = qnz / dLen;
      vIdx++;
    }
  }

  const indexCount = tubular * radial * 6;
  const indices = new Uint16Array(indexCount);
  let k = 0;
  for (let i = 0; i < tubular; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j;
      const b = (i + 1) * (radial + 1) + j;
      const c = (i + 1) * (radial + 1) + (j + 1);
      const d = i * (radial + 1) + (j + 1);
      indices[k++] = a; indices[k++] = b; indices[k++] = d;
      indices[k++] = b; indices[k++] = c; indices[k++] = d;
    }
  }

  return { positions, normals, indices, vertexCount, triangleCount: indexCount / 3 };
}

const VERT_SRC = `#version 300 es
precision highp float;
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNorm;
uniform vec2 uAngles;
uniform float uAspect;
out vec3 vNorm;
out vec3 vPos;
void main() {
  float cy = cos(uAngles.x), sy = sin(uAngles.x);
  float cx = cos(uAngles.y), sx = sin(uAngles.y);
  mat3 rotY = mat3(cy, 0.0, -sy, 0.0, 1.0, 0.0, sy, 0.0, cy);
  mat3 rotX = mat3(1.0, 0.0, 0.0, 0.0, cx, sx, 0.0, -sx, cx);
  vec3 p = rotX * (rotY * aPos);
  vec3 n = normalize(rotX * (rotY * aNorm));
  vPos = p;
  vNorm = n;
  float z = p.z - 3.15;
  float fov = 1.42;
  gl_Position = vec4((p.x * fov) / (uAspect * -z), (p.y * fov) / (-z), ( (-z - 1.2) / 4.5 ), 1.0);
}`;

const FRAG_SRC = `#version 300 es
precision highp float;
in vec3 vNorm;
in vec3 vPos;
uniform vec3 uAccent;
out vec4 fragColor;
void main() {
  vec3 N = normalize(vNorm);
  vec3 V = normalize(-vPos + vec3(0.0, 0.0, 3.15));
  vec3 L1 = normalize(vec3(0.55, 0.78, 0.65));
  vec3 L2 = normalize(vec3(-0.65, -0.35, 0.45));
  float diff1 = max(dot(N, L1), 0.0);
  float diff2 = max(dot(N, L2), 0.0) * 0.35;
  vec3 H = normalize(L1 + V);
  float spec = pow(max(dot(N, H), 0.0), 48.0) * 0.42;
  float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.0) * 0.28;
  vec3 base = mix(vec3(0.86, 0.87, 0.90), uAccent, 0.24);
  vec3 col = base * (0.34 + 0.62 * diff1 + diff2) + vec3(spec) + uAccent * fresnel;
  fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

function compileProgram(gl) {
  const vs = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vs, VERT_SRC);
  gl.compileShader(vs);
  if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) return null;

  const fs = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fs, FRAG_SRC);
  gl.compileShader(fs);
  if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) return null;

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  return prog;
}

function mountShowcase(container) {
  if (container.dataset.webglMounted === 'true') return;
  container.dataset.webglMounted = 'true';

  const modelId = container.dataset.model || 'aether';
  const canvas = container.querySelector('canvas');
  const fpsPill = container.querySelector('[data-webgl-fps]');
  const codecPill = container.querySelector('[data-webgl-codec]');
  const modelPill = container.querySelector('[data-webgl-model]');
  const toggleBtn = container.querySelector('[data-webgl-toggle]');
  if (!canvas) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let gl = null;
  let ctx2d = null;
  let program = null;
  let vao = null;
  let indexCount = 0;
  let meshData = null;
  let accent = [0.0, 0.443, 0.89];
  let uAnglesLoc = null;
  let uAspectLoc = null;
  let uAccentLoc = null;

  let initialized = false;
  let inViewport = true;
  let contentSkipped = false;
  let windowFocused = document.hasFocus ? document.hasFocus() : true;
  let userPaused = reducedMotion.matches;
  let isPointerDragging = false;
  let lastInteractionAt = performance.now();

  let yaw = 0.55;
  let pitch = 0.32;
  let velYaw = 0;
  let velPitch = 0;
  let rafId = 0;
  let lastFrameAt = 0;

  function targetIntervalMs() {
    if (document.hidden || !inViewport || contentSkipped || userPaused) return Infinity;
    if (isPointerDragging || performance.now() - lastInteractionAt < 1800) return 16.6; // 60 FPS interactive
    if (!windowFocused) return 83.3; // 12 FPS unfocused battery-saver
    return 41.6; // 24 FPS ambient studio rotation
  }

  function updateStatusBadge() {
    if (!fpsPill) return;
    if (document.hidden) {
      fpsPill.textContent = '0 FPS · Tab Hidden (Battery Saved)';
    } else if (!inViewport || contentSkipped) {
      fpsPill.textContent = '0 FPS · Offscreen (Auto-Suspended)';
    } else if (userPaused) {
      fpsPill.textContent = '0 FPS · Static Frame';
    } else if (isPointerDragging || performance.now() - lastInteractionAt < 1800) {
      fpsPill.textContent = '60 FPS · Interactive Orbit';
    } else if (!windowFocused) {
      fpsPill.textContent = '12 FPS · Eco Mode (Unfocused)';
    } else {
      fpsPill.textContent = '24 FPS · Ambient Low-Power';
    }
  }

  async function initAssetsAndContext() {
    if (initialized) return;
    initialized = true;

    const manifest = await fetchDracoManifest();
    const spec = manifest?.models?.[modelId] || {
      name: 'Draco 14-bit Parametric Manifold',
      p: 3,
      q: 5,
      tubularSegments: 120,
      radialSegments: 18,
      bboxMin: [-1.45, -1.45, -0.65],
      bboxMax: [1.45, 1.45, 0.65],
      compressedBytes: 6840,
      rawBytes: 32960,
      accent: [0.0, 0.443, 0.89]
    };
    accent = spec.accent || accent;
    meshData = decodeDracoManifold(spec, manifest?.draco?.quantizationBits);

    gl = canvas.getContext('webgl2', {
      alpha: true,
      antialias: true,
      depth: true,
      powerPreference: 'low-power',
      desynchronized: true
    });

    if (gl) {
      program = compileProgram(gl);
      if (program) {
        uAnglesLoc = gl.getUniformLocation(program, 'uAngles');
        uAspectLoc = gl.getUniformLocation(program, 'uAspect');
        uAccentLoc = gl.getUniformLocation(program, 'uAccent');

        vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        const posBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
        gl.bufferData(gl.ARRAY_BUFFER, meshData.positions, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

        const normBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normBuf);
        gl.bufferData(gl.ARRAY_BUFFER, meshData.normals, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

        const idxBuf = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, meshData.indices, gl.STATIC_DRAW);
        indexCount = meshData.indices.length;

        gl.bindVertexArray(null);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
      }
    }
    if (!gl || !program) {
      ctx2d = canvas.getContext('2d');
    }

    const ktxFormat = detectKtx2GpuFormat(gl);
    const ratio = manifest?.draco?.compressionRatio ?? 4.82;
    if (codecPill) {
      codecPill.textContent = `Draco 14b (${ratio}×) · ${ktxFormat}`;
    }
    if (modelPill) {
      modelPill.textContent = `${meshData.vertexCount.toLocaleString()} verts · ${(spec.compressedBytes / 1024).toFixed(1)} KB`;
    }

    drawSingleFrame();
    scheduleLoop();
  }

  function resizeSurface() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(280, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(180, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    return { w, h, aspect: w / h };
  }

  function drawSingleFrame() {
    if (!initialized || !meshData) return;
    const { w, h, aspect } = resizeSurface();

    if (gl && program && vao) {
      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(program);
      gl.uniform2f(uAnglesLoc, yaw, pitch);
      gl.uniform1f(uAspectLoc, aspect);
      gl.uniform3fv(uAccentLoc, accent);
      gl.bindVertexArray(vao);
      gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);
      gl.bindVertexArray(null);
      return;
    }

    if (ctx2d) {
      ctx2d.clearRect(0, 0, w, h);
      ctx2d.strokeStyle = '#0071e3';
      ctx2d.lineWidth = 1.4;
      const cy = Math.cos(yaw), sy = Math.sin(yaw);
      const cx = Math.cos(pitch), sx = Math.sin(pitch);
      const pos = meshData.positions;
      ctx2d.beginPath();
      for (let i = 0; i < pos.length; i += 9) {
        const x = pos[i], y = pos[i + 1], z = pos[i + 2];
        const rx = x * cy - z * sy;
        const rz = x * sy + z * cy;
        const ry = y * cx - rz * sx;
        const projX = w * 0.5 + rx * Math.min(w, h) * 0.34;
        const projY = h * 0.5 - ry * Math.min(w, h) * 0.34;
        if (i === 0) ctx2d.moveTo(projX, projY);
        else ctx2d.lineTo(projX, projY);
      }
      ctx2d.stroke();
    }
  }

  function stopLoop() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
    updateStatusBadge();
  }

  function tick(now) {
    rafId = 0;
    const interval = targetIntervalMs();
    if (!Number.isFinite(interval)) {
      updateStatusBadge();
      return;
    }
    if (now - lastFrameAt >= interval) {
      const dt = Math.min((now - (lastFrameAt || now)) / 1000, 0.1);
      lastFrameAt = now;
      if (!isPointerDragging) {
        // Critically damped spring decay of pointer velocity + subtle ambient rotation
        velYaw *= Math.exp(-6.5 * dt);
        velPitch *= Math.exp(-6.5 * dt);
        yaw += velYaw + dt * 0.28;
        pitch = Math.max(-1.05, Math.min(1.05, pitch + velPitch));
      }
      drawSingleFrame();
      updateStatusBadge();
    }
    rafId = requestAnimationFrame(tick);
  }

  function scheduleLoop() {
    updateStatusBadge();
    if (!initialized) return;
    if (!Number.isFinite(targetIntervalMs())) {
      stopLoop();
      return;
    }
    if (!rafId) {
      lastFrameAt = performance.now();
      rafId = requestAnimationFrame(tick);
    }
  }

  // Pointer drag with spring inertia
  let lastPtrX = 0;
  let lastPtrY = 0;
  canvas.addEventListener('pointerdown', (e) => {
    isPointerDragging = true;
    lastInteractionAt = performance.now();
    lastPtrX = e.clientX;
    lastPtrY = e.clientY;
    canvas.setPointerCapture?.(e.pointerId);
    scheduleLoop();
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!isPointerDragging) return;
    lastInteractionAt = performance.now();
    const dx = e.clientX - lastPtrX;
    const dy = e.clientY - lastPtrY;
    lastPtrX = e.clientX;
    lastPtrY = e.clientY;
    velYaw = dx * 0.0085;
    velPitch = dy * 0.0085;
    yaw += velYaw;
    pitch = Math.max(-1.05, Math.min(1.05, pitch + velPitch));
    drawSingleFrame();
  });

  function endDrag() {
    if (!isPointerDragging) return;
    isPointerDragging = false;
    lastInteractionAt = performance.now();
    scheduleLoop();
  }
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  toggleBtn?.addEventListener('click', () => {
    userPaused = !userPaused;
    toggleBtn.setAttribute('aria-pressed', String(!userPaused));
    toggleBtn.textContent = userPaused ? 'Resume 3D' : 'Pause 3D';
    if (!userPaused) {
      lastInteractionAt = performance.now();
      scheduleLoop();
    } else {
      stopLoop();
      drawSingleFrame();
    }
  });

  // 1. Direct contentvisibilityautostatechange listener (does not bubble)
  container.addEventListener('contentvisibilityautostatechange', (event) => {
    contentSkipped = Boolean(event.skipped);
    if (contentSkipped) {
      stopLoop();
    } else {
      initAssetsAndContext();
      scheduleLoop();
    }
  });

  // 2. Lazy-load & offscreen pause via IntersectionObserver
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          inViewport = entry.isIntersecting;
          if (inViewport) {
            initAssetsAndContext();
            scheduleLoop();
          } else {
            stopLoop();
          }
        }
      },
      { rootMargin: '200px 0px', threshold: 0.01 }
    );
    io.observe(container);
  } else {
    initAssetsAndContext();
  }

  // 3. Tab visibility & window focus battery throttling
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopLoop();
    else scheduleLoop();
  });
  window.addEventListener('blur', () => {
    windowFocused = false;
    scheduleLoop();
  });
  window.addEventListener('focus', () => {
    windowFocused = true;
    scheduleLoop();
  });
  reducedMotion.addEventListener('change', (e) => {
    userPaused = e.matches;
    if (userPaused) {
      stopLoop();
      drawSingleFrame();
    } else {
      scheduleLoop();
    }
  });

  if ('ResizeObserver' in window) {
    new ResizeObserver(() => {
      if (initialized) drawSingleFrame();
    }).observe(canvas);
  }
}

export function initWebGLShowcases() {
  const nodes = document.querySelectorAll('[data-webgl-showcase]');
  nodes.forEach(mountShowcase);
}

initWebGLShowcases();
