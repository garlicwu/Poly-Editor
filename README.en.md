# Poly Editor

<div align="center">

English | [简体中文](./README.md)

A modern, open-source visual editor built with Vue 3 + TypeScript

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Vue](https://img.shields.io/badge/Vue-3.4-green.svg)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)

[Live Demo](http://demo.jhu-ai.com/) | [Quick Start](#-quick-start) | [Documentation](#-usage) | [Contributing](CONTRIBUTING.md)

**GitHub**: [https://github.com/garlicwu/polyeditor](https://github.com/garlicwu/polyeditor)
**Gitee**: [https://gitee.com/wu_fan_xin/polyeditor](https://gitee.com/wu_fan_xin/polyeditor)

</div>

---

## 📖 Introduction

Poly Editor is an open-source project derived from **PolyPrint Studio**, a professional layout and translation tool. We've open-sourced the core visual editing functionality to provide the community with a powerful and easy-to-use editor framework.

### Features Overview

Poly Editor is a fully-featured visual editor that provides a PowerPoint-like editing experience, but with more flexibility and customization. Key features include:

- **Multi-page Document Editing**: Create and manage multiple pages, each with independent size and style settings
- **Rich Component Types**: Text, images, icons, shapes, tables, SVG, and more to meet various layout needs
- **Professional Text Editing**: Quill 2.0-based rich text editor with complete text formatting support
- **Precise Layout Control**: Professional layout tools including rulers, grids, snap alignment, and guides
- **Powerful Table Features**: Integrated ag-grid for complex table editing and data display
- **Complete Editing Operations**: Drag, scale, rotate, flip, layer management, grouping, undo/redo, and more
- **PDF Import**: Import PDF files with automatic text recognition (powered by Zhipu AI OCR)
- **Local Storage**: All data saved in browser localStorage, no backend server required, protecting data privacy
- **Data Export**: Export to JSON, standard PDF, and print PDF documents

Use cases: Document layout, poster design, report creation, presentations, certificate generation, form design, and more.

### Full Version Product

**PolyPrint Studio Demo**: [http://demo.jhu-ai.com/](http://demo.jhu-ai.com/)

The full version adds to the open-source version:
- Multi-language translation features
- Cloud storage and collaboration
- More professional templates
- Advanced layout features

Try the full version and support the open-source project!

## 🎉 Latest Updates

### 2026-03-31 Print PDF Export

**New Features**
- ✨ **Print PDF Export**: Added a `Print PDF` button in the top toolbar
  - Supports 3 export switches: `Enable CMYK`, `Embed ICC`, and `Outline Text`
  - Writes the PDF in separate layers: one background layer, one other-shapes layer, one layer per image, and one layer per text component
  - Normal text prioritizes browser-faithful appearance, while `Outline Text` attempts true vector outlining when possible
  - If the font cannot be downloaded, glyphs are missing, or the text structure is unsupported, export falls back to an image layer without aborting

**How to Use**
1. Click `Print PDF` in the top toolbar
2. Enable `Enable CMYK`, `Embed ICC`, and `Outline Text` as needed
3. Click `Export Print PDF`
4. Wait for export to finish and download the file

**Technical Details**
- Uses `renderScale=2` by default
- Background and other-shape layers are mainly captured with `html2canvas`
- Text without rotation or skew prefers `dom-to-image` to reduce layout drift
- True outline conversion is implemented with `pdf-lib + @pdf-lib/fontkit`
- The default ICC profile is `Coated FOGRA39`

### v1.1.0 (2026-03-02)

**New Features**
- ✨ **PDF Import**: Import PDF files with automatic text recognition
  - Integrated Zhipu AI OCR API for document parsing
  - Automatically extract text blocks with position and content
  - Support multi-page PDF documents
  - Configurable default font and size
  - Imported pages automatically inserted after current page

**How to Use**
1. Click "Import PDF" button in the top toolbar
2. Enter Zhipu AI API Key (required for first use)
3. Select PDF file (≤50MB, max 100 pages)
4. Wait for OCR recognition to complete
5. Adjust import settings (optional)
6. Click "Import" button

**Technical Details**
- Uses Zhipu AI glm-ocr model for document parsing
- Supported format: PDF
- File size limit: ≤50MB
- Page limit: Max 100 pages
- API Documentation: [Zhipu AI OCR Service](https://docs.bigmodel.cn/api-reference/%E5%B7%A5%E5%85%B7-api/ocr-%E6%9C%8D%E5%8A%A1)

### Contact Us

- **Email**: 124005421@qq.com
- **WeChat**: melevenalk

Feel free to reach out with any questions, suggestions, or collaboration opportunities!

---

## ✨ Features

### Core Features
- 🎨 **Visual Editing** - WYSIWYG drag-and-drop editing experience
- 📝 **Rich Text Editing** - Professional text editor based on Quill 2.0 with multiple formats
- 🖼️ **Multimedia Support** - Images, icons, shapes, SVG, and more component types
- 📊 **Table Editing** - Powerful table features with ag-grid 35.0
- 📄 **Multi-page Management** - Create, delete, and sort multiple pages
- 🎯 **Precise Positioning** - Rulers, grid lines, snap alignment, and other auxiliary tools

### Editing Capabilities
- ↔️ **Free Transform** - Drag, scale, rotate, flip
- 📐 **Smart Alignment** - Auto-snap, alignment guides, distribution
- 🔄 **Undo/Redo** - Complete operation history
- 📋 **Clipboard** - Copy, paste, cut, delete
- 🎭 **Layer Management** - Bring to front, send to back, move up, move down
- 🔗 **Group Operations** - Group, ungroup, batch selection

### Data Management
- 💾 **Local Storage** - Data saved in browser localStorage, no backend required
- 📤 **JSON Export** - Export complete editing data as JSON
- 📥 **Data Import** - Import previously exported JSON data
- 📄 **PDF Import** - Import PDF files with automatic text recognition (Zhipu AI OCR)
- 📑 **PDF Export** - Export pages as standard PDF documents or print PDF with RGB/CMYK, ICC embedding, and outline-text fallback

## 🚀 Quick Start

### Requirements

- Node.js 22.14.0 or higher (Volta recommended)
- pnpm 10.30.2 or higher

### Installation

```bash
# Clone from GitHub
git clone https://github.com/garlicwu/polyeditor.git

# Or clone from Gitee
# git clone https://gitee.com/wu_fan_xin/polyeditor.git

# Enter project directory
cd polyeditor

# Install dependencies
pnpm install
```

### Development

```bash
# Start development server
pnpm dev

# Visit http://localhost:8081
```

### Build

```bash
# Build for production
pnpm build

# Preview production build
pnpm preview

# Type checking
npx vue-tsc --noEmit
```

### Fonts and Print PDF Configuration

Poly Editor's current font setup is split into 4 layers. Once these layers are clear, it becomes much easier to add fonts or debug why a text block did not get true outline conversion during print PDF export.

#### 1. Font picker source

File:

- `public/poly/config/font-server-list.csv`

Purpose:

- Controls which font names appear in the editor font dropdown
- Only decides whether users can pick a font in the editor UI
- Entries can be system font names or remote font names

Important:

- Being listed here does not guarantee that the actual font file can be downloaded
- It also does not guarantee that print PDF text outlining will work

Example:

```csv
Arial
Verdana
Tahoma
Trebuchet%20MS
Microsoft%20YaHei
```

#### 2. Downloadable font file index

File:

- `src/assets/config/font-server-list.csv`

Purpose:

- This is the real index of downloadable font files
- At runtime the editor uses this file to infer candidate font files for a selected font family
- During true outline conversion for print PDF, the exporter also uses this file to fetch the font bytes and pass them to `fontkit`

Request rule:

- Actual download URL = `${VITE_FONT_URL}/${file name or relative path from font-server-list.csv}`

Example:

```csv
Arial.ttf
Arial%20Black.ttf
Poppins-Regular.otf
OPlusSans3-Regular.ttf
SourceHanSans-Regular.otf
思源黑体.ttf
```

If your `VITE_FONT_URL` is:

```bash
VITE_FONT_URL='https://your-cdn.example.com/fonts'
```

Then the real request URL for `Poppins-Regular.otf` will be:

```text
https://your-cdn.example.com/fonts/Poppins-Regular.otf
```

#### 3. Base fonts preloaded at startup

File:

- `src/assets/config/base-font-list.json`

Purpose:

- Controls which fonts are preloaded first when the editor starts
- These are usually the most common fonts in the project and the most recommended ones for export and layout

Current default example:

```json
[
  "Poppins-Regular",
  "Future-Circle-Regular",
  "Arial",
  "Arial Rounded Bold",
  "NotoSansDevanagari-Regular",
  "OPlusSans3-Regular",
  "SourceHanSans-Regular",
  "思源黑体"
]
```

Recommendation:

- Put frequently used fonts here
- Rarely used fonts do not need to be preloaded, as long as they can still be loaded on demand

#### 4. Mapping from text styles and languages to fonts

Files:

- `src/assets/config/lang-font-list.json`
- `src/assets/config/font-list.json`

Purpose:

- Controls which fonts and font sizes are used by default for different languages and text roles
- For example, body text, heading 1, or table text can each map to different default fonts

Typical examples:

- English body text defaults to `Poppins-Regular`
- Chinese body text defaults to `思源黑体`
- A brand template can force all titles to use its own brand font

#### Environment variable

Files:

- `.env.development`
- `.env.production`

Key variable:

```bash
VITE_FONT_URL='https://huishi-media.oss-cn-hangzhou.aliyuncs.com/translate/font'
```

Meaning:

- This is the base URL used to download remote font files
- If this variable is empty, the editor can still use browser or system fonts for display
- But startup remote font preload and print PDF true outline conversion will not be able to fetch font binaries

#### How the current font loading works

The runtime behavior is:

1. `fontServerInit()` reads `public/poly/config/font-server-list.csv` to build the editor font picker list.
2. `fontInitWithList()` receives the fonts that should be preloaded and tries to load them through `new FontFace(...)`.
3. The actual file candidates are resolved by `resolveFontFileCandidates()` in `src/lib/util.ts`.
4. Candidate matching depends on `src/assets/config/font-server-list.csv`, built-in font grouping rules, and alias mapping.
5. During print PDF true outline conversion, the exporter reuses the same downloadable-font logic to fetch font bytes.

So the answer to "Can we use the fonts already shown in the picker?" is:

- Yes, they can be used in the editor as long as the browser can render them.
- But for remote preload, stable print export, and especially true outline conversion, those fonts must also have downloadable font files configured.

#### Font alias mapping

File:

- `src/lib/util.ts`

Current example:

```ts
const fontFileAliasMap: Record<string, string> = {
  Arialr: 'Arial',
}
```

Purpose:

- Handles cases where the font family used in component data does not exactly match the downloadable file name
- Useful when legacy data, OCR import, or template data uses aliases

You can extend it like this:

```ts
const fontFileAliasMap: Record<string, string> = {
  Arialr: 'Arial',
  BrandSans: 'BrandSans-Regular',
}
```

#### Requirements for true outline conversion in print PDF

For a text block to become real vector outlines instead of an image fallback, all of the following must be true:

- The text structure must be supported by the current outline exporter
- The font family must resolve to a downloadable font file
- `VITE_FONT_URL` must point to a valid remote font directory
- The remote font file must be reachable and readable
- `fontkit` must be able to parse the font
- The required glyphs must exist in that font

If any of these steps fails, the current strategy is to log the reason and fall back to an image layer, so export still succeeds.

#### How to add a new font that supports editor usage and true outline export

1. Upload the font files to your font CDN or object storage.
2. Set `VITE_FONT_URL` to the parent directory of those files.
3. Add the downloadable font file path to `src/assets/config/font-server-list.csv`.
4. Add the font family name to `public/poly/config/font-server-list.csv` so users can pick it.
5. If the display name and file name do not match, add an alias in `fontFileAliasMap`.
6. Optionally add the font to `src/assets/config/base-font-list.json` for startup preload.
7. Optionally update `src/assets/config/lang-font-list.json` or `src/assets/config/font-list.json` to make it the default for certain text styles.

Minimal example:

- CDN file: `BrandSans-Regular.ttf`
- Picker entry: `BrandSans-Regular`
- Optional alias: `BrandSans -> BrandSans-Regular`

#### How to validate the configuration

Recommended validation steps:

1. Open the editor and confirm the font appears in the dropdown.
2. Apply the font to a text component and verify the browser renders it correctly.
3. Reload the page and confirm there are no remote font loading errors in the console.
4. Export with "Print PDF" and enable "Outline Text".
5. If the text still falls back to an image layer, check the debug logs in `print-pdf-export.ts` and `pdf-util.ts`.

#### Recommended practice

- Treat picker fonts and downloadable fonts as two separate configuration layers.
- For fonts used in print export, always prepare real downloadable `.ttf` or `.otf` files.
- Prefer using a small, verified base font set for templates that require stable output.
- If a font is only for browser display and you do not need true outline conversion, it can exist only in the picker list.

## 🛠️ Tech Stack

### Core Framework
- **Vue 3.4** - Progressive JavaScript framework
- **TypeScript 5.8** - Type-safe JavaScript superset
- **Vite 5.3** - Next-generation frontend build tool

### UI and Styling
- **PrimeVue 4.2** - Rich Vue UI component library
- **Tailwind CSS 4.0** - Utility-first CSS framework
- **@tailwindcss/vite** - Tailwind CSS Vite plugin

### State Management
- **Pinia 2.1** - Intuitive state management for Vue (Composition API style)

### Editor Components
- **Quill 2.0.3** - Powerful rich text editor
- **ag-grid 35.0** - Enterprise-grade table component
- **simple-panzoom** - Canvas zoom and pan
- **vue-draggable-plus** - Drag and drop functionality

### Utilities
- **Lodash** - JavaScript utility library
- **Axios** - HTTP client
- **Moment.js** - Date and time handling
- **html2canvas + dom-to-image + jspdf + pdf-lib** - Standard PDF export plus print PDF, layer capture, ICC, and outline support
- **@vueuse/core** - Vue Composition API utilities

## 📁 Project Structure

```
poly-editor/
├── src/
│   ├── assets/              # Static resources
│   │   ├── svg/            # SVG icons
│   │   └── images/         # Image resources
│   ├── export/             # Print PDF export pipeline and hidden render views
│   ├── lib/                # Utilities and configuration
│   │   ├── mitt.ts         # Event bus
│   │   ├── storage.ts      # localStorage wrapper
│   │   ├── pdf-util.ts     # Shared PDF helpers, image/font loaders
│   │   └── mockData.ts     # Mock data
│   ├── net/                # Network requests (retained but no backend dependency)
│   ├── router/             # Router configuration
│   ├── store/              # Pinia state management
│   │   ├── editorStore.ts          # Core editor state
│   │   ├── textEdiotrSotre.ts      # Text editor state
│   │   ├── useAreaMoveStore.ts     # Component movement state
│   │   ├── useTableStateStore.ts   # Table state
│   │   └── useViewDraggerStore.ts  # Drag & drop state
│   ├── style/              # Global styles
│   ├── types/              # TypeScript type definitions
│   └── view/               # View components
│       ├── common/         # Common components
│       │   ├── drager/     # Drag component system
│       │   └── sketch-ruler/ # Ruler component
│       └── editor/         # Editor core
│           ├── component/  # Editor components
│           ├── hooks/      # Composables
│           ├── layout/     # Layout components
│           ├── tool/       # Tool functions
│           └── utils/      # Utilities
├── public/                 # Public resources
├── main/                   # Build output directory
├── CLAUDE.md              # AI development guide
├── CONTRIBUTING.md        # Contributing guide
└── LICENSE                # MIT License
```

## 🎯 Core Features

### 1. Component System

#### Text Component
- Rich text editor based on Quill 2.0.3
- Font, size, color, bold, italic, underline support
- Alignment options (left, center, right, justify)
- Line height and letter spacing adjustment
- Ordered and unordered lists
- Text background color

#### Image Component
- Local image upload
- Image scaling and cropping
- Image rotation and flipping
- Image library management (categories, search)

#### Icon Component
- Built-in icon library
- SVG icon support
- Custom icon colors
- Icon size adjustment

#### Shape Component
- Basic shapes: rectangle, circle, triangle, etc.
- Fill and border color support
- Border width and style adjustment

#### Table Component
- Based on ag-grid 35.0
- Cell editing support
- Row and column insertion/deletion
- Custom table styling
- Data sorting and filtering

#### SVG Component
- SVG graphics editing
- Dedicated SVG editor page
- Path editing support

### 2. Editing Features

#### Selection and Transform
- **Single Selection**: Click to select a component
- **Multi-Selection**: Ctrl/Cmd + click multiple components
- **Box Selection**: Drag to select multiple components
- **Move**: Drag components or use arrow keys (Shift for acceleration)
- **Scale**: Drag control points to resize
- **Rotate**: Drag rotation control point
- **Flip**: Horizontal and vertical flip

#### Alignment and Distribution
- **Align**: Left, right, top, bottom, horizontal center, vertical center
- **Distribute**: Horizontal and vertical distribution
- **Snap**: Auto-snap to other components or canvas edges
- **Alignment Guides**: Real-time alignment reference lines

#### Layer Management
- **Bring to Front**: Move component to top layer
- **Send to Back**: Move component to bottom layer
- **Bring Forward**: Move up one layer
- **Send Backward**: Move down one layer
- **Group**: Combine multiple components into one
- **Ungroup**: Dissolve group

#### Clipboard Operations
- **Copy** (Ctrl/Cmd + C): Copy selected components
- **Paste** (Ctrl/Cmd + V): Paste copied components
- **Cut** (Ctrl/Cmd + X): Cut selected components
- **Delete** (Delete): Delete selected components
- **Select All** (Ctrl/Cmd + A): Select all components on current page
- **Duplicate** (Ctrl/Cmd + D): Quick duplicate selected components

#### Undo and Redo
- **Undo** (Ctrl/Cmd + Z): Undo last operation
- **Redo** (Ctrl/Cmd + Y): Redo last operation
- Unlimited undo/redo support
- Operation history tracking

### 3. Page Management

#### Page Operations
- **New Page**: Create new blank page
- **Delete Page**: Delete current page
- **Duplicate Page**: Copy current page with all components
- **Page Sorting**: Drag to adjust page order
- **Page Preview**: Real-time preview of all pages in left panel

#### Page Settings
- **Page Size**: Preset sizes like A4, A3, A5, Letter, etc.
- **Custom Size**: Support custom width and height
- **DPI Settings**: Adjust page resolution (72-300 DPI)
- **Page Orientation**: Landscape or portrait
- **Page Numbers**: Custom page number style and position

### 4. Canvas Features

#### View Control
- **Zoom**: 10% - 300% zoom range
- **Pan**: Drag canvas to pan
- **Fit to Window**: Auto-adjust zoom to fit window
- **Actual Size**: 100% display

#### Auxiliary Tools
- **Ruler**: Display horizontal and vertical rulers
- **Grid**: Show grid lines for alignment assistance
- **Guides**: Drag from ruler to create guides
- **Snap**: Auto-snap to grid, guides, and other components

### 5. Data Management

#### Local Storage
- All editing data auto-saved to browser localStorage
- No backend server required, fully offline capable
- Support for multiple independent projects

#### Data Export
- **JSON Export**: Export complete editing data as JSON
- **Copy to Clipboard**: One-click copy JSON data
- **Download File**: Download JSON file locally

#### Data Import
- **JSON Import**: Import previously exported JSON data
- **Data Recovery**: Restore from backup

#### PDF Export
- Export all pages as a standard PDF document
- Support print PDF export with RGB or CMYK image pipeline
- The top toolbar provides a `Print PDF` entry with `CMYK / ICC / Outline Text` switches
- Optional ICC OutputIntent embedding for print workflows
- Optional true outline conversion for supported text blocks, with image fallback when outlining is not possible
- Export progress display

## 📝 Usage

### Basic Operations

1. **Create New Page**
   - Click "+" button at bottom of left panel
   - Or right-click page list and select "New Page"

2. **Add Components**
   - Select component type from left panel (text, image, icon, shape, table)
   - Drag onto canvas
   - Or click component then click on canvas to place

3. **Edit Components**
   - Click to select component
   - Drag to move position
   - Drag control points to resize
   - Drag rotation control point to rotate
   - Right-click to open context menu for more operations

4. **Text Editing**
   - Double-click text component to enter edit mode
   - Use top toolbar to adjust text style
   - Keyboard shortcuts supported (Ctrl+B bold, Ctrl+I italic, etc.)

5. **Save Data**
   - Click "Save" button at top
   - Data auto-saved to browser locally
   - Export dialog appears with option to copy or download JSON

### Print PDF Export

1. **Open the export panel**
   - Click the `Print PDF` button on the right side of the top toolbar
   - Click `Export Print PDF` in the popover

2. **Configure export options**
   - `Enable CMYK`: writes the PDF through the CMYK image pipeline; if disabled, export uses RGB
   - `Embed ICC`: available only when CMYK is enabled; embeds the default ICC profile as PDF OutputIntent
   - `Outline Text`: attempts true outline conversion for supported text; falls back to an image layer on failure

3. **Current export strategy**
   - Background, shapes, images, and text are written into separate PDF layers
   - Background and other-shape layers are mainly captured with `html2canvas`
   - Text without rotation or skew prefers `dom-to-image`
   - The default export scale is `renderScale=2`

4. **Font notes**
   - If you need true outline conversion, also read the "Fonts and Print PDF Configuration" section above
   - Text is converted to vector paths only when the font is downloadable, the glyphs exist, and the text structure is supported
   - Otherwise debug logs are recorded and the exporter falls back to an image layer automatically

### Keyboard Shortcuts

#### Editing Operations
- `Ctrl/Cmd + C` - Copy
- `Ctrl/Cmd + V` - Paste
- `Ctrl/Cmd + X` - Cut
- `Ctrl/Cmd + D` - Duplicate
- `Ctrl/Cmd + A` - Select All
- `Delete` - Delete
- `Ctrl/Cmd + Z` - Undo
- `Ctrl/Cmd + Y` - Redo

#### Movement and Alignment
- `↑ ↓ ← →` - Move component (1px)
- `Shift + ↑ ↓ ← →` - Fast move (10px)
- `Ctrl/Cmd + Shift + E` - Toggle alignment guides
- `Ctrl/Cmd + Shift + Y` - Delete all guides
- `Ctrl/Cmd + Shift + U` - Delete current page guides

### Advanced Tips

1. **Batch Editing**
   - Hold Ctrl/Cmd and click multiple components
   - Or box select multiple components
   - Adjust position, size, and style uniformly

2. **Precise Positioning**
   - Use rulers and guides
   - Enable grid snap
   - Use alignment tools

3. **Component Reuse**
   - Copy frequently used components
   - Use group feature to create templates
   - Copy and paste across pages

4. **Performance Optimization**
   - Avoid too many components per page (recommended < 100)
   - Compress large images before use
   - Regularly clean up unnecessary pages

## 📋 Roadmap (TODO)

### 🔥 High Priority

#### PDF Import Enhancements
- [ ] **PDF Image Extraction & Display**
  - Extract actual images from PDF using PDF.js
  - Replace placeholders with real images
  - Support image compression and optimization
  - Maintain original aspect ratio

- [ ] **LaTeX Formula Rendering**
  - Integrate MathJax or KaTeX library
  - Support visual formula rendering
  - Keep original LaTeX code editable
  - Support inline and display formulas

- [ ] **HTML Format Preservation**
  - Complete HTML to Quill DeltaOps conversion
  - Preserve bold, italic, underline, colors, etc.
  - Support lists, links, and complex formats
  - Optimize conversion accuracy

- [ ] **PDF Table Recognition**
  - Recognize table structure in PDF
  - Auto-create ag-grid table components
  - Preserve table styles and data
  - Support merged cells

### 🎨 Core Editor Features

- [ ] **Image Editing Enhancement**
  - Image crop, filters, adjustments
  - Image compression and format conversion
  - Support modern formats like WebP
  - Batch image processing

- [ ] **Collaboration Features**
  - Real-time collaborative editing (WebSocket)
  - Version history and rollback
  - Comments and annotations
  - Permission management

- [ ] **Template System**
  - Pre-built template library
  - Custom template saving
  - Template categorization and search
  - Template marketplace

- [ ] **Keyboard Shortcuts Enhancement**
  - Customizable shortcuts
  - Shortcut conflict detection
  - Shortcuts help panel
  - Import/export shortcut configs

### 🚀 Performance Optimization

- [ ] **Virtual Scrolling**
  - Optimize for large component scenarios
  - Virtual list rendering
  - Lazy loading components
  - Memory management optimization

- [ ] **Undo/Redo Optimization**
  - Incremental storage strategy
  - History compression
  - Configurable history limits
  - Large document performance

- [ ] **Export Performance**
  - PDF export progress optimization
  - Chunked export for large documents
  - Export queue management
  - Background export support

### 📱 Mobile Support

- [ ] **Responsive Design**
  - Mobile UI adaptation
  - Touch gesture support
  - Mobile toolbar
  - PWA support

- [ ] **Mobile Editing**
  - Simplified editing mode
  - Touch drag optimization
  - Virtual keyboard adaptation
  - Mobile preview

### 🔌 Plugin System

- [ ] **Plugin Architecture**
  - Plugin API design
  - Plugin lifecycle
  - Plugin marketplace
  - Official plugin examples

- [ ] **Third-party Integrations**
  - Google Fonts integration
  - Unsplash image library
  - Iconify icon library
  - AI-assisted writing

### 🌐 Internationalization

- [ ] **Multi-language Support**
  - English interface
  - Japanese interface
  - Other language extensions
  - RTL language support

- [ ] **Localization**
  - Date/time formats
  - Number formats
  - Currency formats
  - Timezone support

### 🛠️ Developer Experience

- [ ] **Documentation**
  - API documentation
  - Component documentation
  - Usage examples
  - Video tutorials

- [ ] **Test Coverage**
  - Unit tests
  - Integration tests
  - E2E tests
  - Performance tests

- [ ] **Development Tools**
  - Component debug panel
  - Performance profiler
  - Logging system
  - Error tracking

### 💡 Innovative Features

- [ ] **AI Assistance**
  - AI auto-layout
  - AI content generation
  - AI image description
  - AI smart suggestions

- [ ] **Smart Alignment**
  - ML-optimized alignment algorithms
  - Smart grid suggestions
  - Auto-distribution optimization
  - Intelligent spacing adjustment

- [ ] **Version Control**
  - Git integration
  - Diff comparison
  - Branch management
  - Merge conflict resolution

- [ ] **Data Visualization**
  - Chart integration (ECharts/Chart.js)
  - Data source binding
  - Real-time data updates
  - Interactive charts

### 🔐 Security & Privacy

- [ ] **Data Encryption**
  - Local data encryption
  - Export file encryption
  - Password protection
  - Permission validation

- [ ] **Privacy Protection**
  - Privacy mode
  - Sensitive info detection
  - Watermark support
  - Content moderation

### 📦 Other Improvements

- [ ] **Import Support**
  - Word document import
  - PowerPoint import
  - Markdown import
  - HTML import

- [ ] **Export Enhancement**
  - Export as images (PNG/JPG/SVG)
  - Export as video (MP4/GIF)
  - Batch export
  - Custom export templates

- [ ] **Cloud Storage**
  - Alibaba Cloud OSS
  - Tencent Cloud COS
  - AWS S3
  - Custom storage backend

---

### 🎯 How to Contribute

If you're interested in any of these features:

1. **Submit Issue** - Discuss feature design and implementation
2. **Fork & PR** - Implement features and submit Pull Requests
3. **Feedback** - Suggest new features and improvements
4. **Testing** - Help test new features and report issues

See [Contributing Guide](CONTRIBUTING.md) for more details.

## 🤝 Contributing

We welcome all forms of contribution! Please see [Contributing Guide](CONTRIBUTING.md) for details.

### How to Contribute

1. Fork this repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Create Pull Request

### Development Guidelines

- Write code in TypeScript
- Follow ESLint and Prettier configuration
- Write clear commit messages
- Add appropriate comments for new features

## 📄 License

This project is licensed under the [MIT License](LICENSE).

The MIT License is a permissive open-source license that allows you to:
- ✅ Commercial use
- ✅ Modify code
- ✅ Distribute
- ✅ Private use

The only requirement is to include the original license and copyright notice in all copies.

## 📮 Contact

### Project Maintainers

- **Email**: 124005421@qq.com
- **WeChat**: melevenalk

### Community Support

- **GitHub Repository**: [https://github.com/garlicwu/polyeditor](https://github.com/garlicwu/polyeditor)
- **Gitee Repository**: [https://gitee.com/wu_fan_xin/polyeditor](https://gitee.com/wu_fan_xin/polyeditor)
- **Submit Issues**: [GitHub Issues](https://github.com/garlicwu/polyeditor/issues) | [Gitee Issues](https://gitee.com/wu_fan_xin/polyeditor/issues)
- **Full Version**: [PolyPrint Studio](http://demo.jhu-ai.com/)

Feel free to reach out through any of the above channels for technical questions, feature suggestions, or business collaboration!

## 🙏 Acknowledgments

This project uses the following excellent open-source projects:

- [Vue.js](https://vuejs.org/) - Progressive JavaScript framework
- [Vite](https://vitejs.dev/) - Next-generation frontend build tool
- [PrimeVue](https://primevue.org/) - Vue UI component library
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Quill](https://quilljs.com/) - Rich text editor
- [ag-grid](https://www.ag-grid.com/) - Table component
- [Pinia](https://pinia.vuejs.org/) - Vue state management
- [VueUse](https://vueuse.org/) - Vue Composition API utilities
- [drager](https://github.com/vangleer/es-drager) - 基于 vue3.x + CompositionAPI + typescript + vite 的可拖拽、缩放、旋转的组件
- [vue3-sketch-ruler](https://github.com/kakajun/vue3-sketch-ruler) - Vue3 低代码平台操作页面缩放工具

Thanks to all open-source community contributors!

## 🗺️ Screenshots

### Main Interface

<div align="center">
  <img src="https://huishi-media.oss-cn-hangzhou.aliyuncs.com/showdemo/demo/1.png" alt="Main Interface" width="800"/>
  <p><em>Main editing interface - Multi-page management with real-time preview</em></p>
</div>

### Text Editing

<div align="center">
  <img src="https://huishi-media.oss-cn-hangzhou.aliyuncs.com/showdemo/demo/2.png" alt="Text Editing" width="800"/>
  <p><em>Rich text editing - Multiple text formats and styles</em></p>
</div>

### Component Library

<div align="center">
  <img src="https://huishi-media.oss-cn-hangzhou.aliyuncs.com/showdemo/demo/3.png" alt="Component Library" width="800"/>
  <p><em>Rich component library - Images, icons, shapes, and more</em></p>
</div>

### Table Editing

<div align="center">
  <img src="https://huishi-media.oss-cn-hangzhou.aliyuncs.com/showdemo/demo/4.png" alt="Table Editing" width="800"/>
  <p><em>Powerful table features - Based on ag-grid</em></p>
</div>

### Precise Alignment

<div align="center">
  <img src="https://huishi-media.oss-cn-hangzhou.aliyuncs.com/showdemo/demo/5.png" alt="Precise Alignment" width="800"/>
  <p><em>Rulers and alignment guides - Professional layout tools</em></p>
</div>

### Layer Management

<div align="center">
  <img src="https://huishi-media.oss-cn-hangzhou.aliyuncs.com/showdemo/demo/6.png" alt="Layer Management" width="800"/>
  <p><em>Layer management - Easy control of element hierarchy</em></p>
</div>

### Page Settings

<div align="center">
  <img src="https://huishi-media.oss-cn-hangzhou.aliyuncs.com/showdemo/demo/7.png" alt="Page Settings" width="800"/>
  <p><em>Page settings - Custom size and DPI</em></p>
</div>

### Export Features

<div align="center">
  <img src="https://huishi-media.oss-cn-hangzhou.aliyuncs.com/showdemo/demo/8.png" alt="Export Features" width="800"/>
  <p><em>Data export - JSON and PDF format support</em></p>
</div>

---

<div align="center">

Made with ❤️ by Poly Editor Contributors

</div>

