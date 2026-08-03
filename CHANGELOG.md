# Changelog

## [0.2.0] - 2026

### Added

- Light/dark/system theme with CSS variable-based theming
- Theme selector in Settings
- Universal search across both My Texts and History tabs
- Simplified tab shortcuts: Ctrl+T (My Texts), Ctrl+H (History)
- Keyboard shortcut badges on tab buttons

### Changed

- Auto-save settings on every change — removed Save button
- Tabs redesigned as segmented control with clear active state
- Page headers redesigned: heading left-aligned, back button right
- Softened dark theme colors for reduced eye strain

### Fixed

- Hotkey registration errors no longer fail settings save
- Clippy warnings fixed across Rust codebase

## [0.1.0] - 2026

### Added

- System tray residency with custom dark-themed context menu
- Global shortcut trigger (Ctrl+Shift+Space, configurable)
- Text CRUD with auto-paste and copy flows
- Search with multi-word matching across titles, text, and tags
- Settings panel with shortcut capture and launch-at-startup toggle
- Persistent window position
- Optimistic updates with rollback on save failure

### Accessibility

- Full keyboard navigation with arrow keys and shortcuts
- ARIA roles: listbox, option, menu, menuitem, switch, alert
- aria-label on all icon-only buttons
- aria-selected on active text cards
- aria-checked on toggle switch
- aria-live regions for dynamic content
- Screen reader support for view changes and toast notifications
- prefers-reduced-motion support
- Visible focus rings on all interactive elements
- tabIndex management on hidden action buttons

### UI/UX

- Keyboard shortcut badge indicators on all interactive elements
- Search result count display
- Floating add button in toolbar with Ctrl+N badge
- Auto-focus on search bar when returning to list view
- Escape-to-cancel across add, edit, and settings views
- Arrow key navigation in delete confirmation dialogs
- Tray menu with arrow key navigation and Escape to close
