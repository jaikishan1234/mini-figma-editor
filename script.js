// Canvas aur main buttons ko DOM se pakad rahe hain
const canvas = document.querySelector(".canvas");
const addRectBtn = document.querySelector("#addRectBtn");
const addTextBtn = document.querySelector("#addTextBtn");
const removeBtn = document.querySelector("#removeBtn");

// Layers panel ke elements
const layersList = document.querySelector("#layersList");
const moveUpBtn = document.querySelector("#moveUpBtn");
const moveDownBtn = document.querySelector("#moveDownBtn");

// Properties panel ke saare input fields (HTML IDs se match karte hain)
const propX = document.querySelector("#propX");
const propY = document.querySelector("#propY");
const propW = document.querySelector("#propW");
const propH = document.querySelector("#propH");
const propRotate = document.querySelector("#propRotate");
const propColor = document.querySelector("#propColor");
const propText = document.querySelector("#propText");
const textOnlyContainer = document.querySelector("#textOnlyProperty");

// Currently selected element (null = koi nahi)
let selectedElement = null;

// Mouse interaction flags - ek time me sirf ek true
let isDragging = false;
let isResizing = false;
let isRotating = false;

// Resize ke time kaunsa corner handle use ho raha hai
let currentHandle = null;

// Drag ke liye mouse aur element ke beech ka offset
let offsetX = 0;
let offsetY = 0;

// Resize start ke time ka snapshot
let startMouseX = 0;
let startMouseY = 0;
let startWidth = 0;
let startHeight = 0;
let startLeft = 0;
let startTop = 0;

// Rotation tracking variables
let startAngle = 0;
let currentRotation = 0;

// Unique ID counter (element-1, element-2, etc.)
let elementCounter = 0;

// Minimum size taaki element invisible na ho
const MIN_SIZE = 20;

// Layers array: index 0 = bottom, last = top
let layers = [];

// RGB string ko hex format me convert karta hai (e.g., "rgb(255, 0, 0)" → "#ff0000")
function rgbToHex(rgb) {
  const nums = rgb.match(/\d+/g); // saare numbers extract karo
  if (!nums) return "#000000"; // agar nahi mila to black return karo
  return (
    "#" +
    nums.map((n) => parseInt(n).toString(16).padStart(2, "0")).join("")
  );
}

// Selected element ke around resize aur rotate handles add karta hai
function addControls(element) {
  // 4 corners ke resize handles
  const positions = ["top-left", "top-right", "bottom-left", "bottom-right"];

  positions.forEach((pos) => {
    const handle = document.createElement("div");
    handle.classList.add("resize-handle", pos);

    // Resize handle pe mouse down = resize mode start
    handle.addEventListener("mousedown", (e) => {
      e.stopPropagation(); // parent element ka event block karo
      e.preventDefault();

      isResizing = true;
      isDragging = false;
      isRotating = false;

      currentHandle = pos; // kaunsa corner pakda hai

      // Start position aur size store karo
      startMouseX = e.clientX;
      startMouseY = e.clientY;
      startWidth = element.offsetWidth;
      startHeight = element.offsetHeight;
      startLeft = element.offsetLeft;
      startTop = element.offsetTop;
    });

    element.appendChild(handle);
  });

  // Rotate handle top-center pe
  const rotateHandle = document.createElement("div");
  rotateHandle.classList.add("rotate-handle");

  rotateHandle.addEventListener("mousedown", (e) => {
    e.stopPropagation();
    e.preventDefault();

    isRotating = true;
    isDragging = false;
    isResizing = false;

    // Element ke center se mouse ka angle nikalo
    const rect = element.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const radians = Math.atan2(e.clientY - cy, e.clientX - cx);
    startAngle = radians * (180 / Math.PI); // radians → degrees

    currentRotation = parseFloat(element.dataset.rotation || 0);
  });

  element.appendChild(rotateHandle);
}

// Saare control handles remove karta hai
function removeControls(element) {
  element
    .querySelectorAll(".resize-handle, .rotate-handle")
    .forEach((h) => h.remove());
}

