// Canvas aur buttons ko DOM se select kar rahe hain
const canvas = document.querySelector(".canvas");
const addRectBtn = document.querySelector("#addRectBtn");
const addTextBtn = document.querySelector("#addTextBtn");
const removeBtn = document.querySelector("#removeBtn");

// Abhi kaunsa element selected hai
let selectedElement = null;

// Interaction states
let isDragging = false;
let isResizing = false;
let isRotating = false;

// Kaunsa resize handle active hai
let currentHandle = null;

// Drag ke liye mouse offset (element ke andar ka gap)
let offsetX = 0;
let offsetY = 0;

// Resize ke start par mouse aur element ka snapshot
let startMouseX = 0;
let startMouseY = 0;
let startWidth = 0;
let startHeight = 0;
let startLeft = 0;
let startTop = 0;

// Rotation ke liye starting angle values
let startAngle = 0;
let currentRotation = 0;

// Unique ID ke liye counter
let elementCounter = 0;

// Minimum size taaki element negative ya invisible na ho
const MIN_SIZE = 20;


/*
  Ye function selected element ke liye
  - 4 resize handles
  - 1 rotate handle
  add karta hai
*/
function addControls(element) {

  // 4 corners ke resize handles
  const positions = ["top-left", "top-right", "bottom-left", "bottom-right"];

  positions.forEach((pos) => {
    const handle = document.createElement("div");
    handle.classList.add("resize-handle", pos);

    // Resize handle pe mouse down ka matlab resize start
    handle.addEventListener("mousedown", (e) => {
      e.stopPropagation();   // drag ya canvas click ko roko
      e.preventDefault();

      // Resize mode ON
      isResizing = true;
      isDragging = false;
      isRotating = false;

      currentHandle = pos;

      // Resize start ke time mouse position store
      startMouseX = e.clientX;
      startMouseY = e.clientY;

      // Resize start ke time element ka size & position store
      startWidth = element.offsetWidth;
      startHeight = element.offsetHeight;
      startLeft = element.offsetLeft;
      startTop = element.offsetTop;
    });

    element.appendChild(handle);
  });

  // Rotation handle
  const rotateHandle = document.createElement("div");
  rotateHandle.classList.add("rotate-handle");

  rotateHandle.addEventListener("mousedown", (e) => {
    e.stopPropagation();
    e.preventDefault();

    // Rotation mode ON
    isRotating = true;
    isDragging = false;
    isResizing = false;

    // Element ke center ka position nikal rahe hain
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Mouse aur center ke beech ka angle
    const radians = Math.atan2(
      e.clientY - centerY,
      e.clientX - centerX
    );

    startAngle = radians * (180 / Math.PI);

    // Agar pehle se rotation hai to usko yaad rakho
    currentRotation = parseFloat(element.dataset.rotation || 0);
  });

  element.appendChild(rotateHandle);
}


// Selected element se saare handles remove karne ke liye
function removeControls(element) {
  element
    .querySelectorAll(".resize-handle, .rotate-handle")
    .forEach((h) => h.remove());
}


/*
  Element select karne ka logic
  - purana deselect
  - naya select
  - rotation restore
*/
function selectElement(element) {
  if (selectedElement) {
    selectedElement.classList.remove("selected");
    removeControls(selectedElement);
  }

  selectedElement = element;
  selectedElement.classList.add("selected");

  // Agar rotation pehle se nahi hai to default 0
  if (!selectedElement.dataset.rotation) {
    selectedElement.dataset.rotation = 0;
  }

  // Saved rotation apply karo
  selectedElement.style.transform =
    `rotate(${selectedElement.dataset.rotation}deg)`;

  addControls(selectedElement);
}


/*
  Rectangle aur Text dono ke liye base element creator
*/
function createBaseElement(type, width, height) {
  const el = document.createElement("div");

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
    // Agar resize/rotate chal raha ho ya handle pe click ho
    if (
      isResizing ||
      isRotating ||
      e.target.classList.contains("resize-handle") ||
      e.target.classList.contains("rotate-handle")
    ) return;

    e.stopPropagation();
    selectElement(el);

    isDragging = true;

    // Mouse aur element ke beech ka offset
    const rect = el.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
  });

  return el;
}


