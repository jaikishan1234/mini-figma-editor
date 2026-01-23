// Canvas aur main buttons ko DOM se pakad rahe hain
const canvas = document.querySelector(".canvas");
const addRectBtn = document.querySelector("#addRectBtn");
const addTextBtn = document.querySelector("#addTextBtn");
const removeBtn = document.querySelector("#removeBtn");

// Layers panel ke elements - layer ordering ke liye
const layersList = document.querySelector("#layersList");
const moveUpBtn = document.querySelector("#moveUpBtn");
const moveDownBtn = document.querySelector("#moveDownBtn");

// Abhi currently kaunsa element active / selected hai (null = koi bhi nahi)
let selectedElement = null;

// Mouse interactions ke flags - ek time me sirf ek true ho sakta hai
let isDragging = false; // element ko drag kar rahe hain
let isResizing = false; // element ka size change kar rahe hain
let isRotating = false; // element ko rotate kar rahe hain

// Resize ke time kaunsa handle (corner) use ho raha hai
// Possible values: "top-left", "top-right", "bottom-left", "bottom-right"
let currentHandle = null;

// Drag ke liye: mouse aur element ke top-left corner ke beech ka distance
// Isse element mouse ke neeche jump nahi karta
let offsetX = 0;
let offsetY = 0;

// Resize start ke time element aur mouse ki state save karte hain
// Taaki live resize calculate kar sakein
let startMouseX = 0; // resize start pe mouse X position
let startMouseY = 0; // resize start pe mouse Y position
let startWidth = 0; // resize start pe element ki width
let startHeight = 0; // resize start pe element ki height
let startLeft = 0; // resize start pe element ka left position
let startTop = 0; // resize start pe element ka top position

// Rotation ke liye angle tracking
let startAngle = 0; // rotation start ke time mouse ka angle
let currentRotation = 0; // element ka current rotation in degrees

// Har element ko ek unique id dene ke liye counter
// element-1, element-2, element-3... aise IDs milti hain
let elementCounter = 0;

// Minimum size taaki resize karte time element gayab na ho
// 20px se chhota element user ko dikhai nahi dega
const MIN_SIZE = 20;

// Layers ka internal order store karne ke liye array
// Index 0 = bottom-most layer (sabse neeche)
// Index last = top-most layer (sabse upar)
let layers = [];

/*
  addControls() - Jab koi element select hota hai
  tab uske around resize aur rotate ke controls add karte hain
  
  Ye function 5 handles create karta hai:
  - 4 corners me resize handles (blue squares)
  - 1 top-center me rotate handle (orange circle)
*/
function addControls(element) {
  // 4 corners ke resize handles ek loop me create kar rahe hain
  const positions = ["top-left", "top-right", "bottom-left", "bottom-right"];

  positions.forEach((pos) => {
    // Har corner ke liye ek chhota blue square div banate hain
    const handle = document.createElement("div");
    handle.classList.add("resize-handle", pos);

    // Resize handle par mouse down = resize mode start
    handle.addEventListener("mousedown", (e) => {
      // stopPropagation = parent element (main element) ka drag event trigger nahi hoga
      e.stopPropagation();
      // preventDefault = browser ka default behavior (text select etc) nahi hoga
      e.preventDefault();

      // Sabse pehle saare flags reset karke sirf resize mode ON
      isResizing = true;
      isDragging = false;
      isRotating = false;

      // Kaunsa corner pakda hai wo save kar lo
      currentHandle = pos;

      // Resize start ke time initial values store karo
      // Baad me mouse move pe inhi se comparison karke new size calculate karenge
      startMouseX = e.clientX;
      startMouseY = e.clientY;
      startWidth = element.offsetWidth;
      startHeight = element.offsetHeight;
      startLeft = element.offsetLeft;
      startTop = element.offsetTop;
    });

    // Ye handle element ke andar as a child add ho jata hai
    element.appendChild(handle);
  });

  // Rotate handle element ke top-center pe add hota hai
  // Ye orange color ka circle hota hai
  const rotateHandle = document.createElement("div");
  rotateHandle.classList.add("rotate-handle");

  rotateHandle.addEventListener("mousedown", (e) => {
    e.stopPropagation();
    e.preventDefault();

    // Saare flags reset karke sirf rotation mode ON
    isRotating = true;
    isDragging = false;
    isResizing = false;

    // Element ke center se mouse ka angle calculate karte hain
    // Ye trigonometry use karta hai (atan2 = angle between two points)
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2; // element ka horizontal center
    const centerY = rect.top + rect.height / 2; // element ka vertical center

    // Math.atan2() radians me angle deta hai
    const radians = Math.atan2(
      e.clientY - centerY, // Y distance
      e.clientX - centerX, // X distance
    );

    // Radians ko degrees me convert karo (humans ke liye easy)
    // Formula: degrees = radians × (180 / π)
    startAngle = radians * (180 / Math.PI);

    // Agar element pehle se rotated hai to wo angle bhi save karo
    // dataset.rotation me hum custom data store karte hain
    currentRotation = parseFloat(element.dataset.rotation || 0);
  });

  // Rotate handle bhi element ke andar add ho jata hai
  element.appendChild(rotateHandle);
}

