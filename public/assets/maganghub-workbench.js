try {
      document.querySelector('meta[name="color-scheme"]').content = localStorage.getItem("color-scheme") ?? "light dark";
    } catch (_) {}

// --- 1. THEME TOGGLE (Follows modern-web-guidance dark-mode-toggle) ---
    const metaScheme = document.querySelector('meta[name="color-scheme"]');
    const themeBtn = document.getElementById('themeToggleBtn');
    const darkMql = window.matchMedia('(prefers-color-scheme: dark)');

    function getRenderedScheme() {
      const stored = localStorage.getItem('color-scheme');
      if (stored === 'dark' || stored === 'light') return stored;
      return darkMql.matches ? 'dark' : 'light';
    }

    function updateThemeButtonLabel() {
      const stored = localStorage.getItem('color-scheme');
      const current = getRenderedScheme();
      themeBtn.textContent = stored
        ? `Tema: ${current === 'dark' ? 'Gelap (Pin)' : 'Terang (Pin)'}`
        : `Tema: Sistem (${current === 'dark' ? 'Gelap' : 'Terang'})`;
    }

    themeBtn.addEventListener('click', () => {
      const currentRendered = getRenderedScheme();
      const target = currentRendered === 'dark' ? 'light' : 'dark';
      const systemScheme = darkMql.matches ? 'dark' : 'light';
      try {
        if (target === systemScheme) {
          localStorage.removeItem('color-scheme');
          metaScheme.content = 'light dark';
        } else {
          localStorage.setItem('color-scheme', target);
          metaScheme.content = target;
        }
      } catch (_) {
        metaScheme.content = target;
      }
      updateThemeButtonLabel();
    });

    window.addEventListener('storage', (e) => {
      if (e.key === 'color-scheme') {
        metaScheme.content = e.newValue ?? 'light dark';
        updateThemeButtonLabel();
      }
    });
    darkMql.addEventListener('change', updateThemeButtonLabel);
    updateThemeButtonLabel();

    // --- 2. TABS NAVIGATION ---
    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach((b) => b.setAttribute('aria-selected', 'false'));
        document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
        btn.setAttribute('aria-selected', 'true');
        document.getElementById(btn.dataset.target).classList.add('active');
      });
    });

    // --- 3. LOGBOOK DATA & VALIDATOR ---
    const logbookEntries = [
      {
        hari_ke: 1,
        tanggal: "2026-11-09",
        jalur_kompetensi: "Teknik, Perangkat Keras",
        durasi_jam: 8.0,
        uraian_kegiatan: "Melaksanakan induksi K3 kelistrikan (LOTO & APD), orientasi single-line diagram (SLD), serta inspeksi visual dan pengukuran tegangan float sistem UPS 30 kVA & bank baterai VRLA 384 VDC.",
        kompetensi_teknis: ["K3 Kelistrikan & LOTO (PUIL 2020)", "Inspeksi Sistem UPS & Rectifier", "Analisis Single-Line Diagram (SLD)"],
        output_bukti_kerja: "Form Checklist Inspeksi Harian UPS-01 (Tegangan bus DC 432.0 V float, beban 24.0 kW) & peta titik ukur panel.",
        kendala_solusi: "Kendala: Label blok baterai #14-#18 pudar. Solusi: Penomoran ulang dengan label tahan panas sesuai urutan SLD.",
        verifikasi_mentor: "Disetujui"
      },
      {
        hari_ke: 2,
        tanggal: "2026-11-10",
        jalur_kompetensi: "Teknik, Perangkat Keras",
        durasi_jam: 8.0,
        uraian_kegiatan: "Melakukan pengujian komunikasi serial RS-485 Modbus RTU antara power meter digital Schneider PM5350 dan gateway mikrokontroler STM32/ESP32 pada baud rate 19200 bps (8E1).",
        kompetensi_teknis: ["Akuisisi Data Modbus RTU (RS-485)", "Embedded Telemetry (STM32/ESP32)", "Analisis Protokol & CRC-16"],
        output_bukti_kerja: "Tabel tangkapan paket heksadesimal (Function Code 0x03) dengan 0% packet loss selama 1.000 siklus polling.",
        kendala_solusi: "Kendala: Pantulan sinyal pada kabel 80 m. Solusi: Memasang resistor terminasi 120 Ohm di ujung bus RS-485.",
        verifikasi_mentor: "Disetujui"
      },
      {
        hari_ke: 3,
        tanggal: "2026-11-11",
        jalur_kompetensi: "Teknik, Perangkat Keras",
        durasi_jam: 8.0,
        uraian_kegiatan: "Melaksanakan evaluasi kurva koordinasi proteksi rele arus lebih (OCR/GFR) dan perhitungan kapasitas otonomi baterai cadangan menggunakan standar IEEE 485.",
        kompetensi_teknis: ["Koordinasi Rele Proteksi (OCR/GFR)", "Perhitungan Otonomi Baterai (IEEE 485)", "Evaluasi Keandalan Sistem Tenaga"],
        output_bukti_kerja: "Lembar kerja kalkulasi otonomi baterai (46.8 menit pada beban 24 kW) dan kurva koordinasi waktu-arus.",
        kendala_solusi: "Kendala: Faktor penuaan baterai tidak ada di ringkasan. Solusi: Mengacu standar IEEE 485 (aging factor 1.25, DoD 80%).",
        verifikasi_mentor: "Disetujui"
      },
      {
        hari_ke: 4,
        tanggal: "2026-11-12",
        jalur_kompetensi: "Teknik, Perangkat Lunak",
        durasi_jam: 8.0,
        uraian_kegiatan: "Mengembangkan layanan Python otomatis untuk akuisisi data telemetri harian, validasi integritas payload sensor (CRC-16/CRC-32), serta pembersihan derau sinyal.",
        kompetensi_teknis: ["Otomasi Python & Pemrosesan Sinyal", "Validasi Integritas Data (CRC/Schema)", "Rekayasa Pipeline Telemetri"],
        output_bukti_kerja: "Modul Python telemetry_validator.py beserta 12 unit test (pytest 100% pass) dan ekspor otomatis CSV/JSON.",
        kendala_solusi: "Kendala: Timestamp sensor tidak konsisten (UTC vs WIB). Solusi: Normalisasi ISO-8601 (UTC+07:00) di parser.",
        verifikasi_mentor: "Disetujui"
      },
      {
        hari_ke: 5,
        tanggal: "2026-11-13",
        jalur_kompetensi: "Teknik, Perangkat Lunak",
        durasi_jam: 8.0,
        uraian_kegiatan: "Membangun antarmuka dashboard monitoring status peralatan & generator laporan mingguan otomatis (Markdown/CSV/PDF) untuk efisiensi pemeliharaan preventif.",
        kompetensi_teknis: ["Pengembangan Web & Visualisasi Data", "Otomasi Pelaporan Teknis (MD/CSV/PDF)", "Quality Assurance & Deployment"],
        output_bukti_kerja: "Aplikasi Web Workbench offline-first dan dokumen laporan rekapitulasi mingguan yang tervalidasi penuh.",
        kendala_solusi: "Kendala: Ruang panel tidak selalu terkoneksi internet. Solusi: Arsitektur 100% luring tanpa ketergantungan CDN.",
        verifikasi_mentor: "Disetujui"
      }
    ];

    function scoreEntry(e) {
      let score = 0;
      if (/^\d{4}-\d{2}-\d{2}$/.test(e.tanggal) && e.durasi_jam >= 0.5 && e.durasi_jam <= 12) score += 15;
      if (e.jalur_kompetensi && e.kompetensi_teknis.length >= 2) score += 20;
      else if (e.kompetensi_teknis.length === 1) score += 15;
      if (e.uraian_kegiatan.length >= 25) score += 25;
      if (e.output_bukti_kerja.length >= 12) score += 20;
      if (e.kendala_solusi.length >= 10) score += 10;
      if (e.verifikasi_mentor) score += 10;
      return score;
    }

    function renderLogbook() {
      const tbody = document.getElementById('logbookTableBody');
      tbody.innerHTML = '';
      let totalHours = 0;
      let totalScore = 0;
      let approved = 0;

      logbookEntries.forEach((e) => {
        const sc = scoreEntry(e);
        totalHours += Number(e.durasi_jam);
        totalScore += sc;
        if (e.verifikasi_mentor === 'Disetujui') approved += 1;

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <th>H-${e.hari_ke}<br><span style="font-weight:400;color:var(--muted)">${e.tanggal} (${e.durasi_jam}j)</span></th>
          <td><span class="badge">${e.jalur_kompetensi}</span></td>
          <td>${e.uraian_kegiatan}</td>
          <td>${e.kompetensi_teknis.join('; ')}</td>
          <td>${e.output_bukti_kerja}</td>
          <td>${e.kendala_solusi}</td>
          <td><span class="badge ok">${e.verifikasi_mentor}</span><br><small class="mono">Skor: ${sc}/100</small></td>
        `;
        tbody.appendChild(tr);
      });

      const avgScore = logbookEntries.length ? (totalScore / logbookEntries.length).toFixed(1) : 0;
      document.getElementById('logbookKpis').innerHTML = `
        <div class="kpi-box"><div class="lbl">Total Entri Harian</div><div class="val">${logbookEntries.length} Hari</div></div>
        <div class="kpi-box"><div class="lbl">Akumulasi Jam Kerja</div><div class="val">${totalHours.toFixed(1)} Jam</div></div>
        <div class="kpi-box"><div class="lbl">Rata-rata Skor Kualitas</div><div class="val">${avgScore} / 100</div></div>
        <div class="kpi-box"><div class="lbl">Verifikasi Mentor</div><div class="val">${approved}/${logbookEntries.length} Disetujui</div></div>
      `;
    }

    document.getElementById('logbookForm').addEventListener('submit', (ev) => {
      ev.preventDefault();
      const newEntry = {
        hari_ke: Number(document.getElementById('lbHari').value),
        tanggal: document.getElementById('lbTanggal').value,
        jalur_kompetensi: document.getElementById('lbJalur').value,
        durasi_jam: Number(document.getElementById('lbDurasi').value),
        uraian_kegiatan: document.getElementById('lbUraian').value.trim(),
        kompetensi_teknis: document.getElementById('lbKompetensi').value.split(',').map((s) => s.trim()).filter(Boolean),
        output_bukti_kerja: document.getElementById('lbOutput').value.trim(),
        kendala_solusi: document.getElementById('lbKendala').value.trim(),
        verifikasi_mentor: document.getElementById('lbStatus').value
      };
      logbookEntries.push(newEntry);
      document.getElementById('lbHari').value = newEntry.hari_ke + 1;
      renderLogbook();
    });

    function downloadBlob(filename, content, mime) {
      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }

    document.getElementById('exportMdBtn').addEventListener('click', () => {
      const lines = [
        "# LOGBOOK AKTIVITAS MAGANGHUB KEMNAKER",
        "- **Nama Peserta**: Ardhya Novri Ramadhan, S.T. (S1 Teknik Elektro UNDIP)",
        "",
        "| Hari | Tanggal | Jalur Kompetensi | Uraian Kegiatan | Kompetensi Teknis | Output / Bukti Kerja | Kendala & Solusi | Verifikasi |",
        "| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |"
      ];
      logbookEntries.forEach((e) => {
        lines.push(`| H-${e.hari_ke} | ${e.tanggal} | ${e.jalur_kompetensi} | ${e.uraian_kegiatan} | ${e.kompetensi_teknis.join('; ')} | ${e.output_bukti_kerja} | ${e.kendala_solusi} | ${e.verifikasi_mentor} |`);
      });
      downloadBlob('MAGANGHUB_LOGBOOK_MINGGUAN.md', lines.join('\n'), 'text/markdown;charset=utf-8');
    });

    document.getElementById('exportCsvBtn').addEventListener('click', () => {
      const header = ['Hari_Ke','Tanggal','Jalur_Kompetensi','Durasi_Jam','Uraian_Kegiatan','Kompetensi_Teknis','Output_Bukti_Kerja','Kendala_Solusi','Verifikasi_Mentor'];
      const rows = [header.join(',')];
      logbookEntries.forEach((e) => {
        const vals = [
          e.hari_ke, e.tanggal, e.jalur_kompetensi, e.durasi_jam,
          e.uraian_kegiatan, e.kompetensi_teknis.join('; '), e.output_bukti_kerja, e.kendala_solusi, e.verifikasi_mentor
        ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
        rows.push(vals.join(','));
      });
      downloadBlob('MAGANGHUB_LOGBOOK_SIAPKERJA.csv', rows.join('\n'), 'text/csv;charset=utf-8');
    });

    // --- 4. UPS & BATTERY CALCULATOR ---
    function updateUpsCalc() {
      const kva = Math.max(0.1, Number(document.getElementById('upsKva').value) || 30);
      const pf = Math.min(1, Math.max(0.1, Number(document.getElementById('upsPf').value) || 0.85));
      const eff = Math.min(1, Math.max(0.5, Number(document.getElementById('upsEff').value) || 0.92));
      const vdc = Math.max(12, Number(document.getElementById('upsVdc').value) || 384);
      const ah = Math.max(1, Number(document.getElementById('upsAh').value) || 100);
      const strings = Math.max(1, Number(document.getElementById('upsStrings').value) || 1);
      const targetMin = Math.max(1, Number(document.getElementById('upsTargetMin').value) || 30);
      const dod = Math.min(1, Math.max(0.3, Number(document.getElementById('upsDod').value) || 0.8));
      const peukert = Math.max(1.0, Number(document.getElementById('upsPeukert').value) || 1.1);

      const kw = kva * pf;
      const dcKw = kw / eff;
      const idc = (dcKw * 1000) / vdc;
      const totalAh = ah * strings;
      const usableKwh = (totalAh * vdc * dod) / 1000;
      const usableAh = totalAh * dod;
      const iRef = usableAh / 10.0;
      const autonomyHours = 10.0 * Math.pow(iRef / idc, peukert);
      const autonomyMin = autonomyHours * 60.0;

      const rawReqUsableAh = idc * 10.0 * Math.pow((targetMin / 60.0) / 10.0, 1.0 / peukert);
      const recAh = (rawReqUsableAh / dod) * 1.25;
      const blocksPerStr = Math.round(vdc / 12);

      const badge = document.getElementById('upsStatusBadge');
      if (autonomyMin >= targetMin) {
        badge.textContent = 'ADEQUATE (MEMENUHI TARGET)';
        badge.className = 'badge ok';
      } else {
        badge.textContent = 'UNDERSIZED (PERLU TAMBAH KAPASITAS)';
        badge.className = 'badge err';
      }

      document.getElementById('upsResultsStrip').innerHTML = `
        <div class="kpi-box"><div class="lbl">Daya Aktif / DC Input</div><div class="val">${kw.toFixed(2)} kW / ${dcKw.toFixed(2)} kW</div></div>
        <div class="kpi-box"><div class="lbl">Arus Discharge DC</div><div class="val">${idc.toFixed(1)} A</div></div>
        <div class="kpi-box"><div class="lbl">Energi Usable (DoD)</div><div class="val">${usableKwh.toFixed(2)} kWh</div></div>
        <div class="kpi-box"><div class="lbl">Estimasi Otonomi</div><div class="val">${autonomyMin.toFixed(1)} Menit</div></div>
        <div class="kpi-box"><div class="lbl">Rekomendasi Ah (IEEE 485)</div><div class="val">${recAh.toFixed(1)} Ah</div></div>
        <div class="kpi-box"><div class="lbl">Konfigurasi Blok 12V</div><div class="val">${strings}x ${blocksPerStr} Blok</div></div>
      `;
    }

    ['upsKva','upsPf','upsEff','upsVdc','upsAh','upsStrings','upsTargetMin','upsDod','upsPeukert'].forEach((id) => {
      document.getElementById(id).addEventListener('input', updateUpsCalc);
    });

    // --- 5. MODBUS RTU CRC-16/32 & UART TIMING CALCULATOR ---
    function computeCrc16And32(hexStr) {
      const clean = hexStr.replace(/0x/gi, '').replace(/[^0-9a-fA-F]/g, '');
      if (!clean || clean.length % 2 !== 0) return null;
      const bytes = [];
      for (let i = 0; i < clean.length; i += 2) {
        bytes.push(parseInt(clean.slice(i, i + 2), 16));
      }
      let crc = 0xFFFF;
      for (const b of bytes) {
        crc ^= b;
        for (let bit = 0; bit < 8; bit++) {
          crc = (crc & 1) ? ((crc >>> 1) ^ 0xA001) : (crc >>> 1);
        }
      }
      // IEEE 802.3 CRC-32
      let crc32 = 0xFFFFFFFF;
      for (const b of bytes) {
        crc32 ^= b;
        for (let bit = 0; bit < 8; bit++) {
          crc32 = (crc32 & 1) ? ((crc32 >>> 1) ^ 0xEDB88320) : (crc32 >>> 1);
        }
      }
      crc32 = (crc32 ^ 0xFFFFFFFF) >>> 0;
      const low = crc & 0xFF;
      const high = (crc >>> 8) & 0xFF;
      return {
        bytes,
        crc16Hex: '0x' + crc.toString(16).toUpperCase().padStart(4, '0'),
        wireOrder: low.toString(16).toUpperCase().padStart(2, '0') + ' ' + high.toString(16).toUpperCase().padStart(2, '0'),
        crc32Hex: '0x' + crc32.toString(16).toUpperCase().padStart(8, '0')
      };
    }

    function updateModbusCalc() {
      const hexVal = document.getElementById('mbHexInput').value;
      const baud = Number(document.getElementById('mbBaud').value) || 19200;
      const reqBytes = Math.max(1, Number(document.getElementById('mbReqBytes').value) || 8);
      const respBytes = Math.max(1, Number(document.getElementById('mbRespBytes').value) || 9);
      const turnaround = Math.max(0, Number(document.getElementById('mbTurnaround').value) || 5);
      const slaves = Math.max(1, Number(document.getElementById('mbSlaves').value) || 4);

      const crcRes = computeCrc16And32(hexVal);
      const badge = document.getElementById('modbusCrcBadge');
      if (!crcRes) {
        badge.textContent = 'HEX INVALID (PASTIKAN DIGIT GENAP)';
        badge.className = 'badge err';
        return;
      }
      badge.textContent = `CRC-16 Wire: ${crcRes.wireOrder}`;
      badge.className = 'badge ok';

      const charTimeMs = (11 * 1000) / baud;
      const t35Ms = baud <= 19200 ? 3.5 * charTimeMs : 1.75;
      const txMs = reqBytes * charTimeMs;
      const rxMs = respBytes * charTimeMs;
      const singlePollMs = txMs + t35Ms + turnaround + rxMs + t35Ms;
      const allSlavesMs = singlePollMs * slaves;
      const pollsPerSec = 1000 / allSlavesMs;
      const minBuf = Math.max(64, 4 * Math.max(reqBytes, respBytes));
      const dmaBuf = Math.pow(2, Math.ceil(Math.log2(minBuf)));

      document.getElementById('modbusResultsStrip').innerHTML = `
        <div class="kpi-box"><div class="lbl">CRC-16 (Wire Low-High)</div><div class="val">${crcRes.wireOrder} (${crcRes.crc16Hex})</div></div>
        <div class="kpi-box"><div class="lbl">IEEE CRC-32</div><div class="val">${crcRes.crc32Hex}</div></div>
        <div class="kpi-box"><div class="lbl">Silent Interval T3.5</div><div class="val">${t35Ms.toFixed(3)} ms</div></div>
        <div class="kpi-box"><div class="lbl">Waktu Transaksi 1 Slave</div><div class="val">${singlePollMs.toFixed(2)} ms</div></div>
        <div class="kpi-box"><div class="lbl">Siklus ${slaves} Slave / Poll Rate</div><div class="val">${allSlavesMs.toFixed(1)} ms (${pollsPerSec.toFixed(1)} Hz)</div></div>
        <div class="kpi-box"><div class="lbl">Rekomendasi DMA Buffer</div><div class="val">${dmaBuf} Bytes</div></div>
      `;
    }

    ['mbHexInput','mbBaud','mbReqBytes','mbRespBytes','mbTurnaround','mbSlaves'].forEach((id) => {
      document.getElementById(id).addEventListener('input', updateModbusCalc);
    });

    // --- 6. ONBOARDING 30-60-90 & PM CHECKLIST ---
    const onboardingPhases = [
      {
        title: "Fase 30 Hari (Bulan 1)",
        sub: "Safety (K3), Architecture Mapping & Baseline Diagnostics",
        items: [
          "Induksi K3 Kelistrikan (PUIL 2020 / LOTO) & pemahaman SOP tanggap darurat.",
          "Pemetaan Single-Line Diagram (SLD), kapasitas UPS/baterai, dan topologi jaringan Modbus/IoT.",
          "Eksekusi checklist inspeksi harian terarah bersama mentor (Akurasi 100%).",
          "Otomasi skrip validasi logbook & konversi data telemetri harian ke CSV/Markdown."
        ]
      },
      {
        title: "Fase 60 Hari (Bulan 2)",
        sub: "Guided Execution, Telemetry Automation & Reliability",
        items: [
          "Kalibrasi node sensor STM32/ESP32 & optimasi terminasi bus RS-485 (packet loss < 0.1%).",
          "Evaluasi kurva proteksi OCR/GFR dan audit kapasitas otonomi baterai berdasarkan beban puncak.",
          "Implementasi workbench monitoring luring untuk memangkas waktu rekapitulasi laporan >= 40%.",
          "Integrasi pengujian otomatis (pytest unit tests) untuk modul kalkulasi teknis."
        ]
      },
      {
        title: "Fase 90 Hari (Bulan 3)",
        sub: "Independent Ownership, System Optimization & Handover",
        items: [
          "Penyelesaian proyek peningkatan keandalan sistem daya / otomasi telemetri unit kerja.",
          "Penyusunan dokumen SOP/Runbook operasional dan panduan pemeliharaan preventif.",
          "Serah terima source code, skema pengkabelan, dan laporan akhir MagangHub Kemnaker.",
          "Presentasi evaluasi akhir kompetensi SIAPkerja di hadapan mentor & manajemen."
        ]
      }
    ];

    const pmItems = [
      { id: "PM-UPS-01", domain: "Substation / UPS", item: "Verifikasi suhu ruang baterai (20–25 °C), ventilasi aktif, dan kesiapan LOTO/APD.", std: "IEEE 485 / PUIL 2020", crit: "Suhu <= 25 °C, RH < 70%", sev: "CRITICAL", pass: true },
      { id: "PM-UPS-02", domain: "Substation / UPS", item: "Inspeksi visual & termal blok VRLA dari pembengkakan, korosi terminal, dan titik panas.", std: "IEEE 1188", crit: "Delta suhu konektor < 3 °C", sev: "CRITICAL", pass: true },
      { id: "PM-UPS-03", domain: "Substation / UPS", item: "Catat tegangan float bus DC, arus ripple, dan beban kVA/kW per fasa pada HMI.", std: "IEC 62040-3", crit: "13.5–13.65 V/blok; beban < 80%", sev: "MAJOR", pass: true },
      { id: "PM-UPS-04", domain: "Substation / UPS", item: "Verifikasi indikator sehat rele proteksi OCR/GFR dan suplai DC tripping coil.", std: "SPLN / IEC 60255", crit: "Tegangan kontrol 110/24 VDC +/- 5%", sev: "CRITICAL", pass: true },
      { id: "PM-IOT-01", domain: "IoT Sensor Node", item: "Ukur regulasi tegangan rail 3.3V/5.0V dan ripple buck converter pada board MCU.", std: "IPC-A-610", crit: "3.30V +/- 2%, ripple < 50 mV", sev: "CRITICAL", pass: true },
      { id: "PM-IOT-02", domain: "IoT Sensor Node", item: "Periksa level diferensial RS-485 (A-B), resistor terminasi 120 Ohm, dan CRC-16 error.", std: "TIA/EIA-485-A", crit: "|V_AB| >= 200 mV, CRC error < 0.1%", sev: "MAJOR", pass: true },
      { id: "PM-IOT-03", domain: "IoT Sensor Node", item: "Bandingkan pembacaan ADC sensor terhadap alat ukur referensi & uji Watchdog Timer.", std: "ISO/IEC 17025 QA", crit: "Deviasi < 1.5% FS; WDT < 5 dtk", sev: "MAJOR", pass: true },
      { id: "PM-SW-01", domain: "Software QA", item: "Jalankan seluruh unit test otomatis (pytest) pada kalkulator engineering & validator.", std: "IEEE 829", crit: "100% unit tests lulus", sev: "CRITICAL", pass: true },
      { id: "PM-SW-02", domain: "Software QA", item: "Pastikan sanitasi input & normalisasi zona waktu ISO-8601 (UTC+07:00) pada parser.", std: "OWASP Input QA", crit: "Zero unhandled exception", sev: "MAJOR", pass: true },
      { id: "PM-SW-03", domain: "Software QA", item: "Verifikasi fungsi ekspor laporan Markdown/CSV dan kesiapan operasional offline-first.", std: "Internal SOP", crit: "Ekspor berhasil 100% luring", sev: "MINOR", pass: true }
    ];

    function renderOnboardingAndPm() {
      document.getElementById('onboardingGrid').innerHTML = onboardingPhases.map((p) => `
        <div class="card" style="margin-bottom:0">
          <h2><span>${p.title}</span></h2>
          <p style="margin:0 0 0.5rem;font-size:0.8rem;color:var(--muted);font-weight:600">${p.sub}</p>
          <ul class="compact-list">
            ${p.items.map((it) => `<li>${it}</li>`).join('')}
          </ul>
        </div>
      `).join('');

      const pmBody = document.getElementById('pmTableBody');
      pmBody.innerHTML = '';
      let passedCount = 0;
      let critFail = 0;

      pmItems.forEach((it, idx) => {
        if (it.pass) passedCount += 1;
        else if (it.sev === 'CRITICAL') critFail += 1;

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <th>${it.id}</th>
          <td><strong>${it.domain}</strong></td>
          <td>${it.item}</td>
          <td><span class="mono">${it.std}</span></td>
          <td>${it.crit}</td>
          <td><span class="badge ${it.sev === 'CRITICAL' ? 'err' : ''}">${it.sev}</span></td>
          <td>
            <label for="pm-chk-${idx}" style="display:inline-flex;align-items:center;gap:0.4rem;cursor:pointer">
              <input type="checkbox" id="pm-chk-${idx}" data-idx="${idx}" ${it.pass ? 'checked' : ''}>
              <span>${it.pass ? 'PASS' : 'PENDING'}</span>
            </label>
          </td>
        `;
        pmBody.appendChild(tr);
      });

      pmBody.querySelectorAll('input[type="checkbox"]').forEach((chk) => {
        chk.addEventListener('change', (e) => {
          const i = Number(e.target.dataset.idx);
          pmItems[i].pass = e.target.checked;
          renderOnboardingAndPm();
        });
      });

      const pct = ((passedCount / pmItems.length) * 100).toFixed(0);
      const badge = document.getElementById('pmReadinessBadge');
      if (critFail === 0 && passedCount >= 8) {
        badge.textContent = `Readiness: ${pct}% (${passedCount}/${pmItems.length} PASS — SIAP OPERASI)`;
        badge.className = 'badge ok';
      } else {
        badge.textContent = `Readiness: ${pct}% (${critFail} Critical Pending — HOLD)`;
        badge.className = 'badge err';
      }
    }

    // Initialize all views
    renderLogbook();
    updateUpsCalc();
    updateModbusCalc();
    renderOnboardingAndPm();
