use std::thread;
use std::time::Duration;
use windows::Win32::Foundation::HWND;
use windows::Win32::UI::WindowsAndMessaging::{
    GetForegroundWindow, SetForegroundWindow, GetClassNameW, GetWindowThreadProcessId
};
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

pub fn restore_focus_and_paste(hwnd_val: isize, backspace_count: usize) -> Result<(), String> {
    unsafe {
        let hwnd = HWND(hwnd_val as *mut std::ffi::c_void);
        
        if hwnd_val != 0 {
            let _ = SetForegroundWindow(hwnd);
            // Non-negotiable 150ms sleep to let OS transfer focus
            thread::sleep(Duration::from_millis(150));
        }

        let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;

        // If this paste was triggered via inline search (/parrot:), delete the trigger text first
        for _ in 0..backspace_count {
            enigo.key(Key::Backspace, Direction::Press).ok();
            enigo.key(Key::Backspace, Direction::Release).ok();
        }

        if backspace_count > 0 {
            // Tiny extra sleep to ensure backspaces are processed before pasting
            thread::sleep(Duration::from_millis(50));
        }

        // Simulate Ctrl+V pasting
        enigo.key(Key::Control, Direction::Press).ok();
        enigo.key(Key::Unicode('v'), Direction::Press).ok();
        enigo.key(Key::Unicode('v'), Direction::Release).ok();
        enigo.key(Key::Control, Direction::Release).ok();
    }
    
    Ok(())
}
