use tauri::{AppHandle, Manager, Emitter};

use crate::storage::{self, Prompt, Settings, HistoryEntry};
use crate::paste::{get_current_foreground_hwnd, restore_focus_and_paste, is_valid_user_window};
use crate::clipboard_monitor::{self, HistoryState};
use std::sync::Mutex;

pub static LAST_FOREGROUND_HWND: Mutex<Option<isize>> = Mutex::new(None);

#[tauri::command]
pub fn get_prompts(app: AppHandle) -> Result<Vec<Prompt>, String> {
    storage::load_prompts(&app)
}

#[tauri::command]
pub fn save_prompts(app: AppHandle, prompts: Vec<Prompt>) -> Result<(), String> {
    storage::save_prompts(&app, &prompts)
}

#[tauri::command]
pub fn get_settings(app: AppHandle) -> Result<Settings, String> {
    storage::load_settings(&app)
}

#[tauri::command]
pub fn save_settings(app: AppHandle, settings: Settings) -> Result<(), String> {
    storage::save_settings(&app, &settings)?;
    crate::hotkey::register_hotkeys(&app, &settings.global_shortcut, &settings.quick_capture_shortcut)?;
    Ok(())
}

#[tauri::command]
pub fn exit_app(app: AppHandle) {
    clipboard_monitor::flush_history(&app);
    app.exit(0);
}

#[tauri::command]
pub fn open_main_window(app: AppHandle, view: String) -> Result<(), String> {
    if let Some(main_win) = app.get_webview_window("main") {
        let hwnd = get_current_foreground_hwnd();
        if is_valid_user_window(hwnd) {
            *LAST_FOREGROUND_HWND.lock().unwrap() = Some(hwnd);
        }

        let _ = main_win.show();
        crate::paste::position_window_at_caret_or_cursor(&main_win);
        let _ = main_win.set_focus();

        if let Ok(mut last_show) = crate::LAST_SHOW_TIME.lock() {
            *last_show = Some(std::time::Instant::now());
        }

        if view == "settings" {
            let _ = app.emit("open-settings", ());
        } else if view == "add" {
            let _ = app.emit("open-add", ());
        } else if view == "about" {
            let _ = app.emit("open-about", ());
        } else if view == "command-palette" {
            let _ = app.emit("open-palette", ());
        } else {
            let _ = app.emit("open-list", ());
        }
    }

    if let Some(tray_win) = app.get_webview_window("tray_menu") {
        let _ = tray_win.hide();
    }

    Ok(())
}

#[tauri::command]
pub fn paste_to_previous_window(hwnd: isize) -> Result<(), String> {
    restore_focus_and_paste(hwnd)
}

#[tauri::command]
pub fn get_recent_prompts(app: AppHandle) -> Result<Vec<Prompt>, String> {
    let mut prompts = storage::load_prompts(&app)?;
    prompts.sort_by(|a, b| {
        let a_time = a.last_used_at.as_deref().unwrap_or("0");
        let b_time = b.last_used_at.as_deref().unwrap_or("0");
        b_time.cmp(a_time)
    });
    prompts.truncate(3);
    Ok(prompts)
}

