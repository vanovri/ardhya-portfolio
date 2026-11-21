(function () {
  "use strict";

  /* 1. Two-state dark mode toggle synced with <meta name="color-scheme"> and storage events */
  var STORAGE_KEY = "ai4gb-color-scheme";
  var metaScheme = document.querySelector('meta[name="color-scheme"]');
  var themeBtn = document.getElementById("themeToggle");

  function getSystemScheme() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function getStoredScheme() {
    try {
      var v = localStorage.getItem(STORAGE_KEY);
      return v === "light" || v === "dark" ? v : null;
    } catch (_) {
      return null;
    }
  }

  function applyScheme(stored) {
    var content = stored || "light dark";
    if (metaScheme) metaScheme.setAttribute("content", content);
    var resolved = stored || getSystemScheme();
    document.documentElement.setAttribute("data-theme", resolved);
    if (themeBtn) {
      themeBtn.setAttribute("aria-pressed", String(resolved === "dark"));
      themeBtn.setAttribute(
        "aria-label",
        resolved === "dark" ? "Switch to light theme" : "Switch to dark theme"
      );
      var lbl = themeBtn.querySelector(".theme-label");
      if (lbl) lbl.textContent = resolved === "dark" ? "Light mode" : "Dark mode";
    }
  }

  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var currentRendered = document.documentElement.getAttribute("data-theme") || getSystemScheme();
      var target = currentRendered === "dark" ? "light" : "dark";
      var system = getSystemScheme();
      if (target === system) {
        try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
        applyScheme(null);
      } else {
        try { localStorage.setItem(STORAGE_KEY, target); } catch (_) {}
        applyScheme(target);
      }
    });
  }

  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    if (mq.addEventListener) {
      mq.addEventListener("change", function () {
        if (!getStoredScheme()) applyScheme(null);
      });
    }
  }

  window.addEventListener("storage", function (ev) {
    if (ev.key === STORAGE_KEY) applyScheme(getStoredScheme());
  });

  var urlTheme = new URLSearchParams(window.location.search).get("theme");
  applyScheme(urlTheme === "light" || urlTheme === "dark" ? urlTheme : getStoredScheme());

  /* 2. Accessible single-row scrolling tabs with focusgroupstart, hidden=until-found & beforematch */
  var tablist = document.getElementById("projectTablist");
  var tabs = tablist ? Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]')) : [];
  var panels = Array.prototype.slice.call(document.querySelectorAll('[role="tabpanel"]'));

  function selectTab(targetTab, shouldFocus) {
    if (!targetTab) return;
    var targetId = targetTab.id;
    for (var i = 0; i < tabs.length; i++) {
      var tab = tabs[i];
      var active = tab === targetTab;
      tab.setAttribute("aria-selected", String(active));
      tab.toggleAttribute("focusgroupstart", active);
      tab.setAttribute("tabindex", active ? "0" : "-1");
    }
    for (var j = 0; j < panels.length; j++) {
      var panel = panels[j];
      var match = panel.getAttribute("aria-labelledby") === targetId;
      if (match) {
        panel.removeAttribute("hidden");
        panel.setAttribute("tabindex", "0");
      } else {
        panel.setAttribute("hidden", "until-found");
        panel.removeAttribute("tabindex");
      }
    }
    try {
      targetTab.scrollIntoView({ block: "nearest", inline: "nearest", container: "nearest" });
    } catch (_) {
      targetTab.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
    if (shouldFocus) targetTab.focus();
  }

  for (var t = 0; t < tabs.length; t++) {
    (function (tab, index) {
      tab.addEventListener("click", function () {
        selectTab(tab, false);
      });
      tab.addEventListener("keydown", function (ev) {
        var next = -1;
        if (ev.key === "ArrowRight") next = (index + 1) % tabs.length;
        else if (ev.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
        else if (ev.key === "Home") next = 0;
        else if (ev.key === "End") next = tabs.length - 1;
        if (next >= 0) {
          ev.preventDefault();
          selectTab(tabs[next], true);
        }
      });
    })(tabs[t], t);
  }

  for (var p = 0; p < panels.length; p++) {
    (function (panel) {
      panel.addEventListener("beforematch", function () {
        var ownerId = panel.getAttribute("aria-labelledby");
        var ownerTab = ownerId ? document.getElementById(ownerId) : null;
        if (ownerTab) selectTab(ownerTab, false);
      });
    })(panels[p]);
  }

  /* IntersectionObserver edge-fade fallback when scroll-driven animations are unsupported */
  if (tablist && typeof CSS !== "undefined" && !CSS.supports("animation-timeline", "scroll()")) {
    var firstTab = tablist.firstElementChild;
    var lastTab = tablist.lastElementChild;
    if (firstTab && lastTab && "IntersectionObserver" in window) {
      var fadeObs = new IntersectionObserver(
        function (entries) {
          for (var k = 0; k < entries.length; k++) {
            var entry = entries[k];
            tablist.classList.toggle(
              entry.target === firstTab ? "more-start" : "more-end",
              entry.intersectionRatio < 1
            );
          }
        },
        { root: tablist, threshold: 1, rootMargin: "1px" }
      );
      fadeObs.observe(firstTab);
      fadeObs.observe(lastTab);
    }
  }

  /* 3. Copy buttons via Invoker Commands (command="--copy" + commandfor) with CommandEvent fallback */
  var copyTimers = new WeakMap();
  var lastMessage = "";

  function reportCopy(button, ok) {
    var tip = button.nextElementSibling;
    if (!tip) return;
    clearTimeout(copyTimers.get(button));
    button.removeAttribute("data-copied");
    button.removeAttribute("data-failed");
    var msg = ok ? "Copied" : "Copy failed";
    if (msg === lastMessage) msg += "\u00A0";
    lastMessage = msg;
    tip.textContent = "";
    void button.offsetWidth;
    button.setAttribute(ok ? "data-copied" : "data-failed", "");
    requestAnimationFrame(function () {
      tip.textContent = msg;
    });
    copyTimers.set(
      button,
      setTimeout(function () {
        button.removeAttribute("data-copied");
        button.removeAttribute("data-failed");
        tip.textContent = "";
      }, 2200)
    );
  }

  function legacyCopy(text) {
    var field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.cssText = "position:fixed;inset-block-start:0;opacity:0";
    document.body.appendChild(field);
    field.select();
    try {
      return document.execCommand("copy");
    } finally {
      field.remove();
    }
  }

  async function runCopy(button, target) {
    if (!button || !target) return;
    var text = target.matches("input, textarea") ? target.value : target.innerText.trim();
    if (!text) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else if (!legacyCopy(text)) {
        throw new Error("Copy failed");
      }
      reportCopy(button, true);
    } catch (_) {
      try {
        if (legacyCopy(text)) reportCopy(button, true);
        else reportCopy(button, false);
      } catch (_err) {
        reportCopy(button, false);
      }
    }
  }

  if ("CommandEvent" in window) {
    document.addEventListener(
      "command",
      function (event) {
        if (event.command === "--copy") {
          runCopy(event.source, event.target);
        }
      },
      true
    );
  } else {
    document.addEventListener("click", function (event) {
      var btn = event.target && event.target.closest ? event.target.closest('button[command="--copy"]') : null;
      if (!btn) return;
      var target = document.getElementById(btn.getAttribute("commandfor") || "");
      if (target) runCopy(btn, target);
    });
  }
})();
