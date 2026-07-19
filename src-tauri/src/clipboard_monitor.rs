use std::sync::Mutex;
use std::thread;
use tauri::{AppHandle, Manager, Emitter};
use sha2::{Sha256, Digest};

use crate::storage::{HistoryEntry, save_history, save_image_to_disk};

const MAX_ENTRIES: usize = 500;
const WM_CLIPBOARDUPDATE: u32 = 0x031D;

pub struct HistoryState {
    pub entries: Vec<HistoryEntry>,
    pub dirty: bool,
}

struct MonitorState {
    app: AppHandle,
    clipboard: arboard::Clipboard,
    last_text: Option<String>,
    last_image_hash: Option<String>,
}

pub fn start_clipboard_monitoring(app: AppHandle) {
    thread::spawn(move || {
        let clipboard = match arboard::Clipboard::new() {
            Ok(c) => c,
            Err(_) => return,
        };

        let state = Box::new(MonitorState {
            app,
            clipboard,
            last_text: None,
            last_image_hash: None,
        });
        let state_ptr = Box::into_raw(state);

        unsafe {
            use windows::Win32::Foundation::{BOOL, HWND, LPARAM, LRESULT, WPARAM};
            use windows::Win32::System::DataExchange::AddClipboardFormatListener;
            use windows::Win32::System::LibraryLoader::GetModuleHandleW;
            use windows::Win32::UI::WindowsAndMessaging::{
                CreateWindowExW, DefWindowProcW, DestroyWindow, DispatchMessageW,
                GetMessageW, GetWindowLongPtrW, RegisterClassW,
                SetWindowLongPtrW, CW_USEDEFAULT, GWLP_USERDATA, MSG, WNDCLASSW,
            };
            use windows::core::PCWSTR;

            let instance = GetModuleHandleW(None).unwrap();
            let class_name = windows::core::HSTRING::from("ParrotClipboardWatcher");
            let class_pcwstr = PCWSTR(class_name.as_ptr());

            unsafe extern "system" fn wnd_proc(
                hwnd: HWND,
                msg: u32,
                wparam: WPARAM,
                lparam: LPARAM,
            ) -> LRESULT {
                if msg == WM_CLIPBOARDUPDATE {
                    unsafe {
                        let ptr = GetWindowLongPtrW(hwnd, GWLP_USERDATA) as *mut MonitorState;
                        if let Some(s) = ptr.as_mut() {
                            handle_clipboard_change(&mut s.clipboard, &mut s.last_text, &mut s.last_image_hash, &s.app);
                        }
                    }
                    return LRESULT(0);
                }
                unsafe { DefWindowProcW(hwnd, msg, wparam, lparam) }
            }

            let mut wc = WNDCLASSW::default();
            wc.lpfnWndProc = Some(wnd_proc);
            wc.hInstance = instance.into();
            wc.lpszClassName = class_pcwstr;

            if RegisterClassW(&wc as *const WNDCLASSW) == 0 {
                let _ = Box::from_raw(state_ptr);
                return;
            }

            let hwnd = match CreateWindowExW(
                Default::default(),
                class_pcwstr,
                PCWSTR::null(),
                Default::default(),
                CW_USEDEFAULT,
                CW_USEDEFAULT,
                CW_USEDEFAULT,
                CW_USEDEFAULT,
                None,
                None,
                instance,
                None,
            ) {
                Ok(h) => h,
                Err(_) => {
                    let _ = Box::from_raw(state_ptr);
                    return;
                }
            };

            SetWindowLongPtrW(hwnd, GWLP_USERDATA, state_ptr as isize);

            if let Err(_) = AddClipboardFormatListener(hwnd) {
                let _ = Box::from_raw(state_ptr);
                let _ = DestroyWindow(hwnd);
                return;
            }

            let mut msg = MSG::default();
            loop {
                let result = GetMessageW(&mut msg, None, 0, 0);
                if result == BOOL(0) {
                    break;
                }
                let _ = DispatchMessageW(&mut msg);
            }

            use windows::Win32::System::DataExchange::RemoveClipboardFormatListener;
            let _ = RemoveClipboardFormatListener(hwnd);
            let _ = DestroyWindow(hwnd);
            let _ = Box::from_raw(state_ptr);
        }
    });
}

fn handle_clipboard_change(
    clipboard: &mut arboard::Clipboard,
    last_text: &mut Option<String>,
    last_image_hash: &mut Option<String>,
    app: &AppHandle,
) {
    let mut captured: Option<HistoryEntry> = None;

    if let Ok(img) = clipboard.get_image() {
        let hash = hash_bytes(&img.bytes);
        let is_new = Some(&hash) != last_image_hash.as_ref();
        if is_new && img.bytes.len() > 0 {
            *last_image_hash = Some(hash);
            *last_text = None;
            let source_app = get_foreground_window_title();
            let entry_id = uuid::Uuid::new_v4().to_string();

            let img_path = save_image_to_disk(
                app, &entry_id, &img.bytes, img.width as u32, img.height as u32,
            ).ok();

            captured = Some(HistoryEntry {
                id: entry_id,
                text: String::new(),
                source_app,
                captured_at: chrono::Utc::now().to_rfc3339(),
                image_path: img_path,
                image_width: Some(img.width as u32),
                image_height: Some(img.height as u32),
            });
        }
    }

    if captured.is_none() {
        if let Ok(text) = clipboard.get_text() {
            let trimmed = text.trim().to_string();
            if !trimmed.is_empty() {
                let is_new = Some(&trimmed) != last_text.as_ref();
                if is_new {
                    *last_text = Some(trimmed.clone());
                    *last_image_hash = None;
                    let source_app = get_foreground_window_title();

                    captured = Some(HistoryEntry {
                        id: uuid::Uuid::new_v4().to_string(),
                        text: trimmed,
                        source_app,
                        captured_at: chrono::Utc::now().to_rfc3339(),
                        image_path: None,
                        image_width: None,
                        image_height: None,
                    });
                }
            }
        }
    }

    if let Some(entry) = &captured {
        if let Some(state) = app.try_state::<Mutex<HistoryState>>() {
            if let Ok(mut state) = state.lock() {
                state.entries.insert(0, entry.clone());
                if state.entries.len() > MAX_ENTRIES {
                    state.entries.truncate(MAX_ENTRIES);
                }
                state.dirty = true;
            }
        }
        let _ = app.emit("history-updated", ());
    }
}

pub fn flush_history(app: &AppHandle) {
    if let Some(state) = app.try_state::<Mutex<HistoryState>>() {
        if let Ok(mut state) = state.lock() {
            if state.dirty {
                println!("[parrot] HISTORY: flushing {} entries to disk", state.entries.len());
                let _ = save_history(app, &state.entries);
                state.dirty = false;
                println!("[parrot] HISTORY: flush complete");
            } else {
                println!("[parrot] HISTORY: flush skipped (not dirty, {} entries in memory)", state.entries.len());
            }
        }
    }
}

fn hash_bytes(bytes: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(bytes);
    let result = hasher.finalize();
    format!("{:x}", result)
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
