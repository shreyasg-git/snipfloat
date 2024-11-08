// background.js
async function captureFullTab(tab) {
  try {
    const imageData = await chrome.tabs.captureVisibleTab(null, {
      format: "jpeg",
      quality: 100,
    });
    return imageData;
  } catch (error) {
    console.error("Screenshot capture error:", error);
    throw error;
  }
}

// !TODO fixing this next
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

// IT STARTS HERE
// TAKE SS ON INITIALIZATION ONLY, AND THEN SEND IT
chrome.commands.onCommand.addListener((command, tab) => {
  console.log("COMMAND");
  if (command === "take-screenshot") {
    console.log("COMMAND :: SS");

    chrome.tabs.query(
      { active: true, lastFocusedWindow: true, currentWindow: true },
      async function (tabs) {
        console.log("COMMAND :: SS :: TAB QUERY");

        var url = tabs[0].url;
        console.log(url);
        const imgData = await captureFullTab(tabs[0]);
        chrome.tabs.sendMessage(tab.id, {
          type: "START_SELECTION",
          data: imgData,
        });
      }
    );
    // why and when did I add this idk
    // chrome.tabs.onActivated.addListener((activeInfo) => {
    //   console.log("COMMAND :: SS :: onActive");
    // });
  }
});

// chrome.runtime.onInstalled.addListener(() => {
//   chrome.contextMenus.create({
//     id: "takeScreenshot",
//     title: "Take Screenshot",
//     contexts: ["page"],
//   });
// });
