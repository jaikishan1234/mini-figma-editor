# Figma-Style Visual Editor (Foundation Version)

## Project Status: Section 7 Complete
This project is a web-based visual design tool built from scratch using Vanilla JavaScript. As of this milestone, the core engine—including **Element Creation, Selection, Transformations, Advanced Layer Management, Live Properties Panel, Keyboard Interactions, and Full Persistence System (Sections 1-7)**—is fully implemented and documented with detailed Hinglish commentary.

## Project Goal
The objective is to build a basic visual design editor similar in spirit to Figma, implemented entirely using standard DOM elements. This project demonstrates mastery over DOM manipulation, coordinate geometry, state management, two-way data binding, keyboard-driven workflows, and data persistence without the use of external frameworks, Canvas, or SVG engines.

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

### 6. Keyboard Interactions (Power User Features)
A global keyboard event listener enables professional-grade shortcuts for faster workflows:

#### Deletion Shortcuts
* **Delete Key**: Removes the currently selected element from the canvas.
* **Backspace Key**: Alternative deletion shortcut (browser back navigation is prevented).
* **Automatic Cleanup**: Upon deletion, the element is removed from the layers array, DOM, and all panels are synchronized.
* **State Reset**: Selection is cleared and control handles are removed automatically.

#### Arrow Key Nudging
* **Precision Movement**: Arrow keys move the selected element by 5 pixels per keypress.
* **Directional Control**:
    * **ArrowLeft**: Moves element 5px to the left.
    * **ArrowRight**: Moves element 5px to the right.
    * **ArrowUp**: Moves element 5px upward.
    * **ArrowDown**: Moves element 5px downward.

#### Boundary Clamping System
* **Canvas Containment**: A `clamp()` utility function ensures elements never escape the canvas boundaries.
* **Mathematical Constraint**: Uses `Math.max()` and `Math.min()` to enforce position limits:
    * Minimum X/Y position: `0`
    * Maximum X position: `canvas.clientWidth - element.offsetWidth`
    * Maximum Y position: `canvas.clientHeight - element.offsetHeight`
* **Real-Time Validation**: Position is clamped after every arrow key movement before applying to the element.

#### Keyboard Event Handling
* **Selection Guard**: All keyboard shortcuts only work when an element is selected.
* **Event Prevention**: `preventDefault()` stops default browser behavior (page scrolling, back navigation).
* **Properties Sync**: After any keyboard-driven movement or deletion, the Properties Panel is updated to reflect changes.
* **Input Field Detection**: Shortcuts are disabled when typing in text inputs to prevent conflicts.

### 7. Full Persistence System (LocalStorage + Export)
A complete data persistence layer ensures no work is lost and designs can be exported in multiple formats:

#### Auto-Save to LocalStorage
* **Automatic Persistence**: Every transformation (drag, resize, rotate, color change, text edit) triggers an immediate save to browser localStorage.
* **JSON Serialization**: Canvas state is serialized to JSON format containing:
    * Element IDs and types
    * Positions (X, Y coordinates)
    * Dimensions (width, height)
    * Rotation angles
    * Background colors
    * Text content (for text elements)
* **Storage Key**: Uses a constant `STORAGE_KEY` for consistent browser storage access.
* **Non-Blocking**: Save operations are synchronous but lightweight, causing no UI lag.

#### Session Restoration
* **Auto-Load on Page Load**: When the page loads, `loadFromLocalStorage()` automatically restores the previous session.
* **State Reconstruction**: 
    * Clears current canvas state
    * Recreates all elements from saved data
    * Restores all properties (position, size, rotation, color, text)
    * Reconstructs layer order and z-index hierarchy
    * Re-enables interactive features (contentEditable for text boxes)
* **ID Counter Sync**: Tracks the highest element ID to ensure new elements get unique identifiers.
* **Graceful Handling**: If no saved data exists, the editor starts with a blank canvas.

#### JSON Export
* **Data Structure Export**: `exportJSON()` creates a downloadable JSON file containing the complete canvas state.
* **Human-Readable Format**: JSON is formatted with 2-space indentation for easy viewing and editing.
* **Use Cases**:
    * Backup designs externally
    * Version control integration
    * Sharing designs with others
    * Programmatic manipulation of designs

