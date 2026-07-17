<p align="center">
  <img src="public/parrot-icon-transparent.png" width="128" height="128" alt="Parrot Logo" />
</p>

<h1 align="center">Parrot</h1>

<p align="center">
  A lightweight, high-performance desktop tray prompt manager built using <b>Tauri v2</b>, <b>React</b>, <b>TypeScript</b>, and <b>Tailwind CSS</b>. Securely store, search, and instantly paste frequently used AI prompts or text snippets into any active input field.
</p>

<p align="center">
  <a href="https://tauri.app/"><img src="https://img.shields.io/badge/Tauri-v2-blue?logo=tauri&logoColor=white" alt="Tauri v2" /></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-v18-61dafb?logo=react&logoColor=white" alt="React" /></a>
  <a href="https://www.rust-lang.org/"><img src="https://img.shields.io/badge/Rust-1.75%2B-orange?logo=rust&logoColor=white" alt="Rust" /></a>
  <a href="https://microsoft.com/windows"><img src="https://img.shields.io/badge/Platform-Windows-blue?logo=windows&logoColor=white" alt="Platform" /></a>
  <a href="https://github.com/goyalaakarsh/parrot/releases/latest"><img src="https://img.shields.io/github/v/release/goyalaakarsh/parrot?label=Download&logo=github" alt="Download" /></a>
</p>

---

## Features

- **System Tray Residency**: Runs quietly in your system tray. Left-click toggles the popup; right-click opens a custom dark-themed context menu.
- **Persistent Relocated Position**: Drag the window from any empty space. Parrot remembers your position.
- **Global Shortcut Trigger**: Press `Ctrl+Shift+Space` (configurable) from any application to toggle the window.
- **Auto-Paste Flow**: Intelligently restores focus to your previous window and pastes using simulated keystrokes.
- **Keyboard-First Navigation**: Every action has a keyboard shortcut � no mouse required.
- **Local Storage**: Fully offline. Data stored as structured JSON � no databases, no network calls.

---

## Keyboard Navigation & Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+Space` | Toggle Parrot popup (default, customizable in Settings) |
| `Arrow Up` / `Arrow Down` | Navigate prompt cards |
| `Enter` | Auto-paste selected prompt into previous active window |
| `Shift+Enter` | Copy selected prompt to clipboard (without pasting) |
| `Escape` | Close window / Cancel add/edit/delete / Go back from Settings |
| `Ctrl+N` | Open Add Prompt panel |
| `Ctrl+E` | Edit selected prompt |
| `Ctrl+D` or `Delete` | Delete selected prompt (Enter to confirm, Escape to cancel) |
| `Ctrl+,` | Open Settings |
| `Ctrl+Enter` | Save prompt in Add/Edit panel |
| `Arrow Left` / `Arrow Right` | Navigate Cancel/Delete buttons in confirmation |
| `Tab` | Move focus between interactive elements |

**Tray Menu (right-click tray icon):**
| Shortcut | Action |
|---|---|
| `Arrow Up` / `Arrow Down` | Navigate menu items |
| `Enter` | Select menu item |
| `Escape` | Close tray menu |

---

## Installation

Download the latest installer from the [Releases page](https://github.com/goyalaakarsh/parrot/releases/latest) (or click the badge above), then run the MSI and launch Parrot from your desktop or start menu.

---

## Build from Source

### Prerequisites

- [Node.js v20+](https://nodejs.org/)
- [Rust toolchain](https://www.rust-lang.org/tools/install) (cargo, rustc, and Windows SDK dependencies)

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/goyalaakarsh/parrot.git
   cd parrot
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Run in development mode:
   ```bash
   npm run tauri dev
   ```

### Production Packaging

```bash
npm run tauri build
```

The installer will be in `src-tauri/target/release/bundle/`.

---

## Accessibility

Parrot is built with accessibility as a core principle:
- Full keyboard navigation with visible focus rings
- ARIA roles (`listbox`, `option`, `menu`, `menuitem`, `switch`, `alert`)
- Screen reader support with `aria-label`, `aria-selected`, `aria-checked`
- `prefers-reduced-motion` support
- Semantic HTML with proper label associations

---

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) and our [Code of Conduct](CODE_OF_CONDUCT.md).

---

## License

MIT License. See [LICENSE](LICENSE) for details.
