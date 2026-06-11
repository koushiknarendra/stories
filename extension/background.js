const BASE = "https://storis.in";

chrome.runtime.onInstalled.addListener(() => {
  // Right-click on any page
  chrome.contextMenus.create({
    id: "storis-page",
    title: "Get the story · Storis",
    contexts: ["page"],
    documentUrlPatterns: ["http://*/*", "https://*/*"],
  });

  // Right-click on a link
  chrome.contextMenus.create({
    id: "storis-link",
    title: "Get the story · Storis",
    contexts: ["link"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const url = info.linkUrl ?? info.pageUrl ?? tab?.url;
  if (!url) return;
  chrome.tabs.create({ url: `${BASE}/?url=${encodeURIComponent(url)}` });
});
