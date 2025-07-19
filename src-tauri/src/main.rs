// src-tauri/src/main.rs @preserve
// Prevents additional console window on Windows in release, DO NOT REMOVE!! @preserve
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Builder;
use tauri::Manager;
use tauri_plugin_decorum::WebviewWindowExt;
use tauri_plugin_log::Builder as LogBuilder; // adds helper methods to WebviewWindow

fn main() {
    Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(LogBuilder::new().build())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_decorum::init()) // Initialize the decorum plugin
        .plugin(tauri_plugin_dialog::init()) // Initialize the dialog plugin
        .setup(|app| {
            // Get the main window
            let main_window = app.get_webview_window("main").unwrap();
            // Create a custom titlebar for the main window
            main_window.create_overlay_titlebar().unwrap();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