#[tauri::command]
pub fn check_first_run(app: AppHandle) -> Result<bool, String> {
    let data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let marker = data_dir.join(".parrot-onboarded");
    if marker.exists() {
        return Ok(false);
    }
    std::fs::write(&marker, "").map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
pub fn get_foreground_hwnd() -> Result<isize, String> {
    let last = LAST_FOREGROUND_HWND.lock().unwrap();

    if let Some(hwnd) = *last {
        Ok(hwnd)
    } else {
        Ok(get_current_foreground_hwnd())
    }
}

// --- History Commands ---

#[tauri::command]
pub fn get_history(app: AppHandle) -> Result<Vec<HistoryEntry>, String> {
    let mut entries = Vec::new();
    if let Some(state) = app.try_state::<Mutex<HistoryState>>() {
        if let Ok(state) = state.lock() {
            entries = state.entries.clone();
        }
    }
    if entries.is_empty() {
        entries = storage::load_history(&app)?;
    }
    Ok(entries)
}

#[tauri::command]
pub fn delete_history_entry(app: AppHandle, entry_id: String) -> Result<(), String> {
    let mut deleted: Option<HistoryEntry> = None;
    if let Some(state) = app.try_state::<Mutex<HistoryState>>() {
        if let Ok(mut state) = state.lock() {
            deleted = state.entries.iter().find(|e| e.id == entry_id).cloned();
            state.entries.retain(|e| e.id != entry_id);
            state.dirty = true;
        }
    }
    // Delete associated image file if any
    if let Some(entry) = deleted {
        if let Some(img_path) = &entry.image_path {
            storage::delete_image_file(&app, img_path);
        }
    }
    clipboard_monitor::flush_history(&app);
    Ok(())
}

#[tauri::command]
pub fn clear_history(app: AppHandle) -> Result<(), String> {
    if let Some(state) = app.try_state::<Mutex<HistoryState>>() {
        if let Ok(mut state) = state.lock() {
            state.entries.clear();
            state.dirty = true;
        }
    }
    clipboard_monitor::flush_history(&app);
    Ok(())
}

#[tauri::command]
pub fn promote_to_prompt(app: AppHandle, entry_id: String) -> Result<(), String> {
    let entry = {
        let entries = if let Some(state) = app.try_state::<Mutex<HistoryState>>() {
            let state = state.lock().map_err(|e| e.to_string())?;
            state.entries.clone()
        } else {
            Vec::new()
        };

        entries.into_iter().find(|e| e.id == entry_id)
            .ok_or_else(|| "History entry not found".to_string())?
    };

    // Don't promote image entries to prompts
    if entry.is_image() {
        return Err("Cannot save image to My Texts".to_string());
    }

    // Remove from history
    if let Some(state) = app.try_state::<Mutex<HistoryState>>() {
        if let Ok(mut state) = state.lock() {
            state.entries.retain(|e| e.id != entry_id);
            state.dirty = true;
        }
    }

    // Create prompt from entry
    let first_line = entry.text.split('\n').next().unwrap_or("").trim();
    let title = if first_line.len() > 40 {
        format!("{}...", &first_line[..40])
    } else {
        first_line.to_string()
    };

    let prompt = Prompt {
        id: uuid::Uuid::new_v4().to_string(),
        title,
        text: entry.text,
        tags: Vec::new(),
        created_at: chrono::Utc::now().to_rfc3339(),
        last_used_at: None,
        pinned: false,
        pinned_at: None,
    };

    let mut prompts = storage::load_prompts(&app)?;
    prompts.insert(0, prompt);
    storage::save_prompts(&app, &prompts)?;

    clipboard_monitor::flush_history(&app);

    Ok(())
}

// --- Image Commands ---

#[tauri::command]
pub fn paste_image(app: AppHandle, entry_id: String) -> Result<(), String> {
    let entry = get_entry_by_id(&app, &entry_id)?;
    let img_path = entry.image_path.as_deref()
        .ok_or_else(|| "Entry has no image".to_string())?;

    let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let full_path = app_data_dir.join(img_path);

    // Load PNG from disk
    let img = image::open(&full_path).map_err(|e| e.to_string())?;
    let rgba = img.to_rgba8();
    let (width, height) = rgba.dimensions();
    let bytes = rgba.into_raw();

    let hwnd = get_current_foreground_hwnd();
    let last_hwnd = {
        let last = LAST_FOREGROUND_HWND.lock().unwrap();
        last.unwrap_or(hwnd)
    };

    // Set image to clipboard
    let mut clipboard = arboard::Clipboard::new().map_err(|e| e.to_string())?;
    let image_data = arboard::ImageData {
        width: width as usize,
        height: height as usize,
        bytes: std::borrow::Cow::Owned(bytes),
    };
    clipboard.set_image(image_data).map_err(|e| e.to_string())?;

    // Simulate Ctrl+V
    crate::paste::restore_focus_and_paste(last_hwnd)?;

    Ok(())
}

#[tauri::command]
pub fn copy_image(app: AppHandle, entry_id: String) -> Result<(), String> {
    let entry = get_entry_by_id(&app, &entry_id)?;
    let img_path = entry.image_path.as_deref()
        .ok_or_else(|| "Entry has no image".to_string())?;

    let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let full_path = app_data_dir.join(img_path);

    let img = image::open(&full_path).map_err(|e| e.to_string())?;
    let rgba = img.to_rgba8();
    let (width, height) = rgba.dimensions();
    let bytes = rgba.into_raw();

    let mut clipboard = arboard::Clipboard::new().map_err(|e| e.to_string())?;
    let image_data = arboard::ImageData {
        width: width as usize,
        height: height as usize,
        bytes: std::borrow::Cow::Owned(bytes),
    };
    clipboard.set_image(image_data).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn get_image_path(app: AppHandle, entry_id: String) -> Result<String, String> {
    let entry = get_entry_by_id(&app, &entry_id)?;
    let img_path = entry.image_path.as_deref()
        .ok_or_else(|| "Entry has no image".to_string())?;

    let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let full_path = app_data_dir.join(img_path);
    Ok(full_path.to_string_lossy().to_string())
}

fn get_entry_by_id(app: &AppHandle, entry_id: &str) -> Result<HistoryEntry, String> {
    // Check in-memory state first
    if let Some(state) = app.try_state::<Mutex<HistoryState>>() {
        if let Ok(state) = state.lock() {
            if let Some(entry) = state.entries.iter().find(|e| e.id == entry_id) {
                return Ok(entry.clone());
            }
        }
    }
    // Fallback to disk
    let entries = storage::load_history(app)?;
    entries.into_iter().find(|e| e.id == entry_id)
        .ok_or_else(|| "History entry not found".to_string())
}
