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
    pub text: String,
    #[serde(default)]
    pub source_app: Option<String>,
    pub captured_at: String,
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
}

impl Default for Settings {
    fn default() -> Self {
        Settings {
            global_shortcut: "CommandOrControl+Shift+Space".to_string(),
            quick_capture_shortcut: "CommandOrControl+Shift+C".to_string(),
            launch_at_startup: false,
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

    // Filter out entries older than 15 days
    let cutoff = chrono::Utc::now() - chrono::Duration::days(15);
    let total = entries.len();
    let filtered: Vec<HistoryEntry> = entries
        .into_iter()
        .filter(|e| {
            if let Ok(ts) = chrono::DateTime::parse_from_rfc3339(&e.captured_at) {
                ts.with_timezone(&chrono::Utc) > cutoff
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

pub fn save_history(app: &tauri::AppHandle, entries: &[HistoryEntry]) -> Result<(), String> {
    let path = get_storage_path(app, "history.json")?;
    let content = serde_json::to_string_pretty(entries).map_err(|e| e.to_string())?;
    fs::write(&path, content).map_err(|e| e.to_string())?;
    Ok(())
}