/*
  removeControls() - Jab element deselect hota hai
  tab saare controls (resize + rotate handles) hata dete hain
  
  Ye function querySelectorAll se saare handles dhundh ke unhe remove karta hai
*/
function removeControls(element) {
  element
    .querySelectorAll(".resize-handle, .rotate-handle") // dono types ke handles select karo
    .forEach((h) => h.remove()); // har ek ko DOM se remove kardo
}

/*
  selectElement() - Element select karne ka common function
  
  Ye function 5 kaam karta hai:
  1. Purana element deselect (agar koi tha)
  2. Naya element highlight
  3. Rotation restore (agar pehle se rotated tha)
  4. Control handles add
  5. Layers panel update
*/
function selectElement(element) {
  // Agar pehle se koi element selected tha to usko deselect karo
  if (selectedElement) {
    selectedElement.classList.remove("selected"); // yellow border hatao
    removeControls(selectedElement); // handles hatao
  }

  // Naye element ko selected bana do
  selectedElement = element;
  selectedElement.classList.add("selected"); // yellow border add karo

  // Rotation handling: agar pehle rotation set nahi hai toh default 0
  // dataset me custom attributes store karte hain (HTML5 feature)
  if (!selectedElement.dataset.rotation) {
    selectedElement.dataset.rotation = 0;
  }

  // Saved rotation ko CSS transform me apply karo
  // Ye ensure karta hai ki element apne rotation me rehta hai
  selectedElement.style.transform = `rotate(${selectedElement.dataset.rotation}deg)`;

  // Control handles add karo (resize + rotate)
  addControls(selectedElement);

  // Layers panel me active state update karo
  // Taaki user ko dikh sake ki kaunsa element selected hai
  renderLayersPanel();
}

/*
  createBaseElement() - Rectangle aur Text dono ke liye common base creator
  
  Parameters:
  - type: "rectangle" ya "text"
  - width: element ki width in pixels
  - height: element ki height in pixels
  
  Return: fully configured DOM element (abhi canvas me add nahi hua)
*/
function createBaseElement(type, width, height) {
  // Naya div element create karo
  const el = document.createElement("div");

  // Unique ID assign karo (element-1, element-2, etc.)
  elementCounter++;
  el.id = `element-${elementCounter}`;

  // Type dataset me store karo (baad me zaroorat pad sakti hai)
  el.dataset.type = type;

  // Canvas ke andar random position calculate karo
  // Math.random() = 0 se 1 ke beech random decimal
  // Isko multiply karke humein canvas ke andar ka random position milta hai
  const maxX = canvas.clientWidth - width; // max left position (taaki element canvas se bahar na jaye)
  const maxY = canvas.clientHeight - height; // max top position

  el.style.left = `${Math.random() * maxX}px`;
  el.style.top = `${Math.random() * maxY}px`;
  el.style.width = `${width}px`;
  el.style.height = `${height}px`;

  // Mouse down par element select + drag start
  el.addEventListener("mousedown", (e) => {
    // Agar resize/rotate chal raha hai ya handle pe click hai to drag start mat karo
    // Ye important check hai - warna handle drag ho jayega instead of resize/rotate
    if (
      isResizing ||
      isRotating ||
      e.target.classList.contains("resize-handle") ||
      e.target.classList.contains("rotate-handle")
    )
      return; // early return = baaki code skip ho jayega

    // Parent (canvas) ka event trigger nahi hona chahiye
    e.stopPropagation();

    // Is element ko select karo
    selectElement(el);

    // Drag mode ON
    isDragging = true;

    // Mouse aur element ke corner ke beech ka offset calculate karo
    // Isse element exactly wahin pakda jayega jahan user ne click kiya
    const rect = el.getBoundingClientRect(); // screen pe element ki exact position
    offsetX = e.clientX - rect.left; // mouse X - element left = X offset
    offsetY = e.clientY - rect.top; // mouse Y - element top = Y offset
  });

  return el; // configured element return karo
}

