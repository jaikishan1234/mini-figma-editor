// Canvas aur buttons select kar rahe hain
const canvas = document.querySelector('.canvas');
const addRectBtn = document.querySelector('#addRectBtn');
const addTextBtn = document.querySelector('#addTextBtn');
const removeBtn = document.querySelector('#removeBtn');

// Unique ID generate karne ke liye counter
let elementCounter = 0;

// Add Rectangle button logic
addRectBtn.addEventListener("click", function () {

    // Rectangle ke liye naya div bana rahe hain
    const rect = document.createElement("div");
    rect.classList.add("rect");

    // Unique ID assign kar rahe hain
    elementCounter++;
    rect.id = `element-${elementCounter}`;

    // Rectangle ka type metadata me store kar rahe hain
    rect.dataset.type = "rectangle";

    // Canvas ka size nikaal rahe hain
    const canvasWidth = canvas.clientWidth;
    const canvasHeight = canvas.clientHeight;

    // Rectangle ka default size
    const rectWidth = 80;
    const rectHeight = 80;

    // Canvas ke andar safe position calculate kar rahe hain
    const maxX = canvasWidth - rectWidth;
    const maxY = canvasHeight - rectHeight;

    // Random position generate kar rahe hain
    const randomX = Math.random() * maxX;
    const randomY = Math.random() * maxY;

    // Rectangle ko position de rahe hain
    rect.style.left = `${randomX}px`;
    rect.style.top = `${randomY}px`;

    // Rectangle ko canvas me add kar rahe hain
    canvas.appendChild(rect);
});

// Add Text button logic
addTextBtn.addEventListener("click", function () {

    // Text box ke liye naya div bana rahe hain
    const textBox = document.createElement("div");
    textBox.classList.add("text-box");

    // Default text set kar rahe hain
    textBox.textContent = "Text";

    // Unique ID assign kar rahe hain
    elementCounter++;
    textBox.id = `element-${elementCounter}`;

    // Text element ka type metadata me store kar rahe hain
    textBox.dataset.type = "text";

    // Canvas ka size nikaal rahe hain
    const canvasWidth = canvas.clientWidth;
    const canvasHeight = canvas.clientHeight;

    // Text box ka default size
    const textWidth = 120;
    const textHeight = 40;

    // Canvas ke andar safe position calculate kar rahe hain
    const maxX = canvasWidth - textWidth;
    const maxY = canvasHeight - textHeight;

    // Random position generate kar rahe hain
    const randomX = Math.random() * maxX;
    const randomY = Math.random() * maxY;

    // Text box ko position de rahe hain
    textBox.style.left = `${randomX}px`;
    textBox.style.top = `${randomY}px`;

    // Text box ko canvas me add kar rahe hain
    canvas.appendChild(textBox);
});

// REMOVE LAST ELEMENT
removeBtn.addEventListener("click", function () {

    // Canvas ke andar saare elements select kar rahe hain
    const elements = canvas.querySelectorAll('.rect, .text-box');

    // Agar koi element hai tab hi remove karo
    if (elements.length > 0) {
        const lastElement = elements[elements.length - 1];
        lastElement.remove();
    }
});
