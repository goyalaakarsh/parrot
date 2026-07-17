# Contributing to Parrot

First off, thank you for considering contributing to Parrot! We welcome contributions from everyone.

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How to Contribute

### Reporting Bugs

1. Check the [issues](https://github.com/goyalaakarsh/parrot/issues) to avoid duplicates
2. Use the bug report template
3. Include steps to reproduce, expected behavior, and actual behavior
4. Include screenshots if applicable

### Suggesting Features

1. Check existing issues for similar suggestions
2. Use the feature request template
3. Describe the problem and your proposed solution

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes
4. Run `npm run build` to verify compilation
5. Run `npx tsc --noEmit` to check types
6. Commit using conventional commits (e.g. `feat:`, `fix:`, `chore:`)
7. Push and open a Pull Request

## Development Setup

```bash
git clone https://github.com/goyalaakarsh/parrot.git
cd parrot
npm install
npm run tauri dev
```

## Project Structure

- `src/` — React/TypeScript frontend
- `src-tauri/` — Rust backend (Tauri v2)
- `src/components/` — UI components
- `src/hooks/` — React hooks
- `src/types/` — TypeScript interfaces

## Code Style

- TypeScript with strict mode
- Functional components with hooks
- Tailwind CSS for styling
- No external state management (React hooks only)
- Prefer `useCallback` for memoized handlers
- Icon-only buttons must have `aria-label`
- All Lucide icons should have `aria-hidden="true"`
- Template literals for dynamic classNames
