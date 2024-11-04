// background.js
async function captureFullTab(tab) {
  try {
    const imageData = await chrome.tabs.captureVisibleTab(null, {
      format: "png",
      quality: 100,
    });
    return imageData;
  } catch (error) {
    console.error("Screenshot capture error:", error);
    throw error;
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg === "capture_tab") {
    captureFullTab(sender.tab).then((imageData) => {
      sendResponse({ imgSrc: imageData });
    });
    return true; // Keep the message channel open for async response
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "takeScreenshot",
    title: "Take Screenshot",
    contexts: ["page"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "takeScreenshot") {
    chrome.tabs.sendMessage(tab.id, { type: "START_SELECTION" });
  }
});

chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "take-screenshot") {
    chrome.tabs.sendMessage(tab.id, { type: "START_SELECTION" });
  }
});
