# Implementation Plan: Links Tab & Identity Tab

## Overview

Add two new dedicated tabs to Parrot:
1. **Links** — Save, organize, and quickly paste URLs with auto-capture and favicon fetching
2. **Identity** — Store personal info (email, phone, address) for quick copy/paste into forms

Window size increases from `380×480` to `420×520` to accommodate 4 tabs.

---

## Part 1: TypeScript Types & Rust Structs

### Files to modify
- `src/types/index.ts` — Add `SavedLink`, `IdentityField`, `Identity` interfaces
- `src-tauri/src/storage.rs` — Add Rust structs + `load_links`/`save_links`/`load_identities`/`save_identities`

### Types to add

```typescript
// src/types/index.ts

export interface SavedLink {
  id: string;
  title: string;
  url: string;
  description: string;
  faviconUrl: string | null;
  category: string;
  tags: string[];
  createdAt: string;
  lastUsedAt?: string;
  pinned: boolean;
  pinnedAt?: string;
}

export interface IdentityField {
  id: string;
  label: string;
  value: string;
  type: 'text' | 'email' | 'phone' | 'address';
}

export interface Identity {
  id: string;
  name: string;
  fields: IdentityField[];
  createdAt: string;
  updatedAt?: string;
  pinned: boolean;
  pinnedAt?: string;
}
```

### Rust structs to add (storage.rs)

```rust
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SavedLink {
    pub id: String,
    pub title: String,
    pub url: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub favicon_url: Option<String>,
    #[serde(default)]
    pub category: String,
    #[serde(default)]
    pub tags: Vec<String>,
    pub created_at: String,
    #[serde(default)]
    pub last_used_at: Option<String>,
    #[serde(default)]
    pub pinned: bool,
    #[serde(default)]
    pub pinned_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct IdentityField {
    pub id: String,
    pub label: String,
    pub value: String,
    #[serde(default = "default_field_type")]
    pub field_type: String,
}

fn default_field_type() -> String { "text".to_string() }

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Identity {
    pub id: String,
    pub name: String,
    pub fields: Vec<IdentityField>,
    pub created_at: String,
    #[serde(default)]
    pub updated_at: Option<String>,
    #[serde(default)]
    pub pinned: bool,
    #[serde(default)]
    pub pinned_at: Option<String>,
}
```

Storage functions: `load_links`, `save_links`, `load_identities`, `save_identities` (same pattern as prompts).

---

## Part 2: Backend Commands

### File to modify
- `src-tauri/src/commands.rs` — Add Tauri IPC commands
- `src-tauri/src/lib.rs` — Register commands

### Commands to add

```rust
// Links
#[tauri::command] fn get_links(app: AppHandle) -> Result<Vec<SavedLink>, String>
#[tauri::command] fn save_links(app: AppHandle, links: Vec<SavedLink>) -> Result<(), String>

// Identities
#[tauri::command] fn get_identities(app: AppHandle) -> Result<Vec<Identity>, String>
#[tauri::command] fn save_identities(app: AppHandle, identities: Vec<Identity>) -> Result<(), String>
```

Register in `lib.rs` invoke_handler.

---

## Part 3: Frontend Hooks

### Files to create
- `src/hooks/useLinks.ts` — CRUD hook for links (same pattern as `usePrompts`)
- `src/hooks/useIdentities.ts` — CRUD hook for identities

### useLinks hook
- `fetchLinks()` — invoke `get_links`, sort pinned first then by date
- `addLink(link)` — optimistic update + `save_links`
- `updateLink(id, updates)` — optimistic update + `save_links`
- `deleteLink(id)` — optimistic update + `save_links`
- `markLinkUsed(id)` — set lastUsedAt
- `togglePin(id)` — toggle pin state

### useIdentities hook
- `fetchIdentities()` — invoke `get_identities`, sort pinned first then by date
- `addIdentity(identity)` — optimistic update + `save_identities`
- `updateIdentity(id, updates)` — optimistic update + `save_identities`
- `deleteIdentity(id)` — optimistic update + `save_identities`
- `togglePin(id)` — toggle pin state

---

## Part 4: Links Tab UI

### Files to create
- `src/components/LinkCard.tsx` — Individual link card (like PromptCard)
- `src/components/LinkList.tsx` — Links list view (like PromptList)
- `src/components/AddEditLinkPanel.tsx` — Add/Edit link form

### LinkCard features
- Show title, URL (truncated), favicon (fallback to globe icon), category badge
- Tag chips (clickable to filter)
- Pin toggle (star icon)
- Actions: Copy URL, Paste (auto-paste URL), Edit, Delete
- Keyboard: `Enter` = paste, `Shift+Enter` = copy, `Ctrl+E` = edit, `Delete` = delete

### AddEditLinkPanel features
- URL input (auto-detect if valid URL)
- Title input (auto-generated from URL if empty)
- Description textarea (optional)
- Category dropdown/text input (Work, Social, Shopping, Custom)
- Tags input (comma-separated, same as Texts)
- Auto-fetch favicon from `https://{domain}/favicon.ico` on URL blur

### LinkList features
- Category filter pills (All, Work, Social, Shopping, Custom) — like History's All/Text/Images
- "Add Link" button with `Ctrl+N` shortcut
- Empty state with icon and CTA

