chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "socialspy-search",
    title: "🕵️ Search '%s' on SocialSpy",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "socialspy-search") {
    const username = info.selectionText.trim();
    chrome.tabs.create({
      url: `https://socialspy.vercel.app?username=${encodeURIComponent(username)}`
    });
  }
});