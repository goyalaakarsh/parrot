# Parrot 🦜

A lightweight, Windows-only desktop tray prompt manager built using Tauri v2, React, TypeScript, and Tailwind CSS. Securely store, search, and instantly paste frequently used AI prompts or text snippets into any active input field.

<!-- screenshot -->

## Features

- **System Tray Residency**: Lives in the Windows system tray (bottom-right corner) with click toggles and custom right-click menus.
- **Global Shortcut Trigger**: Press `Ctrl+Shift+Space` anywhere to summon/dismiss the Parrot window.
- **Inline Typing Trigger**: Type `/parrot:"your-search-query"` inside *any* editor or text field (e.g. Notepad, Chrome, Word) to bring up the search popup near the bottom right. Click on a search match to erase the trigger and automatically insert the prompt.
- **Auto-Paste Flow**: Restore focus to the target application, sleep 150ms to prevent glitches, and inject keystrokes via simulated input.
- **Local Storage**: Fully offline and stored as JSON under `{app_data_dir}/parrot/`—no databases, no network requests.
- **Keyboard Navigation**: Fully navigatable using Arrow keys, Enter, Shift+Enter, and Escape.

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+Space` | Toggle Parrot popup |
| `Arrow Up / Arrow Down` | Navigate prompt cards |
| `Enter` | Copy body of selected prompt to clipboard and close window |
| `Shift+Enter` | Copy + Auto-paste selected prompt directly into previous active window |
| `Escape` | Close/hide window |

---

## Installation

1. Go to the [Releases](https://github.com/your-username/parrot/releases) tab.
2. Download the latest `Parrot_0.1.0_x64_en-US.msi` installer.
3. Run the installer and follow the instructions to install.

---

## Build from Source

### Prerequisites

- [Node.js v20+](https://nodejs.org/)
- [Rust toolchain](https://www.rust-lang.org/tools/install) (cargo, rustc, and Windows SDK dependencies)

### Local Development

1. Clone the repository and navigate to the project directory:
   ```bash
   git clone https://github.com/your-username/parrot.git
   cd parrot
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Run the application in development mode:
   ```bash
   npm run tauri dev
   ```

### Production Packaging

Compile the React frontend assets and package the production executable:
```bash
npm run tauri build
```
The final executable and installer will be located in:
`src-tauri/target/release/bundle/`

---

## Contributing

We welcome issues and pull requests! Please ensure any code changes pass linting and compilation before submitting.
