// content.js
let isSelecting = false;
let startX, startY;
let selectionBox = null;
let overlay = null;

function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

function initializeSelection() {
  overlay = document.createElement("div");
  overlay.className = "screenshot-overlay";

  selectionBox = document.createElement("div");
  selectionBox.className = "selection-box";

  document.body.appendChild(overlay);
  document.body.appendChild(selectionBox);

  overlay.addEventListener("mousedown", startSelection);
  overlay.addEventListener("mousemove", updateSelection);
  overlay.addEventListener("mouseup", endSelection);

  isSelecting = true;
}

function startSelection(e) {
  e.preventDefault();
  console.log("MOUSE DOWN");

  startX = e.clientX;
  startY = e.clientY;
  selectionBox.style.display = "block";
  selectionBox.style.left = startX + "px";
  selectionBox.style.top = startY + "px";
}

function updateSelection(e) {
  e.preventDefault();

  console.log("MOUSE MOVE");

  if (!startX || !startY) return;

  const currentX = e.clientX;
  const currentY = e.clientY;

  const width = Math.abs(currentX - startX);
  const height = Math.abs(currentY - startY);

  selectionBox.style.width = width + "px";
  selectionBox.style.height = height + "px";
  selectionBox.style.left = (currentX > startX ? startX : currentX) + "px";
  selectionBox.style.top = (currentY > startY ? startY : currentY) + "px";
}

async function endSelection(e) {
  // e.preventDefault();

  console.log("MOUSE UP");
  const rect = selectionBox.getBoundingClientRect();
  await captureSelectedArea(rect);

  // Clean up
  document.querySelector(".screenshot-overlay").remove();
  selectionBox.remove();
  isSelecting = false;
}

async function captureSelectedArea(rect) {
  try {
    overlay.remove();
    selectionBox.remove();
    await delay(1000);
    const response = await chrome.runtime.sendMessage({ msg: "capture_tab" });

    const image = new Image();
    image.src = response.imgSrc;

    image.onload = function () {
      const canvas = document.createElement("canvas");
      const scale = window.devicePixelRatio;

      canvas.width = rect.width * scale;
      canvas.height = rect.height * scale;
      const ctx = canvas.getContext("2d");

      ctx.drawImage(
        image,
        rect.left * scale,
        rect.top * scale,
        rect.width * scale,
        rect.height * scale,
        0,
        0,
        rect.width * scale,
        rect.height * scale
      );

      const croppedImage = canvas.toDataURL();
      displayScreenshot(croppedImage);
    };
  } catch (error) {
    console.error("Capture error:", error);
  }
}

function displayScreenshot(imageData) {
  const container = document.createElement("div");
  container.className = "screenshot-container";

  const closeButton = document.createElement("button");
  closeButton.textContent = "×";
  closeButton.className = "screenshot-close";
  closeButton.onclick = () => container.remove();

  const img = document.createElement("img");
  img.src = imageData;
  img.className = "screenshot-image";

  // Make container draggable
  container.draggable = true;
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;

  container.addEventListener("mousedown", dragStart);
  document.addEventListener("mousemove", drag);
  document.addEventListener("mouseup", dragEnd);

  function dragStart(e) {
    if (e.target === closeButton) return;
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
    if (e.target === container || e.target === img) {
      isDragging = true;
    }
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;
      xOffset = currentX;
      yOffset = currentY;

      container.style.transform = `translate(${currentX}px, ${currentY}px)`;
    }
  }

  function dragEnd() {
    initialX = currentX;
    initialY = currentY;
    isDragging = false;
  }

  container.appendChild(closeButton);
  container.appendChild(img);
  document.body.appendChild(container);
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "START_SELECTION" && !isSelecting) {
    initializeSelection();
  }
  return true;
});
