// Canvas aur buttons select kar rahe hain
const canvas = document.querySelector(".canvas");
const addRectBtn = document.querySelector("#addRectBtn");
const addTextBtn = document.querySelector("#addTextBtn");
const removeBtn = document.querySelector("#removeBtn");

// Currently selected element ko store karne ke liye
let selectedElement = null;

// Unique ID generate karne ke liye counter
let elementCounter = 0;

// Resize handles add karne ka function
function addResizeHandles(element) {
  const positions = ["top-left", "top-right", "bottom-left", "bottom-right"];

  positions.forEach((pos) => {
    const handle = document.createElement("div");
    handle.classList.add("resize-handle", pos);
    element.appendChild(handle);
  });
}

// Resize handles remove karne ka function
function removeResizeHandles(element) {
  const handles = element.querySelectorAll(".resize-handle");
  handles.forEach((handle) => handle.remove());
}

// Element ko select karne ka common function
function selectElement(element) {
  // Agar pehle koi selected element hai to uska selection hatao
  if (selectedElement) {
    selectedElement.classList.remove("selected");
    removeResizeHandles(selectedElement);
  }

  // Naye element ko select karo
  selectedElement = element;
  selectedElement.classList.add("selected");

  // Selected element pe resize handles add karo
  addResizeHandles(selectedElement);
}

// Add Rectangle button logic
addRectBtn.addEventListener("click", function () {
  const rect = document.createElement("div");
  rect.classList.add("rect");

  elementCounter++;
  rect.id = `element-${elementCounter}`;
  rect.dataset.type = "rectangle";

  const canvasWidth = canvas.clientWidth;
  const canvasHeight = canvas.clientHeight;

  const rectWidth = 80;
  const rectHeight = 80;

  const maxX = canvasWidth - rectWidth;
  const maxY = canvasHeight - rectHeight;

  rect.style.left = `${Math.random() * maxX}px`;
  rect.style.top = `${Math.random() * maxY}px`;

  // Rectangle pe click hone par select hoga
  rect.addEventListener("click", function (e) {
    e.stopPropagation();
    selectElement(rect);
  });

  canvas.appendChild(rect);
});

// Add Text button logic
addTextBtn.addEventListener("click", function () {
  const textBox = document.createElement("div");
  textBox.classList.add("text-box");
  textBox.textContent = "Text";

  elementCounter++;
  textBox.id = `element-${elementCounter}`;
  textBox.dataset.type = "text";

  const canvasWidth = canvas.clientWidth;
  const canvasHeight = canvas.clientHeight;

  const textWidth = 120;
  const textHeight = 40;

  const maxX = canvasWidth - textWidth;
  const maxY = canvasHeight - textHeight;

  textBox.style.left = `${Math.random() * maxX}px`;
  textBox.style.top = `${Math.random() * maxY}px`;

  // Text box pe click hone par select hoga
  textBox.addEventListener("click", function (e) {
    e.stopPropagation();
    selectElement(textBox);
  });

  canvas.appendChild(textBox);
});

// Canvas pe click karne par selection clear ho jayega
canvas.addEventListener("click", function () {
  if (selectedElement) {
    selectedElement.classList.remove("selected");
    removeResizeHandles(selectedElement);
    selectedElement = null;
  }
});

// REMOVE SELECTED ELEMENT
removeBtn.addEventListener("click", function () {
  // Agar koi element selected nahi hai to kuch mat karo
  if (!selectedElement) return;

  // Selected element ke resize handles hata rahe hain
  removeResizeHandles(selectedElement);

  // Selected element ko DOM se remove kar rahe hain
  selectedElement.remove();

  // Selection state clear kar rahe hain
  selectedElement = null;
});
