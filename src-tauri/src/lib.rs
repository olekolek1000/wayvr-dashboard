use app::AppState;
use tauri::Manager;

pub mod app;
pub mod frontend_ipc;
pub mod util;

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
			frontend_ipc::desktop_file_list,
			frontend_ipc::game_list,
			frontend_ipc::game_launch,
			frontend_ipc::audio_list_devices,
			frontend_ipc::audio_set_device_volume,
			frontend_ipc::audio_get_device_volume,
			// # wlx IPC below
			frontend_ipc::auth_info,
			frontend_ipc::display_list,
			frontend_ipc::display_create,
			frontend_ipc::display_get,
			frontend_ipc::process_list,
			frontend_ipc::process_terminate,
			frontend_ipc::process_launch,
		])
		.plugin(tauri_plugin_fs::init())
		.plugin(tauri_plugin_shell::init())
		.run(tauri::generate_context!())
		.expect("Failed to start tauri application");
}
