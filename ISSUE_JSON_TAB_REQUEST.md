# Feature Request: Add a dedicated JSON Tools tab

## 📋 Issue Title
**Feature Request: Add a dedicated "JSON Tools" tab with Tree View and JQ Filter support**

---

## 🎯 Problem Statement

Currently, Tooly has some excellent JSON-related features scattered within the **Smart Converter** tool:
- JSON Beautify
- JSON Sort (alphabetical key sorting)
- Syntax Highlighting with collapsible nodes

However, when working with complex JSON data (like API responses, config files, or logs), I often need more specialized JSON tooling that goes beyond encoding/decoding workflows. The current features are great for quick formatting, but a dedicated JSON tab would provide a more focused experience for heavy JSON manipulation tasks.

---

## ✨ Proposed Solution

Add a new **"JSON Tools"** tab (or "JSON Explorer") alongside the existing tabs:
- Smart Converter | Diff Master | List Wizard | Time Converter | **JSON Tools** *(new)*

### Minimum Viable Features

#### 1. 🌳 Text-to-Tree Conversion (JSON Tree Viewer)
- **Input**: Raw JSON text (paste or type)
- **Output**: Interactive tree visualization
- **Requirements**:
  - ✅ Expand/collapse individual nodes (similar to existing highlight mode in SmartConverter)
  - ✅ Expand All / Collapse All buttons
  - ✅ Visual distinction between data types (strings, numbers, booleans, null, arrays, objects)
  - ✅ Show array lengths and object key counts when collapsed
  - ✅ Click-to-copy JSON path (e.g., `data.users[0].name`)
  - ✅ Error handling for invalid JSON with clear error messages

*Note: Some of this functionality already exists in `SmartConverter.tsx` (lines 424-590) with the `renderCollapsibleJSON` function. This could be extracted and enhanced for the new tab.*

#### 2. 🔍 JQ Filter Box
- **Input**: A text input for [jq](https://jqlang.github.io/jq/) filter expressions
- **Behavior**: Apply jq-like filters to the JSON input and show filtered results
- **Example filters**:
  - `.data.users` - Extract nested path
  - `.data.users[0]` - Get first item
  - `.data.users[] | .name` - Extract all names from array
  - `.data.users | length` - Get array length
  - `keys` - List all keys
  - `select(.status == "active")` - Filter by condition

**Implementation options**:
- Use a JavaScript jq implementation like [jq-web](https://github.com/niclasko/jq-web) or [jmespath](https://jmespath.org/) as an alternative
- Or implement a subset of common jq operations natively

---

## 🖼️ Proposed UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│  JSON Tools                                                 │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────┐  ┌───────────────────────────┐ │
│  │ JSON Input              │  │ Tree View / Filtered      │ │
│  │ [Clear] [Paste] [Format]│  │ [Expand All] [Collapse All]│ │
│  ├─────────────────────────┤  ├───────────────────────────┤ │
│  │                         │  │ ▼ root {3 keys}           │ │
│  │ {                       │  │   ▼ data {2 keys}         │ │
│  │   "data": {             │  │     ▶ users [5 items]     │ │
│  │     "users": [...]      │  │     "status": "active"    │ │
│  │   }                     │  │   "meta": {...}           │ │
│  │ }                       │  │                           │ │
│  │                         │  │                           │ │
│  └─────────────────────────┘  └───────────────────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ JQ Filter: [ .data.users[] | .name                    ] ││
│  │            [Apply Filter]                               ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  💡 Tip: Use jq syntax to filter and transform JSON data   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Technical Considerations

### Reusable Components
The existing `SmartConverter.tsx` already has:
- `renderCollapsibleJSON()` - Recursive JSON tree renderer with expand/collapse
- `highlightJSON()` - Syntax highlighting with type-based colors
- `collapsedPaths` state management for expand/collapse
- `expandAll()` / `collapseAll()` functions

These could be extracted into a shared utility or component for reuse.

### Consistent Styling
Following the existing design patterns:
- Orange accent color (`orange-500`) for active states
- Stone color palette for neutral elements
- JetBrains Mono for code/JSON display
- Same button styles and spacing conventions

### Dependencies to Consider
For JQ support:
- [jq-web](https://www.npmjs.com/package/jq-web) - Full jq implementation via WebAssembly
- [jmespath](https://www.npmjs.com/package/jmespath) - Simpler JSON query language
- Custom implementation for basic path queries

---

## 🚀 Why This Would Be Valuable

1. **Dedicated workspace** - JSON manipulation without the encoding/decoding context
2. **Developer productivity** - Quickly explore and filter large JSON responses
3. **Debugging aid** - Extract specific data from complex nested structures
4. **Consistent with Tooly's philosophy** - Simple, focused tools for everyday coding

---

## 📝 Additional Context

- **Existing similar tools**: [jqplay.org](https://jqplay.org/), [jsonpath.com](https://jsonpath.com/), [json-tree.com](https://json-tree.com/)
- **Use cases**: Exploring API responses, filtering log data, extracting config values, debugging webhook payloads

---

## ✅ Acceptance Criteria

- [ ] New "JSON Tools" tab added to the main navigation
- [ ] JSON input textarea with Format/Clear/Paste buttons
- [ ] Interactive tree view with expand/collapse for all nodes
- [ ] Expand All / Collapse All functionality
- [ ] JQ filter input box with Apply button
- [ ] Basic jq operations supported (path extraction, array indexing, filtering)
- [ ] Error messages for invalid JSON or invalid jq syntax
- [ ] Responsive design matching existing tools
- [ ] State persistence when switching tabs (like other tools)

---

**Thank you for building Tooly! 🧡**
