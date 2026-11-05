(function () {
      const SCENARIOS = JSON.parse(document.getElementById("kilnmcp-embedded-data").textContent);
      let activePreset = "nominal";
      let activeBagMode = "mixed";
      let previewFormat = "markdown";
      let cursorIdx = 720;
      let hoverIdx = null;
      let replayTimer = null;

      const elBatchId = document.getElementById("hdr-batch-id");
      const elQualityGate = document.getElementById("active-quality-gate");
      const elScrubber = document.getElementById("scrubber-idx");
      const elCursorReadout = document.getElementById("cursor-readout");
      const elPlayPause = document.getElementById("btn-play-pause");
      const elSpeed = document.getElementById("sel-speed");
      const elBagMode = document.getElementById("sel-bag-mode");
      const elUartFilter = document.getElementById("sel-uart-filter");
      const elUartStream = document.getElementById("uart-stream-box");
      const elUartVerifyInp = document.getElementById("inp-uart-verify");
      const elUartVerifyBadge = document.getElementById("uart-verify-badge");
      const elReportPreview = document.getElementById("report-preview-box");

      const canvasTemp = document.getElementById("canvas-temp");
      const canvasMoist = document.getElementById("canvas-moist-o2");

      function xorChecksumHex(bodyStr) {
        let c = 0;
        for (let i = 0; i < bodyStr.length; i++) {
          c ^= bodyStr.charCodeAt(i);
        }
        return c.toString(16).toUpperCase().padStart(2, "0");
      }

      function verifyUartFrame(raw) {
        const line = (raw || "").trim();
        const dIdx = line.indexOf("$");
        const sIdx = line.lastIndexOf("*");
        if (dIdx < 0 || sIdx < 0 || sIdx <= dIdx) {
          return { ok: false, msg: "INVALID SYNTAX (missing $ or *)" };
        }
        const body = line.slice(dIdx + 1, sIdx);
        const given = line.slice(sIdx + 1).toUpperCase();
        const expected = xorChecksumHex(body);
        if (given === expected) {
          return { ok: true, msg: "XOR OK (*" + expected + ")" };
        }
        return { ok: false, msg: "BAD XOR (got *" + given + ", expected *" + expected + ")" };
      }

      function updateVerifierUI() {
        const res = verifyUartFrame(elUartVerifyInp.value);
        elUartVerifyBadge.textContent = res.msg;
        elUartVerifyBadge.className = "badge " + (res.ok ? "badge-pass" : "badge-fault");
      }

      function buildDynamicMarkdown(b, bagMode) {
        const sm = b.steady_metrics;
        const carb = b.carbon_accounting;
        const rec = b.bag_reconciliation_by_mode[bagMode];
        const lines = [
          "# PT ENVIID Karbon Solusi — Batch dMRV Draft Report `" + b.batch_id + "`",
          "",
          "> **" + b.certification_status + "**",
          "> **" + b.banner + ".** `synthetic: true` | `certification_status: \"" + b.certification_status + "\"`",
          "",
          "## 1. Batch & Pyrolysis Summary",
          "- **Scenario:** " + b.label + " (`" + b.preset_id + "`)",
          "- **Feedstock:** `" + b.feedstock + "` (55% Coffee Shell + 45% Corn Cob)",
          "- **Target Pyrolysis Zone:** 450–650 °C | **Steady Temp (min/mean/max):** " +
            sm.temp_min_c.toFixed(2) + " / " + sm.temp_mean_c.toFixed(2) + " / " + sm.temp_max_c.toFixed(2) +
            " °C (" + sm.in_target_zone_pct.toFixed(1) + "% in zone)",
          "- **Input Dry Mass:** " + b.input_mass_kg.toFixed(2) + " kg -> **Kiln Output Mass:** " +
            b.output_mass_kg.toFixed(2) + " kg (" + rec.actual_yield_pct.toFixed(2) + "% yield)",
          "",
          "## 2. Stoichiometric Net CO2e Calculation (44/12 × 0.80 × 0.90)",
          "- **Stored Organic Carbon (70% C_org):** " + carb.stored_c_org_kg.toFixed(2) + " kg C",
          "- **Molar H/C_org:** " + carb.h_c_org_molar.toFixed(2) + " (Threshold < 0.70: " +
            (carb.h_c_org_compliant ? "PASS" : "FAIL") + ")",
          "- **Gross CO2e (× 44/12):** " + carb.gross_co2e_kg.toFixed(2) + " kg CO2e",
          "- **Permanence Adjusted (× 0.80):** " + carb.permanence_adjusted_co2e_kg.toFixed(2) + " kg CO2e",
          "- **Net CO2e (× 0.90 Draft):** **" + carb.net_co2e_kg.toFixed(2) + " kg CO2e (" +
            carb.net_co2e_tonnes.toFixed(4) + " tCO2e)**",
          "",
          "## 3. Anomaly Events (" + b.anomalies.length + ")",
        ];
        if (b.anomalies.length === 0) {
          lines.push("No rule or EWMA k-sigma anomalies detected during steady state.");
        } else {
          b.anomalies.forEach(function (a, i) {
            lines.push(
              (i + 1) + ". `" + a.rule + "` on `" + a.sensor + "` (T+" + a.start_min.toFixed(1) + "m to T+" +
              a.end_min.toFixed(1) + "m, peak=" + a.value + ", thr=" + a.threshold + ") -> Cause: `" +
              a.diagnosis.probable_cause + "`"
            );
          });
        }
        lines.push(
          "",
          "## 4. QR Bag Reconciliation (`" + bagMode + "` mode — 2.0 t/ha Ultisol Plots)",
          "| QR Bag Code | Class (kg) | Net (kg) | Gross (kg) | C_org (kg) | Net CO2e (kg) | Ultisol Plot | Area (ha) | Status |",
          "|---|---|---|---|---|---|---|---|---|"
        );
        rec.bags.forEach(function (bg) {
          lines.push(
            "| `" + bg.qr_code + "` | " + bg.bag_class_kg + " | " + bg.net_mass_kg.toFixed(2) + " | " +
            bg.gross_mass_kg.toFixed(2) + " | " + bg.c_org_kg.toFixed(2) + " | " + bg.net_co2e_kg.toFixed(2) +
            " | `" + bg.ultisol_plot_id + "` | " + bg.plot_coverage_ha.toFixed(4) + " | `" + bg.dispatch_status + "` |"
          );
        });
        return lines.join("\n");
      }

      function buildExportJsonObject(b, bagMode) {
        return {
          synthetic: true,
          certification_status: "dMRV-style DRAFT - NOT CERTIFIED",
          banner: b.banner,
          organization: "PT ENVIID Karbon Solusi",
          batch_id: b.batch_id,
          preset_id: b.preset_id,
          feedstock: b.feedstock,
          feedstock_blend: b.feedstock_blend,
          target_temp_zone_c: b.target_temp_zone_c,
          quality_gate: b.quality_gate,
          steady_metrics: b.steady_metrics,
          carbon_accounting: b.carbon_accounting,
          anomalies: b.anomalies,
          bag_reconciliation: b.bag_reconciliation_by_mode[bagMode],
          uart_stats: b.uart_stats
        };
      }

      function drawTempCanvas(b) {
        const ctx = canvasTemp.getContext("2d");
        const W = canvasTemp.width;
        const H = canvasTemp.height;
        ctx.clearRect(0, 0, W, H);

        const padL = 58, padR = 64, padT = 22, padB = 30;
        const plotW = W - padL - padR;
        const plotH = H - padT - padB;
        const maxMin = 120;
        const minTemp = 0, maxTemp = 780;
        const minMass = 0, maxMass = 850;

        const xOfMin = (m) => padL + (m / maxMin) * plotW;
        const yOfTemp = (t) => padT + plotH - ((t - minTemp) / (maxTemp - minTemp)) * plotH;
        const yOfMass = (kg) => padT + plotH - ((kg - minMass) / (maxMass - minMass)) * plotH;

        // 450-650 C Target Pyrolysis Zone Band
        const y650 = yOfTemp(650);
        const y450 = yOfTemp(450);
        ctx.fillStyle = "rgba(21, 128, 61, 0.09)";
        ctx.fillRect(padL, y650, plotW, y450 - y650);

        // Warmup / Cooldown vertical boundary lines
        ctx.strokeStyle = "#CBD5E1";
        ctx.setLineDash([4, 4]);
        [20, 105].forEach(function (mBound) {
          const x = xOfMin(mBound);
          ctx.beginPath();
          ctx.moveTo(x, padT);
          ctx.lineTo(x, padT + plotH);
          ctx.stroke();
        });
        ctx.setLineDash([]);

        // Gridlines & Left Y labels
        ctx.strokeStyle = "#E2E8F0";
        ctx.fillStyle = "#475569";
        ctx.font = "11px monospace";
        [0, 150, 300, 450, 560, 650, 750].forEach(function (tVal) {
          const y = yOfTemp(tVal);
          ctx.beginPath();
          ctx.moveTo(padL, y);
          ctx.lineTo(padL + plotW, y);
          ctx.stroke();
          ctx.fillText(tVal + "°C", 8, y + 4);
        });

        // Right Y axis Mass labels
        [200, 400, 600, 800].forEach(function (mVal) {
          const y = yOfMass(mVal);
          ctx.fillStyle = "#64748B";
          ctx.fillText(mVal + "kg", padL + plotW + 6, y + 4);
        });

        // X axis minute labels
        for (let m = 0; m <= 120; m += 15) {
          const x = xOfMin(m);
          ctx.fillStyle = "#475569";
          ctx.fillText(m + "m", x - 10, H - 8);
        }

        // R-TEMP-LOW (500 C) dashed line
        ctx.strokeStyle = "#B91C1C";
        ctx.lineWidth = 1.2;
        ctx.setLineDash([5, 4]);
        const y500 = yOfTemp(500);
        ctx.beginPath();
        ctx.moveTo(padL, y500);
        ctx.lineTo(padL + plotW, y500);
        ctx.stroke();
        ctx.setLineDash([]);

        // Highlight Anomaly Windows for temp_c
        b.anomalies.forEach(function (a) {
          if (a.sensor === "temp_c") {
            const x1 = xOfMin(a.start_min);
            const x2 = Math.max(x1 + 4, xOfMin(a.end_min));
            ctx.fillStyle = "rgba(185, 28, 28, 0.16)";
            ctx.fillRect(x1, padT, x2 - x1, plotH);
            ctx.fillStyle = "#B91C1C";
            ctx.font = "bold 11px monospace";
            ctx.fillText("⚑ " + a.rule + " (" + a.value + "°C)", x1 + 3, padT + 14);
          }
        });

        const s = b.series;
        const limit = Math.min(cursorIdx, s.min.length - 1);

        // EWMA upper/lower band in steady state
        ctx.strokeStyle = "rgba(59, 130, 246, 0.55)";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ["ewma_temp_upper", "ewma_temp_lower"].forEach(function (k) {
          ctx.beginPath();
          let started = false;
          for (let i = 120; i <= Math.min(limit, 630); i++) {
            const x = xOfMin(s.min[i]);
            const y = yOfTemp(s[k][i]);
            if (!started) { ctx.moveTo(x, y); started = true; }
            else { ctx.lineTo(x, y); }
          }
          ctx.stroke();
        });
        ctx.setLineDash([]);

        // Mass curve (Right axis)
        ctx.strokeStyle = "#94A3B8";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (let i = 0; i <= limit; i++) {
          const x = xOfMin(s.min[i]);
          const y = yOfMass(s.mass_kg[i]);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Reactor Temperature curve
        ctx.strokeStyle = "#183B65";
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        for (let i = 0; i <= limit; i++) {
          const x = xOfMin(s.min[i]);
          const y = yOfTemp(s.temp_c[i]);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Active / Hover cursor line
        const activeIdx = hoverIdx !== null ? Math.min(hoverIdx, limit) : limit;
        const cx = xOfMin(s.min[activeIdx]);
        ctx.strokeStyle = "#0F172A";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, padT);
        ctx.lineTo(cx, padT + plotH);
        ctx.stroke();

        ctx.fillStyle = "#183B65";
        ctx.beginPath();
        ctx.arc(cx, yOfTemp(s.temp_c[activeIdx]), 4, 0, Math.PI * 2);
        ctx.fill();
      }

      function drawMoistO2Canvas(b) {
        const ctx = canvasMoist.getContext("2d");
        const W = canvasMoist.width;
        const H = canvasMoist.height;
        ctx.clearRect(0, 0, W, H);

        const padL = 58, padR = 64, padT = 20, padB = 28;
        const plotW = W - padL - padR;
        const plotH = H - padT - padB;
        const maxMin = 120;
        const maxPct = 32.0;

        const xOfMin = (m) => padL + (m / maxMin) * plotW;
        const yOfPct = (p) => padT + plotH - (p / maxPct) * plotH;

        // Gridlines
        ctx.strokeStyle = "#E2E8F0";
        ctx.fillStyle = "#475569";
        ctx.font = "11px monospace";
        [0, 5, 10, 15, 20, 25, 30].forEach(function (pVal) {
          const y = yOfPct(pVal);
          ctx.beginPath();
          ctx.moveTo(padL, y);
          ctx.lineTo(padL + plotW, y);
          ctx.stroke();
          ctx.fillText(pVal + "%", 14, y + 4);
        });

        for (let m = 0; m <= 120; m += 15) {
          const x = xOfMin(m);
          ctx.fillStyle = "#475569";
          ctx.fillText(m + "m", x - 10, H - 8);
        }

        // Threshold lines: 20% Moisture and 5% O2
        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = "#B45309";
        ctx.beginPath();
        ctx.moveTo(padL, yOfPct(20));
        ctx.lineTo(padL + plotW, yOfPct(20));
        ctx.stroke();

        ctx.strokeStyle = "#B91C1C";
        ctx.beginPath();
        ctx.moveTo(padL, yOfPct(5));
        ctx.lineTo(padL + plotW, yOfPct(5));
        ctx.stroke();
        ctx.setLineDash([]);

        // Anomaly Windows for moisture_pct and o2_pct
        b.anomalies.forEach(function (a) {
          if (a.sensor === "moisture_pct" || a.sensor === "o2_pct") {
            const x1 = xOfMin(a.start_min);
            const x2 = Math.max(x1 + 4, xOfMin(a.end_min));
            ctx.fillStyle = a.sensor === "o2_pct" ? "rgba(185, 28, 28, 0.16)" : "rgba(180, 83, 9, 0.16)";
            ctx.fillRect(x1, padT, x2 - x1, plotH);
            ctx.fillStyle = a.sensor === "o2_pct" ? "#B91C1C" : "#B45309";
            ctx.font = "bold 11px monospace";
            ctx.fillText("⚑ " + a.rule + " (" + a.value + "%)", x1 + 3, padT + 14);
          }
        });

        const s = b.series;
        const limit = Math.min(cursorIdx, s.min.length - 1);

        // Moisture curve
        ctx.strokeStyle = "#0284C7";
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        for (let i = 0; i <= limit; i++) {
          const x = xOfMin(s.min[i]);
          const y = yOfPct(s.moisture_pct[i]);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // O2 curve
        ctx.strokeStyle = "#D97706";
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        for (let i = 0; i <= limit; i++) {
          const x = xOfMin(s.min[i]);
          const y = yOfPct(s.o2_pct[i]);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        const activeIdx = hoverIdx !== null ? Math.min(hoverIdx, limit) : limit;
        const cx = xOfMin(s.min[activeIdx]);
        ctx.strokeStyle = "#0F172A";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, padT);
        ctx.lineTo(cx, padT + plotH);
        ctx.stroke();
      }

      function renderAll() {
        const b = SCENARIOS[activePreset];
        const sm = b.steady_metrics;
        const carb = b.carbon_accounting;
        const rec = b.bag_reconciliation_by_mode[activeBagMode];
        const s = b.series;
        const limit = Math.min(cursorIdx, s.min.length - 1);

        elBatchId.textContent = b.batch_id;
        elQualityGate.textContent = b.quality_gate;
        elCursorReadout.textContent =
          "T+" + s.min[limit].toFixed(1) + "m (" + (limit + 1) + "/" + s.min.length + ") | " +
          s.temp_c[limit].toFixed(1) + "°C, O2 " + s.o2_pct[limit].toFixed(2) + "%, MC " +
          s.moisture_pct[limit].toFixed(1) + "%";

        // KPI Strip
        document.getElementById("kpi-temp").textContent = sm.temp_mean_c.toFixed(1) + " °C";
        document.getElementById("kpi-temp-sub").textContent =
          "Min " + sm.temp_min_c.toFixed(1) + " / Max " + sm.temp_max_c.toFixed(1) + " °C (" + sm.in_target_zone_pct.toFixed(1) + "% in 450–650°C)";
        document.getElementById("kpi-mass").textContent = b.output_mass_kg.toFixed(2) + " kg";
        document.getElementById("kpi-mass-sub").textContent =
          "Input: " + b.input_mass_kg.toFixed(1) + " kg blend (" + rec.actual_yield_pct.toFixed(2) + "% dry yield)";
        document.getElementById("kpi-corg").textContent = carb.stored_c_org_kg.toFixed(2) + " kg C";
        document.getElementById("kpi-hc-sub").textContent =
          "70.0% C_org | Molar H/C_org: " + carb.h_c_org_molar.toFixed(2) + " (<0.70)";
        document.getElementById("kpi-co2e").textContent = carb.net_co2e_kg.toFixed(2) + " kg";
        document.getElementById("kpi-co2e-sub").textContent =
          carb.net_co2e_tonnes.toFixed(4) + " tCO2e (Gross: " + carb.gross_co2e_kg.toFixed(2) + " kg)";
        document.getElementById("kpi-area").textContent = rec.total_ultisol_area_ha.toFixed(4) + " ha";
        document.getElementById("kpi-area-sub").textContent =
          rec.total_ultisol_area_m2.toFixed(1) + " m² across " + rec.bag_count + " QR bags (@ 2 t/ha)";
        document.getElementById("kpi-anom-count").textContent = b.anomalies.length + (b.anomalies.length === 1 ? " Event" : " Events");
        document.getElementById("kpi-anom-sub").textContent =
          b.anomalies.length === 0
            ? "0 false positives — nominal pyrolysis"
            : b.anomalies.map((x) => x.rule).join(", ");

        // Anomalies Panel
        const anomBox = document.getElementById("anomaly-container");
        if (b.anomalies.length === 0) {
          anomBox.innerHTML =
            '<div style="padding:0.9rem;background:#F0FDF4;border:1px solid #86EFAC;border-radius:6px;color:#15803D;font-family:var(--font-mono);font-size:0.8rem;">' +
            '✓ NOMINAL STEADY STATE: Zero rule or EWMA k-σ anomalies recorded across 721 timestamps (2,884 sensor readings).' +
            '</div>';
        } else {
          anomBox.innerHTML = b.anomalies.map(function (a) {
            return (
              '<div class="anomaly-item">' +
                '<div class="anomaly-item-head">' +
                  '<span>' + a.rule + ' · ' + a.sensor + ' (T+' + a.start_min.toFixed(1) + 'm – T+' + a.end_min.toFixed(1) + 'm)</span>' +
                  '<span>Peak: ' + a.value + ' | Thr: ' + a.threshold + ' | Samples: ' + a.samples + '</span>' +
                '</div>' +
                '<div class="anomaly-diag"><strong>Probable Cause (<code>' + a.diagnosis.probable_cause + '</code>):</strong> ' + a.diagnosis.explanation + '</div>' +
                '<div class="anomaly-action">Suggested Action: ' + a.diagnosis.suggested_action + '</div>' +
              '</div>'
            );
          }).join("");
        }

        // UART Stream Panel
        const filterVal = elUartFilter.value;
        const frames = b.uart_frames.filter(function (f) {
          if (f.step > limit) return false;
          if (filterVal === "ALL") return true;
          if (filterVal === "ANOMALY") return f.in_anomaly_window;
          return f.sensor === filterVal;
        });
        document.getElementById("uart-stats-pill").textContent =
          b.uart_stats.total_frames + " total frames @ " + b.uart_stats.baud + " baud | showing " + frames.length;
        elUartStream.innerHTML = frames.map(function (f) {
          const cls = f.in_anomaly_window ? "uart-line anom-frame" : "uart-line";
          return (
            '<div class="' + cls + '" data-frame="' + f.frame + '">' +
              '<span>' + f.frame + '</span>' +
              '<span style="opacity:0.65;">T+' + f.min.toFixed(1) + 'm · XOR *' + f.checksum + '</span>' +
            '</div>'
          );
        }).join("");

        // Bag Reconciliation Table
        const tbody = document.getElementById("bag-table-body");
        tbody.innerHTML = rec.bags.map(function (bg) {
          const stageBadge = bg.dispatch_status === "APPLIED_ULTISOL"
            ? '<span class="badge badge-pass">APPLIED_ULTISOL</span>'
            : '<span class="badge badge-warn">IN_INVENTORY_TAGGED</span>';
          return (
            '<tr>' +
              '<th scope="row">' + bg.qr_code + '</th>' +
              '<td>' + bg.bag_class_kg + ' kg bag</td>' +
              '<td class="mono">' + bg.net_mass_kg.toFixed(2) + ' kg</td>' +
              '<td class="mono">' + bg.tare_mass_kg.toFixed(2) + ' / ' + bg.gross_mass_kg.toFixed(2) + ' kg</td>' +
              '<td class="mono">' + bg.c_org_kg.toFixed(2) + ' kg C</td>' +
              '<td class="mono">' + bg.net_co2e_kg.toFixed(2) + ' kg CO2e</td>' +
              '<td class="mono">' + bg.ultisol_plot_id + '</td>' +
              '<td class="mono">' + bg.plot_coverage_ha.toFixed(4) + ' ha (' + bg.plot_coverage_m2.toFixed(1) + ' m²)</td>' +
              '<td>' + stageBadge + '</td>' +
            '</tr>'
          );
        }).join("");

        const tfoot = document.getElementById("bag-table-foot");
        tfoot.innerHTML =
          '<tr>' +
            '<th scope="row">RECONCILIATION TOTAL (' + rec.bag_count + ' bags)</th>' +
            '<td>' + rec.bags_50kg_count + '×50kg + ' + rec.bags_25kg_count + '×25kg</td>' +
            '<td>' + rec.total_bag_net_kg.toFixed(2) + ' kg net</td>' +
            '<td>Lab: ' + rec.lab_sample_kg.toFixed(2) + ' kg | Loss: ' + rec.handling_loss_kg.toFixed(2) + ' kg</td>' +
            '<td>' + (rec.total_bag_net_kg * 0.70).toFixed(2) + ' kg C</td>' +
            '<td>' + (rec.total_bag_net_kg * 0.70 * (44 / 12) * 0.80 * 0.90).toFixed(2) + ' kg CO2e</td>' +
            '<td>Lampung Ultisol</td>' +
            '<td>' + rec.total_ultisol_area_ha.toFixed(4) + ' ha (' + rec.total_ultisol_area_m2.toFixed(1) + ' m²)</td>' +
            '<td>Δ = ' + rec.mass_discrepancy_kg.toFixed(2) + ' kg (RECONCILED)</td>' +
          '</tr>';

        // Report Preview
        if (previewFormat === "json") {
          elReportPreview.textContent = JSON.stringify(buildExportJsonObject(b, activeBagMode), null, 2);
        } else {
          elReportPreview.textContent = buildDynamicMarkdown(b, activeBagMode);
        }

        drawTempCanvas(b);
        drawMoistO2Canvas(b);
      }

      // Event Listeners
      document.querySelectorAll(".scenario-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
          document.querySelectorAll(".scenario-btn").forEach((b) => b.setAttribute("aria-pressed", "false"));
          btn.setAttribute("aria-pressed", "true");
          activePreset = btn.getAttribute("data-preset");
          const b = SCENARIOS[activePreset];
          if (b.uart_frames.length > 0) {
            elUartVerifyInp.value = b.uart_frames[0].frame;
            updateVerifierUI();
          }
          renderAll();
        });
      });

      elScrubber.addEventListener("input", function () {
        cursorIdx = parseInt(elScrubber.value, 10);
        renderAll();
      });

      elBagMode.addEventListener("change", function () {
        activeBagMode = elBagMode.value;
        renderAll();
      });

      elUartFilter.addEventListener("change", renderAll);
      elUartVerifyInp.addEventListener("input", updateVerifierUI);

      elUartStream.addEventListener("click", function (ev) {
        const row = ev.target.closest(".uart-line");
        if (row && row.dataset.frame) {
          elUartVerifyInp.value = row.dataset.frame;
          updateVerifierUI();
        }
      });

      function stopReplay() {
        if (replayTimer) {
          clearInterval(replayTimer);
          replayTimer = null;
        }
        elPlayPause.textContent = "▶ Replay Stream";
      }

      elPlayPause.addEventListener("click", function () {
        if (replayTimer) {
          stopReplay();
          return;
        }
        if (cursorIdx >= 720) cursorIdx = 1;
        elPlayPause.textContent = "⏸ Pause Replay";
        const intervalMs = parseInt(elSpeed.value, 10) || 45;
        replayTimer = setInterval(function () {
          cursorIdx = Math.min(720, cursorIdx + 3);
          elScrubber.value = String(cursorIdx);
          renderAll();
          if (cursorIdx >= 720) stopReplay();
        }, intervalMs);
      });

      document.getElementById("btn-step").addEventListener("click", function () {
        stopReplay();
        cursorIdx = Math.min(720, cursorIdx + 1);
        elScrubber.value = String(cursorIdx);
        renderAll();
      });

      document.getElementById("btn-reset-full").addEventListener("click", function () {
        stopReplay();
        cursorIdx = 720;
        elScrubber.value = "720";
        renderAll();
      });

      function attachCanvasHover(canvas) {
        canvas.addEventListener("mousemove", function (ev) {
          const rect = canvas.getBoundingClientRect();
          const scaleX = canvas.width / rect.width;
          const x = (ev.clientX - rect.left) * scaleX;
          const padL = 58, padR = 64;
          const plotW = canvas.width - padL - padR;
          const frac = Math.max(0, Math.min(1, (x - padL) / plotW));
          hoverIdx = Math.min(cursorIdx, Math.round(frac * 720));
          const b = SCENARIOS[activePreset];
          const s = b.series;
          document.getElementById("hover-telemetry-pill").textContent =
            "Sample #" + hoverIdx + " (T+" + s.min[hoverIdx].toFixed(1) + "m): Temp=" +
            s.temp_c[hoverIdx].toFixed(2) + "°C | O2=" + s.o2_pct[hoverIdx].toFixed(3) +
            "% | Moisture=" + s.moisture_pct[hoverIdx].toFixed(2) + "% | Mass=" + s.mass_kg[hoverIdx].toFixed(2) + "kg";
          drawTempCanvas(b);
          drawMoistO2Canvas(b);
        });
        canvas.addEventListener("mouseleave", function () {
          hoverIdx = null;
          const b = SCENARIOS[activePreset];
          drawTempCanvas(b);
          drawMoistO2Canvas(b);
        });
      }
      attachCanvasHover(canvasTemp);
      attachCanvasHover(canvasMoist);

      function triggerDownload(filename, content, mime) {
        const blob = new Blob([content], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }

      document.getElementById("btn-export-json").addEventListener("click", function () {
        const b = SCENARIOS[activePreset];
        const payload = JSON.stringify(buildExportJsonObject(b, activeBagMode), null, 2);
        previewFormat = "json";
        renderAll();
        triggerDownload("dmrv_draft_" + b.batch_id + ".json", payload, "application/json;charset=utf-8");
      });

      document.getElementById("btn-export-md").addEventListener("click", function () {
        const b = SCENARIOS[activePreset];
        const md = buildDynamicMarkdown(b, activeBagMode);
        previewFormat = "markdown";
        renderAll();
        triggerDownload("dmrv_draft_" + b.batch_id + ".md", md, "text/markdown;charset=utf-8");
      });

      document.getElementById("btn-preview-toggle").addEventListener("click", function () {
        previewFormat = previewFormat === "markdown" ? "json" : "markdown";
        renderAll();
      });

      document.getElementById("btn-copy-report").addEventListener("click", function () {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(elReportPreview.textContent);
        }
      });

      updateVerifierUI();
      renderAll();
    })();
