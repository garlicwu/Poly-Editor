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
- Node 22.14.0 (Volta)
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
- Component types: Text (Quill), Image, Shape, Table (ag-grid), SVG
- Each component has unique ID: pageId + 'C' + timestamp
- Components rendered in area-view.vue with drager wrapper

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

## Build Configuration

- Base path: `/poly`
- Output directory: `main/`
- Target: ES2015 with legacy plugin
- Console logs removed in production
- Vendor chunks split by node_modules
- SVG icons injected from src/assets/svg/

## Naming Conventions

- Components: PascalCase (EditorComponent)
- Types: PascalCase with I prefix (IComponentInfo)
- Enums: PascalCase with E prefix (EComponentType)
- Variables/Functions: camelCase
- Constants: UPPER_SNAKE_CASE

## Important Files

- src/store/editorStore.ts - Core editor logic, canvas config, undo/redo
- src/lib/mitt.ts - Event bus definitions
- src/lib/pdf-util.ts - PDF export logic
- src/lib/storage.ts - LocalStorage wrapper
- src/view/common/drager/ - Drag/resize/rotate system
- src/view/common/sketch-ruler/ - Canvas ruler component
- src/view/editor/component/ - Component renderers (text, image, table, etc.)
- src/types/ - TypeScript type definitions

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
