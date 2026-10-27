#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use tauri_plugin_clipboard_manager::ClipboardExt;
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_opener::OpenerExt;

#[tauri::command]
fn open_url(app: tauri::AppHandle, url: String) -> Result<(), String> {
    if !url.starts_with("https://") {
        return Err("Only HTTPS links can open in the browser.".into());
    }
    app.opener().open_url(url, None::<&str>).map_err(|error| error.to_string())
}

#[tauri::command]
fn copy_text(app: tauri::AppHandle, text: String) -> Result<(), String> {
    app.clipboard().write_text(text).map_err(|error| error.to_string())
}

#[tauri::command]
async fn save_text(app: tauri::AppHandle, filename: String, text: String) -> Result<bool, String> {
    if filename.contains('/') || filename.contains('\\') || text.len() > 5_000_000 {
        return Err("Invalid download.".into());
    }
    let path = app.dialog().file().set_file_name(filename).blocking_save_file();
    if let Some(path) = path {
        let path = path.into_path().map_err(|error| error.to_string())?;
        std::fs::write(path, text).map_err(|error| error.to_string())?;
        return Ok(true);
    }
    Ok(false)
}

#[tauri::command]
async fn save_bytes(app: tauri::AppHandle, filename: String, bytes: Vec<u8>) -> Result<bool, String> {
    if filename.contains('/') || filename.contains('\\') || !filename.ends_with(".xlsx") || bytes.len() > 8_000_000 {
        return Err("Invalid spreadsheet download.".into());
    }
    let path = app.dialog().file().set_file_name(filename).add_filter("Excel spreadsheet", &["xlsx"]).blocking_save_file();
    if let Some(path) = path {
        let path = path.into_path().map_err(|error| error.to_string())?;
        std::fs::write(path, bytes).map_err(|error| error.to_string())?;
        return Ok(true);
    }
    Ok(false)
}

#[tauri::command]
async fn load_profile(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let path = app.dialog().file().add_filter("Naming profiles", &["json"]).blocking_pick_file();
    if let Some(path) = path {
        let path = path.into_path().map_err(|error| error.to_string())?;
        if std::fs::metadata(&path).map_err(|error| error.to_string())?.len() > 1_000_000 {
            return Err("Choose a profile smaller than 1 MB.".into());
        }
        return std::fs::read_to_string(path).map(Some).map_err(|error| error.to_string());
    }
    Ok(None)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![copy_text, save_text, save_bytes, load_profile, open_url])
        .run(tauri::generate_context!())
        .expect("Unable to start Name Everything Better");
}