// Element select karne ka main function
function selectElement(element) {
  // Purana element deselect karo
  if (selectedElement) {
    selectedElement.classList.remove("selected");
    removeControls(selectedElement);
  }

  // Naya element select karo
  selectedElement = element;
  selectedElement.classList.add("selected");

  // Rotation restore karo
  if (!selectedElement.dataset.rotation) {
    selectedElement.dataset.rotation = 0;
  }

  selectedElement.style.transform = `rotate(${selectedElement.dataset.rotation}deg)`;

  addControls(selectedElement);
  renderLayersPanel(); // layers panel update
  updatePropertiesPanel(); // properties panel update
}

// Properties panel ko selected element ke values se populate karta hai
function updatePropertiesPanel() {
  if (!selectedElement) return;

  // Position aur size values set karo
  propX.value = parseInt(selectedElement.style.left) || 0;
  propY.value = parseInt(selectedElement.style.top) || 0;
  propW.value = parseInt(selectedElement.style.width) || 0;
  propH.value = parseInt(selectedElement.style.height) || 0;
  propRotate.value = parseFloat(selectedElement.dataset.rotation || 0);

  // Background color ko hex me convert karke set karo
  propColor.value = rgbToHex(
    getComputedStyle(selectedElement).backgroundColor
  );

  // Text box ke liye text content field show/hide
  if (selectedElement.dataset.type === "text") {
    textOnlyContainer.style.display = "block";
    propText.value = selectedElement.textContent;
  } else {
    textOnlyContainer.style.display = "none";
  }
}

// Rectangle aur Text dono ke liye base element creator
function createBaseElement(type, width, height) {
  const el = document.createElement("div");

  // Unique ID assign
  elementCounter++;
  el.id = `element-${elementCounter}`;
  el.dataset.type = type;

  // Canvas ke andar random position
  const maxX = canvas.clientWidth - width;
  const maxY = canvas.clientHeight - height;

  el.style.left = `${Math.random() * maxX}px`;
  el.style.top = `${Math.random() * maxY}px`;
  el.style.width = `${width}px`;
  el.style.height = `${height}px`;

  // Mouse down = select + drag start
  el.addEventListener("mousedown", (e) => {
    // Handle pe click hai to drag start mat karo
    if (
      isResizing ||
      isRotating ||
      e.target.classList.contains("resize-handle") ||
      e.target.classList.contains("rotate-handle")
    )
      return;

    e.stopPropagation();

    selectElement(el);

    isDragging = true;

    // Mouse offset calculate (taaki element jump na kare)
    const rect = el.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
  });

  return el;
}

// Layers panel render karta hai (top layer upar dikhta hai)
function renderLayersPanel() {
  layersList.innerHTML = "";

  // Array reverse karke loop (UI me top → bottom order)
  [...layers].reverse().forEach((el) => {
    const item = document.createElement("div");
    item.className = "layer-item";
    item.textContent = el.id;

    // Selected element ko highlight karo
    if (el === selectedElement) {
      item.classList.add("active");
    }

    // Layer name pe click = element select
    item.onclick = () => selectElement(el);

    layersList.appendChild(item);
  });
}

// DOM order ko layers array ke saath sync karta hai
function syncDOMOrder() {
  layers.forEach((el) => canvas.appendChild(el));
}

// Z-index explicitly set karta hai (safety)
function updateZIndexes() {
  layers.forEach((el, i) => {
    el.style.zIndex = i + 1; // index 0 = z-index 1, etc.
  });
}

// Rectangle add button
addRectBtn.onclick = () => {
  const r = createBaseElement("rectangle", 80, 80);
  r.classList.add("rect");
  canvas.appendChild(r);

  // Layers system me register
  layers.push(r); // top-most layer ban jayega
  updateZIndexes();
  syncDOMOrder();
  renderLayersPanel();
};

// Text box add button
addTextBtn.onclick = () => {
  const t = createBaseElement("text", 120, 40);
  t.classList.add("text-box");
  t.textContent = "Text Box";
  canvas.appendChild(t);

  // Layers system me register
  layers.push(t);
  updateZIndexes();
  syncDOMOrder();
  renderLayersPanel();
};

