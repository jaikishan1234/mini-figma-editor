# Figma-Style Visual Editor (Foundation Version)

## Project Status: Section 5 Complete
This project is a web-based visual design tool built from scratch using Vanilla JavaScript. As of this milestone, the core engine—including **Element Creation, Selection, Transformations, Advanced Layer Management, and Live Properties Panel (Sections 1-5)**—is fully implemented and documented with detailed Hinglish commentary.

## Project Goal
The objective is to build a basic visual design editor similar in spirit to Figma, implemented entirely using standard DOM elements. This project demonstrates mastery over DOM manipulation, coordinate geometry, state management, and two-way data binding without the use of external frameworks, Canvas, or SVG engines.

---

## Core Technical Features (Implemented)

### 1. Element Creation & Identification
The system allows for the dynamic generation of design objects:
* **Element Types**: Supports Rectangles and Text Boxes.
* **DOM Representation**: Every object is a `<div>` element assigned a unique ID via a global counter (e.g., `element-1`).
* **Metadata**: Essential data like the element type and current rotation angle are stored directly on the node using HTML5 dataset attributes.
* **Randomized Spawning**: Elements appear at random coordinates within the canvas boundaries to prevent immediate overlapping.

### 2. Selection & Control Management
The editor follows a centralized selection logic to maintain a clean workspace:
* **Visual Selection**: Clicking an element applies a "selected" class, which adds a visual highlight (e.g., yellow border).
* **Dynamic Control Injection**: Upon selection, 4 blue corner resize handles and 1 orange circular rotation handle are injected into the DOM.
* **Automatic Cleanup**: Deselection via clicking the empty canvas clears the global state and removes all interactive handles from the DOM.

### 3. Transformation Engine
This engine handles all physical modifications of the objects using mouse events and coordinate math.

#### Dragging Mechanics
* **Grab-and-Move**: Elements are draggable using mousedown, mousemove, and mouseup events.
* **Offset Calculation**: An offset is calculated based on the click position relative to the element's bounding rect to prevent "jumping" during drag.

#### Coordinate-Based Resizing
* **Handle-Specific Logic**: Resizing behavior changes depending on the grabbed corner (e.g., Top-Left adjusts width, height, left, and top; Bottom-Right adjusts width and height).
* **Minimum Size Constraint**: A `MIN_SIZE` of 20px is enforced to ensure elements remain visible and interactive.

#### Geometry-Driven Rotation
* **Trigonometric Calculation**: The system uses `Math.atan2()` to calculate the angle between the element's center and the mouse cursor.
* **Persistence**: Rotation values are stored in `dataset.rotation` and applied via CSS `transform: rotate()`, ensuring the state is preserved even after deselection.

### 4. Advanced Layer Management
A dedicated Layers Panel provides a vertical overview of the project structure:
* **Reversed UI Order**: To match design tool standards, the topmost element in the DOM (last in the layers array) is displayed at the top of the UI list.
* **Selection Sync**: Clicking a layer item in the panel automatically selects the corresponding element on the canvas.
* **Stacking Logic**:
    * **Move Up**: Swaps the selected element with the next one in the array, bringing it forward in the visual stack.
    * **Move Down**: Swaps with the previous element in the array, sending it backward.
* **DOM & Z-Index Sync**: After any reorder, the system re-appends elements to the canvas using `appendChild` and recalculates `zIndex` to ensure visual and structural consistency.

### 5. Live Properties Panel (Two-Way Data Binding)
A comprehensive inspector panel enables precise numerical control over element properties with real-time synchronization:

#### Property Inspection
* **Auto-Population**: When an element is selected, the Properties Panel automatically populates with current values:
    * **Position (X, Y)**: Element's left and top coordinates in pixels.
    * **Dimensions (W, H)**: Width and height values.
    * **Rotation**: Current rotation angle in degrees.
    * **Background Color**: Displayed as a hex color code via color picker.
    * **Text Content**: Visible only for text elements, shows the current text string.

#### Color Conversion System
* **RGB to Hex Converter**: A utility function (`rgbToHex()`) converts CSS computed color values from RGB format to hexadecimal for seamless color picker integration.
* **Regex Parsing**: Extracts numerical RGB components using pattern matching and converts them to padded hex strings.

#### Live Two-Way Sync
The panel implements bidirectional data flow between UI inputs and canvas elements:

**Canvas → Panel (Automatic Updates)**:
* Triggered after every drag, resize, or rotation operation.
* Uses `updatePropertiesPanel()` to read current computed styles and dataset values.
* Ensures the panel always reflects the visual state of the selected element.

**Panel → Canvas (User Input)**:
* Each input field has an `oninput` event listener for instant feedback.
* Changes are immediately applied to the element's inline styles.
* Minimum size validation prevents elements from becoming invisible.
* Text content updates are restricted to text-type elements only.

#### Conditional UI Display
* **Type-Specific Fields**: The text content input container is shown/hidden dynamically based on the selected element's `data-type` attribute.
* **Deselection Behavior**: When no element is selected (canvas click), all input fields are cleared and reset to default values.

---

## Technical Methodology: The Snapshot Approach
To maintain stability and prevent glitches, the system captures state "Snapshots":
1. **Mousedown (Capture)**: Stores initial Width, Height, Left, Top, and Mouse Coordinates.
2. **Mousemove (Delta Calculation)**: Calculates the change (Delta) between current mouse position and the captured snapshot to apply updates.
3. **Mouseup (Commit)**: Resets all interaction flags to prevent accidental movements.
4. **Properties Sync (Reflection)**: After any transformation, the Properties Panel is updated to reflect new values, maintaining consistency across the interface.

---

## Roadmap (Remaining Sections)
* **Section 6**: Keyboard Interactions (Delete key, Arrow key nudging, Copy/Paste).
* **Section 7**: Persistence via localStorage (Auto-save and restore projects).
* **Section 8**: Export functionality (JSON data export, HTML/CSS code generation).

---

### How to Run
1. Clone the repository.
2. Open `index.html` in any modern browser.
3. Use the top controls to add elements, the Layers Panel to manage stacking order, and the Properties Panel to fine-tune element attributes.