// Buttons
addRectBtn.onclick = () => {
  const r = createBaseElement("rectangle", 80, 80);
  r.classList.add("rect");
  canvas.appendChild(r);
};

addTextBtn.onclick = () => {
  const t = createBaseElement("text", 120, 40);
  t.classList.add("text-box");
  t.textContent = "Text Box";
  canvas.appendChild(t);
};


/*
  Global mousemove
  Yahin drag, resize, rotate sab handle hota hai
*/
document.addEventListener("mousemove", (e) => {
  if (!selectedElement) return;

  const canvasRect = canvas.getBoundingClientRect();

  // ROTATION LOGIC
  if (isRotating) {
    const rect = selectedElement.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const radians = Math.atan2(
      e.clientY - cy,
      e.clientX - cx
    );

    const angle = radians * (180 / Math.PI);
    const finalAngle = currentRotation + (angle - startAngle);

    selectedElement.style.transform =
      `rotate(${finalAngle}deg)`;

    selectedElement.dataset.rotation = finalAngle;
    return;
  }

  // RESIZE LOGIC (rotation-safe)
  if (isResizing) {
    const dx = e.clientX - startMouseX;
    const dy = e.clientY - startMouseY;

    let newWidth = startWidth;
    let newHeight = startHeight;
    let newLeft = startLeft;
    let newTop = startTop;

    if (currentHandle === "bottom-right") {
      newWidth += dx;
      newHeight += dy;
    } else if (currentHandle === "bottom-left") {
      newWidth -= dx;
      newLeft += dx;
      newHeight += dy;
    } else if (currentHandle === "top-right") {
      newWidth += dx;
      newHeight -= dy;
      newTop += dy;
    } else if (currentHandle === "top-left") {
      newWidth -= dx;
      newLeft += dx;
      newHeight -= dy;
      newTop += dy;
    }

    // Minimum size
    newWidth = Math.max(newWidth, MIN_SIZE);
    newHeight = Math.max(newHeight, MIN_SIZE);

    // Temporarily apply resize
    selectedElement.style.width = `${newWidth}px`;
    selectedElement.style.height = `${newHeight}px`;
    selectedElement.style.left = `${newLeft}px`;
    selectedElement.style.top = `${newTop}px`;

    // Rotated bounding box check
    const bounds = selectedElement.getBoundingClientRect();
    if (
      bounds.left < canvasRect.left ||
      bounds.top < canvasRect.top ||
      bounds.right > canvasRect.right ||
      bounds.bottom > canvasRect.bottom
    ) {
      // Agar canvas se bahar ja raha hai to revert
      selectedElement.style.width = `${startWidth}px`;
      selectedElement.style.height = `${startHeight}px`;
      selectedElement.style.left = `${startLeft}px`;
      selectedElement.style.top = `${startTop}px`;
    }

    return;
  }

  // DRAG LOGIC
  if (isDragging) {
    const mouseX = e.clientX - canvasRect.left;
    const mouseY = e.clientY - canvasRect.top;

    let newLeft = mouseX - offsetX;
    let newTop = mouseY - offsetY;

    const maxX = canvas.clientWidth - selectedElement.offsetWidth;
    const maxY = canvas.clientHeight - selectedElement.offsetHeight;

    selectedElement.style.left =
      `${Math.max(0, Math.min(newLeft, maxX))}px`;
    selectedElement.style.top =
      `${Math.max(0, Math.min(newTop, maxY))}px`;
  }
});


// Mouse chhodte hi sab modes band
document.addEventListener("mouseup", () => {
  isDragging = false;
  isResizing = false;
  isRotating = false;
  currentHandle = null;
});


// Canvas click par deselect
canvas.onclick = (e) => {
  if (e.target === canvas && selectedElement) {
    selectedElement.classList.remove("selected");
    removeControls(selectedElement);
    selectedElement = null;
  }
};


// Remove button
removeBtn.onclick = () => {
  if (!selectedElement) return;
  removeControls(selectedElement);
  selectedElement.remove();
  selectedElement = null;
};
