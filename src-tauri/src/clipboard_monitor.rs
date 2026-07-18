use std::sync::Mutex;
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Manager};

use crate::storage::{HistoryEntry, save_history};

const MAX_HISTORY: usize = 500;

pub struct HistoryState {
    pub entries: Vec<HistoryEntry>,
    pub dirty: bool,
}

pub fn start_clipboard_monitoring(app: AppHandle) {
    thread::spawn(move || {
        let mut clipboard = match arboard::Clipboard::new() {
            Ok(c) => c,
            Err(_) => return,
        };
        let mut last_text: Option<String> = None;

        loop {
            thread::sleep(Duration::from_millis(1200));

            if let Ok(text) = clipboard.get_text() {
                if text.trim().is_empty() {
                    continue;
                }
                if Some(&text) == last_text.as_ref() {
                    continue;
                }
                last_text = Some(text.clone());

                let source_app = get_foreground_window_title();

                let entry = HistoryEntry {
                    id: uuid::Uuid::new_v4().to_string(),
                    text,
                    source_app,
                    captured_at: chrono::Utc::now().to_rfc3339(),
                };

                if let Some(state) = app.try_state::<Mutex<HistoryState>>() {
                    if let Ok(mut state) = state.lock() {
                        state.entries.insert(0, entry);
                        if state.entries.len() > MAX_HISTORY {
                            state.entries.truncate(MAX_HISTORY);
                        }
                        state.dirty = true;
                    }
                }
            }
        }
    });
}

pub fn flush_history(app: &AppHandle) {
    if let Some(state) = app.try_state::<Mutex<HistoryState>>() {
        if let Ok(mut state) = state.lock() {
            if state.dirty {
                let _ = save_history(app, &state.entries);
                state.dirty = false;
            }
        }
    }
}

fn get_foreground_window_title() -> Option<String> {
    use windows::Win32::UI::WindowsAndMessaging::{GetForegroundWindow, GetWindowTextW, GetWindowTextLengthW};

    unsafe {
        let hwnd = GetForegroundWindow();
        if hwnd.is_invalid() {
            return None;
        }
        let len = GetWindowTextLengthW(hwnd);
        if len == 0 {
            return None;
        }
        let mut buf = vec![0u16; (len + 1) as usize];
        let actual = GetWindowTextW(hwnd, &mut buf);
        if actual > 0 {
            let title = String::from_utf16_lossy(&buf[..actual as usize]);
            if title.is_empty() {
                return None;
            }
            return Some(title);
        }
    }
    None
}
