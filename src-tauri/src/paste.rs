use std::thread;
use std::time::Duration;
use windows::Win32::Foundation::HWND;
use windows::Win32::UI::WindowsAndMessaging::{GetForegroundWindow, SetForegroundWindow};
use enigo::{Enigo, Key, Keyboard, Settings, Direction};

pub fn get_current_foreground_hwnd() -> isize {
    unsafe {
        let hwnd = GetForegroundWindow();
        hwnd.0
    }
}

pub fn restore_focus_and_paste(hwnd_val: isize, backspace_count: usize) -> Result<(), String> {
    unsafe {
        let hwnd = HWND(hwnd_val);
        
        if hwnd_val != 0 {
            SetForegroundWindow(hwnd);
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
