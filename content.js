// content.js
let isInitialized = false;

function initializeContentScript() {
  if (isInitialized) return;

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "DISPLAY_SCREENSHOT") {
      displayScreenshot(message.imageData);
      sendResponse({ status: "success" });
    }
    return true; // Keep the message channel open for async response
  });

  isInitialized = true;
}

// take ss
// show it as a still image for cropping
// let the user drag it

function displayScreenshot(imageData) {
  // Remove existing screenshot if present
  const existingContainer = document.querySelector(".screenshot-container");
  if (existingContainer) {
    existingContainer.remove();
  }

  // Create container
  const container = document.createElement("div");
  container.className = "screenshot-container";

  // Create close button
  const closeButton = document.createElement("button");
  closeButton.textContent = "×";
  closeButton.className = "screenshot-close";
  closeButton.onclick = () => container.remove();

  // Create image
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
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;

    if (e.target === container) {
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

  function dragEnd(e) {
    initialX = currentX;
    initialY = currentY;
    isDragging = false;
  }

  // Add elements to container
  container.appendChild(closeButton);
  container.appendChild(img);
  document.body.appendChild(container);
}

// Initialize content script
initializeContentScript();
