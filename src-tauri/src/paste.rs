use std::thread;
use std::time::Duration;
use windows::Win32::Foundation::HWND;
use windows::Win32::UI::WindowsAndMessaging::{
    GetForegroundWindow, SetForegroundWindow, GetClassNameW, GetWindowThreadProcessId,
    GetGUIThreadInfo, GUITHREADINFO, GetCursorPos
};
use windows::Win32::Graphics::Gdi::ClientToScreen;
use enigo::{Enigo, Key, Keyboard, Settings, Direction};

pub fn get_current_foreground_hwnd() -> isize {
    unsafe {
        let hwnd = GetForegroundWindow();
        hwnd.0 as isize
    }
}

pub fn is_valid_user_window(hwnd_val: isize) -> bool {
    if hwnd_val == 0 {
        return false;
    }
    
    unsafe {
        let hwnd = HWND(hwnd_val as *mut std::ffi::c_void);
        
        // 1. Check if the window belongs to our own process
        let mut window_process_id = 0u32;
        let _ = GetWindowThreadProcessId(hwnd, Some(&mut window_process_id));
        if window_process_id == std::process::id() {
            return false;
        }
        
        // 2. Check if the window is the Windows Taskbar or Desktop background
        let mut class_name = [0u16; 256];
        let len = GetClassNameW(hwnd, &mut class_name);
        if len > 0 {
            let class_str = String::from_utf16_lossy(&class_name[..len as usize]);
            if class_str == "Shell_TrayWnd" 
                || class_str == "Shell_SecondaryTrayWnd" 
                || class_str == "WorkerW"
                || class_str == "Progman"
            {
                return false;
            }
        }
    }
    
    true
}

pub fn restore_focus_and_paste(hwnd_val: isize) -> Result<(), String> {
    unsafe {
        let hwnd = HWND(hwnd_val as *mut std::ffi::c_void);
        
        if hwnd_val != 0 {
            let _ = SetForegroundWindow(hwnd);
            // Non-negotiable 150ms sleep to let OS transfer focus
            thread::sleep(Duration::from_millis(150));
        }

        let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;

        // Simulate Ctrl+V pasting
        enigo.key(Key::Control, Direction::Press).ok();
        enigo.key(Key::Unicode('v'), Direction::Press).ok();
        enigo.key(Key::Unicode('v'), Direction::Release).ok();
        enigo.key(Key::Control, Direction::Release).ok();
    }
    
    Ok(())
}

pub fn position_window_at_caret_or_cursor(window: &tauri::WebviewWindow) {
    let mut target_point = windows::Win32::Foundation::POINT { x: 0, y: 0 };
    let mut got_caret = false;

    // 1. Try to get caret position using GetGUIThreadInfo
    let mut gti = GUITHREADINFO {
        cbSize: std::mem::size_of::<GUITHREADINFO>() as u32,
        ..Default::default()
    };
    
    unsafe {
        // Passing 0 queries the active/foreground thread
        if GetGUIThreadInfo(0, &mut gti).is_ok() {
            if !gti.hwndCaret.is_invalid() {
                let mut pt = windows::Win32::Foundation::POINT {
                    x: gti.rcCaret.left,
                    y: gti.rcCaret.bottom, // align window just below the caret line
                };
                if ClientToScreen(gti.hwndCaret, &mut pt).as_bool() {
                    // Make sure it's not a garbage coordinate (0, 0)
                    if pt.x != 0 || pt.y != 0 {
                        target_point = pt;
                        got_caret = true;
                    }
                }
            }
        }
    }

    // 2. Fallback to current mouse cursor if caret pos is unavailable
    if !got_caret {
        unsafe {
            let _ = GetCursorPos(&mut target_point);
        }
    }

    // 3. Move the window to the calculated position, adjusting for monitor boundaries and scale factor
    if let Ok(Some(monitor)) = window.current_monitor() {
        let monitor_pos = monitor.position();
        let monitor_size = monitor.size();
        let scale_factor = monitor.scale_factor();

        // Get window size in physical pixels
        let window_size = window.inner_size().unwrap_or(tauri::PhysicalSize { width: 380, height: 450 });
        
        let mut x = target_point.x;
        let mut y = target_point.y;

        // Offset below caret/cursor by 20 physical pixels scaled
        let offset_y = (20.0 * scale_factor) as i32;
        y += offset_y;

        // Shift left if it goes off the right edge of the screen
        let monitor_right = monitor_pos.x + monitor_size.width as i32;
        if x + window_size.width as i32 > monitor_right {
            x = monitor_right - window_size.width as i32 - (10.0 * scale_factor) as i32;
        }
        if x < monitor_pos.x {
            x = monitor_pos.x + (10.0 * scale_factor) as i32;
        }

        // Shift above the caret/cursor if it goes off the bottom of the screen
        let monitor_bottom = monitor_pos.y + monitor_size.height as i32;
        if y + window_size.height as i32 > monitor_bottom {
            y = target_point.y - window_size.height as i32 - (10.0 * scale_factor) as i32;
        }
        if y < monitor_pos.y {
            y = monitor_pos.y + (10.0 * scale_factor) as i32;
        }

        let _ = window.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x, y }));
    } else {
        let _ = window.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x: target_point.x, y: target_point.y }));
    }
}
