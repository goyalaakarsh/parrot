use std::fs;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Prompt {
    pub id: String,
    pub title: String,
    pub body: String,
    pub tags: Vec<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub global_shortcut: String,
    pub launch_at_startup: bool,
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
            launch_at_startup: false,
        };
        save_settings(app, &default_settings)?;
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