/*
  renderLayersPanel() - Layers panel ko current layers array ke basis par render karte hain
  
  UI me top-most element sabse upar dikhana hota hai
  Lekin layers array me last element = top-most hai
  Isliye reverse() use karte hain
*/
function renderLayersPanel() {
  // Pehle pura panel khali karo
  layersList.innerHTML = "";

  // Layers array ko reverse karke loop (top → bottom order me UI me dikhega)
  // Spread operator [...] se copy banate hain taaki original array change na ho
  [...layers].reverse().forEach((el) => {
    // Har layer ke liye ek list item div create karo
    const item = document.createElement("div");
    item.className = "layer-item";
    item.textContent = el.id; // element ki ID show karo (element-1, element-2, etc.)

    // Agar ye element currently selected hai to special style do
    if (el === selectedElement) {
      item.classList.add("active"); // blue background + white text
    }

    // Layer name par click karne se canvas me wo element select ho jaye
    item.onclick = () => selectElement(el);

    // Is item ko layers list me add karo
    layersList.appendChild(item);
  });
}

/*
  syncDOMOrder() - DOM order ko layers array ke order ke saath sync karte hain
  
  Isse z-index aur stacking consistent rehta hai
  appendChild() existing element ko move kar deta hai (duplicate nahi banata)
*/
function syncDOMOrder() {
  // Layers array ke order me sab elements ko canvas me re-append karo
  // Browser automatically sahi stacking order bana deta hai
  layers.forEach((el) => canvas.appendChild(el));
}

/*
  updateZIndexes() - Extra safety ke liye z-index explicitly set kar dete hain
  
  Normally DOM order hi kaafi hai, but z-index bhi set karne se guarantee milti hai
  Index 0 = z-index 1 (bottom)
  Index 1 = z-index 2
  Index 2 = z-index 3 (top)
*/
function updateZIndexes() {
  layers.forEach((el, i) => {
    el.style.zIndex = i + 1; // +1 isliye taaki 0 se start na ho
  });
}

/*
  addRectBtn - Rectangle add karne ka button handler
  Click pe:
  1. Base element create
  2. "rect" class add (CSS styling ke liye)
  3. Canvas me append
  4. Layers array me push (top-most layer ban jayega)
  5. Z-index aur DOM sync
  6. Layers panel update
*/
addRectBtn.onclick = () => {
  // 80x80 size ka rectangle create karo
  const r = createBaseElement("rectangle", 80, 80);
  r.classList.add("rect"); // CSS me .rect class se pink background milta hai
  canvas.appendChild(r); // canvas me dikhao

  // Layers system me register karo
  layers.push(r); // array ke end me = top-most layer
  updateZIndexes();
  syncDOMOrder();
  renderLayersPanel();
};

/*
  addTextBtn - Text box add karne ka button handler
  Similar to rectangle but different size aur default text ke saath
*/
addTextBtn.onclick = () => {
  // 120x40 size ka text box create karo (wider for text)
  const t = createBaseElement("text", 120, 40);
  t.classList.add("text-box"); // CSS me .text-box class se blue background + center text
  t.textContent = "Text Box"; // default text
  canvas.appendChild(t);

  // Layers system me register karo
  layers.push(t); // array ke end me = top-most layer
  updateZIndexes();
  syncDOMOrder();
  renderLayersPanel();
};

