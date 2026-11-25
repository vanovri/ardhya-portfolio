(function () {
  "use strict";

  // 1. Two-state color-scheme toggle (reverts to system 'light dark' when matching OS)
  var themeBtn = document.getElementById("themeToggle");
  var schemeMeta = document.querySelector('meta[name="color-scheme"]');
  var mqDark = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  function getSystemScheme() {
    return mqDark && mqDark.matches ? "dark" : "light";
  }

  function getStoredScheme() {
    try {
      var val = localStorage.getItem("mh-color-scheme");
      return val === "dark" || val === "light" ? val : null;
    } catch (_) {
      return null;
    }
  }

  function applyTheme(stored) {
    var resolved = stored === "dark" ? "dark" : "light";
    if (schemeMeta) schemeMeta.setAttribute("content", resolved);
    document.documentElement.setAttribute("data-theme", resolved);
    if (themeBtn) {
      themeBtn.textContent = resolved === "dark" ? "Mode Terang" : "Mode Gelap";
      themeBtn.setAttribute("aria-pressed", String(resolved === "dark"));
    }
  }

  applyTheme(getStoredScheme());

  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var currentResolved = document.documentElement.getAttribute("data-theme") || "light";
      var target = currentResolved === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("mh-color-scheme", target);
      } catch (_) {}
      applyTheme(target);
    });
  }

  window.addEventListener("storage", function (e) {
    if (e.key === "mh-color-scheme") {
      applyTheme(getStoredScheme());
    }
  });

  if (mqDark && mqDark.addEventListener) {
    mqDark.addEventListener("change", function () {
      if (!getStoredScheme()) applyTheme(null);
    });
  }

  // 2. Interactive Wayback Machine Timeline (E13 + V3)
  var SNAPSHOTS = [
    {
      url: "web.archive.org / 2025-10-10",
      isSsr: false,
      badge: "SPA CLIENT-ONLY (HTML KOSONG)",
      title: "Snapshot 10 Oktober 2025 (Arsip Awal)",
      desc: "Crawler hanya menerima cangkang SPA kosong dengan judul generik tanpa H1, tanpa meta description, dan tanpa tombol CTA.",
      words: "0 teks SSR",
      headings: "0 H1, 0 H2",
      ctas: "0 CTA",
      crawl: "Tidak terbaca crawler",
      snippet: '<title>Maganghub - Kemnaker RI</title>\n<meta name="description" content="" />\n<body>\n  <div id="__next"></div>\n  <!-- h1: "", description: "", ctas: [] -->\n</body>'
    },
    {
      url: "web.archive.org / 2025-11-03",
      isSsr: false,
      badge: "SPA CLIENT-ONLY (MASIH KOSONG)",
      title: "Snapshot 3 November 2025",
      desc: "Satu bulan berjalan, respons HTML awal belum berubah. Googlebot tetap tidak melihat copy program maupun daftar lowongan.",
      words: "0 teks SSR",
      headings: "0 H1, 0 H2",
      ctas: "0 CTA",
      crawl: "Tidak terbaca crawler",
      snippet: '<title>Maganghub - Kemnaker RI</title>\n<meta name="description" content="" />\n<body>\n  <div id="__next"></div>\n  <!-- h1: "", description: "", ctas: [] -->\n</body>'
    },
    {
      url: "web.archive.org / 2026-05-16",
      isSsr: false,
      badge: "BULAN KE-7: MASIH SPA KOSONG",
      title: "Snapshot 16 Mei 2026",
      desc: "Tujuh bulan setelah pengarsipan pertama, struktur HTML awal masih kosong bagi crawler yang tidak merender JavaScript penuh.",
      words: "0 teks SSR",
      headings: "0 H1, 0 H2",
      ctas: "0 CTA",
      crawl: "Tidak terbaca crawler",
      snippet: '<title>Maganghub - Kemnaker RI</title>\n<meta name="description" content="" />\n<body>\n  <div id="__next"></div>\n  <!-- 7 bulan tanpa SSR H1/meta/CTA -->\n</body>'
    },
    {
      url: "web.archive.org / 2026-11-16",
      isSsr: true,
      badge: "NEXT.JS FULL SSR TEREKAM UTUH",
      title: "Snapshot 16 November 2026 (Aktif Saat Ini)",
      desc: "Berpindah dari SPA kosong ke Next.js full SSR antara Mei dan November 2026 (terekam utuh di snapshot 16 Nov 2026): 1.245 kata SSR, Plausible self-hosted aktif, tetapi 8/8 rute mewarisi canonical root.",
      words: "1.245 kata SSR",
      headings: "1 H1, 4 H2",
      ctas: "2 CTA aktif",
      crawl: "Terbaca penuh + Bug Canonical 8/8",
      snippet: '<title>Program Pemagangan Lulusan Perguruan Tinggi : Maganghub - Kemnaker RI</title>\n<link rel="canonical" href="https://maganghub.kemnaker.go.id" /> <!-- BUG: identik di 8/8 rute -->\n<script defer src="https://plausible.kemnaker.go.id/js/script.js"></script>\n<h1>Mulai Karirmu dari Magang Terbaik di sini.</h1>\n<!-- Aktif: /magang-nasional/lowongan, /penyelenggara, /persyaratan, /tentang, /faq -->'
    }
  ];

  var wbBtns = Array.from(document.querySelectorAll(".wb-btn"));
  function renderSnap(idx) {
    var s = SNAPSHOTS[idx];
    if (!s) return;
    wbBtns.forEach(function (b, i) {
      b.setAttribute("aria-pressed", String(i === idx));
    });
    var badge = document.getElementById("wbBadge");
    if (badge) {
      badge.textContent = s.badge;
      badge.className = "status-badge " + (s.isSsr ? "status-badge--ok" : "status-badge--alert");
    }
    document.getElementById("wbTitle").textContent = s.title;
    document.getElementById("wbDesc").textContent = s.desc;
    document.getElementById("wbWords").textContent = s.words;
    document.getElementById("wbHeadings").textContent = s.headings;
    document.getElementById("wbCtas").textContent = s.ctas;
    document.getElementById("wbCrawl").textContent = s.crawl;
    document.getElementById("wbUrl").textContent = s.url;
    document.getElementById("wbSnippet").textContent = s.snippet;
  }
  wbBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      renderSnap(Number(btn.dataset.snap));
    });
  });
  renderSnap(3);

  // 3. Google for Jobs Simulator (Before vs After)
  var SERP_MODES = {
    before: {
      badge: "MagangHub tidak tampil",
      badgeClass: "flag flag--no",
      heading: "Mengapa lowongan bersubsidi belum muncul di Google for Jobs?",
      copy: "8/8 rute publik mengunci canonical ke beranda, sitemap.xml 404 (0 URL), robots.txt hanya komentar Cloudflare, dan jsonLdTypes kosong. Akibatnya kueri berniat tinggi direbut portal swasta.",
      organicSnip: "Hanya halaman beranda yang berpeluang muncul sebagai tautan biru umum. Subhalaman /magang-nasional/lowongan dan /magang-nasional/faq dikonsolidasikan balik ke root oleh canonical duplikat.",
      rows: [
        { title: "Electrical Engineering Intern", meta: "Perusahaan Manufaktur Swasta / Jakarta / via Glints", tag: "Glints", hi: false },
        { title: "Junior Electrical Intern (Paid)", meta: "Startup Energi / Jakarta Selatan / via Dealls (51.957 URL)", tag: "Dealls", hi: false },
        { title: "Magang Teknik Elektro", meta: "Agregator Lowongan / Jabodetabek / via JobStreet", tag: "JobStreet", hi: false }
      ],
      checks: [
        { ok: true, text: "Next.js full SSR + Plausible self-hosted aktif di plausible.kemnaker.go.id [E13, v1.18.23]" },
        { ok: false, text: "Blocker #0: 8/8 rute publik memancarkan canonical ke root '/' & title identik [V3]" },
        { ok: false, text: "sitemap.xml 404 (0 URL) & robots.txt (1.248 B) hanya komentar Cloudflare [E8, V4]" },
        { ok: false, text: "JSON-LD 0 blok (JobPosting & FAQPage kosong) + llms.txt 404 [E1, E9, V3]" }
      ]
    },
    after: {
      badge: "MagangHub terindeks langsung",
      badgeClass: "flag flag--ok",
      heading: "Yang berubah setelah Patch #0 sampai Patch #5 + 8-Gate CI",
      copy: "Setelah canonical root dicabut dan rute /magang-nasional/lowongan/[slug] mengirim schema JobPosting + sitemap dinamis + llms.txt Batch 3B 2026, lowongan bersubsidi tampil langsung di Google for Jobs dan AI Search.",
      organicSnip: "Setiap rute /magang-nasional/* memiliki self-canonical & title unik, lowongan tutup otomatis berpindah 200 (noindex) -> 410 Gone, dan /llms.txt + /ai/jobs.ndjson menyalip Glints (llmsTxt: null).",
      rows: [
        { title: "Electrical Staff Intern (Program Bersubsidi)", meta: "Mitra Resmi Kemnaker / Jakarta / maganghub.kemnaker.go.id/magang-nasional/lowongan/...", tag: "MagangHub RI", hi: true },
        { title: "Electrical Engineering Intern", meta: "Perusahaan Manufaktur Swasta / Jakarta / via Glints", tag: "Glints", hi: false },
        { title: "Junior Electrical Intern (Paid)", meta: "Startup Energi / Jakarta Selatan / via Dealls", tag: "Dealls", hi: false }
      ],
      checks: [
        { ok: true, text: "Patch #0: alternates.canonical dicabut dari root layout.tsx; 8/8 rute self-canonical unik" },
        { ok: true, text: "Patch #1-#2: app/sitemap.ts (fail-closed ACTIVE, sharding >50K) + app/robots.ts eksplisit" },
        { ok: true, text: "Patch #3-#4: JobPosting + FAQPage JSON-LD XSS-safe & expired guard 200->410 Gone" },
        { ok: true, text: "Patch #5 + CI: app/llms.txt/route.ts (Batch 3B 2026) + /ai/jobs.ndjson + 8-Gate Validator" }
      ]
    }
  };

  var btnBefore = document.getElementById("btnSerpBefore");
  var btnAfter = document.getElementById("btnSerpAfter");

  function renderSerp(mode) {
    var data = SERP_MODES[mode];
    if (!data) return;
    btnBefore.setAttribute("aria-pressed", String(mode === "before"));
    btnAfter.setAttribute("aria-pressed", String(mode === "after"));

    var badge = document.getElementById("shelfBadge");
    badge.textContent = data.badge;
    badge.className = data.badgeClass;

    document.getElementById("simHeading").textContent = data.heading;
    document.getElementById("simCopy").textContent = data.copy;
    document.getElementById("organicSnip").textContent = data.organicSnip;

    var rowsEl = document.getElementById("jobRowsContainer");
    rowsEl.textContent = "";
    data.rows.forEach(function (r) {
      var div = document.createElement("div");
      div.className = "job-row" + (r.hi ? " job-row--highlight" : "");
      var left = document.createElement("div");
      var t = document.createElement("div");
      t.className = "job-title";
      t.textContent = r.title;
      var m = document.createElement("div");
      m.className = "job-meta";
      m.textContent = r.meta;
      left.appendChild(t);
      left.appendChild(m);
      var tag = document.createElement("span");
      tag.className = "job-tag";
      tag.textContent = r.tag;
      div.appendChild(left);
      div.appendChild(tag);
      rowsEl.appendChild(div);
    });

    var checksEl = document.getElementById("simChecks");
    checksEl.textContent = "";
    data.checks.forEach(function (c) {
      var li = document.createElement("li");
      var flag = document.createElement("span");
      flag.className = "flag " + (c.ok ? "flag--ok" : "flag--no");
      flag.textContent = c.ok ? "OK" : "GAP";
      var txt = document.createElement("span");
      txt.textContent = c.text;
      li.appendChild(flag);
      li.appendChild(txt);
      checksEl.appendChild(li);
    });
  }

  if (btnBefore && btnAfter) {
    btnBefore.addEventListener("click", function () { renderSerp("before"); });
    btnAfter.addEventListener("click", function () { renderSerp("after"); });
    renderSerp("before");
  }

  // 4. Accessible Tabs Controller (Modern Web Guidance: focusgroup + hidden=until-found + beforematch + keyboard nav)
  var tablist = document.querySelector('[role="tablist"]');
  var tabs = tablist ? Array.from(tablist.querySelectorAll('[role="tab"]')) : [];
  var panels = tabs.map(function (t) {
    return document.querySelector('[role="tabpanel"][aria-labelledby="' + t.id + '"]');
  }).filter(Boolean);

  function selectTab(selectedTab, moveFocus) {
    tabs.forEach(function (tab, idx) {
      var isActive = tab === selectedTab;
      tab.setAttribute("aria-selected", String(isActive));
      tab.toggleAttribute("focusgroupstart", isActive);
      var panel = panels[idx];
      if (!panel) return;
      if (isActive) {
        panel.removeAttribute("hidden");
        panel.setAttribute("tabindex", "0");
      } else {
        panel.setAttribute("hidden", "until-found");
        panel.removeAttribute("tabindex");
      }
    });
    if (selectedTab.scrollIntoView) {
      selectedTab.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
    if (moveFocus) {
      selectedTab.focus();
    }
  }

  tabs.forEach(function (tab, idx) {
    tab.addEventListener("click", function () {
      selectTab(tab, false);
    });
    tab.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        selectTab(tabs[(idx + 1) % tabs.length], true);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        selectTab(tabs[(idx - 1 + tabs.length) % tabs.length], true);
      } else if (e.key === "Home") {
        e.preventDefault();
        selectTab(tabs[0], true);
      } else if (e.key === "End") {
        e.preventDefault();
        selectTab(tabs[tabs.length - 1], true);
      }
    });
  });

  panels.forEach(function (panel, idx) {
    panel.addEventListener("beforematch", function () {
      selectTab(tabs[idx], false);
    });
  });

  // 5. Copy active code panel with double-copy lock + centralized role="status"
  var copyBtn = document.getElementById("copyCodeBtn");
  var copyStatus = document.getElementById("copyStatus");
  var copyInFlight = false;
  var copyCount = 0;

  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      if (copyInFlight) return;
      copyInFlight = true;

      var activeIdx = tabs.findIndex(function (t) {
        return t.getAttribute("aria-selected") === "true";
      });
      var activePanel = panels[activeIdx >= 0 ? activeIdx : 0];
      var codeEl = activePanel ? activePanel.querySelector("code") : null;
      var label = tabs[activeIdx >= 0 ? activeIdx : 0].textContent.trim();
      var text = codeEl ? codeEl.textContent : "";

      var finish = function (ok) {
        copyCount += 1;
        copyBtn.dataset.copyCount = String(copyCount);
        copyBtn.textContent = ok ? "Tersalin" : "Gagal salin";
        if (copyStatus) {
          copyStatus.textContent = ok
            ? "Berhasil menyalin " + label + " (" + text.length + " karakter)."
            : "Gagal menyalin " + label + " ke clipboard.";
        }
        setTimeout(function () {
          copyBtn.textContent = "Salin Kode";
          copyInFlight = false;
        }, 1400);
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(
          function () { finish(true); },
          function () { finish(false); }
        );
      } else {
        finish(false);
      }
    });
  }
})();
