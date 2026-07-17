use std::sync::{Mutex, OnceLock};
use windows::Win32::Foundation::{HWND, LPARAM, LRESULT, WPARAM};
use windows::Win32::UI::WindowsAndMessaging::{
    CallNextHookEx, GetForegroundWindow, SetWindowsHookExW, UnhookWindowsHookEx,
    ShowWindow, SW_SHOWNA, KBDLLHOOKSTRUCT, MSG, GetMessageW, TranslateMessage,
    DispatchMessageW, WH_KEYBOARD_LL, WM_KEYDOWN, WM_SYSKEYDOWN, WM_KEYUP, WM_SYSKEYUP
};
use tauri::{AppHandle, Manager, Emitter};
use tauri_plugin_positioner::{WindowExt, Position};

pub static APP_HANDLE: OnceLock<AppHandle> = OnceLock::new();

#[derive(Debug)]
pub struct HookState {
    pub buffer: String,
    pub inline_search_active: bool,
    pub target_hwnd: Option<isize>,
    pub query: String,
    pub backspace_count: usize,
    pub shift_pressed: bool,
}

pub static HOOK_STATE: Mutex<HookState> = Mutex::new(HookState {
    buffer: String::new(),
    inline_search_active: false,
    target_hwnd: None,
    query: String::new(),
    backspace_count: 0,
    shift_pressed: false,
});

pub fn start_keyboard_hook() {
    std::thread::spawn(|| unsafe {
        let hook = SetWindowsHookExW(
            WH_KEYBOARD_LL,
            Some(keyboard_hook_proc),
            None,
            0,
        ).expect("Failed to register global keyboard hook");

        let mut msg = MSG::default();
        while GetMessageW(&mut msg, None, 0, 0).as_bool() {
            let _ = TranslateMessage(&msg);
            DispatchMessageW(&msg);
        }

        UnhookWindowsHookEx(hook).ok();
    });
}

pub fn deactivate_inline_search() {
    let mut state = HOOK_STATE.lock().unwrap();
    if state.inline_search_active {
        state.inline_search_active = false;
        state.query.clear();
        state.buffer.clear();
        state.backspace_count = 0;
        
        if let Some(app) = APP_HANDLE.get() {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.hide();
                let _ = app.emit("inline-search-end", ());
            }
        }
    }
}

fn map_vk_to_char(vk_code: u32, shift: bool) -> Option<char> {
    match vk_code {
        0x41..=0x5A => { // A-Z
            let base = if shift { b'A' } else { b'a' };
            Some((base + (vk_code as u8 - 0x41)) as char)
        }
        0x30..=0x39 => { // 0-9
            if shift {
                match vk_code {
                    0x31 => Some('!'),
                    0x32 => Some('@'),
                    0x33 => Some('#'),
                    0x34 => Some('$'),
                    0x35 => Some('%'),
                    0x36 => Some('^'),
                    0x37 => Some('&'),
                    0x38 => Some('*'),
                    0x39 => Some('('),
                    0x30 => Some(')'),
                    _ => None,
                }
            } else {
                Some((b'0' + (vk_code as u8 - 0x30)) as char)
            }
        }
        0x20 => Some(' '), // Space
        0xBE => Some(if shift { '>' } else { '.' }), // Period
        0xBC => Some(if shift { '<' } else { ',' }), // Comma
        0xBD => Some(if shift { '_' } else { '-' }), // Minus
        0xBB => Some(if shift { '+' } else { '=' }), // Plus
        0xBA => Some(if shift { ':' } else { ';' }), // Semicolon
        0xDE => Some(if shift { '"' } else { '\'' }), // Quote
        0xBF => Some(if shift { '?' } else { '/' }), // Slash
        0xDC => Some(if shift { '|' } else { '\\' }), // Backslash
        _ => None
    }
}

