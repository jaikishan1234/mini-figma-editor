# Figma-Style Visual Editor (Foundation Version)

## Project Status: Section 3 Complete
This project is a web-based visual design tool built from scratch using Vanilla JavaScript. As of this commit, the core engine—including **Element Creation, Selection, Dragging, Resizing, and Rotation (Sections 1-3)**—is fully implemented and stable.

## Project Goal
The objective is to build a basic visual design editor similar in spirit to Figma, implemented entirely using standard DOM elements. This project demonstrates a strong command of DOM manipulation, coordinate geometry, and state management without the use of external frameworks, Canvas, or SVG engines.

---

## Core Technical Features (Implemented)

### 1. Element Creation & Identification
The system allows for the dynamic generation of design objects:
* **Element Types**: Users can create Rectangles and Text Boxes.
* **DOM Representation**: Every object is a `<div>` element assigned a unique ID via a global counter.
* **Metadata**: Essential data like the element type and its rotation angle are stored directly on the node using dataset attributes.
* **Initial Placement**: Elements spawn with default dimensions at random coordinates within the canvas to prevent immediate overlapping.

### 2. Selection & Control Management
The editor follows a centralized selection logic to maintain a clean workspace:
* **Visual Selection**: Clicking an element selects it, adding a high-contrast outline to indicate it is active.
* **Dynamic Control Injection**: Upon selection, 4 corner resize handles and a circular rotation handle are injected into the DOM for that specific element.
* **Deselection**: Clicking the empty canvas clears the global state and removes all interactive handles.

### 3. Transformation Engine
This is the "brain" of the editor, handling all physical modifications of the objects.

#### Dragging Mechanics
* **Mouse Interaction**: Elements are draggable using a standard "grab-and-move" approach using mouse events.
* **Offset Calculation**: To prevent the element from "jumping" to the cursor, we calculate the gap between the mouse click and the element's top-left corner.
* **Boundary Constraints**: Elements are strictly clamped within the canvas width and height.

#### Coordinate-Based Resizing
* **Corner Anchoring**: Resizing is restricted to the four corner handles.
* **Real-time Scaling**: Width and height update dynamically by calculating the "Delta" (difference) from the initial mouse-down position.
* **Safety Limits**: A minimum size constraint is enforced so that elements never disappear or invert.

#### Geometry-Driven Rotation
* **Figma-Style Interaction**: Instead of keyboard shortcuts, a visual handle allows for intuitive rotation based on mouse events.
* **Math (atan2)**: The script calculates the angle between the element’s visual center and the current mouse cursor position using trigonometry.
* **State Preservation**: The rotation angle is preserved in the element's metadata, ensuring that the next rotation session starts from the previous angle.

---

## The "Snapshot" Methodology
For maximum stability and to avoid glitches, this project uses a **Snapshot Method**:
1. **Mousedown (The Capture)**: When a user clicks a handle, the script takes a "photo" of the current state including Initial Left, Top, Width, Height, and Angle.
2. **Mousemove (The Calculation)**: Every pixel the mouse moves is compared against that original snapshot to determine the new size or position.
3. **Mouseup (The Release)**: All interaction flags are reset to prevent accidental movements.



---

## Visual Stability & Rotated Bounds
A common challenge with DOM-based editors is that rotation changes an element's visual footprint. Standard width checks do not account for tilted boxes. This project uses `getBoundingClientRect()` to track the **Rotated Bounding Box**, ensuring that even when a box is tilted, its corners will not clip through the canvas walls.

---

## Roadmap (Remaining Sections)
* **Section 4**: Simple Layers Panel (z-index and stacking order).
* **Section 5**: Basic Properties Panel (Color, Width, Height inputs).
* **Section 6**: Keyboard Interactions (Delete and Arrow keys).
* **Section 7**: Persistence via localStorage.
* **Section 8**: Export functionality (JSON/HTML).

---

### How to Run
1. Clone the repository.
2. Open `index.html` in any modern browser.
3. Add elements and use the handles to build your layout.