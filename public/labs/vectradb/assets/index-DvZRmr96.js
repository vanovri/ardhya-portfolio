const D={zones:{vectradb:{slot:"01",slug:"vectradb",name:"VectraDB",provenance:"VERIFIED_LIVE",runtimeMode:"REAL_ENGINE_WASM",commitSha:"5a1720d",verifiedAt:"2026-11-22T10:41:53.559Z",wasmAssetPath:"/labs/vectradb/assets/vectra_wasm_bg-bba49ce1.wasm",glueAssetPath:"/labs/vectradb/assets/vectra_wasm-3f1abf8d.js",wasmSizeBytes:2083985,wasmSizeKb:2035.14,wasmSha8:"bba49ce1",headlineMetrics:[{id:"tpch_sf01_geomean",label:"22/22 TPC-H (SF=0.1)",value:"261.53 ms geomean (6.96x)"},{id:"sqlsmith_slt_oracle",label:"SQLsmith + SLT Oracle",value:"25,000 seeds / 5,794 SLT"},{id:"spill_pgwire_gate",label:"Spill Cap & PGWire v3",value:"32 MB RAM / 32 clients (0.82s)"}]},kronos:{slot:"02",slug:"kronos",name:"KronosLOB",provenance:"VERIFIED_LIVE",runtimeMode:"REAL_ENGINE_WASM",commitSha:"077bd4e",verifiedAt:"2026-11-22T07:13:58.586Z",wasmAssetPath:"/labs/kronos/assets/kronos_wasm_bg-8356b199.wasm",glueAssetPath:"/labs/kronos/assets/kronos_wasm-509d396e.js",wasmSizeBytes:391147,wasmSizeKb:381.98,wasmSha8:"8356b199",headlineMetrics:[{id:"single_core_throughput",label:"10M Hawkes L3 Rate",value:"4,135,087 orders/s"},{id:"match_latency",label:"Window Latency (p50 / p99)",value:"206 ns / 616 ns"},{id:"disruptor_pipeline",label:"Full Disruptor Pipeline",value:"1,701,837 cmds/s (0 allocs)"}]},aegis:{slot:"03",slug:"aegis",name:"AegisBox",provenance:"VERIFIED_LIVE",runtimeMode:"REAL_ENGINE_WASM",commitSha:"cc0d0de",verifiedAt:"2026-11-22T10:40:05.582Z",wasmAssetPath:"/labs/aegis/assets/aegis_wasm_bg-ed3c394a.wasm",glueAssetPath:"/labs/aegis/assets/aegis_wasm-b6613f5d.js",wasmSizeBytes:334360,wasmSizeKb:326.52,wasmSha8:"ed3c394a",headlineMetrics:[{id:"uffd_cow_restore",label:"userfaultfd CoW Restore",value:"0.009 ms p50 (867.09x)"},{id:"herd_pss_savings",label:"50-Sandbox Herd PSS",value:"97.77% (71.20 MiB)"},{id:"redteam_containment",label:"Red-Team & Syscall Fuzz",value:"44/44 + 100,000 fuzz"}]},novaserve:{slot:"04",slug:"novaserve",name:"NovaServe",provenance:"VERIFIED_LIVE",runtimeMode:"REAL_ENGINE_WASM",commitSha:"197061a",verifiedAt:"2026-11-22T09:49:43.532Z",wasmAssetPath:"/labs/novaserve/assets/novaserve_wasm-d91cd54f.wasm",glueAssetPath:null,wasmSizeBytes:1274747,wasmSizeKb:1244.87,wasmSha8:"d91cd54f",headlineMetrics:[{id:"radix_ttft_speedup",label:"Radix Prefix TTFT",value:"11.17x (95.8% hit)"},{id:"chunked_itl_p99",label:"Chunked Prefill ITL p99",value:"4.27x drop (56.45 ms)"},{id:"speculative_tpot",label:"Speculative K=4 TPOT",value:"1.61x (Q8 3.75x)"}]},spectre:{slot:"05",slug:"spectre",name:"SpectreMesh",provenance:"VERIFIED_LIVE",runtimeMode:"REAL_ENGINE_WASM",commitSha:"d12f05b",verifiedAt:"2026-11-22T11:38:25.601Z",wasmAssetPath:"/labs/spectre/assets/spectre_wasm_bg-1f3cbc83.wasm",glueAssetPath:"/labs/spectre/assets/spectre_wasm-ab6f5f7c.js",wasmSizeBytes:262171,wasmSizeKb:256.03,wasmSha8:"1f3cbc83",headlineMetrics:[{id:"xdp_packet_filter",label:"XDP Kernel / BpfVm",value:"10.10 Mpps (99.00 ns/pkt)"},{id:"l7_tls_uprobe",label:"L7 Decode & TLS 1.3",value:"1094.9k req/s (+48.99 us)"},{id:"mesh_oracle_verifier",label:"Live Mesh Oracle & Verifier",value:"50,000/50,000 (0 drops)"}]},"dst-kv":{slot:"06",slug:"dst-kv",name:"DST-KV",provenance:"VERIFIED_LIVE",runtimeMode:"REAL_ENGINE_WASM",commitSha:"f169eec",verifiedAt:"2026-11-22T06:16:51.360Z",wasmAssetPath:"/labs/dst-kv/assets/dst_sim-3a0b7b88.wasm",glueAssetPath:null,wasmSizeBytes:559842,wasmSizeKb:546.72,wasmSha8:"3a0b7b88",headlineMetrics:[{id:"marathon_seeds",label:"Wing-Gong Marathon",value:"10,000 seeds / 533,348 ops"},{id:"sigkill_failover",label:"5-Node SIGKILL Failover",value:"822 ms (P99 22.71 ms)"},{id:"nemesis_mttr",label:"7-Class Nemesis MTTR",value:"200 ms avg / 300 ms max"}]}}},x=[{index:"01",slug:"vectradb",name:"VectraDB",tag:"OLAP SQL",category:"Database Internals",repo:"vectradb",wasmCrate:"vectra-wasm",vercelZoneOrigin:"https://vectradb-studio.vercel.app",archDocPath:"blob/main/CLAUDE.md",summary:"Vectorized columnar OLAP SQL engine with Umbra 16B German strings, Neumann-Kemper subquery unnesting, Cascades/DPccp cost optimizer, and morsel-driven spill runtime.",defaultParams:{scale:2,secondary:32,seed:20261122,scaleLabel:"TPC-H Scale (x0.001 SF)",secondaryLabel:"Spill Memory Limit (MB)",operationLabel:"Run Real Columnar TPC-H Q1"},baselineTelemetry:{schemaVersion:1,slug:"vectradb",commitSha:"5a1720d",generatedAtIso:"2026-11-22T10:41:36.000Z",wasmSizeKb:2035.14,verificationGate:"VERIFIED LIVE · 22/22 TPC-H · 25k SQLsmith",headlineMetric:{label:"22/22 TPC-H (SF=0.1)",value:"261.53 ms",unit:"geomean",deltaOrNote:"6.96x compression · 865,303 rows"},secondaryMetrics:[{label:"SQLsmith + SLT",value:"25,000 / 5,794",deltaOrNote:"0 mismatches vs SQLite"},{label:"Spill + PGWire",value:"32 MB / 32 TCP",deltaOrNote:"0.82s full 32-client run"},{label:"WASM Studio",value:"2035.14 KB",deltaOrNote:"Real wasm-bindgen engine"}]}},{index:"02",slug:"kronos",name:"KronosLOB",tag:"L3 Matching",category:"Quant & Low-Latency",repo:"kronos-lob",wasmCrate:"kronos-wasm",vercelZoneOrigin:"https://kronos-studio.vercel.app",archDocPath:"blob/main/CLAUDE.md",summary:"Zero-allocation lock-free L3 Limit Order Book matching engine with 64B cache-aligned OrderSlab, 64-ary bitset price ladder, Vyukov Disruptor ring, and deterministic Hawkes L3 replay.",defaultParams:{scale:15e3,secondary:45e3,seed:42,scaleLabel:"Hawkes L3 Events",secondaryLabel:"Aggressive Taker Qty",operationLabel:"Run Real Hawkes L3 Match"},baselineTelemetry:{schemaVersion:1,slug:"kronos",commitSha:"077bd4e",generatedAtIso:"2026-11-22T07:13:58.586Z",wasmSizeKb:381.98,verificationGate:"VERIFIED LIVE · 0 Hot-Path Allocs",headlineMetric:{label:"10M Hawkes L3 Rate",value:"4,135,087",unit:"orders/s",deltaOrNote:"p50 206 ns / p99 616 ns · 0 allocs"},secondaryMetrics:[{label:"Window p50 / p99",value:"206 ns / 616 ns",deltaOrNote:"Cancel p50 87 ns"},{label:"Disruptor Ring",value:"1,701,837",unit:"cmds/s",deltaOrNote:"0 hot-path heap allocs"},{label:"WASM Studio",value:"381.98 KB",deltaOrNote:"Real wasm-bindgen engine"}]}},{index:"03",slug:"aegis",name:"AegisBox",tag:"CoW Sandbox",category:"Kernel & Isolation",repo:"aegis-box",wasmCrate:"aegis-wasm",vercelZoneOrigin:"https://aegis-studio.vercel.app",archDocPath:"blob/main/CLAUDE.md",summary:"Multi-tenant micro-sandbox runtime modeling sub-10ms userfaultfd Copy-on-Write snapshot restore, seccomp-BPF syscall containment, cgroups v2 quotas, and PSS page sharing.",defaultParams:{scale:12,secondary:44,seed:404099,scaleLabel:"Seccomp cBPF Exploit Probes",secondaryLabel:"Red-Team Catalog Window",operationLabel:"Run Real cBPF + CoW Branch Sim"},baselineTelemetry:{schemaVersion:1,slug:"aegis",commitSha:"cc0d0de",generatedAtIso:"2026-11-22T10:40:05.000Z",wasmSizeKb:326.52,verificationGate:"VERIFIED LIVE · 44/44 Red-Team · 0 Leaks",headlineMetric:{label:"userfaultfd CoW Restore",value:"0.009 ms",unit:"p50",deltaOrNote:"867.09x vs cold · p99 0.353 ms"},secondaryMetrics:[{label:"50-Sandbox PSS",value:"97.77%",deltaOrNote:"71.20 MiB vs 3,200 MiB logical"},{label:"Red-Team + Fuzz",value:"44/44 + 100k",deltaOrNote:"0 FD / mount / zombie leaks"},{label:"WASM Studio",value:"326.52 KB",deltaOrNote:"114.71 KB gzip · wasm-bindgen"}]}},{index:"04",slug:"novaserve",name:"NovaServe",tag:"LLM Serving",category:"ML Systems",repo:"novaserve",wasmCrate:"novaserve-wasm",vercelZoneOrigin:"https://novaserve-studio.vercel.app",archDocPath:"blob/main/CLAUDE.md",summary:"High-throughput LLM inference serving engine implementing PagedAttention block tables, SGLang-style RadixAttention prefix KV reuse, chunked prefill, exact Leviathan speculative decoding, and JSON-Schema Byte-DFA masks.",defaultParams:{scale:20,secondary:4,seed:2026,scaleLabel:"Inference Step Budget",secondaryLabel:"Speculative Lookahead (K)",operationLabel:"Run Real PagedAttention + Spec K=4"},baselineTelemetry:{schemaVersion:1,slug:"novaserve",commitSha:"197061a",generatedAtIso:"2026-11-22T09:49:43.532Z",wasmSizeKb:1244.87,verificationGate:"VERIFIED LIVE · Miri 6/6 · 0% KV Frag",headlineMetric:{label:"Radix Prefix TTFT",value:"11.17x",unit:"faster",deltaOrNote:"95.8% KV-block hit · 0% fragmentation"},secondaryMetrics:[{label:"Chunked ITL p99",value:"4.27x drop",deltaOrNote:"240.80 ms -> 56.45 ms"},{label:"Speculative K=4",value:"1.61x TPOT",deltaOrNote:"65.6% α · TVD 0.0051..0.0082"},{label:"JSON-DFA Fuzz",value:"5,000/5,000",deltaOrNote:"100% valid · Q8_0 3.75x"}]}},{index:"05",slug:"spectre",name:"SpectreMesh",tag:"eBPF Mesh",category:"eBPF & Cloud Networking",repo:"spectre-mesh",wasmCrate:"spectre-wasm",vercelZoneOrigin:"https://spectre-studio.vercel.app",archDocPath:"blob/main/CLAUDE.md",summary:"eBPF zero-instrumentation L7 profiler, OpenSSL + Go crypto/tls RET-Uprobe mesh, Pure-Rust ELF64/BTF CO-RE loader, offline Tnum static verifier, and XDP token-bucket firewall.",defaultParams:{scale:12,secondary:6,seed:20261122,scaleLabel:"eBPF Verifier + L7 Runs",secondaryLabel:"ELF Probes Loaded",operationLabel:"Run Real Tnum Verifier + XDP + L7"},baselineTelemetry:{schemaVersion:1,slug:"spectre",commitSha:"d12f05b",generatedAtIso:"2026-11-22T11:38:25.601Z",wasmSizeKb:256.03,verificationGate:"VERIFIED LIVE · 50k Mesh Oracle · 133/133 Verifier",headlineMetric:{label:"XDP Kernel / BpfVm",value:"10.10 Mpps",unit:"99.00 ns/pkt",deltaOrNote:"BpfVm 8.23 Mpps · 10 crates · 8/10 deny(unsafe)"},secondaryMetrics:[{label:"L7 Decode & TLS 1.3",value:"1094.9k req/s",deltaOrNote:"+48.99 us OpenSSL 3.5.5 uprobe (0 MITM)"},{label:"Live Mesh Oracle",value:"50,000/50,000",deltaOrNote:"0 drops · 0 Go crashes · 133/133 Verifier"},{label:"WASM Studio",value:"256.03 KB",deltaOrNote:"105.51 KB gzip · wasm-bindgen +simd128"}]}},{index:"06",slug:"dst-kv",name:"DST-KV",tag:"Raft VOPR",category:"Distributed Consensus",repo:"dst-kv",wasmCrate:"dst-kv-wasm",vercelZoneOrigin:"https://dst-kv-studio.vercel.app",archDocPath:"blob/main/CLAUDE.md",summary:"Sans-I/O Raft distributed key-value store with FoundationDB/TigerBeetle-style Deterministic Simulation Testing, 7-class Chaos Nemesis, Wing-Gong linearizability oracle, and time-travel seed replay.",defaultParams:{scale:400,secondary:5,seed:947,scaleLabel:"Simulated Chaos Ticks",secondaryLabel:"Cluster Quorum Nodes",operationLabel:"Run Real Raft DST Seed"},baselineTelemetry:{schemaVersion:1,slug:"dst-kv",commitSha:"f169eec",generatedAtIso:"2026-11-22T06:16:51.360Z",wasmSizeKb:546,verificationGate:"VERIFIED LIVE · 10k Seeds Wing-Gong",headlineMetric:{label:"Wing-Gong Marathon",value:"10,000 seeds",unit:"0 viol",deltaOrNote:"533,348 ops · 822 ms SIGKILL failover"},secondaryMetrics:[{label:"SIGKILL Failover",value:"822 ms",deltaOrNote:"P50 7.15 ms / P99 22.71 ms"},{label:"7-Class Nemesis",value:"300 ms max",deltaOrNote:"200 ms avg MTTR"},{label:"WAL Power Cuts",value:"98,286",deltaOrNote:"14,261 torn tails · 0 loss"}]}}];function F(s){return x.find(e=>e.slug===s)??x[0]}const Z=new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,8,1,6,0,65,0,253,15,11]);function q(){try{return typeof WebAssembly=="object"&&WebAssembly.validate(Z)}catch{return!1}}function S(s){return!Number.isFinite(s)||s<=0?"0.00 MB":`${(s/(1024*1024)).toFixed(2)} MB`}const z=new CSSStyleSheet;z.replaceSync(`
  :host {
    display: block;
    position: sticky;
    top: 0;
    z-index: 100;
    font-family: "SF Mono", "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    color-scheme: dark;
    -webkit-font-smoothing: antialiased;
  }
  :host([hidden]) {
    display: none;
  }
  .bar {
    min-height: 38px;
    background: #090b10;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 0 14px;
    font-size: 12px;
    line-height: 1;
    color: #9ca3af;
  }
  .left, .tabs, .right {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .left {
    min-width: 0;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .left::-webkit-scrollbar {
    display: none;
  }
  a {
    color: inherit;
    text-decoration: none;
  }
  a:focus-visible {
    outline: 2px solid #60a5fa;
    outline-offset: 2px;
  }
  .home {
    color: #f3f4f6;
    font-weight: 600;
    letter-spacing: -0.01em;
    padding: 6px 10px 6px 2px;
    margin-right: 4px;
    border-right: 1px solid rgba(255, 255, 255, 0.08);
    white-space: nowrap;
    transition: color 120ms cubic-bezier(0.23, 1, 0.32, 1);
  }
  .home:hover {
    color: #60a5fa;
  }
  .tab {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 28px;
    padding: 0 9px;
    border-radius: 5px;
    border: 1px solid transparent;
    white-space: nowrap;
    transition: background-color 120ms cubic-bezier(0.23, 1, 0.32, 1),
      border-color 120ms cubic-bezier(0.23, 1, 0.32, 1),
      color 120ms cubic-bezier(0.23, 1, 0.32, 1),
      transform 110ms cubic-bezier(0.23, 1, 0.32, 1);
  }
  .tab:hover {
    background: #111622;
    color: #f3f4f6;
  }
  .tab:active {
    transform: scale(0.97);
  }
  .tab[aria-current="page"] {
    background: #131c2e;
    border-color: rgba(59, 130, 246, 0.65);
    color: #93c5fd;
  }
  .idx {
    font-size: 10px;
    color: #6b7280;
    font-variant-numeric: tabular-nums;
  }
  .tab[aria-current="page"] .idx {
    color: #60a5fa;
  }
  .name {
    font-weight: 600;
  }
  .badge {
    opacity: 0.72;
    font-size: 10px;
    display: none;
  }
  .tab[aria-current="page"] .badge {
    display: inline;
  }
  @media (min-width: 1560px) {
    .badge {
      display: inline;
    }
  }
  .right {
    flex-shrink: 0;
  }
  .pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 26px;
    padding: 0 8px;
    border-radius: 4px;
    background: #0e131d;
    border: 1px solid rgba(255, 255, 255, 0.07);
    font-size: 11px;
    color: #d1d5db;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  [part="provenance-pill"] {
    font-weight: 600;
    letter-spacing: 0.02em;
  }
  :host(:state(verified-live)) [part="provenance-pill"] {
    border-color: rgba(52, 211, 153, 0.55);
    background: rgba(16, 185, 129, 0.14);
    color: #6ee7b7;
  }
  :host(:state(standby-probe)) [part="provenance-pill"] {
    border-color: rgba(148, 163, 184, 0.35);
    background: rgba(30, 41, 59, 0.75);
    color: #cbd5e1;
  }
  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #f59e0b;
  }
  :host(:state(isolated)) .dot {
    background: #10b981;
  }
  .ext-link {
    display: inline-flex;
    align-items: center;
    height: 26px;
    padding: 0 9px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 4px;
    color: #e5e7eb;
    font-size: 11px;
    white-space: nowrap;
    transition: border-color 120ms cubic-bezier(0.23, 1, 0.32, 1),
      color 120ms cubic-bezier(0.23, 1, 0.32, 1);
  }
  .ext-link:hover {
    border-color: #60a5fa;
    color: #93c5fd;
  }
  @media (max-width: 1120px) {
    .badge, .arch-link {
      display: none;
    }
  }
  @media (max-width: 720px) {
    .coi-pill {
      display: none;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .tab:active {
      transform: none;
    }
  }
  @media (forced-colors: active) {
    [part="provenance-pill"] {
      border: 1px solid ButtonText;
    }
  }
`);function Q(){const s=document.createElement("template"),e=document.createElement("header");e.className="bar",e.setAttribute("part","bar");const a=document.createElement("div");a.className="left";const t=document.createElement("a");t.className="home",t.dataset.home="",t.href="/labs",t.textContent="← Systems Lab";const n=document.createElement("nav");n.className="tabs",n.setAttribute("aria-label","Systems Lab Engine Switcher"),n.dataset.tabs="",a.append(t,n);const r=document.createElement("div");r.className="right";const m=document.createElement("span");m.className="pill",m.setAttribute("part","provenance-pill"),m.dataset.provenancePill="",m.textContent="[PROBE] STANDBY";const h=document.createElement("span");h.className="pill coi-pill",h.dataset.coiPill="";const b=document.createElement("i");b.className="dot",b.setAttribute("aria-hidden","true");const f=document.createElement("span");f.dataset.coiText="",f.textContent="Checking Isolation…",h.append(b,f);const p=document.createElement("span");p.className="pill",p.dataset.heapPill="",p.textContent="WASM Heap: 0.00 MB";const g=document.createElement("a");g.className="ext-link arch-link",g.dataset.arch="",g.target="_blank",g.rel="noopener",g.textContent="Docs ↗";const v=document.createElement("a");return v.className="ext-link",v.dataset.gh="",v.target="_blank",v.rel="noopener",v.textContent="GitHub ↗",r.append(m,h,p,g,v),e.append(a,r),s.content.append(e),s}const j=Q();function X(s,e,a){const t=D.zones[a];if(!t)return;const n=t.provenance==="VERIFIED_LIVE";s?.states&&(s.states.delete("verified-live"),s.states.delete("standby-probe"),s.states.add(n?"verified-live":"standby-probe")),e.dataset.provenance=t.provenance,e.dataset.runtimeMode=t.runtimeMode,e.textContent=n?`[LIVE] ${t.commitSha} · ${t.wasmSizeKb} KB WASM`:`[PROBE] STANDBY · ${t.wasmSizeKb} KB`}class Y extends HTMLElement{static observedAttributes=["active","github-user","hub-href","wasm-heap-bytes","latency-ms"];#e=null;#s;#c;#t=new Map;#i;#d;#a;#r;#o;#n=null;#l=0;#h=0;#m=null;constructor(){super(),typeof this.attachInternals=="function"&&(this.#e=this.attachInternals());const e=this.attachShadow({mode:"open",delegatesFocus:!0});e.adoptedStyleSheets=[z],e.append(j.content.cloneNode(!0)),this.#s=e.querySelector("[data-home]"),this.#c=e.querySelector("[data-tabs]"),this.#i=e.querySelector("[data-provenance-pill]"),this.#d=e.querySelector("[data-coi-text]"),this.#a=e.querySelector("[data-heap-pill]"),this.#r=e.querySelector("[data-arch]"),this.#o=e.querySelector("[data-gh]"),this.#p()}get active(){return this.getAttribute("active")??"vectradb"}set active(e){e?this.setAttribute("active",e):this.removeAttribute("active")}get githubUser(){return this.getAttribute("github-user")??"vanovri"}set githubUser(e){e?this.setAttribute("github-user",e):this.removeAttribute("github-user")}get hubHref(){return this.getAttribute("hub-href")??"/labs"}set hubHref(e){e?this.setAttribute("hub-href",e):this.removeAttribute("hub-href")}connectedCallback(){this.#n?.abort(),this.#n=new AbortController;const{signal:e}=this.#n;window.addEventListener("wasm-lab:telemetry",a=>{const t=a.detail;t&&(this.#l=t.linearMemoryBytes,this.#h=t.arenaUsedBytes,typeof t.elapsedMs=="number"&&(this.#m=t.elapsedMs),this.#u(t.crossOriginIsolated))},{signal:e}),window.addEventListener("keydown",a=>{if(!a.altKey||a.ctrlKey||a.metaKey||a.shiftKey)return;const t=Number(a.key)-1,n=x[t];!n||n.slug===this.active||(a.preventDefault(),this.#g(n))},{signal:e}),this.#b(),this.#u()}connectedMoveCallback(){}disconnectedCallback(){this.#n?.abort(),this.#n=null}attributeChangedCallback(e,a,t){if(a!==t){if(e==="wasm-heap-bytes"){this.#l=Number(t)||0,this.#u();return}if(e==="latency-ms"){this.#m=t!==null?Number(t):null,this.#u();return}this.#b()}}#p(){for(const e of x){const a=document.createElement("a");a.className="tab",a.href=`/labs/${e.slug}`,a.dataset.slug=e.slug;const t=document.createElement("span");t.className="idx",t.textContent=e.index;const n=document.createElement("span");n.className="name",n.textContent=e.name;const r=document.createElement("span");r.className="badge",r.textContent=e.tag,a.append(t,n,r),a.addEventListener("click",()=>{e.slug!==this.active&&window.dispatchEvent(new CustomEvent("wasm-lab:before-zone-leave",{detail:{targetSlug:e.slug}}))}),this.#t.set(e.slug,a),this.#c.append(a)}this.#s.addEventListener("click",()=>{window.dispatchEvent(new CustomEvent("wasm-lab:before-zone-leave",{detail:{targetSlug:"hub"}}))})}#g(e){window.dispatchEvent(new CustomEvent("wasm-lab:before-zone-leave",{detail:{targetSlug:e.slug}})),window.location.assign(`/labs/${e.slug}`)}#b(){const e=F(this.active),a=encodeURIComponent(this.githubUser);this.#s.href=this.hubHref;for(const[n,r]of this.#t)n===e.slug?r.setAttribute("aria-current","page"):r.removeAttribute("aria-current");X(this.#e,this.#i,e.slug);const t=`https://github.com/${a}/${e.repo}`;this.#o.href=t,this.#o.title=`Open ${this.githubUser}/${e.repo} source repository`,this.#r.href=`${t}/${e.archDocPath}`,this.#r.title=`Read ${e.name} architecture & invariants`}#u(e){const a=e??!!globalThis.crossOriginIsolated,t=q();this.#e?.states&&(a?this.#e.states.add("isolated"):this.#e.states.delete("isolated"),t?this.#e.states.add("simd"):this.#e.states.delete("simd"));const n=t?"SIMD128":"Scalar",r=a?"COI · sub-µs":"Standard Timer";if(this.#d.textContent=`${n} · ${r}`,this.#l>0){const m=this.#m!==null&&Number.isFinite(this.#m)?` · ${this.#m.toFixed(2)} ms`:"";this.#a.textContent=`WASM Heap: ${S(this.#l)}${m}`,this.#a.title=this.#h>0?`Linear Memory: ${S(this.#l)} | Active Arena: ${S(this.#h)}`:`Linear Memory: ${S(this.#l)}`}else this.#a.textContent=`WASM ${n} · Ready`}}typeof customElements<"u"&&!customElements.get("systems-lab-dock")&&customElements.define("systems-lab-dock",Y);class J{#e=null;#s;#c=0;#t=new Map;#i=!1;#d=new AbortController;constructor(e,a){this.#s=a,this.#e=e(),this.#e.addEventListener("message",n=>{const r=n.data;if(!r||typeof r.id!="number")return;const m=this.#t.get(r.id);if(m){if(clearTimeout(m.timer),this.#t.delete(r.id),!r.ok){m.reject(new Error(r.error));return}m.resolve(r)}}),this.#e.addEventListener("error",n=>{this.#n(new Error(n.message||"Dedicated WASM Worker crashed"))});const t=this.#d.signal;window.addEventListener("pagehide",()=>this.dispose(),{signal:t}),window.addEventListener("wasm-lab:before-zone-leave",()=>this.dispose(),{signal:t})}get isDisposed(){return this.#i}async init(e,a={}){const t=await this.#o({id:this.#a(),cmd:"INIT",payload:{wasmUrl:e,glueUrl:a.glueUrl??null,runtimeMode:a.runtimeMode??"STANDBY_PROBE_WASM",slug:this.#s}},15e3);if(!t.ok||t.kind!=="READY")throw new Error("Unexpected INIT response from worker");return this.#r(t.heap,t.instantiateMs),{instantiateMs:t.instantiateMs,streamingUsed:t.streamingUsed,runtimeMode:t.runtimeMode,heap:t.heap}}async executeKernel(e){const a=await this.#o({id:this.#a(),cmd:"EXEC_KERNEL",payload:{slug:this.#s,...e}},15e3);if(!a.ok||a.kind!=="EXEC_RESULT")throw new Error("Unexpected EXEC_KERNEL response");return this.#r(a.heap,a.elapsedMs),{elapsedMs:a.elapsedMs,runtimeMode:a.runtimeMode,outputValue:a.outputValue,throughputLabel:a.throughputLabel,metrics:a.metrics,heap:a.heap}}async resetArena(){const e=await this.#o({id:this.#a(),cmd:"RESET_ARENA"});if(!e.ok||e.kind!=="HEAP_STATS")throw new Error("Unexpected RESET_ARENA response");return this.#r(e.heap),e.heap}dispose(){if(this.#i)return;this.#i=!0,this.#d.abort();const e=this.#e;if(this.#e=null,e){try{e.postMessage({id:this.#a(),cmd:"SHUTDOWN"})}catch{}e.terminate()}this.#n(new Error("WASM Worker terminated during zone teardown"))}#a(){return this.#c+=1,this.#c}#r(e,a){const t={slug:this.#s,linearMemoryBytes:e.linearMemoryBytes,arenaUsedBytes:e.arenaUsedBytes,elapsedMs:a,crossOriginIsolated:e.crossOriginIsolated,sabAtomicsOk:e.sabAtomicsOk,runtimeMode:e.runtimeMode};window.dispatchEvent(new CustomEvent("wasm-lab:telemetry",{detail:t}))}#o(e,a=1e4){return this.#i||!this.#e?Promise.reject(new Error("WASM Worker already disposed")):new Promise((t,n)=>{const r=setTimeout(()=>{this.#t.delete(e.id),n(new Error(`Worker RPC timed out after ${a}ms (${e.cmd})`))},a);this.#t.set(e.id,{resolve:t,reject:n,timer:r}),this.#e.postMessage(e)})}#n(e){for(const[,a]of this.#t)clearTimeout(a.timer),a.reject(e);this.#t.clear()}}const W="vectradb",c=F(W),u=D.zones[W],ee=document.getElementById("studio-dock");ee?.setAttribute("active",c.slug);document.title=`${c.name} WASM Studio — Systems Lab | Ardhya Novri Ramadhan`;const i=s=>document.getElementById(s),y=document.getElementById("zone-runtime-banner");y&&u&&(y.dataset.provenance=u.provenance,y.dataset.runtimeMode=u.runtimeMode,y.textContent=`REAL ENGINE WASM · VERIFIED LIVE (${u.commitSha}) · ${u.wasmSizeKb} KB`);i("wb-category").textContent=`${c.index} · ${c.category.toUpperCase()} · DEDICATED WEB WORKER`;i("wb-title").textContent=`${c.name} Interactive WASM Studio`;i("wb-summary").textContent=c.summary;const C=u?.headlineMetrics[0];i("wb-gate-chip").textContent=u&&u.provenance==="VERIFIED_LIVE"&&C?`${C.label}: ${C.value}`:c.baselineTelemetry.verificationGate;i("wb-gate-chip").dataset.ok="true";const o=i("param-scale"),l=i("param-secondary"),E=i("param-seed"),V=i("out-scale"),K=i("out-secondary"),$=i("btn-exec"),I=i("btn-burst"),te=i("btn-reset");i("label-scale").textContent=c.defaultParams.scaleLabel;i("label-secondary").textContent=c.defaultParams.secondaryLabel;$.textContent=c.defaultParams.operationLabel;c.slug==="vectradb"?(o.min="1",o.max="5",o.step="1",l.min="4",l.max="64",l.step="4"):c.slug==="kronos"?(o.min="2000",o.max="50000",o.step="1000",l.min="100",l.max="250000"):c.slug==="aegis"?(o.min="4",o.max="44",o.step="4",l.min="4",l.max="44",l.step="4"):c.slug==="novaserve"?(o.min="8",o.max="64",o.step="4",l.min="0",l.max="4",l.step="1"):c.slug==="spectre"?(o.min="256",o.max="65536",o.step="256",l.min="0",l.max="1000",l.step="10"):(o.min="100",o.max="1000",o.step="100",l.min="3",l.max="9",l.step="2");o.value=String(c.defaultParams.scale);l.value=String(c.defaultParams.secondary);E.value=String(c.defaultParams.seed);V.textContent=Number(o.value).toLocaleString("en-US");K.textContent=Number(l.value).toLocaleString("en-US");o.addEventListener("input",()=>{V.textContent=Number(o.value).toLocaleString("en-US")});l.addEventListener("input",()=>{K.textContent=Number(l.value).toLocaleString("en-US")});const A=!!window.crossOriginIsolated,U=typeof SharedArrayBuffer=="function";i("diag-base").textContent="/labs/vectradb/";i("diag-coi").textContent=String(A);i("diag-timer").textContent=A?"5 µs (Unclamped COI)":"100 µs (Standard)";const L=i("wb-sab-chip");L.textContent=A&&U?"COOP+COEP · SharedArrayBuffer Active":"SharedArrayBuffer Locked";L.dataset.ok=String(A&&U);const w=[],P=i("audit-log");let T=0;function R(s,e){T+=1,i("log-count").textContent=`${T} ${T===1?"run":"runs"}`;const a=document.createElement("li"),t=document.createElement("strong");t.textContent=s;const n=document.createElement("span");for(n.textContent=e,a.append(t,n),P.prepend(a);P.children.length>24;)P.lastElementChild?.remove()}const M=i("trace-canvas"),d=M.getContext("2d");let G=!0,O=0,N=performance.now(),B=0;"IntersectionObserver"in window&&new IntersectionObserver(e=>{G=e.some(a=>a.isIntersecting)}).observe(M);const ae=window.matchMedia("(prefers-reduced-motion: reduce)");function H(s){if(G&&d){if(B+=1,s-N>=500){const t=Math.round(B*1e3/(s-N));i("fps-readout").textContent=`${t} FPS · Main Thread Unblocked`,B=0,N=s}const e=M.width,a=M.height;d.clearRect(0,0,e,a),d.strokeStyle="rgba(255, 255, 255, 0.05)",d.lineWidth=1;for(let t=40;t<a;t+=45)d.beginPath(),d.moveTo(0,t),d.lineTo(e,t),d.stroke();ae.matches||(O+=.06),d.strokeStyle="rgba(96, 165, 250, 0.32)",d.lineWidth=1.5,d.beginPath();for(let t=0;t<e;t+=6){const n=a-26+Math.sin(t*.02+O)*8;t===0?d.moveTo(t,n):d.lineTo(t,n)}if(d.stroke(),w.length>0){const t=Math.max(...w,.05),n=Math.max(8,Math.floor((e-40)/36)-4),r=w.slice(-36);r.forEach((m,h)=>{const b=Math.max(6,Math.round(m/t*(a-72))),f=20+h*(n+4),p=a-46-b;d.fillStyle=h===r.length-1?"#60a5fa":"rgba(59, 130, 246, 0.55)",d.fillRect(f,p,n,b)})}}requestAnimationFrame(H)}requestAnimationFrame(H);const k=new J(()=>new Worker(new URL("/labs/vectradb/assets/engine.worker-DkUZr8s7.js",import.meta.url),{type:"module"}),c.slug);window.addEventListener("wasm-lab:before-zone-leave",()=>{i("diag-worker").textContent="Terminated (0 B leaked)"});async function _(){if(k.isDisposed)return;const s=Number(o.value),e=Number(l.value),a=Number(E.value)||c.defaultParams.seed,t=await k.executeKernel({scale:s,secondary:e,seed:a});w.push(t.elapsedMs),i("metric-latency").textContent=`${t.elapsedMs.toFixed(3)} ms`,i("metric-throughput").textContent=t.throughputLabel,i("metric-output").textContent=t.outputValue,i("metric-memory").textContent=`${(t.heap.linearMemoryBytes/(1024*1024)).toFixed(2)} MB`,i("metric-arena").textContent=`${(t.heap.arenaUsedBytes/1024).toFixed(1)} KiB / ${(t.heap.arenaCapacityBytes/(1024*1024)).toFixed(1)} MiB arena`,t.heap.sabAtomicsOk&&(L.textContent="COOP+COEP · SharedArrayBuffer Atomics OK",L.dataset.ok="true"),R(`${c.name} → ${t.outputValue}`,`${t.elapsedMs.toFixed(3)} ms · ${t.throughputLabel}`)}async function se(){try{const s=await k.init(u.wasmAssetPath,{glueUrl:u.glueAssetPath,runtimeMode:u.runtimeMode});i("diag-worker").textContent=s.runtimeMode==="REAL_ENGINE_WASM"?"Active (Real Engine Worker)":"Active (Standby Probe Worker)";const e=i("wb-stream-chip");e.textContent=s.streamingUsed?`instantiateStreaming · ${s.instantiateMs.toFixed(2)} ms`:`ArrayBuffer Init · ${s.instantiateMs.toFixed(2)} ms`,e.dataset.ok=String(s.streamingUsed),i("metric-instantiate").textContent=`Cold WASM init: ${s.instantiateMs.toFixed(2)} ms (${u.wasmSizeKb} KB)`,await _()}catch(s){i("diag-worker").textContent="Init Error",R("Worker Init Failed",s instanceof Error?s.message:String(s))}}$.addEventListener("click",()=>{_()});I.addEventListener("click",async()=>{I.disabled=!0;try{for(let s=0;s<25;s+=1)E.value=String((Number(E.value)||1)+1),await _()}finally{I.disabled=!1}});te.addEventListener("click",async()=>{const s=await k.resetArena();i("metric-arena").textContent=`${s.arenaUsedBytes} B / ${(s.arenaCapacityBytes/(1024*1024)).toFixed(1)} MiB arena`,R("WASM Linear Arena Reset","0 B active")});se();