#### HTML Export
* **Standalone HTML Generation**: `exportHTML()` creates a fully self-contained HTML file that renders the design without dependencies.
* **Inline Styling**: All element styles are embedded as inline CSS for maximum portability.
* **Static Rendering**: Exported HTML is a static snapshot (no interactive editing).
* **Features**:
    * Preserves all positions, sizes, rotations
    * Maintains color schemes
    * Includes text content
    * Centered canvas with shadow for presentation
* **Use Cases**:
    * Sharing designs via email
    * Embedding in documentation
    * Client previews
    * Portfolio presentations

#### Export Implementation
* **Blob API**: Uses browser's Blob API to create downloadable files.
* **Automatic Download**: Creates temporary download links that auto-click.
* **Memory Cleanup**: Properly revokes object URLs to prevent memory leaks.
* **File Naming**: Exports default to `export.json` and `export.html` (user can rename during save).

#### Data Integrity
* **Type Safety**: Element types are validated during restoration.
* **Defensive Parsing**: JSON parsing includes error handling for corrupted data.
* **Counter Management**: Element counter is carefully synchronized to prevent ID collisions.
* **Feature Restoration**: Type-specific features (like contentEditable) are properly restored.

---

## Technical Methodology: The Snapshot Approach
To maintain stability and prevent glitches, the system captures state "Snapshots":
1. **Mousedown (Capture)**: Stores initial Width, Height, Left, Top, and Mouse Coordinates.
2. **Mousemove (Delta Calculation)**: Calculates the change (Delta) between current mouse position and the captured snapshot to apply updates.
3. **Mouseup (Commit)**: Resets all interaction flags to prevent accidental movements.
4. **Properties Sync (Reflection)**: After any transformation, the Properties Panel is updated to reflect new values, maintaining consistency across the interface.
5. **Keyboard Events (Direct Manipulation)**: Keyboard shortcuts directly modify element positions with boundary validation, ensuring safe operations.
6. **Persistence Layer**: Every state change triggers an automatic save, ensuring zero data loss between sessions.

---

## Additional Features (Bonus Implementations)

### Floating Toolbar with Tool Modes
* **Select Tool**: Default mode for element manipulation (drag, resize, rotate).
* **Hand Tool**: Canvas panning mode for navigating large designs.
* **Quick Creation Tools**: Direct Rectangle and Text creation from toolbar.
* **Visual Feedback**: Active tool highlighted with blue background.
* **Cursor Changes**: Automatic cursor updates (grab/grabbing for Hand tool).

### Editable Text Elements
* **Direct Editing**: Text elements use `contentEditable` for in-place editing.
* **Auto-Resize**: Text boxes automatically adjust height to fit content.
* **Focus Management**: Dragging is disabled during text editing to prevent conflicts.
* **Spellcheck Disabled**: Red underlines are removed for cleaner design experience.

### Workspace Panning
* **Hand Tool Mode**: Click and drag to pan the canvas viewport.
* **Scroll-Based**: Uses native scroll properties for smooth panning.
* **Delta Calculation**: Tracks mouse movement distance for accurate panning.
* **Cursor Feedback**: Changes to "grabbing" cursor during active panning.

---

## Roadmap (Future Enhancements)
* **Section 8**: Multi-select and grouping functionality.
* **Section 9**: Undo/Redo system with command pattern.
* **Section 10**: Copy/Paste and duplication shortcuts.
* **Section 11**: Alignment and distribution tools.
* **Section 12**: Grid and snap-to-grid features.

---

## How to Run
1. Clone the repository.
2. Open `index.html` in any modern browser.
3. Use the top controls to add elements, the Layers Panel to manage stacking order, the Properties Panel to fine-tune element attributes, and keyboard shortcuts for efficient editing.
4. Your work is automatically saved and will be restored when you return.
5. Use Export buttons to save your designs as JSON or HTML files.

---

## Keyboard Shortcuts Reference
| Shortcut | Action |
|----------|--------|
| `Delete` / `Backspace` | Delete selected element |
| `Arrow Keys` | Move element 5px in direction |
| `Escape` | Deselect current element |

---

## Browser Compatibility
* **Tested on**: Chrome 120+, Firefox 120+, Safari 17+, Edge 120+
* **Requirements**: ES6+ support, modern DOM APIs, localStorage
* **No Dependencies**: Pure vanilla JavaScript, no external libraries

---

## Data Storage
* **Location**: Browser localStorage (per-domain)
* **Size**: Typical designs < 50KB
* **Persistence**: Data survives browser restarts (unless cache is cleared)
* **Privacy**: All data stored locally, no server communication