/*
  Global mousemove event - Yahin drag, resize, rotate sab handle hota hai
  Ye constantly trigger hota hai jab mouse move hota hai
  
  Checks:
  1. Agar koi element selected nahi to kuch mat karo
  2. Agar rotating hai to rotation logic chala do
  3. Agar resizing hai to resize logic chala do
  4. Agar dragging hai to drag logic chala do
*/
document.addEventListener("mousemove", (e) => {
  // Agar koi element selected hi nahi to kuch karne ki zaroorat nahi
  if (!selectedElement) return;

  // Canvas ki screen position nikalo (boundaries check ke liye)
  const canvasRect = canvas.getBoundingClientRect();

  // ROTATION LOGIC 
  if (isRotating) {
    // Element ka current bounding box nikalo
    const rect = selectedElement.getBoundingClientRect();

    // Element ka center point calculate karo
    const cx = rect.left + rect.width / 2; // center X
    const cy = rect.top + rect.height / 2; // center Y

    // Mouse aur center ke beech ka current angle nikalo
    // atan2() automatically quadrant handle karta hai (all 4 directions)
    const radians = Math.atan2(e.clientY - cy, e.clientX - cx);
    const angle = radians * (180 / Math.PI); // degrees me convert

    // Final angle = purana rotation + (naya angle - start angle)
    // Ye formula ensure karta hai ki rotation smooth rahe
    const finalAngle = currentRotation + (angle - startAngle);

    // Element ko rotate karo
    selectedElement.style.transform = `rotate(${finalAngle}deg)`;

    // Naya rotation dataset me save karo (taaki deselect/reselect ke baad bhi rahe)
    selectedElement.dataset.rotation = finalAngle;

    return; // rotation complete, baaki logic skip karo
  }

  // RESIZE LOGIC 
  if (isResizing) {
    // Mouse ne kitna move kiya start position se (delta = change)
    const dx = e.clientX - startMouseX; // X me kitna move
    const dy = e.clientY - startMouseY; // Y me kitna move

    // Start values se new values calculate karenge
    let newWidth = startWidth;
    let newHeight = startHeight;
    let newLeft = startLeft;
    let newTop = startTop;

    // Kaunsa handle use ho raha hai uske basis par calculation change hota hai

    if (currentHandle === "bottom-right") {
      // Bottom-right: sirf size badhta hai, position same rehta hai
      newWidth += dx; // width me mouse ka X change add karo
      newHeight += dy; // height me mouse ka Y change add karo
    } else if (currentHandle === "bottom-left") {
      // Bottom-left: width + left dono change, height badhta hai
      newWidth -= dx; // width decrease (left move = width kam)
      newLeft += dx; // left position shift (width kam hone pe left ko adjust)
      newHeight += dy; // height increase
    } else if (currentHandle === "top-right") {
      // Top-right: width + top dono change, height badhta hai
      newWidth += dx; // width increase
      newHeight -= dy; // height decrease (top move = height kam)
      newTop += dy; // top position shift
    } else if (currentHandle === "top-left") {
      // Top-left: sab kuch change hota hai
      newWidth -= dx; // width decrease
      newLeft += dx; // left adjust
      newHeight -= dy; // height decrease
      newTop += dy; // top adjust
    }

    // Minimum size check: element 20px se chhota nahi hona chahiye
    // Math.max() = do values me se badi wali return karta hai
    newWidth = Math.max(newWidth, MIN_SIZE);
    newHeight = Math.max(newHeight, MIN_SIZE);

    // Calculated values element ko apply karo
    selectedElement.style.width = `${newWidth}px`;
    selectedElement.style.height = `${newHeight}px`;
    selectedElement.style.left = `${newLeft}px`;
    selectedElement.style.top = `${newTop}px`;

    return; // resize complete, baaki logic skip karo
  }

  // DRAG LOGIC 
  if (isDragging) {
    // Mouse ki current position - canvas ka left/top = canvas ke andar ka position
    // Phir offset minus karo taaki element exactly wahi pakda rahe jahan click kiya tha
    const newLeft = e.clientX - canvasRect.left - offsetX;
    const newTop = e.clientY - canvasRect.top - offsetY;

    // Position apply karo (koi boundary check nahi - element canvas se bahar ja sakta hai)
    selectedElement.style.left = `${newLeft}px`;
    selectedElement.style.top = `${newTop}px`;
  }
});

