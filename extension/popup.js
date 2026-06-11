const BASE = "https://storis.in";

const btn       = document.getElementById("btn");
const titleEl   = document.getElementById("page-title");
const domainEl  = document.getElementById("page-domain");
const invalidEl = document.getElementById("invalid-msg");

function isArticleUrl(url) {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function getDomain(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); }
  catch { return url; }
}

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url   = tab?.url   ?? "";
  const title = tab?.title ?? url;

  titleEl.textContent  = title || "Untitled page";
  domainEl.textContent = getDomain(url);

  if (!isArticleUrl(url)) {
    btn.disabled          = true;
    invalidEl.style.display = "block";
    invalidEl.textContent   = "Navigate to an article, then click the extension.";
    return;
  }

  btn.disabled = false;
  btn.addEventListener("click", () => {
    const dest = `${BASE}/?url=${encodeURIComponent(url)}`;
    chrome.tabs.create({ url: dest });
    window.close();
  });
}

init();
