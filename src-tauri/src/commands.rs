use tauri::AppHandle;
use crate::storage::{self, Prompt, Settings};
use crate::paste::{get_current_foreground_hwnd, restore_focus_and_paste};
use crate::hook::{HOOK_STATE, deactivate_inline_search};
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
    storage::save_settings(&app, &settings)
}

#[tauri::command]
pub fn paste_to_previous_window(hwnd: isize) -> Result<(), String> {
    let mut backspace_count = 0;
    
    // Read and reset the inline hook backspace count if inline search is active
    {
        let mut state = HOOK_STATE.lock().unwrap();
        if state.inline_search_active {
            backspace_count = state.backspace_count;
        }
    }
    
    // Deactivate the inline search UI and release hooks
    deactivate_inline_search();
    
    // Perform focus restore and paste simulation
    restore_focus_and_paste(hwnd, backspace_count)
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
