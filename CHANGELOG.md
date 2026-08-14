# Changelog

## [0.3.0] - 2026-08-14

### Added

- **Saved Links Manager**: Save web links with auto category tagging, tag filtering, domain extraction, and instant URL copy/paste (`Ctrl+L`).
- **Identity & Personal Info Storage**: Store identities with custom labels (Email, Phone, Address, Full Name, etc.), individual field copy, and full block copy (`Ctrl+B` / `Ctrl+I`).
- **Silent Background Page Title & Favicon Fetcher**: Automatically fetches HTML page titles and favicons silently in the background when connected to the internet, with offline fallbacks.
- **Custom Select Dropdown Component**: Replaced browser default select elements with custom styled `CustomSelect` component matching theme tokens.
- **Enhanced Command Palette**: Quick commands for creating links, identities, copying identity blocks, and tab navigation.
- **Updated Onboarding & Tray Menu**: Onboarding slides and tray menu updated to highlight Saved Links and Identities.

### Changed

- Star pin icons are now always visible on cards (`opacity-40` unpinned, `opacity-100` pinned/hovered).
- Form validation now uses custom theme error banners (`noValidate`) instead of browser HTML5 default popup bubbles.
- Removed native `title="..."` attributes to prevent OS browser tooltips from interfering with custom UI.
- Improved shortcut badge styling inside primary buttons for empty states.

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
