use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};
use std::str::FromStr;
use crate::paste::get_current_foreground_hwnd;
use crate::commands::LAST_FOREGROUND_HWND;
use crate::storage::{Prompt, save_prompts};

pub fn register_hotkeys(app: &AppHandle, toggle_shortcut: &str, quick_capture_shortcut: &str) -> Result<(), String> {
    let shortcut_manager = app.global_shortcut();

    let _ = shortcut_manager.unregister_all();

    // Register toggle shortcut
    let toggle_normalized = normalize_shortcut(toggle_shortcut);
    let toggle_parsed = Shortcut::from_str(&toggle_normalized)
        .map_err(|e| format!("Failed to parse shortcut '{}': {:?}", toggle_shortcut, e))?;

    shortcut_manager.register(toggle_parsed)
        .map_err(|e| format!("Failed to register shortcut '{}': {:?}", toggle_normalized, e))?;

    // Register quick capture shortcut
    let qc_normalized = normalize_shortcut(quick_capture_shortcut);
    let qc_parsed = Shortcut::from_str(&qc_normalized)
        .map_err(|e| format!("Failed to parse shortcut '{}': {:?}", quick_capture_shortcut, e))?;

    shortcut_manager.register(qc_parsed)
        .map_err(|e| format!("Failed to register shortcut '{}': {:?}", qc_normalized, e))?;

    Ok(())
}

fn normalize_shortcut(s: &str) -> String {
    s.to_lowercase()
        .replace("commandorcontrol", "ctrl")
        .replace("control", "ctrl")
        .replace("command", "super")
        .replace("cmd", "super")
}

pub fn handle_hotkey_trigger(app: &AppHandle, triggered: &Shortcut) {
    let settings = crate::storage::load_settings(app).unwrap_or_default();

    if let Ok(toggle_parsed) = Shortcut::from_str(&settings.global_shortcut) {
        if triggered == &toggle_parsed {
            return handle_toggle(app);
        }
    }

    if let Ok(qc_parsed) = Shortcut::from_str(&settings.quick_capture_shortcut) {
        if triggered == &qc_parsed {
            handle_quick_capture(app);
        }
    }
}

fn handle_toggle(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        if let Ok(is_visible) = window.is_visible() {
            if is_visible {
                let _ = window.hide();
            } else {
                let hwnd = get_current_foreground_hwnd();
                if crate::paste::is_valid_user_window(hwnd) {
                    *LAST_FOREGROUND_HWND.lock().unwrap() = Some(hwnd);
                }

                let _ = window.show();
                crate::paste::position_window_at_caret_or_cursor(&window);
                let _ = window.set_focus();

                if let Ok(mut last_show) = crate::LAST_SHOW_TIME.lock() {
                    *last_show = Some(std::time::Instant::now());
                }
            }
        }
    }
}

fn handle_quick_capture(app: &AppHandle) {
    let mut clipboard = match arboard::Clipboard::new() {
        Ok(c) => c,
        Err(_) => return,
    };

    let text = match clipboard.get_text() {
        Ok(t) => t,
        Err(_) => return,
    };

    if text.trim().is_empty() {
        return;
    }

    let first_line = text.split('\n').next().unwrap_or("").trim();
    let title = if first_line.len() > 40 {
        format!("{}...", &first_line[..40])
    } else {
        first_line.to_string()
    };

    let prompt = Prompt {
        id: uuid::Uuid::new_v4().to_string(),
        title,
        text: text.trim().to_string(),
        tags: Vec::new(),
        created_at: chrono::Utc::now().to_rfc3339(),
        last_used_at: None,
        pinned: false,
        pinned_at: None,
    };

    if let Ok(mut prompts) = crate::storage::load_prompts(app) {
        prompts.insert(0, prompt);
        if save_prompts(app, &prompts).is_ok() {
            let _ = app.emit("quick-capture-saved", ());
        }
    }
}