### Auto-capture (Future enhancement — not in MVP)
- In clipboard_monitor.rs, detect URLs and emit `link-detected` event
- Frontend shows toast with "Save to Links?" option
- Defer to Phase 2 to keep MVP scope tight

---

## Part 5: Identity Tab UI

### Files to create
- `src/components/IdentityCard.tsx` — Individual identity card
- `src/components/IdentityList.tsx` — Identity list view
- `src/components/AddEditIdentityPanel.tsx` — Add/Edit identity form

### IdentityCard features
- Show identity name (e.g., "Home", "Work")
- List of fields with labels (Email, Phone, etc.)
- Pin toggle (star icon)
- Actions: Copy Field (click individual field), Copy Block (all fields), Edit, Delete
- Click any field → copies that field's value to clipboard
- "Copy Block" button → copies all fields as formatted text:
  ```
  Name: John Doe
  Email: john@example.com
  Phone: 555-1234
  ```

### AddEditIdentityPanel features
- Identity name input (e.g., "Home", "Work", "Shipping")
- Dynamic field list:
  - Each field has: label, value, type dropdown
  - Add/remove fields
  - Pre-built templates: Email, Phone, Address, Name, Custom
- Drag-to-reorder fields (optional — can defer)
- Save button (`Ctrl+Enter`)

### IdentityList features
- "Add Identity" button with `Ctrl+N`
- Empty state with icon and CTA

---

## Part 6: App Integration

### File to modify
- `src/App.tsx` — Wire everything together

### Changes

1. **Add new tabs to `activeTab` type:**
   ```typescript
   const [activeTab, setActiveTab] = useState<'texts' | 'history' | 'links' | 'identity'>('texts');
   ```

2. **Add new views:**
   ```typescript
   const [view, setView] = useState<'list' | 'add' | 'edit' | 'settings' | 'about' | 'command-palette' | 'tray-menu' | 'add-link' | 'edit-link' | 'add-identity' | 'edit-identity'>('list');
   ```

3. **Import new hooks and components**

4. **Add tab change handler** for links and identity tabs

5. **Add keyboard navigation** for new tabs (Enter = paste, Shift+Enter = copy)

6. **Update `handleTabChange`** to accept new tab types

7. **Add command palette entries:**
   - "Open Links" (Ctrl+L)
   - "Open Identity" (Ctrl+I)
   - "Add Link" (Ctrl+N when on links tab)
   - "Add Identity" (Ctrl+N when on identity tab)

8. **Update screen names** for new views

9. **Wire up Tauri event listeners** for link/identity updates

---

## Part 7: SearchBar Updates

### File to modify
- `src/components/SearchBar.tsx`

### Changes
- Add "Links" and "Identity" tab buttons alongside "My Texts" and "History"
- Update `activeTab` prop type to include new tabs
- Add keyboard shortcut badges: `Ctrl+L` for Links, `Ctrl+I` for Identity
- Style: 4 tabs in a row, compact text (may need smaller font or icon-only on narrow)

---

## Part 8: Unified Search Updates

### File to modify
- `src/components/UnifiedSearchResults.tsx`

### Changes
- Add Links and Identity results to unified search
- When searching, show results from all 4 sources
- Each source has its own section with header

---

## Part 9: Keyboard Navigation Updates

### File to modify
- `src/hooks/useKeyboard.ts`

### Changes
- Add `onCtrlL` callback (Links tab)
- Add `onCtrlI` callback (Identity tab)
- Register `Ctrl+L` and `Ctrl+I` shortcuts

---

## Part 10: Window Size Update

### File to modify
- `src-tauri/tauri.conf.json`

### Changes
- Increase main window dimensions:
  ```json
  "width": 420,
  "height": 520,
  "minWidth": 380,
  "minHeight": 460
  ```

---

## Implementation Order

1. Types + Rust structs + storage functions (backend foundation)
2. Backend commands + register in lib.rs
3. Frontend hooks (useLinks, useIdentities)
4. SearchBar tab updates
5. Links tab UI (LinkCard, LinkList, AddEditLinkPanel)
6. Identity tab UI (IdentityCard, IdentityList, AddEditIdentityPanel)
7. App.tsx integration (views, handlers, keyboard)
8. Unified search updates
9. Keyboard hook updates
10. Window size update
11. Testing & polish

---

## Testing Checklist

- [ ] Links: Create, edit, delete, pin/unpin
- [ ] Links: Copy URL, paste URL
- [ ] Links: Category filtering works
- [ ] Links: Tag filtering works
- [ ] Links: Search finds links
- [ ] Links: Favicon loads from domain
- [ ] Identity: Create, edit, delete, pin/unpin
- [ ] Identity: Click field → copies value
- [ ] Identity: Copy Block → copies all fields as formatted text
- [ ] Identity: Add/remove fields in form
- [ ] Identity: Search finds identities
- [ ] Tab switching works for all 4 tabs
- [ ] Keyboard shortcuts work (Ctrl+T, Ctrl+H, Ctrl+L, Ctrl+I)
- [ ] Command palette includes new commands
- [ ] Unified search shows results from all tabs
- [ ] Window renders correctly at new size
- [ ] Empty states display correctly
- [ ] No lint errors, no type errors