// Selected element delete karta hai
removeBtn.onclick = () => {
  if (!selectedElement) return;

  // Layers array se remove
  layers = layers.filter((el) => el !== selectedElement);
  removeControls(selectedElement);
  selectedElement.remove(); // DOM se delete
  selectedElement = null;

  updateZIndexes();
  syncDOMOrder();
  renderLayersPanel();
};

// Global mousemove - drag/resize/rotate yahin handle hota hai
document.addEventListener("mousemove", (e) => {
  if (!selectedElement) return;

  const canvasRect = canvas.getBoundingClientRect();

  // Rotation logic
  if (isRotating) {
    const rect = selectedElement.getBoundingClientRect();
    const cx = rect.left + rect.width / 2; // center X
    const cy = rect.top + rect.height / 2; // center Y

    // Current angle calculate
    const radians = Math.atan2(e.clientY - cy, e.clientX - cx);
    const angle = radians * (180 / Math.PI);

    // Final angle = old rotation + delta
    const finalAngle = currentRotation + (angle - startAngle);

    selectedElement.style.transform = `rotate(${finalAngle}deg)`;
    selectedElement.dataset.rotation = finalAngle;

    updatePropertiesPanel(); // properties panel sync
    return;
  }

  // Resize logic
  if (isResizing) {
    const dx = e.clientX - startMouseX; // X me kitna move
    const dy = e.clientY - startMouseY; // Y me kitna move

    let newW = startWidth;
    let newH = startHeight;
    let newL = startLeft;
    let newT = startTop;

    // Handle ke basis par calculation
    if (currentHandle === "bottom-right") {
      newW += dx;
      newH += dy;
    } else if (currentHandle === "bottom-left") {
      newW -= dx;
      newL += dx;
      newH += dy;
    } else if (currentHandle === "top-right") {
      newW += dx;
      newH -= dy;
      newT += dy;
    } else if (currentHandle === "top-left") {
      newW -= dx;
      newL += dx;
      newH -= dy;
      newT += dy;
    }

    // Minimum size maintain
    newW = Math.max(newW, MIN_SIZE);
    newH = Math.max(newH, MIN_SIZE);

    selectedElement.style.width = `${newW}px`;
    selectedElement.style.height = `${newH}px`;
    selectedElement.style.left = `${newL}px`;
    selectedElement.style.top = `${newT}px`;

    updatePropertiesPanel();
    return;
  }

  // Drag logic
  if (isDragging) {
    const newLeft = e.clientX - canvasRect.left - offsetX;
    const newTop = e.clientY - canvasRect.top - offsetY;

    selectedElement.style.left = `${newLeft}px`;
    selectedElement.style.top = `${newTop}px`;

    updatePropertiesPanel();
  }
});

// Mouse chhodte hi saare modes reset
document.addEventListener("mouseup", () => {
  isDragging = false;
  isResizing = false;
  isRotating = false;
  currentHandle = null;
});

// Canvas pe click = deselect
canvas.onclick = (e) => {
  if (e.target === canvas && selectedElement) {
    selectedElement.classList.remove("selected");
    removeControls(selectedElement);
    selectedElement = null;
    renderLayersPanel();

    // Properties panel clear karo
    propX.value = "";
    propY.value = "";
    propW.value = "";
    propH.value = "";
    propRotate.value = "";
    propColor.value = "#000000";
    propText.value = "";
  }
};

// Properties panel se element update karne ke handlers (live sync)

propX.oninput = () => {
  if (!selectedElement) return;
  selectedElement.style.left = `${propX.value}px`;
};

propY.oninput = () => {
  if (!selectedElement) return;
  selectedElement.style.top = `${propY.value}px`;
};

propW.oninput = () => {
  if (!selectedElement) return;
  selectedElement.style.width = `${Math.max(propW.value, MIN_SIZE)}px`;
};

propH.oninput = () => {
  if (!selectedElement) return;
  selectedElement.style.height = `${Math.max(propH.value, MIN_SIZE)}px`;
};

