// DOM Elements: Canvas aur workspace container
const canvas = document.querySelector(".canvas");
const workspace = document.querySelector("#workspaceContainer");

// Left Panel: Element creation aur management buttons
const addRectBtn = document.querySelector("#addRectBtn");
const addTextBtn = document.querySelector("#addTextBtn");
const removeBtn = document.querySelector("#removeBtn");

// Floating Toolbar: Top tools (Select, Hand, Rectangle, Text)
const toolSelect = document.querySelector("#toolSelect");
const toolHand = document.querySelector("#toolHand");
const toolRect = document.querySelector("#toolRect");
const toolText = document.querySelector("#toolText");

// Layers Panel: Element list aur ordering controls
const layersList = document.querySelector("#layersList");
const moveUpBtn = document.querySelector("#moveUpBtn");
const moveDownBtn = document.querySelector("#moveDownBtn");

// Properties Panel: Selected element ki details
const propX = document.querySelector("#propX");
const propY = document.querySelector("#propY");
const propW = document.querySelector("#propW");
const propH = document.querySelector("#propH");
const propRotate = document.querySelector("#propRotate");
const propColor = document.querySelector("#propColor");
const propText = document.querySelector("#propText");
const textOnlyContainer = document.querySelector("#textOnlyProperty");

// Constants: localStorage key aur minimum element size
const STORAGE_KEY = "mini-figma-canvas";
const MIN_SIZE = 20;

// State: Current tool mode ('select' = elements edit, 'hand' = canvas pan)
let currentMode = "select";
let selectedElement = null;
let layers = []; // Bottom to top order (index 0 = bottom)
let elementCounter = 0; // Unique ID generator

// Interaction Flags: Ek time me sirf ek action active
let isDragging = false;
let isResizing = false;
let isRotating = false;
let currentHandle = null; // Kaunsa resize handle pakda hai

// Hand Tool State: Canvas panning ke liye
let isPanning = false;
let startPanX = 0;
let startPanY = 0;
let startScrollLeft = 0;
let startScrollTop = 0;

// Transformation State: Mouse events ke liye snapshot values
let offsetX = 0; // Drag: mouse aur element ke beech ka gap
let offsetY = 0;
let startMouseX = 0; // Resize/Rotate start position
let startMouseY = 0;
let startWidth = 0; // Resize start ke time element ka size
let startHeight = 0;
let startLeft = 0; // Resize start ke time element ki position
let startTop = 0;
let startAngle = 0; // Rotation start angle
let currentRotation = 0; // Element ka current rotation

/**
 * Tool Mode Switch: Select aur Hand tool ke beech toggle
 * 
 * Select Mode: Elements ko select, drag, resize, rotate kar sakte hain
 * Hand Mode: Canvas ko pan (scroll) kar sakte hain
 * 
 * Hand mode me automatically element deselect ho jata hai
 */
function setMode(mode) {
  currentMode = mode;

  if (mode === "select") {
    // Select mode UI: blue highlight aur normal cursor
    toolSelect.classList.add("active");
    toolHand.classList.remove("active");
    workspace.classList.remove("hand-mode");
  } else {
    // Hand mode UI: blue highlight aur grab cursor
    toolHand.classList.add("active");
    toolSelect.classList.remove("active");
    workspace.classList.add("hand-mode");

    // Hand mode me elements interact nahi karte, so deselect karo
    if (selectedElement) deselect();
  }
}

// Toolbar Tool Selection
toolSelect.onclick = () => setMode("select");
toolHand.onclick = () => setMode("hand");

// Quick Creation Tools: Toolbar se direct element add (auto-switch to select mode)
toolRect.onclick = () => {
  setMode("select"); // Pehle select mode me aao
  createRectangle();
};

toolText.onclick = () => {
  setMode("select");
  createText();
};

