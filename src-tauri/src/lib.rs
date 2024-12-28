use app::AppState;
use tauri::Manager;

pub mod app;
pub mod client_ipc;
pub mod frontend_ipc;
pub mod util;
pub mod wlx_client_ipc;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub async fn run() {
	let app_state = AppState::new().await.unwrap();

	tauri::Builder::default()
		.plugin(tauri_plugin_http::init())
		.setup(|app| {
			app.manage(app_state);
			Ok(())
		})
		.invoke_handler(tauri::generate_handler![
			frontend_ipc::get_desktop_files,
			frontend_ipc::get_games,
			frontend_ipc::launch_game,
			frontend_ipc::list_displays,
			frontend_ipc::get_display,
		])
		.plugin(tauri_plugin_fs::init())
		.plugin(tauri_plugin_shell::init())
		.run(tauri::generate_context!())
		.expect("Failed to start tauri application");
}
