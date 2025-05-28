use app::{AppParams, AppState};
use tauri::Manager;
use tokio::sync::Mutex;

pub mod app;
pub mod frontend_ipc;
pub mod util;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub async fn run(params: AppParams) {
	let app_state = Mutex::new(AppState::new(params).await.unwrap());

	tauri::Builder::default()
		.plugin(tauri_plugin_http::init())
		.setup(|app| {
			app.manage(app_state);
			AppState::configure_async(app.handle().clone());
			Ok(())
		})
		.invoke_handler(tauri::generate_handler![
			frontend_ipc::is_nvidia,
			frontend_ipc::copy_png_to_frontend_public,
			frontend_ipc::desktop_file_list,
			frontend_ipc::game_list,
			frontend_ipc::game_launch,
			frontend_ipc::game_stop,
			frontend_ipc::running_game_list,
			// sinks
			frontend_ipc::audio_list_sinks,
			frontend_ipc::audio_set_sink_volume,
			frontend_ipc::audio_set_sink_mute,
			frontend_ipc::audio_get_sink_volume,
			frontend_ipc::audio_set_default_sink,
			frontend_ipc::audio_get_default_sink,
			// sources
			frontend_ipc::audio_list_sources,
			frontend_ipc::audio_set_source_volume,
			frontend_ipc::audio_set_source_mute,
			frontend_ipc::audio_get_source_volume,
			frontend_ipc::audio_set_default_source,
			frontend_ipc::audio_get_default_source,
			// cards
			frontend_ipc::audio_list_cards,
			frontend_ipc::audio_set_card_profile,
			// other
			frontend_ipc::get_username,
			frontend_ipc::open_devtools,
			// # monado IPC below
			frontend_ipc::is_monado_present,
			frontend_ipc::monado_recenter,
			frontend_ipc::monado_fix_floor,
			frontend_ipc::monado_get_battery_levels,
			frontend_ipc::monado_client_list,
			frontend_ipc::monado_client_focus,
			// # wlx IPC below
			frontend_ipc::is_ipc_connected,
			frontend_ipc::wvr_auth_info,
			frontend_ipc::wvr_display_list,
			frontend_ipc::wvr_display_create,
			frontend_ipc::wvr_display_get,
			frontend_ipc::wvr_display_remove,
			frontend_ipc::wvr_display_set_visible,
			frontend_ipc::wvr_display_set_layout,
			frontend_ipc::wvr_display_window_list,
			frontend_ipc::wvr_window_set_visible,
			frontend_ipc::wvr_process_get,
			frontend_ipc::wvr_process_list,
			frontend_ipc::wvr_process_terminate,
			frontend_ipc::wvr_process_launch,
			frontend_ipc::wlx_haptics,
			frontend_ipc::wlx_input_state,
		])
		.plugin(tauri_plugin_fs::init())
		.plugin(tauri_plugin_shell::init())
		.run(tauri::generate_context!())
		.expect("Failed to start tauri application");
}