// RGB to Hex Converter: CSS computed colors ko color picker format me
function rgbToHex(rgb) {
  const nums = rgb.match(/\d+/g); // "rgb(255, 0, 0)" se [255, 0, 0]
  if (!nums) return "#000000";

  // Har number ko hex me convert aur pad karo (e.g., 5 -> "05")
  return (
    "#" + nums.map((n) => parseInt(n).toString(16).padStart(2, "0")).join("")
  );
}

// Clamp: Value ko range ke andar constraint karta hai
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// Deselect: Element ko deselect karke sab cleanup
function deselect() {
  if (selectedElement) {
    selectedElement.classList.remove("selected"); // Yellow border hata do
    removeControls(selectedElement); // Handles remove
    selectedElement = null;
    renderLayersPanel(); // Active highlight hata do

    // Properties panel clear karo
    [propX, propY, propW, propH, propRotate, propText].forEach(
      (i) => (i.value = "")
    );
    textOnlyContainer.style.display = "none";
  }
}

/**
 * Add Controls: Selected element ke around interactive handles inject karta hai
 * 
 * Creates:
 * - 4 corner resize handles (blue squares)
 * - 1 top-center rotate handle (blue circle)
 * 
 * Har handle apna mousedown listener rakhta hai jo appropriate mode activate karta hai
 */
function addControls(element) {
  // 4 Corners: Resize handles
  const positions = ["top-left", "top-right", "bottom-left", "bottom-right"];

  positions.forEach((pos) => {
    const handle = document.createElement("div");
    handle.classList.add("resize-handle", pos);

    handle.addEventListener("mousedown", (e) => {
      if (currentMode === "hand") return; // Hand mode me resize disabled

      e.stopPropagation(); // Element ka drag event trigger na ho
      e.preventDefault();

      // Resize mode activate aur snapshot store
      isResizing = true;
      isDragging = false;
      isRotating = false;
      currentHandle = pos; // Kaunsa corner pakda

      // Start state store (mousemove me delta calculate karne ke liye)
      startMouseX = e.clientX;
      startMouseY = e.clientY;
      startWidth = element.offsetWidth;
      startHeight = element.offsetHeight;
      startLeft = element.offsetLeft;
      startTop = element.offsetTop;
    });

    element.appendChild(handle);
  });

  // Rotate Handle: Top-center pe orange circle
  const rotateHandle = document.createElement("div");
  rotateHandle.classList.add("rotate-handle");

  rotateHandle.addEventListener("mousedown", (e) => {
    if (currentMode === "hand") return;

    e.stopPropagation();
    e.preventDefault();

    // Rotation mode activate
    isRotating = true;
    isDragging = false;
    isResizing = false;

    // Element ke center se mouse ka angle calculate (trigonometry)
    const rect = element.getBoundingClientRect();
    const cx = rect.left + rect.width / 2; // Center X
    const cy = rect.top + rect.height / 2; // Center Y

    // atan2: angle between two points (-180 to 180 degrees)
    const radians = Math.atan2(e.clientY - cy, e.clientX - cx);
    startAngle = radians * (180 / Math.PI); // Radians to degrees
    currentRotation = parseFloat(element.dataset.rotation || 0);
  });

  element.appendChild(rotateHandle);
}

// Remove Controls: Saare handles DOM se hata do
function removeControls(element) {
  element
    .querySelectorAll(".resize-handle, .rotate-handle")
    .forEach((h) => h.remove());
}

/**
 * Select Element: Element ko select karke UI update
 * 
 * Steps:
 * 1. Purana element deselect (agar koi tha)
 * 2. Naya element ko "selected" class de do (yellow border)
 * 3. Rotation restore karo (dataset se)
 * 4. Control handles inject karo
 * 5. Layers panel aur properties panel update karo
 */
function selectElement(element) {
  if (currentMode === "hand") return; // Hand mode me selection nahi hoti

  // Cleanup previous selection
  if (selectedElement) {
    selectedElement.classList.remove("selected");
    removeControls(selectedElement);
  }

  // Set new selection
  selectedElement = element;
  selectedElement.classList.add("selected");

  // Rotation persistence: dataset se restore
  if (!selectedElement.dataset.rotation) {
    selectedElement.dataset.rotation = 0;
  }
  selectedElement.style.transform = `rotate(${selectedElement.dataset.rotation}deg)`;

  // UI updates
  addControls(selectedElement);
  renderLayersPanel();
  updatePropertiesPanel();
}