unsafe extern "system" fn keyboard_hook_proc(
    n_code: i32,
    w_param: WPARAM,
    l_param: LPARAM,
) -> LRESULT {
    if n_code >= 0 {
        let event_type = w_param.0 as u32;
        let hook_struct = *(l_param.0 as *const KBDLLHOOKSTRUCT);
        let vk_code = hook_struct.vkCode;

        // Track Shift key state
        if vk_code == 0x10 || vk_code == 0xA0 || vk_code == 0xA1 {
            let mut state = HOOK_STATE.lock().unwrap();
            if event_type == WM_KEYDOWN || event_type == WM_SYSKEYDOWN {
                state.shift_pressed = true;
            } else if event_type == WM_KEYUP || event_type == WM_SYSKEYUP {
                state.shift_pressed = false;
            }
        }

        if event_type == WM_KEYDOWN || event_type == WM_SYSKEYDOWN {
            let mut state = HOOK_STATE.lock().unwrap();
            let app_handle_opt = APP_HANDLE.get();

            if let Some(app) = app_handle_opt {
                let main_window = app.get_webview_window("main");
                let foreground_hwnd = GetForegroundWindow();

                // If our window is focused, let the input go through normally without global capture
                let tauri_focused = if let Some(ref window) = main_window {
                    if let Ok(hwnd) = window.hwnd() {
                        hwnd.0 as isize == foreground_hwnd.0 as isize
                    } else {
                        false
                    }
                } else {
                    false
                };

                if !tauri_focused {
                    // Check if foreground window switched during active inline search
                    if state.inline_search_active {
                        if let Some(target) = state.target_hwnd {
                            if foreground_hwnd.0 as isize != target && foreground_hwnd.0 as isize != 0 {
                                // Foreground window changed, close inline search
                                drop(state);
                                deactivate_inline_search();
                                return CallNextHookEx(None, n_code, w_param, l_param);
                            }
                        }
                    }

                    if vk_code == 0x1B { // Escape
                        if state.inline_search_active {
                            drop(state);
                            deactivate_inline_search();
                        }
                    } else if vk_code == 0x08 { // Backspace
                        if state.inline_search_active {
                            if !state.query.is_empty() {
                                state.query.pop();
                                state.backspace_count -= 1;
                                let _ = app.emit("inline-search-query", state.query.clone());
                            } else {
                                // User backspaced over the trigger itself
                                drop(state);
                                deactivate_inline_search();
                            }
                        } else {
                            if !state.buffer.is_empty() {
                                state.buffer.pop();
                            }
                        }
                    } else if let Some(c) = map_vk_to_char(vk_code, state.shift_pressed) {
                        if state.inline_search_active {
                            if c == '"' {
                                // Closing quote typed, increment backspace but stop query appending
                                state.backspace_count += 1;
                            } else {
                                state.query.push(c);
                                state.backspace_count += 1;
                                let _ = app.emit("inline-search-query", state.query.clone());
                            }
                        } else {
                            state.buffer.push(c);
                            if state.buffer.len() > 50 {
                                state.buffer.remove(0);
                            }

                            // Detect trigger: /parrot:"
                            if state.buffer.ends_with("/parrot:\"") {
                                state.inline_search_active = true;
                                state.target_hwnd = Some(foreground_hwnd.0 as isize);
                                state.query.clear();
                                state.backspace_count = 9; // "/parrot:\"" is 9 chars

                                if let Some(window) = main_window {
                                    let _ = window.move_window(Position::TrayBottomRight);
                                    if let Ok(hwnd) = window.hwnd() {
                                        // Show window without focus using local HWND type
                                        let _ = ShowWindow(HWND(hwnd.0 as *mut std::ffi::c_void), SW_SHOWNA);
                                    }
                                    let _ = app.emit("inline-search-start", ());
                                    let _ = app.emit("inline-search-query", "".to_string());
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    CallNextHookEx(None, n_code, w_param, l_param)
}
