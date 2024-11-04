async function takeScreenshot(tab) {
  try {
    // First, inject the content script if it hasn't been injected
    await chrome.scripting
      .executeScript({
        target: { tabId: tab.id },
        files: ["content.js"],
      })
      .catch(() => {
        // Script might already be injected, continue
      });

    // Take the screenshot
    const imageData = await chrome.tabs.captureVisibleTab(null, {
      format: "png",
    });

    // Try to send the message to the content script
    try {
      await chrome.tabs.sendMessage(tab.id, {
        type: "DISPLAY_SCREENSHOT",
        imageData: imageData,
      });
    } catch (error) {
      // If sending failed, inject and try again
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"],
      });
      await chrome.tabs.sendMessage(tab.id, {
        type: "DISPLAY_SCREENSHOT",
        imageData: imageData,
      });
    }
  } catch (error) {
    console.error("Screenshot error:", error);
  }
}

// Setup context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "takeScreenshot",
    title: "Take Screenshot",
    contexts: ["page"],
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "takeScreenshot") {
    takeScreenshot(tab);
  }
});

// Handle keyboard shortcut
chrome.commands.onCommand.addListener((command) => {
  if (command === "take-screenshot") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        takeScreenshot(tabs[0]);
      }
    });
  }
});