// Properties Panel Update: Selected element ke values ko inputs me populate
function updatePropertiesPanel() {
  if (!selectedElement) return;

  // Position aur dimensions
  propX.value = parseInt(selectedElement.style.left) || 0;
  propY.value = parseInt(selectedElement.style.top) || 0;
  propW.value = parseInt(selectedElement.style.width) || 0;
  propH.value = parseInt(selectedElement.style.height) || 0;
  propRotate.value = parseFloat(selectedElement.dataset.rotation || 0);

  // Color: Computed style ko hex me convert
  propColor.value = rgbToHex(getComputedStyle(selectedElement).backgroundColor);

  // Text-specific property: Conditional visibility
  if (selectedElement.dataset.type === "text") {
    textOnlyContainer.style.display = "block";
    propText.value = selectedElement.textContent;
  } else {
    textOnlyContainer.style.display = "none";
  }
}

/**
 * Base Element Creator: Rectangle aur Text dono ke liye common setup
 * 
 * Creates:
 * - Unique ID wala div element
 * - Random position (canvas ke andar)
 * - Dataset me type store
 * - Mousedown listener (select + drag initiate)
 * 
 * Returns: Configured element (abhi canvas me add nahi hua)
 */
function createBaseElement(type, width, height) {
  const el = document.createElement("div");

  // Unique ID: element-1, element-2, etc.
  elementCounter++;
  el.id = `element-${elementCounter}`;
  el.dataset.type = type; // "rectangle" or "text"

  // Random spawn position (overlapping avoid karne ke liye)
  const maxX = canvas.clientWidth - width;
  const maxY = canvas.clientHeight - height;
  el.style.left = `${Math.random() * maxX}px`;
  el.style.top = `${Math.random() * maxY}px`;
  el.style.width = `${width}px`;
  el.style.height = `${height}px`;

  // Interaction: Select + Drag start
  el.addEventListener("mousedown", (e) => {
    if (currentMode === "hand") return; // Hand mode me elements interact nahi karte

    // Handle clicks ko ignore karo (resize/rotate ke liye)
    if (
      isResizing ||
      isRotating ||
      e.target.classList.contains("resize-handle") ||
      e.target.classList.contains("rotate-handle")
    )
      return;

    e.stopPropagation(); // Canvas click event trigger na ho
    selectElement(el);
    isDragging = true;

    // Offset calculate: Mouse ko element ke exactly click point pe pakde rakhne ke liye
    const rect = el.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
  });

  return el;
}

// Rectangle Creation: 80x80 dark square
function createRectangle() {
  const r = createBaseElement("rectangle", 80, 80);
  r.classList.add("rect"); // CSS styling ke liye
  canvas.appendChild(r);
  layers.push(r); // Top-most layer ban gaya

  updateZIndexes();
  syncDOMOrder();
  renderLayersPanel();
  saveToLocalStorage();
}

/**
 * Auto Resize Text: Text box ki height ko content ke according adjust
 * 
 * Pehle height auto karo, phir scrollHeight se actual required height set karo
 */
function autoResizeText(el) {
  el.style.height = "auto"; // Reset to recalculate
  el.style.height = el.scrollHeight + "px"; // Set to content height
}

/**
 * Text Creation: Editable text box with auto-resize
 * 
 * Features:
 * - contentEditable = true (direct text editing)
 * - Auto-resize on input
 * - Focus pe drag disable (typing conflict avoid)
 */
