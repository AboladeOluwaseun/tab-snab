document.addEventListener("DOMContentLoaded", function () {
  const transcriptionListContainer = document.getElementById(
    "transcription-container"
  );
  const clearConversationsButton = document.getElementById(
    "clearConversationsButton"
  );
  const startButton = document.getElementById("startCapture");
  const stopButton = document.getElementById("stopCapture");

  // Initial state setup
  chrome.storage.local.get("capturingState", ({ capturingState }) => {
    updateButtonStates(capturingState?.isCapturing || false);
  });

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
    // Update button states
    startButton.disabled = isCapturing;
    stopButton.disabled = !isCapturing;

    // Ensure correct styling by toggling classes
    startButton.classList.toggle("disabled", isCapturing);
    stopButton.classList.toggle("disabled", !isCapturing);
    startButton.classList.toggle("active", !isCapturing);
    stopButton.classList.toggle("active", isCapturing);
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
        revAiToken: CONFIG.REV_AI_API_KEY, // You'll need to add a way to configure this
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

  // Fetch and render transcriptions on popup open
  fetchAndRenderTranscriptions();
  // Observe changes to transcriptions in real-time
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.transcriptions) {
      fetchAndRenderTranscriptions(); // Call function to render transcriptions when they change
    }
  });
});
