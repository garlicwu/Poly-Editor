# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
pnpm install         # Install dependencies
pnpm dev             # Dev server on port 8081
pnpm build           # Production build to /main
pnpm preview         # Preview production build
npx vue-tsc --noEmit # TypeScript type checking
```

## Tech Stack

- Vue 3 + TypeScript + Vite
- PrimeVue 4 + Tailwind CSS 4
- Pinia (composition API style)
- Quill 2.0.3 (rich text editor)
- ag-grid 35.0.0 (table/grid component)
- simple-panzoom (canvas zoom/pan)
- html2canvas + jspdf (PDF export)
- vue-draggable-plus (drag & drop)
- Node 22.14.0 + pnpm 10.30.2 (Volta)
- LocalStorage for data persistence (no backend required)

## Code Style

- No semicolons, single quotes, 2-space indent
- 240 char line width
- Use `@/` alias for src imports
- PrimeVue components auto-imported

## Architecture

### State Management (src/store/)
- editorStore.ts - Main editor state, pages, components, undo/redo, canvas/ruler config
- textEdiotrSotre.ts - Text formatting state (Quill editor)
- useAreaMoveStore.ts - Component movement and positioning
- useTableStateStore.ts - ag-grid table state
- useViewDraggerStore.ts - Drag & drop state

### Data Persistence
- All data stored in browser localStorage via LStorage wrapper (`@/lib/storage`)
- No backend API required - fully standalone frontend application
- JSON export/import for data portability
- Auto-save functionality removed (manual save only)

### Canvas & Rendering System
- sketch-ruler (src/view/common/sketch-ruler/) - Canvas ruler with snap guides
- es-drager (src/view/common/drager/) - Custom drag/resize/rotate component system
- simple-panzoom integration for zoom/pan with scale 0.1-3x
- Canvas dimensions stored in editorStore._post (SketchRulerProps)

### Component System
- EditorComponent (src/view/editor/component/editorComponentInit.ts) - Component factory
- Component types defined in EComponentType enum: Text, Image, Icon, Shape, Table, SVG, Group
- Each component has unique ID: pageId + 'C' + timestamp
- Components rendered in area-view.vue with drager wrapper
- All components extend IComponentInfo interface with common properties:
  - componentId, componentType, left, top, width, height, rotate, selected, zIndex, lock

### Rich Text Editing
- Quill 2.0.3 for text components (quill-text-view.vue)
- Custom toolbar and formatting stored in textEdiotrSotre
- Auto-resize utility (quill-text-auto-resize-util.ts)
- Display mode: quill-text-display-view.vue

### PDF Export
- pdf-util.ts - Export pages to PDF using html2canvas + jspdf
- Progress tracking via editorStore.pdfExportProgressValue
- Handles multi-page documents with page breaks

### Event Communication
- mitt event bus (`@/lib/mitt`) for cross-component events
- Key events: toastMessage, pagePreviewRefresh, windowResize

### Undo/Redo System
- History stored in editorStore.history: {undo: [], redo: []}
- IOperationHistory tracks state changes
- Deep clone with lodash cloneDeep for state snapshots

### Key Patterns
- Component IDs: pageId + 'C' + timestamp
- Deep clone with lodash cloneDeep for state updates
- LStorage wrapper for localStorage (`@/lib/storage`)
- Font size conversion: pt ↔ px (dealFontsizePt2Px)

### Keyboard Shortcuts (src/view/editor/hooks/useActions.ts)
- Ctrl+X: Cut component
- Ctrl+C: Copy component
- Ctrl+V: Paste component
- Ctrl+A: Select all components
- Ctrl+D: Duplicate component
- Ctrl+Z: Undo
- Ctrl+Y: Redo
- Delete: Remove component
- Ctrl+Shift+E: Toggle mark lines
- Ctrl+Shift+Y: Delete all mark lines
- Ctrl+Shift+U: Delete current page mark lines

### Layout Structure (src/view/editor/layout/)
- topLayout/ - Top toolbar with editing tools and controls
- leftLayout/ - Left sidebar with page preview and component library
- centerLayout/ - Main canvas area with ruler and components

## Build Configuration

- Base path: `/` (root)
- Output directory: `main/`
- Dev server port: 8081
- Target: ES2015 with legacy plugin
- Console logs removed in production
- Vendor chunks split by node_modules
- SVG icons injected from src/assets/svg/
- Auto-import: PrimeVue components via unplugin-vue-components

## Naming Conventions

- Components: PascalCase (EditorComponent)
- Types: PascalCase with I prefix (IComponentInfo)
- Enums: PascalCase with E prefix (EComponentType)
- Variables/Functions: camelCase
- Constants: UPPER_SNAKE_CASE

## Important Files

- src/store/editorStore.ts - Core editor logic, canvas config, undo/redo
- src/store/textEdiotrSotre.ts - Text editor state and formatting
- src/store/useAreaMoveStore.ts - Component movement and positioning
- src/lib/mitt.ts - Event bus definitions
- src/lib/pdf-util.ts - PDF export logic
- src/lib/storage.ts - LocalStorage wrapper
- src/view/common/drager/ - Drag/resize/rotate system
- src/view/common/sketch-ruler/ - Canvas ruler component
- src/view/editor/component/ - Component renderers (text, image, table, etc.)
- src/view/editor/component/editorComponentInit.ts - Component factory
- src/view/editor/utils/common-modle.ts - Core type definitions (IComponentInfo, IEditorPageInfo, etc.)
- src/view/editor/hooks/useActions.ts - Editor actions and keyboard shortcuts

## Removed Features (Open Source Cleanup)

The following features have been removed to prepare for open source release:

- Translation features (Chinese-English, multilingual translation)
- Backend API integration and authentication
- User management and profiles
- Terminology/term management system
- Batch image replacement functionality
- Auto-save settings
- Export/import buttons (kept JSON save functionality)
- Help system
- Editor comparison functionality

## Project Information

- License: MIT
- Repository: https://github.com/garlicwu/polyeditor
- Mirror: https://gitee.com/wu_fan_xin/polyeditor
- Demo: http://demo.jhu-ai.com/
- Derived from: PolyPrint Studio (commercial product with translation features)
- Documentation: See README.md and README.en.md for detailed usage instructions

