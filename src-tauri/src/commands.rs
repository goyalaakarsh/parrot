use tauri::{AppHandle, Manager, Emitter};

use crate::storage::{self, Prompt, Settings};
use crate::paste::{get_current_foreground_hwnd, restore_focus_and_paste, is_valid_user_window};
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
    crate::hotkey::register_hotkey(&app, &settings.global_shortcut)?;
    Ok(())
}

#[tauri::command]
pub fn exit_app(app: AppHandle) {
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
    
    // If we have a saved window handle, return it. Otherwise, get the current foreground window.
    if let Some(hwnd) = *last {
        Ok(hwnd)
    } else {
        Ok(get_current_foreground_hwnd())
    }
}