function createText() {
  const t = createBaseElement("text", 120, 40);
  t.classList.add("text-box");
  t.textContent = "Text";
  t.contentEditable = true; // Direct editing enable
  
  // Focus pe drag disable (warna typing ke time element move hoga)
  t.addEventListener("focus", () => {
    isDragging = false;
  });

  t.spellcheck = false; // Browser ka red underline disable
  canvas.appendChild(t);
  layers.push(t);

  // Live auto-resize aur auto-save
  t.addEventListener("input", () => {
    autoResizeText(t);
    updatePropertiesPanel();
    saveToLocalStorage();
  });

  updateZIndexes();
  syncDOMOrder();
  renderLayersPanel();
  saveToLocalStorage();
}

/**
 * Layers Panel Render: UI list ko layers array ke saath sync
 * 
 * Important: Array reverse karte hain kyunki:
 * - layers[0] = bottom-most (sabse neeche)
 * - layers[last] = top-most (sabse upar)
 * But UI me top element upar dikhana chahiye
 */
function renderLayersPanel() {
  layersList.innerHTML = ""; // Clear existing list

  [...layers].reverse().forEach((el) => {
    const item = document.createElement("div");
    item.className = "layer-item";
    item.textContent = el.id; // "element-1", "element-2", etc.

    // Active state: Selected element ko highlight
    if (el === selectedElement) {
      item.classList.add("active");
    }

    // Click handler: Select mode me switch karke element select
    item.onclick = () => {
      setMode("select");
      selectElement(el);
    };

    layersList.appendChild(item);
  });
}

// Sync DOM Order: Layers array ke order me elements ko canvas me re-append
// appendChild existing element ko move karta hai (duplicate nahi banata)
function syncDOMOrder() {
  layers.forEach((el) => canvas.appendChild(el));
}

// Update Z-Index: Array index ke basis par explicit z-index set
function updateZIndexes() {
  layers.forEach((el, i) => {
    el.style.zIndex = i + 1; // 0-based index, 1-based z-index
  });
}

/**
 * Save to LocalStorage: Canvas state ko browser memory me persist
 * 
 * Saves:
 * - Har element ki position, size, rotation
 * - Background color
 * - Text content (for text elements)
 * 
 * JSON format me store hota hai
 */
function saveToLocalStorage() {
  const data = layers.map((el) => ({
    id: el.id,
    type: el.dataset.type,
    x: parseInt(el.style.left),
    y: parseInt(el.style.top),
    width: parseInt(el.style.width),
    height: parseInt(el.style.height),
    rotation: parseFloat(el.dataset.rotation || 0),
    color: el.style.backgroundColor || "",
    text: el.dataset.type === "text" ? el.textContent : "",
  }));

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * Load from LocalStorage: Previous session restore
 * 
 * Steps:
 * 1. Check if data exists
 * 2. Clear current canvas
 * 3. Recreate elements from saved data
 * 4. Restore all properties (position, size, rotation, color, text)
 * 5. Update counter to avoid ID conflicts
 */
function loadFromLocalStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return; // No saved data

  const data = JSON.parse(raw);

  // Clear current state
  layers.forEach((el) => el.remove());
  layers = [];
  selectedElement = null;
  elementCounter = 0;

  // Recreate saved elements
  data.forEach((item) => {
    // Counter sync: Ensure new elements get unique IDs
    const idNum = parseInt(item.id.split("-")[1]);
    if (idNum > elementCounter) elementCounter = idNum;

    // Create element with saved dimensions
    const el = createBaseElement(item.type, item.width, item.height);
    el.id = item.id; // Restore original ID

    // Restore position and size
    el.style.left = item.x + "px";
    el.style.top = item.y + "px";
    el.style.width = item.width + "px";
    el.style.height = item.height + "px";

    // Restore rotation
    el.dataset.rotation = item.rotation;
    el.style.transform = `rotate(${item.rotation}deg)`;

    // Type-specific restoration
    if (item.type === "rectangle") {
      el.classList.add("rect");
      if (item.color) el.style.backgroundColor = item.color;
    }

    if (item.type === "text") {
      el.classList.add("text-box");
      el.textContent = item.text;

      // Re-enable editing features
      el.contentEditable = true;
      el.spellcheck = false;

      if (item.color) el.style.backgroundColor = item.color;

      autoResizeText(el); // Adjust height to content
    }

    canvas.appendChild(el);
    layers.push(el);
  });

  updateZIndexes();
  syncDOMOrder();
  renderLayersPanel();
}