propRotate.oninput = () => {
  if (!selectedElement) return;
  selectedElement.dataset.rotation = propRotate.value;
  selectedElement.style.transform = `rotate(${propRotate.value}deg)`;
};

propColor.oninput = () => {
  if (!selectedElement) return;
  selectedElement.style.backgroundColor = propColor.value;
};

propText.oninput = () => {
  if (!selectedElement) return;
  if (selectedElement.dataset.type === "text") {
    selectedElement.textContent = propText.value;
  }
};

// Move Up = stacking me aage (higher z-index)
moveUpBtn.onclick = () => {
  if (!selectedElement) return;

  const i = layers.indexOf(selectedElement);
  if (i < layers.length - 1) {
    // Next element ke saath swap
    [layers[i], layers[i + 1]] = [layers[i + 1], layers[i]];
    updateZIndexes();
    syncDOMOrder();
    renderLayersPanel();
  }
};

// Move Down = stacking me peeche (lower z-index)
moveDownBtn.onclick = () => {
  if (!selectedElement) return;

  const i = layers.indexOf(selectedElement);
  if (i > 0) {
    // Previous element ke saath swap
    [layers[i], layers[i - 1]] = [layers[i - 1], layers[i]];
    updateZIndexes();
    syncDOMOrder();
    renderLayersPanel();
  }
};

// Helper function: value ko min aur max ke beech constraint karta hai
// Math.max/min dono use karke boundary check karta hai
// Example: clamp(150, 0, 100) → 100 (max se zyada nahi)
// Example: clamp(-10, 0, 100) → 0 (min se kam nahi)
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// Global keyboard event listener - Delete aur Arrow keys handle karta hai
document.addEventListener("keydown", (e) => {
  // Agar koi element selected nahi hai to keyboard kuch nahi karta
  if (!selectedElement) return;

  // Arrow keys se kitne pixels move karenge (nudge amount)
  const STEP = 5;

  // Canvas aur element ki boundaries nikalo (boundary check ke liye)
  const canvasRect = canvas.getBoundingClientRect();
  const elRect = selectedElement.getBoundingClientRect();

  // Element ki current position store karo
  let left = selectedElement.offsetLeft;
  let top = selectedElement.offsetTop;

  // DELETE ya BACKSPACE key = element delete karo
  if (e.key === "Delete" || e.key === "Backspace") {
    e.preventDefault(); // browser ka default behavior (back page) roko

    // Layers array se element remove
    layers = layers.filter(el => el !== selectedElement);
    removeControls(selectedElement); // handles hata do
    selectedElement.remove(); // DOM se delete
    selectedElement = null; // selection clear

    // Sab sync karo
    updateZIndexes();
    syncDOMOrder();
    renderLayersPanel();

    return; // baaki code skip karo
  }

  // Arrow keys se movement (nudging)
  // Switch statement se key ke basis par position update
  switch (e.key) {
    case "ArrowLeft":
      left -= STEP; // left me 5px move
      break;
    case "ArrowRight":
      left += STEP; // right me 5px move
      break;
    case "ArrowUp":
      top -= STEP; // upar 5px move
      break;
    case "ArrowDown":
      top += STEP; // neeche 5px move
      break;
    default:
      return; // koi aur key hai to ignore karo
  }

  e.preventDefault(); // page scroll nahi hona chahiye

  // Canvas ke andar rehne ke liye position ko clamp karo
  // Left: 0 se lekar (canvas width - element width) tak
  left = clamp(
    left,
    0,
    canvas.clientWidth - selectedElement.offsetWidth
  );

  // Top: 0 se lekar (canvas height - element height) tak
  top = clamp(
    top,
    0,
    canvas.clientHeight - selectedElement.offsetHeight
  );

  // Naya position apply karo
  selectedElement.style.left = `${left}px`;
  selectedElement.style.top = `${top}px`;

  // Properties panel update karo (agar function exist karta hai)
  // Type checking isliye ki error na aaye agar panel nahi hai to
  if (typeof updatePropertiesPanel === "function") {
    updatePropertiesPanel();
  }
});
