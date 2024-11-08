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

async function initialize(tab, imgData = null) {
  // console.log("initialize");

  if (!imgData) {
    const imgData = await captureFullTab(tab);
    chrome.tabs.sendMessage(tab.id, {
      type: "START_SELECTION",
      data: imgData,
    });
  } else {
    chrome.tabs.sendMessage(tab.id, {
      type: "DIRECT_FLOAT",
      data: imgData,
    });
  }
}

// !TODO fixing this next
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "takeFloatingSS",
    title: "Take Floating Screenshot",
    contexts: ["page"],
  });

  chrome.contextMenus.create({
    id: "floatImg",
    title: "Float Image",
    contexts: ["image"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "takeFloatingSS") {
    initialize(tab);
  } else if (info.menuItemId === "floatImg") {
    // console.log("INFOO", info.srcUrl);
    initialize(tab, info.srcUrl);
  }
});

// IT STARTS HERE
// TAKE SS ON INITIALIZATION ONLY, AND THEN SEND IT
chrome.commands.onCommand.addListener((command, tab) => {
  console.log("COMMAND");
  if (command === "take-screenshot") {
    // console.log("COMMAND :: SS");
    initialize(tab);

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