// Export JSON: Canvas data ko downloadable file me
function exportJSON() {
  const data = layers.map((el) => ({
    id: el.id,
    type: el.dataset.type,
    x: parseInt(el.style.left),
    y: parseInt(el.style.top),
    width: parseInt(el.style.width),
    height: parseInt(el.style.height),
    rotation: parseFloat(el.dataset.rotation || 0),
    color: el.style.backgroundColor || "",
    text: el.dataset.type === "text" ? el.textContent : "",
  }));

  // Blob create karke download trigger
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "export.json";
  a.click();
  URL.revokeObjectURL(url); // Memory cleanup
}

/**
 * Export HTML: Canvas ko standalone HTML file me convert
 * 
 * Creates:
 * - Complete HTML document
 * - Inline styles for all elements
 * - No external dependencies
 * - Browser me direct open ho sakti hai
 */
function exportHTML() {
  let htmlElements = "";

  // Har element ke liye inline-styled div
  layers.forEach((el) => {
    const style =
      `position:absolute;` +
      `left:${el.style.left};` +
      `top:${el.style.top};` +
      `width:${el.style.width};` +
      `height:${el.style.height};` +
      `background:${el.style.backgroundColor || "transparent"};` +
      `transform:rotate(${el.dataset.rotation || 0}deg);` +
      `transform-origin:center center;` +
      `display:flex;` +
      `align-items:center;` +
      `justify-content:center;` +
      `color:#30364F;` +
      `border:1px solid #ACBAC4;` +
      `box-sizing:border-box;` +
      `font-family:sans-serif;`;

    htmlElements +=
      el.dataset.type === "text"
        ? `<div style="${style}">${el.textContent}</div>`
        : `<div style="${style}"></div>`;
  });

  // Complete HTML document structure
  const html = `<!doctype html>
    <html>
    <body style="margin:0;padding:40px;background:#f0f0f0;display:flex;justify-content:center">
      <div style="position:relative;width:${canvas.clientWidth}px;height:${canvas.clientHeight}px;background:#fff;box-shadow:0 0 20px rgba(0,0,0,0.1)">
        ${htmlElements}
      </div>
    </body>
    </html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "export.html";
  a.click();
  URL.revokeObjectURL(url);
}

// Left Panel Buttons
addRectBtn.onclick = createRectangle;
addTextBtn.onclick = createText;

// Remove Button: Selected element delete
removeBtn.onclick = () => {
  if (!selectedElement) return;

  layers = layers.filter((el) => el !== selectedElement);
  removeControls(selectedElement);
  selectedElement.remove();
  selectedElement = null;

  updateZIndexes();
  syncDOMOrder();
  renderLayersPanel();
  saveToLocalStorage();
};

// Move Up: Element ko forward layer me (higher z-index)
moveUpBtn.onclick = () => {
  if (!selectedElement) return;

  const i = layers.indexOf(selectedElement);
  if (i < layers.length - 1) {
    // Swap with next element
    [layers[i], layers[i + 1]] = [layers[i + 1], layers[i]];
    updateZIndexes();
    syncDOMOrder();
    renderLayersPanel();
    saveToLocalStorage();
  }
};

// Move Down: Element ko backward layer me (lower z-index)
moveDownBtn.onclick = () => {
  if (!selectedElement) return;

  const i = layers.indexOf(selectedElement);
  if (i > 0) {
    // Swap with previous element
    [layers[i], layers[i - 1]] = [layers[i - 1], layers[i]];
    updateZIndexes();
    syncDOMOrder();
    renderLayersPanel();
    saveToLocalStorage();
  }
};

// Properties Panel: Live sync inputs (immediate update + auto-save)
propX.oninput = () => {
  if (!selectedElement) return;
  selectedElement.style.left = propX.value + "px";
  saveToLocalStorage();
};

propY.oninput = () => {
  if (!selectedElement) return;
  selectedElement.style.top = propY.value + "px";
  saveToLocalStorage();
};

propW.oninput = () => {
  if (!selectedElement) return;
  selectedElement.style.width = Math.max(propW.value, MIN_SIZE) + "px";
  saveToLocalStorage();
};

propH.oninput = () => {
  if (!selectedElement) return;
  selectedElement.style.height = Math.max(propH.value, MIN_SIZE) + "px";
  saveToLocalStorage();
};

propRotate.oninput = () => {
  if (!selectedElement) return;
  selectedElement.dataset.rotation = propRotate.value;
  selectedElement.style.transform = `rotate(${propRotate.value}deg)`;
  saveToLocalStorage();
};

propColor.oninput = () => {
  if (!selectedElement) return;
  selectedElement.style.backgroundColor = propColor.value;
  saveToLocalStorage();
};

propText.oninput = () => {
  if (!selectedElement) return;
  if (selectedElement.dataset.type === "text") {
    selectedElement.textContent = propText.value;
    saveToLocalStorage();
  }
};

// Workspace Mousedown: Hand tool panning initiate
workspace.addEventListener("mousedown", (e) => {
  if (currentMode === "hand") {
    isPanning = true;
    startPanX = e.clientX;
    startPanY = e.clientY;
    startScrollLeft = workspace.scrollLeft;
    startScrollTop = workspace.scrollTop;
    workspace.style.cursor = "grabbing";
  }
});

/**
 * Global Mousemove: Sabse important event handler
 * 
 * Handles 4 different modes:
 * 1. Panning (Hand Tool): Workspace scroll
 * 2. Rotation: Element ko center ke around rotate
 * 3. Resize: Element ka size change (corner handle ke basis par)
 * 4. Drag: Element ko move karna
 * 
 * Priority order me check hota hai
 */
document.addEventListener("mousemove", (e) => {
  // Mode 1: Hand Tool - Workspace Panning
  if (isPanning) {
    const dx = e.clientX - startPanX;
    const dy = e.clientY - startPanY;
    workspace.scrollLeft = startScrollLeft - dx;
    workspace.scrollTop = startScrollTop - dy;
    return; // Early exit
  }

  // Baaki modes ke liye element selected hona zaruri
  if (!selectedElement) return;

  const canvasRect = canvas.getBoundingClientRect();

  // Mode 2: Rotation
  if (isRotating) {
    const rect = selectedElement.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    // Current mouse angle calculate
    const radians = Math.atan2(e.clientY - cy, e.clientX - cx);
    
    // Final angle = previous rotation + delta
    const finalAngle =
      currentRotation + (radians * (180 / Math.PI) - startAngle);

    selectedElement.style.transform = `rotate(${finalAngle}deg)`;
    selectedElement.dataset.rotation = finalAngle;
    updatePropertiesPanel();
  }
  // Mode 3: Resize
  else if (isResizing) {
    const dx = e.clientX - startMouseX; // Mouse movement X
    const dy = e.clientY - startMouseY; // Mouse movement Y

    let nw = startWidth;
    let nh = startHeight;
    let nl = startLeft;
    let nt = startTop;

    // Handle-specific calculations (har corner ka alag logic)
    if (currentHandle === "bottom-right") {
      // Right-bottom: sirf size badhta hai
      nw += dx;
      nh += dy;
    } else if (currentHandle === "bottom-left") {
      // Left-bottom: width + left adjust, height badhta hai
      nw -= dx;
      nl += dx;
      nh += dy;
    } else if (currentHandle === "top-right") {
      // Right-top: width badhta hai, height + top adjust
      nw += dx;
      nh -= dy;
      nt += dy;
    } else if (currentHandle === "top-left") {
      // Left-top: sab adjust hota hai
      nw -= dx;
      nl += dx;
      nh -= dy;
      nt += dy;
    }

    // Minimum size enforcement
    nw = Math.max(nw, MIN_SIZE);
    nh = Math.max(nh, MIN_SIZE);

    selectedElement.style.width = nw + "px";
    selectedElement.style.height = nh + "px";
    selectedElement.style.left = nl + "px";
    selectedElement.style.top = nt + "px";
    updatePropertiesPanel();
  }
  // Mode 4: Drag
  else if (isDragging) {
    let newLeft = e.clientX - canvasRect.left - offsetX;
    let newTop = e.clientY - canvasRect.top - offsetY;

    // Soft boundaries: Element partially canvas se bahar ja sakta hai (10px visible minimum)
    const minLeft = -selectedElement.offsetWidth + 10;
    const maxLeft = canvas.clientWidth - 10;
    const minTop = -selectedElement.offsetHeight + 10;
    const maxTop = canvas.clientHeight - 10;

    newLeft = Math.max(minLeft, Math.min(newLeft, maxLeft));
    newTop = Math.max(minTop, Math.min(newTop, maxTop));

    selectedElement.style.left = newLeft + "px";
    selectedElement.style.top = newTop + "px";
    updatePropertiesPanel();
  }
});

/**
 * Global Mouseup: Saare interaction modes reset + auto-save
 * 
 * Agar koi transformation hua tha (drag/resize/rotate) to localStorage me save karo
 */
document.addEventListener("mouseup", () => {
  // Auto-save on transformation complete
  if (isDragging || isResizing || isRotating) {
    saveToLocalStorage();
  }

  // Reset all flags
  isDragging = false;
  isResizing = false;
  isRotating = false;
  currentHandle = null;

  isPanning = false;
  workspace.style.cursor = currentMode === "hand" ? "grab" : "default";
});

// Canvas Click: Deselect element (sirf select mode me)
canvas.onclick = (e) => {
  if (currentMode === "select" && e.target === canvas) {
    deselect();
  }
};

/**
 * Global Keyboard Shortcuts
 * 
 * Important: Input field detection to prevent conflicts
 * Agar user properties panel me typing kar raha hai to shortcuts disable
 * 
 * Shortcuts:
 * - ESC: Deselect
 * - Delete/Backspace: Remove element
 * - Arrow Keys: Nudge element (5px steps)
 */
document.addEventListener("keydown", (e) => {
  // CRITICAL: Check if user is typing in an input field
  // Prevent shortcuts when editing text
  const active = document.activeElement;

  if (
    active.tagName === "INPUT" ||
    active.tagName === "TEXTAREA" ||
    active.isContentEditable
  ) {
    return; // User typing kar raha hai, shortcuts disable
  }

  // ESC: Deselect current element
  if (e.key === "Escape") {
    deselect();
  }

  // Delete/Backspace: Remove selected element
  if (e.key === "Delete" || e.key === "Backspace") {
    removeBtn.click();
  }

  // Arrow keys ke liye element selected hona zaruri
  if (!selectedElement) return;

  // Nudge amount: 5 pixels per keypress
  const STEP = 5;
  let left = selectedElement.offsetLeft;
  let top = selectedElement.offsetTop;

  // Direction mapping
  switch (e.key) {
    case "ArrowLeft":
      left -= STEP;
      break;
    case "ArrowRight":
      left += STEP;
      break;
    case "ArrowUp":
      top -= STEP;
      break;
    case "ArrowDown":
      top += STEP;
      break;
    default:
      return; // Other keys ignore
  }

  e.preventDefault(); // Page scroll prevent

  // Clamp to canvas boundaries
  left = clamp(left, 0, canvas.clientWidth - selectedElement.offsetWidth);
  top = clamp(top, 0, canvas.clientHeight - selectedElement.offsetHeight);

  // Apply new position
  selectedElement.style.left = left + "px";
  selectedElement.style.top = top + "px";
  updatePropertiesPanel();
  saveToLocalStorage();
});

// Page Load: Previous session restore
loadFromLocalStorage();
