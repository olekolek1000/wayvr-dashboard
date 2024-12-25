use app::AppState;
use tauri::Manager;

pub mod app;
pub mod ipc;
pub mod util;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
	tauri::Builder::default()
		.plugin(tauri_plugin_http::init())
		.setup(|app| {
			app.manage(AppState::new().unwrap());
			Ok(())
		})
		.invoke_handler(tauri::generate_handler![
			ipc::get_desktop_files,
			ipc::get_games,
			ipc::launch_game,
		])
		.plugin(tauri_plugin_fs::init())
		.plugin(tauri_plugin_shell::init())
		.run(tauri::generate_context!())
		.expect("Failed to start tauri application");
}
