document.addEventListener("DOMContentLoaded", () => {
  const summarizeBtn = document.getElementById("summarize");
  const hintBtn = document.getElementById("hint");
  const bruteBtn = document.getElementById("brute");
  const optimalBtn = document.getElementById("optimal");
  const resultDiv = document.getElementById("result");

  chrome.storage.sync.get(["geminiApiKey"], ({ geminiApiKey }) => {
    if (!geminiApiKey) {
      resultDiv.textContent = "❌ Please set your API key in extension options.";
      return;
    }

    summarizeBtn.addEventListener("click", () => handleAction("summarize", geminiApiKey));
    hintBtn.addEventListener("click", () => handleAction("hint", geminiApiKey));
    bruteBtn.addEventListener("click", () => handleAction("brute", geminiApiKey));
    optimalBtn.addEventListener("click", () => handleAction("optimal", geminiApiKey));
  });

  async function handleAction(action, apiKey) {
    resultDiv.textContent = "⏳ Extracting problem...";
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      chrome.tabs.sendMessage(tab.id, { type: "GET_PROBLEM_TEXT" }, async (response) => {
        if (chrome.runtime.lastError) {
          resultDiv.textContent = "⚠️ Could not connect to LeetCode page.";
          return;
        }

        if (!response || !response.text) {
          resultDiv.textContent = "⚠️ Could not extract problem. Open a LeetCode problem page.";
          return;
        }

        const problemText = response.text;
        let prompt = "";

        switch (action) {
          case "summarize":
            prompt = `Summarize this LeetCode problem clearly:\n\n${problemText}`;
            break;
          case "hint":
            prompt = `Give a useful hint to solve this LeetCode problem:\n\n${problemText}`;
            break;
          case "brute":
            prompt = `Explain a brute force solution with steps for this LeetCode problem:\n\n${problemText}`;
            break;
          case "optimal":
            prompt = `Explain the optimal solution (time & space complexity) for this LeetCode problem:\n\n${problemText}`;
            break;
        }

        resultDiv.textContent = "Thinking...";

        try {
          const apiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
            }
          );

          const data = await apiResponse.json();
          if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
            resultDiv.textContent = data.candidates[0].content.parts[0].text.trim();
          } else {
            resultDiv.textContent = "⚠️ No response from Gemini. Check console.";
            console.error(data);
          }
        } catch (err) {
          console.error("API Error:", err);
          resultDiv.textContent = "❌ API request failed. Check console.";
        }
      });
    });
  }
});
