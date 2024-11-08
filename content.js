// content.js
let isSelecting = false;
let startX, startY;

let fullImg = null;
let overlay = null;
let cropBox = null;

function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
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
  // e.preventDefault();

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
  cleanupTempEffects();
  cleanupMain();
}

async function captureSelectedArea(rect) {
  try {
    const image = new Image();
    console.log(fullImg);
    image.src = fullImg.src;

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
  img.classList.add("ss-img-hover");

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
  container.addEventListener("mouseup", dragEnd);

  function dragStart(e) {
    e.preventDefault();
    img.classList.remove("ss-img-hover");
    if (e.target === closeButton) return;
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
    if (e.target === container || e.target === img) {
      isDragging = true;
    }
  }

  function drag(e) {
    if (isDragging) {
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;
      xOffset = currentX;
      yOffset = currentY;

      container.style.transform = `translate(${currentX}px, ${currentY}px)`;
    }
  }

  function dragEnd(e) {
    initialX = currentX;
    initialY = currentY;
    isDragging = false;
    img.classList.add("ss-img-hover");
  }

  container.appendChild(closeButton);
  container.appendChild(img);
  document.body.appendChild(container);
}

function cleanupMain() {
  overlay.remove();
  fullImg.remove();
  selectionBox.remove();
  isSelecting = false;
}

/** 3 things - actual image, an overlay with a tint, and then finally the actual cropping rect  */
function overlayAndCropInject(imgData) {
  fullImg = document.createElement("img");
  fullImg.src = imgData;
  fullImg.className = "full-img";

  // console.log(fullImg);

  overlay = document.createElement("div");
  overlay.className = "screenshot-overlay";

  overlay.style.userSelect = "none";
  overlay.draggable = "false";

  selectionBox = document.createElement("div");
  selectionBox.className = "selection-box";

  overlay.addEventListener("mousedown", startSelection);
  overlay.addEventListener("mousemove", updateSelection);
  overlay.addEventListener("mouseup", endSelection);
  selectionBox.addEventListener("mouseup", endSelection);

  document.body.parentNode.appendChild(fullImg);
  document.body.parentNode.appendChild(overlay);
  document.body.parentNode.appendChild(selectionBox);

  isSelecting = true;

  // ! always remember to clean this up
  applyTempEffects();
}

function applyTempEffects() {
  document.body.parentNode.style.overflow = "hidden";
}

function cleanupTempEffects() {
  document.body.parentNode.style.overflow = "visible";
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // console.log("CONTENT :: MSG FROM WORKER", message.data);

  if (message.type === "START_SELECTION" && !isSelecting) {
    // console.log("CONTENT :: MSG FROM WORKER :: START_SELECTION", message.data);

    overlayAndCropInject(message.data);
  }

  if (message.type === "DIRECT_FLOAT" && !isSelecting) {
    displayScreenshot(message.data);
  }
  // return true;
});
