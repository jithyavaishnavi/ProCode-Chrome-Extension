// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_PROBLEM_TEXT") {
    try {
      // Stable selector for problem description
      const problemElement = document.querySelector("div[data-track-load='description_content']");

      if (problemElement) {
        sendResponse({ text: problemElement.innerText.trim() });
      } else {
        console.warn("Problem description not found.");
        sendResponse({ text: null });
      }
    } catch (err) {
      console.error("Content script error:", err);
      sendResponse({ text: null });
    }
  }
  return true; // keep async channel open
});
