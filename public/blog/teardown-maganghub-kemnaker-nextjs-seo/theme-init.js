(function () {
  var meta = document.querySelector('meta[name="color-scheme"]');
  var param = new URLSearchParams(window.location.search).get("theme");
  var saved = null;
  try {
    saved = localStorage.getItem("mh-color-scheme");
  } catch (_) {}

  var scheme = (param === "dark" || param === "light")
    ? param
    : (saved === "dark" || saved === "light" ? saved : "light");

  if (meta) meta.setAttribute("content", scheme);

  var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  var resolved = scheme === "light dark" ? (prefersDark ? "dark" : "light") : scheme;
  document.documentElement.setAttribute("data-theme", resolved);
})();
