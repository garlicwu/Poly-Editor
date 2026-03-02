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
- **Data Export**: Export to JSON format and PDF documents

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
- 📑 **PDF Export** - Export pages as PDF documents

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
- **html2canvas + jspdf** - PDF export functionality
- **@vueuse/core** - Vue Composition API utilities

## 📁 Project Structure

```
poly-editor/
├── src/
│   ├── assets/              # Static resources
│   │   ├── svg/            # SVG icons
│   │   └── images/         # Image resources
│   ├── lib/                # Utilities and configuration
│   │   ├── mitt.ts         # Event bus
│   │   ├── storage.ts      # localStorage wrapper
│   │   ├── pdf-util.ts     # PDF export utility
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
- Export all pages as PDF document
- Custom PDF size and quality
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

