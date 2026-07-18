use std::fs;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Prompt {
    pub id: String,
    pub title: String,
    #[serde(alias = "body")]
    pub text: String,
    pub tags: Vec<String>,
    pub created_at: String,
    #[serde(default)]
    pub last_used_at: Option<String>,
    #[serde(default)]
    pub pinned: bool,
    #[serde(default)]
    pub pinned_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct HistoryEntry {
    pub id: String,
    #[serde(default)]
    pub text: String,
    #[serde(default)]
    pub source_app: Option<String>,
    pub captured_at: String,
    #[serde(default)]
    pub image_path: Option<String>,
    #[serde(default)]
    pub image_width: Option<u32>,
    #[serde(default)]
    pub image_height: Option<u32>,
}

impl HistoryEntry {
    pub fn is_image(&self) -> bool {
        self.image_path.is_some()
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    #[serde(default = "default_shortcut")]
    pub global_shortcut: String,
    #[serde(default = "default_quick_capture_shortcut")]
    pub quick_capture_shortcut: String,
    #[serde(default)]
    pub launch_at_startup: bool,
    #[serde(default = "default_text_retention")]
    pub text_history_retention_days: u32,
    #[serde(default = "default_image_retention")]
    pub image_history_retention_days: u32,
}

fn default_text_retention() -> u32 { 15 }
fn default_image_retention() -> u32 { 5 }

impl Default for Settings {
    fn default() -> Self {
        Settings {
            global_shortcut: "CommandOrControl+Shift+Space".to_string(),
            quick_capture_shortcut: "CommandOrControl+Shift+C".to_string(),
            launch_at_startup: false,
            text_history_retention_days: 15,
            image_history_retention_days: 5,
        }
    }
}

fn default_shortcut() -> String {
    "CommandOrControl+Shift+Space".to_string()
}

fn default_quick_capture_shortcut() -> String {
    "CommandOrControl+Shift+C".to_string()
}

fn get_storage_path(app: &tauri::AppHandle, filename: &str) -> Result<PathBuf, String> {
    let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    
    // Ensure the directory exists
    if !app_data_dir.exists() {
        fs::create_dir_all(&app_data_dir).map_err(|e| e.to_string())?;
    }
    
    Ok(app_data_dir.join(filename))
}

pub fn load_prompts(app: &tauri::AppHandle) -> Result<Vec<Prompt>, String> {
    let path = get_storage_path(app, "prompts.json")?;
    if !path.exists() {
        // Return default empty list
        let default_prompts: Vec<Prompt> = Vec::new();
        save_prompts(app, &default_prompts)?;
        return Ok(default_prompts);
    }
    
    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let prompts: Vec<Prompt> = serde_json::from_str(&content).map_err(|e| e.to_string())?;
    Ok(prompts)
}

pub fn save_prompts(app: &tauri::AppHandle, prompts: &Vec<Prompt>) -> Result<(), String> {
    let path = get_storage_path(app, "prompts.json")?;
    let content = serde_json::to_string_pretty(prompts).map_err(|e| e.to_string())?;
    fs::write(&path, content).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn load_settings(app: &tauri::AppHandle) -> Result<Settings, String> {
    let path = get_storage_path(app, "config.json")?;
    if !path.exists() {
        // Default settings
        let default_settings = Settings {
            global_shortcut: "CommandOrControl+Shift+Space".to_string(),
            quick_capture_shortcut: "CommandOrControl+Shift+C".to_string(),
            launch_at_startup: true,
            text_history_retention_days: 15,
            image_history_retention_days: 5,
        };
        save_settings(app, &default_settings)?;
        
        // Enable autostart in OS registry on first run
        use tauri_plugin_autostart::ManagerExt;
        let _ = app.autolaunch().enable();
        
        return Ok(default_settings);
    }
    
    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let settings: Settings = serde_json::from_str(&content).map_err(|e| e.to_string())?;
    Ok(settings)
}

pub fn save_settings(app: &tauri::AppHandle, settings: &Settings) -> Result<(), String> {
    let path = get_storage_path(app, "config.json")?;
    let content = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
    fs::write(&path, content).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn load_history(app: &tauri::AppHandle) -> Result<Vec<HistoryEntry>, String> {
    let path = get_storage_path(app, "history.json")?;
    if !path.exists() {
        return Ok(Vec::new());
    }
    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let entries: Vec<HistoryEntry> = serde_json::from_str(&content).map_err(|e| e.to_string())?;

    let settings = load_settings(app).unwrap_or_default();
    let text_cutoff = chrono::Utc::now() - chrono::Duration::days(settings.text_history_retention_days as i64);
    let image_cutoff = chrono::Utc::now() - chrono::Duration::days(settings.image_history_retention_days as i64);

    let total = entries.len();
    let filtered: Vec<HistoryEntry> = entries
        .into_iter()
        .filter(|e| {
            if let Ok(ts) = chrono::DateTime::parse_from_rfc3339(&e.captured_at) {
                let utc_ts = ts.with_timezone(&chrono::Utc);
                if e.is_image() {
                    utc_ts > image_cutoff
                } else {
                    utc_ts > text_cutoff
                }
            } else {
                false
            }
        })
        .collect();

    // Write back the filtered list
    if filtered.len() < total {
        let _ = save_history(app, &filtered);
    }

    Ok(filtered)
}

pub fn delete_image_file(app: &tauri::AppHandle, image_path: &str) {
    if image_path.is_empty() {
        return;
    }
    if let Ok(app_data_dir) = app.path().app_data_dir() {
        let full_path = app_data_dir.join(image_path);
        let _ = fs::remove_file(full_path);
    }
}

pub fn cleanup_orphaned_images(app: &tauri::AppHandle, keep_entries: &[HistoryEntry]) {
    if let Ok(app_data_dir) = app.path().app_data_dir() {
        let images_dir = app_data_dir.join("images");
        if !images_dir.exists() {
            return;
        }
        // Collect referenced image paths
        let referenced: std::collections::HashSet<&str> = keep_entries
            .iter()
            .filter_map(|e| e.image_path.as_deref())
            .collect();

        // Delete files not in referenced set
        if let Ok(entries) = fs::read_dir(&images_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if let Some(relative) = path.strip_prefix(&app_data_dir).ok() {
                    let rel_str = relative.to_string_lossy().replace('\\', "/");
                    if !referenced.contains(rel_str.as_str()) {
                        let _ = fs::remove_file(&path);
                    }
                }
            }
        }
    }
}

pub fn save_history(app: &tauri::AppHandle, entries: &[HistoryEntry]) -> Result<(), String> {
    let path = get_storage_path(app, "history.json")?;
    let content = serde_json::to_string_pretty(entries).map_err(|e| e.to_string())?;
    fs::write(&path, content).map_err(|e| e.to_string())?;
    cleanup_orphaned_images(app, entries);
    Ok(())
}

pub fn save_image_to_disk(app: &tauri::AppHandle, entry_id: &str, data: &[u8], width: u32, height: u32) -> Result<String, String> {
    let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let images_dir = app_data_dir.join("images");
    fs::create_dir_all(&images_dir).map_err(|e| e.to_string())?;

    let filename = format!("{}.png", entry_id);
    let file_path = images_dir.join(&filename);

    let img: image::ImageBuffer<image::Rgba<u8>, Vec<u8>> =
        image::ImageBuffer::from_raw(width, height, data.to_vec())
            .ok_or_else(|| "Failed to create image buffer".to_string())?;
    img.save(&file_path).map_err(|e| e.to_string())?;

    let relative = format!("images/{}", filename);
    Ok(relative)
}
