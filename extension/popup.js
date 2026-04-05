function search() {
  const username = document.getElementById('username').value.trim();
  if (!username) return;
  chrome.tabs.create({
    url: `https://socialspy.vercel.app?username=${encodeURIComponent(username)}`
  });
}

// Search on Enter key
document.getElementById('username').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') search();
});

// Auto-fill if username was passed
chrome.storage.local.get(['lastUsername'], (result) => {
  if (result.lastUsername) {
    document.getElementById('username').value = result.lastUsername;
  }
});
document.getElementById('searchBtn').addEventListener('click', search);