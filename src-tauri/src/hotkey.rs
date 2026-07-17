use tauri::{AppHandle, Manager};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};
use std::str::FromStr;
use crate::paste::get_current_foreground_hwnd;
use crate::commands::LAST_FOREGROUND_HWND;


pub fn register_hotkey(app: &AppHandle, shortcut_str: &str) -> Result<(), String> {
    let shortcut_manager = app.global_shortcut();
    
    // Clean up all existing registered shortcuts
    let _ = shortcut_manager.unregister_all();
    
    // Normalize shortcut string for tauri-plugin-global-shortcut parsing
    // Standard format examples: "Ctrl+Shift+Space" or "CommandOrControl+Shift+Space"
    let normalized = shortcut_str.to_lowercase()
        .replace("commandorcontrol", "ctrl")
        .replace("control", "ctrl")
        .replace("command", "super")
        .replace("cmd", "super");
        
    let shortcut = Shortcut::from_str(&normalized)
        .map_err(|e| format!("Failed to parse shortcut '{}': {:?}", shortcut_str, e))?;
        
    shortcut_manager.register(shortcut)
        .map_err(|e| format!("Failed to register shortcut '{}': {:?}", shortcut_str, e))?;
        
    Ok(())
}

pub fn handle_hotkey_trigger(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        if let Ok(is_visible) = window.is_visible() {
            if is_visible {
                let _ = window.hide();
            } else {
                // Capture the foreground window HWND immediately before our window takes focus
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
