# AGENTS.md

This file provides coding guidelines and commands for agentic coding assistants working in this repository.

## Build & Quality Commands

```bash
# Development
npm run dev        # Start dev server on port 8081
npm run debug      # Start dev server with debug mode

# Build
npm run build      # Production build to /main directory
npm run preview    # Preview production build

# Type Checking
npx vue-tsc --noEmit    # TypeScript type checking

# Linting (via Vite plugin)
# ESLint runs automatically via vite-plugin-eslint during dev/build
# Manual linting: npx eslint . --ext .ts,.tsx,.vue
```

**Note**: No test framework is currently configured. Add test setup if implementing tests.

## Project Overview

- **Stack**: Vue 3 + TypeScript + Vite
- **UI Framework**: PrimeVue 4 + Tailwind CSS 4
- **State Management**: Pinia (composition API style)
- **HTTP Client**: Axios with custom interceptors
- **Node Version**: 22.14.0 (managed by Volta)

## Code Style Guidelines

### Imports

- Use `@/` alias for src directory imports (configured in vite.config.ts)
- Named imports preferred: `import {ref, computed} from 'vue'`
- Vue composition imports: `import {onMounted, onUnmounted} from 'vue'`
- PrimeVue components are auto-imported via `unplugin-vue-components`

### Formatting (Prettier)

```json
{
  "semi": false, // No semicolons
  "singleQuote": true, // Single quotes
  "tabWidth": 2, // 2-space indentation
  "printWidth": 240, // Long lines allowed
  "arrowParens": "always", // Always wrap arrow function params
  "bracketSpacing": false // No spaces in object literals
}
```

### TypeScript

- Strict mode enabled in tsconfig.json
- Use `interface` for object shapes, `type` for unions/primitives
- Generic types with angle brackets: `Promise<AxiosResponse<T>>`
- Any types allowed with `@typescript-eslint/no-explicit-any: 'off'`
- Type imports: `import type {AxiosResponse} from 'axios'`

### Naming Conventions

- **Components**: PascalCase (e.g., `EditorComponent`, `SketchRulerProps`)
- **Variables/Functions**: camelCase (e.g., `currentPage`, `addComponentAction`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `EComponentType`, `defaultSketchRulerWidth`)
- **Event Emitters**: Prefix with `on` (e.g., `onDotMousedown`, `handleRotateEnd`)
- **Type definitions**: PascalCase with `I` prefix (e.g., `IComponentInfo`, `IEditorInfo`)

### Vue Components

- Use `<script setup lang="ts">` syntax
- Destructure props: `const props = defineProps({...})`
- Define emits: `const emit = defineEmits(['change', 'drag'])`
- Refs: `const dragRef = ref<HTMLElement | null>(null)`
- Computed: `const showResize = computed(() => props.resizable && !props.disabled)`
- Lifecycle: `onMounted(() => {...})`, `onUnmounted(() => {...})`
- Template refs: Access via `(el) => ref.value = el`

### State Management (Pinia)

- Use composition API: `defineStore('editor', () => {...})`
- Internal state: `const _editorInfo = ref<IEditorInfo>(...)`
- Computed getters: `const currentPage = computed(() => _currentPage.value)`
- Actions as regular functions (no mutations in Pinia v2)
- Deep clone when needed: `import {cloneDeep} from 'lodash'`

### Error Handling

- HTTP errors: Handled in `src/net/httpRequest.ts` via axios interceptors
- Use try/catch for async operations with `console.error(e)`
- Toast notifications via PrimeVue: `useToast().add({severity: 'error', ...})`
- Auth errors (401): Emit `MittTypeEnum.Toast_Message` with re-login group

### API Requests

- Base URL: `import.meta.env.VITE_APP_BASE_API` (set in .env files)
- Use `HttpRequest` class from `@/net/httpRequest`
- Custom headers: `x-access-token` auto-added from localStorage
- Response types: `Result<T>` with `{code, message, data}` structure
- Error codes: 200=success, 400/401/403/404/500 etc. handled in interceptors

### CSS & Styling

- Tailwind CSS v4 (via `@tailwindcss/vite` plugin)
- PrimeVue theme: Aura with custom primary colors
- Scoped styles in Vue: `<style scoped>`
- CSS modules not used; prefer Tailwind utility classes
- Stylelint configured for SCSS, CSS, and Vue files

### Router

- File-based routes in `src/router/index.ts`
- Lazy loading: `component: () => import('../view/editor/editor-main-page.vue')`
- Route meta: `meta: {title: '编辑', keepAlive: false}`
- Custom types extended: `interface RouteMeta` in `src/types/global.d.ts`

### Directory Structure

```
src/
├── components/     # Reusable Vue components
├── hooks/          # Composition API hooks (use* naming)
├── lib/            # Utilities, storage, helpers
├── net/            # HTTP requests, API layer
├── router/         # Vue Router configuration
├── store/          # Pinia stores (composition style)
├── types/          # TypeScript type definitions
├── view/           # Page-level components
└── assets/         # Static assets (fonts, svg, images)
```

### Important Patterns

- **Event Bus**: Uses mitt (`@/lib/mitt`) for cross-component communication
- **Local Storage**: `LStorage` wrapper in `@/lib/storage`
- **Deep Cloning**: `cloneDeep` from lodash for immutable updates
- **Unique IDs**: `uniqueId('cache_operation')` for history tracking
- **Component IDs**: Timestamp-based: `pageId + 'C' + timestamp`
- **Font Loading**: Custom font init in `@/lib/font-face-list.ts`

### ESLint Rules

- Prettier warnings (not errors)
- Unused vars: off (TypeScript handles this)
- Explicit return types: off
- Any types: off
- Vue recommended rules enabled

### Environment Variables

- Development: `.env.development`
- Production: `.env.production`
- Access via `import.meta.env.VITE_*`
- Required: `VITE_APP_BASE_API`, `VITE_FONT_URL`