/*
  Global mouseup event - Mouse chhodte hi saare interaction modes reset
  
  Ye zaruri hai warna drag/resize/rotate continue ho jayega
  even agar mouse canvas se bahar chala jaye
*/
document.addEventListener("mouseup", () => {
  // Saare flags false kar do
  isDragging = false;
  isResizing = false;
  isRotating = false;
  currentHandle = null; // koi handle active nahi
});

/*
  Canvas par click (empty area pe) karne par element deselect ho jaye
  
  e.target === canvas check karta hai ki exactly canvas pe click hua
  (kisi element pe nahi)
*/
canvas.onclick = (e) => {
  // Agar canvas pe hi click hua (element pe nahi) aur koi element selected tha
  if (e.target === canvas && selectedElement) {
    // Element deselect karo
    selectedElement.classList.remove("selected"); // yellow border hatao
    removeControls(selectedElement); // handles hatao
    selectedElement = null; // selection clear karo
    renderLayersPanel(); // layers panel update (active state hata do)
  }
};

/*
  removeBtn - Selected element ko delete karta hai
  
  Steps:
  1. Layers array se remove
  2. Controls remove
  3. DOM se remove
  4. Selection clear
  5. Sab sync karo
*/
removeBtn.onclick = () => {
  // Agar koi element selected hi nahi to kuch mat karo
  if (!selectedElement) return;

  // Layers array se is element ko filter karke nikal do
  // filter() = condition match karne wale elements ko rakho, baaki hata do
  layers = layers.filter((el) => el !== selectedElement);

  // Handles hata do
  removeControls(selectedElement);

  // DOM se permanently delete karo
  selectedElement.remove();

  // Selection clear karo
  selectedElement = null;

  // Layers system sync karo
  updateZIndexes(); // z-index recalculate
  syncDOMOrder(); // DOM order fix
  renderLayersPanel(); // UI update
};

/*
  moveUpBtn - Element ko stacking me aage lana (z-index badhana)
  
  Important concept:
  - layers[0] = bottom-most (sabse neeche)
  - layers[last] = top-most (sabse upar)
  
  Move UP = array me aage (higher index) shift karna
*/
moveUpBtn.onclick = () => {
  // Agar koi element selected nahi to kuch mat karo
  if (!selectedElement) return;

  // Selected element ka current index dhundo
  const index = layers.indexOf(selectedElement);

  // Agar element already top-most hai (last index pe) to move nahi kar sakte
  if (index < layers.length - 1) {
    // Current element aur next element ki position swap karo
    // Destructuring assignment se ek line me swap ho jata hai
    // Pehle: [A, B] → Baad: [B, A]
    [layers[index], layers[index + 1]] = [layers[index + 1], layers[index]];

    // Changes apply karo
    updateZIndexes(); // z-index recalculate (higher index = higher z-index)
    syncDOMOrder(); // DOM order match karao array se
    renderLayersPanel(); // UI me layers list update karo
  }
};

/*
  moveDownBtn - Element ko stacking me peeche bhejna (z-index ghatana)
  
  Move DOWN = array me peeche (lower index) shift karna
*/
moveDownBtn.onclick = () => {
  // Agar koi element selected nahi to kuch mat karo
  if (!selectedElement) return;

  // Selected element ka current index dhundo
  const index = layers.indexOf(selectedElement);

  // Agar element already bottom-most hai (index 0 pe) to move nahi kar sakte
  if (index > 0) {
    // Current element aur previous element ki position swap karo
    [layers[index], layers[index - 1]] = [layers[index - 1], layers[index]];

    // Changes apply karo
    updateZIndexes(); // z-index recalculate (lower index = lower z-index)
    syncDOMOrder(); // DOM order match karao
    renderLayersPanel(); // UI update
  }
};
