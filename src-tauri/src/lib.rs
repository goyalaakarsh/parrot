pub mod storage;
pub mod paste;
pub mod hook;
pub mod hotkey;
pub mod commands;

use tauri::{
    tray::TrayIconBuilder,
    Manager, WindowEvent, Emitter
};
use tauri_plugin_positioner::{WindowExt, Position};
use crate::commands::LAST_FOREGROUND_HWND;
use crate::paste::get_current_foreground_hwnd;
use std::sync::Mutex;
use std::sync::atomic::AtomicBool;

pub static HAS_SHOWN_ONCE: AtomicBool = AtomicBool::new(false);
pub static LAST_SHOW_TIME: Mutex<Option<std::time::Instant>> = Mutex::new(None);

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_positioner::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
        .setup(|app| {
            // Setup the global app handle for the keyboard hook
            hook::APP_HANDLE.set(app.handle().clone()).ok();
            
            // Start the low-level keyboard hook thread
            hook::start_keyboard_hook();

            // Register global shortcut handler plugin
            app.handle().plugin(
                tauri_plugin_global_shortcut::Builder::new()
                    .with_handler(move |app, _shortcut, event| {
                        if event.state() == tauri_plugin_global_shortcut::ShortcutState::Pressed {
                            hotkey::handle_hotkey_trigger(app);
                        }
                    })
                    .build(),
            )?;

            // Load saved settings and register the global shortcut
            if let Ok(settings) = storage::load_settings(app.handle()) {
                let _ = hotkey::register_hotkey(app.handle(), &settings.global_shortcut);
            }

            let last_hide_time = std::sync::Arc::new(std::sync::Mutex::new(None::<std::time::Instant>));
            let last_hide_time_clone = last_hide_time.clone();

            let tray_hide_time = std::sync::Arc::new(std::sync::Mutex::new(None::<std::time::Instant>));
            let tray_hide_time_clone = tray_hide_time.clone();

            // Build System Tray (no native menu attached)
            let _tray = TrayIconBuilder::new()
                .icon(tauri::image::Image::from_bytes(include_bytes!("../icons/tray.png")).expect("Failed to load tray icon"))
                .tooltip("Parrot")
                .on_tray_icon_event(move |tray, event| {
                    tauri_plugin_positioner::on_tray_event(tray.app_handle(), &event);
                    if let tauri::tray::TrayIconEvent::Click { button_state: tauri::tray::MouseButtonState::Up, button, .. } = event {
                        let app = tray.app_handle();
                        
                        match button {
                            tauri::tray::MouseButton::Left => {
                                if let Some(window) = app.get_webview_window("main") {
                                    let is_visible = window.is_visible().unwrap_or(false);
                                    
                                    let mut just_hidden = false;
                                    if let Ok(last_hide) = last_hide_time.lock() {
                                        if let Some(instant) = *last_hide {
                                            if instant.elapsed() < std::time::Duration::from_millis(200) {
                                                just_hidden = true;
                                            }
                                        }
                                    }

                                    if is_visible {
                                        let _ = window.hide();
                                    } else if !just_hidden {
                                        // Capture foreground HWND immediately before window takes focus
                                        let hwnd = get_current_foreground_hwnd();
                                        if crate::paste::is_valid_user_window(hwnd) {
                                            *LAST_FOREGROUND_HWND.lock().unwrap() = Some(hwnd);
                                        }
                                        
                                        let _ = window.show();
                                        crate::paste::position_window_at_caret_or_cursor(&window);
                                        let _ = window.set_focus();
                                        
                                        // Record last show time
                                        if let Ok(mut last_show) = LAST_SHOW_TIME.lock() {
                                            *last_show = Some(std::time::Instant::now());
                                        }
                                        let _ = app.emit("open-list", ());
                                    }
                                }
                            }
                            tauri::tray::MouseButton::Right => {
                                if let Some(window) = app.get_webview_window("tray_menu") {
                                    let is_visible = window.is_visible().unwrap_or(false);
                                    
                                    let mut just_hidden = false;
                                    if let Ok(last_hide) = tray_hide_time.lock() {
                                        if let Some(instant) = *last_hide {
                                            if instant.elapsed() < std::time::Duration::from_millis(200) {
                                                just_hidden = true;
                                            }
                                        }
                                    }

                                    if is_visible {
                                        let _ = window.hide();
                                    } else if !just_hidden {
                                        let _ = window.show();
                                        let _ = window.move_window(Position::TrayCenter);
                                        let _ = window.set_focus();
                                    }
                                }
                            }
                            _ => {}
                        }
                    }
                })
                .build(app)?;

            // Register Window Listener for Focus Blur (Hide on lost focus) for main window
            if let Some(window) = app.get_webview_window("main") {
                let window_clone = window.clone();
                let last_hide_time_clone = last_hide_time_clone.clone();
                window.on_window_event(move |event| {
                    if let WindowEvent::Focused(focused) = event {
                        if !focused {
                            // If focus shifts internally (like dragging or keypresses), the foreground window is still ours.
                            let foreground_hwnd = get_current_foreground_hwnd();
                            let our_hwnd = window_clone.hwnd().ok().map(|h| h.0 as isize).unwrap_or(0);
                            if foreground_hwnd == our_hwnd {
                                let _ = window_clone.set_focus();
                                return;
                            }

                            let mut just_shown = false;
                            if let Ok(last_show) = LAST_SHOW_TIME.lock() {
                                if let Some(instant) = *last_show {
                                    if instant.elapsed() < std::time::Duration::from_millis(300) {
                                        just_shown = true;
                                    }
                                }
                            }
                            
                            if just_shown {
                                // Re-focus to keep it on screen (avoids split-second hide)
                                let _ = window_clone.set_focus();
                            } else {
                                let _ = window_clone.hide();
                                if let Ok(mut last_hide) = last_hide_time_clone.lock() {
                                    *last_hide = Some(std::time::Instant::now());
                                }
                                // Also deactivate any active inline search
                                hook::deactivate_inline_search();
                            }
                        }
                    }
                });
            }

            // Register Window Listener for Focus Blur for tray_menu window
            if let Some(window) = app.get_webview_window("tray_menu") {
                let window_clone = window.clone();
                let tray_hide_time_clone = tray_hide_time_clone.clone();
                window.on_window_event(move |event| {
                    if let WindowEvent::Focused(focused) = event {
                        if !focused {
                            let _ = window_clone.hide();
                            if let Ok(mut last_hide) = tray_hide_time_clone.lock() {
                                *last_hide = Some(std::time::Instant::now());
                            }
                        }
                    }
                });
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_prompts,
            commands::save_prompts,
            commands::get_settings,
            commands::save_settings,
            commands::exit_app,
            commands::open_main_window,
            commands::paste_to_previous_window,
            commands::get_foreground_hwnd,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
