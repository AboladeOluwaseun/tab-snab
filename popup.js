document.addEventListener("DOMContentLoaded", function () {
  const transcriptionListContainer = document.getElementById(
    "transcription-container"
  );
  const clearConversationsButton = document.getElementById(
    "clearConversationsButton"
  );
  const startButton = document.getElementById("startCapture");
  const stopButton = document.getElementById("stopCapture");

  // Fetch and render transcriptions from storage
  function fetchAndRenderTranscriptions() {
    chrome.storage.local.get("transcriptions", ({ transcriptions }) => {
      if (!transcriptions || transcriptions.length === 0) {
        transcriptionListContainer.textContent = "No transcriptions available.";
        return;
      }

      // Clear existing content
      transcriptionListContainer.innerHTML = "";

      // Create and append each transcription
      transcriptions.forEach((transcription) => {
        const transcriptionElement = document.createElement("div");
        transcriptionElement.style.borderBottom = "1px solid #ccc";
        transcriptionElement.style.padding = "10px";

        const timestampElement = document.createElement("div");
        timestampElement.textContent = new Date(
          transcription.timestamp
        ).toLocaleString();
        timestampElement.style.fontSize = "12px";
        timestampElement.style.color = "#666";

        const textElement = document.createElement("div");
        textElement.textContent = transcription.text;
        textElement.style.marginTop = "5px";

        transcriptionElement.appendChild(timestampElement);
        transcriptionElement.appendChild(textElement);
        transcriptionListContainer.appendChild(transcriptionElement);
      });
    });
  }

  // Clear transcriptions from storage and UI
  function clearConversations() {
    chrome.storage.local.set({ transcriptions: [] }, () => {
      transcriptionListContainer.textContent = "No transcriptions available.";
      console.log("Conversations cleared.");
    });
  }

  // Disable or enable buttons based on capturing state and change styles
  function updateButtonStates(isCapturing) {
    chrome.storage.local.set({ capturingState: { isCapturing } }); // Save state to storage
    if (isCapturing) {
      // Change styles for "Start Capture" button
      startButton.disabled = true;
      startButton.style.backgroundColor = "#bbb";
      startButton.style.color = "#666";
      startButton.style.cursor = "not-allowed";

      // Enable "Stop Capture" button
      stopButton.disabled = false;
      stopButton.style.backgroundColor = "#e74c3c";
      stopButton.style.color = "#fff";
      stopButton.style.cursor = "pointer";
    } else {
      // Reset styles for "Start Capture" button
      startButton.disabled = false;
      startButton.style.backgroundColor = "#4a90e2";
      startButton.style.color = "#fff";
      startButton.style.cursor = "pointer";

      // Disable "Stop Capture" button
      stopButton.disabled = true;
      stopButton.style.backgroundColor = "#bbb";
      stopButton.style.color = "#666";
      stopButton.style.cursor = "not-allowed";
    }
  }

  // Function to get the current active tab
  function getCurrentTab() {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
          resolve(tabs[0]);
        } else {
          reject("No active tab found.");
        }
      });
    });
  }

  // Handle "Start Capture" button click
  startButton.addEventListener("click", async () => {
    const currentTab = await getCurrentTab();
    chrome.runtime.sendMessage(
      {
        action: "startCapture",
        tabId: currentTab.id,
        revAiToken:
          "02YNHWnpptcf8S8gntcfKVdpO9aIMtTm1D2guAlsSzEJRbKZF0CGU7gIJsgHnY6nI4yi230f1wKfPFgaqo6jV4VQLOgC8", // You'll need to add a way to configure this
      },
      () => {
        console.log("Start capture initiated.");
        updateButtonStates(true); // Immediately reflect capturing state
      }
    );
  });

  // Handle "Stop Capture" button click
  stopButton.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "stopCapture" }, () => {
      console.log("Stop capture initiated.");
      updateButtonStates(false); // Immediately reflect capturing state
    });
  });

  // Handle "Clear Conversations" button click
  clearConversationsButton.addEventListener("click", clearConversations);

  // Listen for state updates from the background script
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "updateCapturingState") {
      updateButtonStates(message.isCapturing);
    } else if (message.action === "updateTranscriptions") {
      fetchAndRenderTranscriptions();
    }
  });

  // Initial state setup
  chrome.storage.local.get("capturingState", ({ capturingState }) => {
    updateButtonStates(capturingState?.isCapturing || false);
  });

  // Fetch and render transcriptions on popup open
  fetchAndRenderTranscriptions();
  // Observe changes to transcriptions in real-time
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.transcriptions) {
      fetchAndRenderTranscriptions(); // Call function to render transcriptions when they change
    }
  });
});
