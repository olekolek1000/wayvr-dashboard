use serde::Serialize;
use wayvr_ipc::{
	client::{WayVRClient, WayVRClientMutex},
	packet_client, packet_server,
};

use crate::{
	app::AppState,
	util::{self, audio, steam_bridge},
};

#[derive(Debug, Serialize)]
pub struct DesktopFile {
	name: String,
	icon: Option<String>,
	exec: String,
}

#[derive(Serialize)]
pub struct Games {
	manifests: Vec<steam_bridge::AppManifest>,
}

fn handle_result<T, E>(msg: &str, result: Result<T, E>) -> Result<T, String>
where
	E: std::fmt::Display,
{
	result.map_err(|e| format!("failed to {}: {}", msg, e))
}

#[tauri::command]
pub fn desktop_file_list() -> Result<Vec<DesktopFile>, String> {
	Ok(
		handle_result(
			"find desktop file entries",
			util::desktop_finder::find_entries(),
		)?
		.iter()
		.map(|entry| DesktopFile {
			exec: entry.exec_path.clone(),
			icon: entry.icon_path.clone(),
			name: entry.app_name.clone(),
		})
		.collect::<Vec<DesktopFile>>(),
	)
}

#[tauri::command]
pub async fn game_list(state: tauri::State<'_, AppState>) -> Result<Games, String> {
	Ok(Games {
		manifests: handle_result(
			"list game entries",
			state
				.steam_bridge
				.list_installed_games(steam_bridge::GameSortMethod::PlayDateDesc),
		)?,
	})
}

#[tauri::command]
pub fn game_launch(app_id: i32) -> Result<(), String> {
	handle_result(
		"execute xdg-open",
		std::process::Command::new("xdg-open")
			.arg(format!("steam://run/{}", app_id))
			.spawn(),
	)?;
	Ok(())
}

#[tauri::command]
pub async fn audio_list_devices() -> Result<Vec<audio::Device>, String> {
	handle_result("list audio devices", audio::list_devices())
}

// Volume: from 0.0 to 1.0
#[tauri::command]
pub async fn audio_set_device_volume(device_index: i32, volume: f32) -> Result<(), String> {
	handle_result("set audio volume", audio::set_volume(device_index, volume))?;
	Ok(())
}

// Volume: from 0.0 to 1.0
#[tauri::command]
pub async fn audio_get_device_volume(device_index: i32) -> Result<f32, String> {
	handle_result("get audio volume", audio::get_volume(device_index))
}

#[tauri::command]
pub fn is_ipc_connected(state: tauri::State<'_, AppState>) -> bool {
	state.wayvr_client.is_some()
}

#[tauri::command]
pub fn open_devtools(window: tauri::WebviewWindow) {
	if window.is_devtools_open() {
		window.close_devtools();
	} else {
		window.open_devtools();
	}
}

#[tauri::command]
pub fn get_username() -> String {
	match std::env::var("USER") {
		Ok(user) => user,
		Err(_) => String::from("anonymous"),
	}
}

// ############################

fn get_client(state: &AppState) -> Result<WayVRClientMutex, String> {
	match &state.wayvr_client {
		Some(client) => Ok(client.clone()),
		None => Err(String::from("Couldn't connect to WayVR Server")),
	}
}

#[tauri::command]
pub async fn auth_info(
	state: tauri::State<'_, AppState>,
) -> Result<Option<wayvr_ipc::client::AuthInfo>, String> {
	if state.wayvr_client.is_none() {
		return Ok(None);
	}

	let c = get_client(&state)?;
	let client = c.lock().await;
	Ok(client.auth.clone())
}

#[tauri::command]
pub async fn display_create(
	state: tauri::State<'_, AppState>,
	width: u16,
	height: u16,
	name: String,
	scale: Option<f32>,
	attach_to: packet_client::AttachTo,
) -> Result<packet_server::WvrDisplayHandle, String> {
	let display = handle_result(
		"create display",
		WayVRClient::fn_wvr_display_create(
			get_client(&state)?,
			state.serial_generator.increment_get(),
			packet_client::WvrDisplayCreateParams {
				width,
				height,
				name,
				scale,
				attach_to,
			},
		)
		.await,
	)?;

	Ok(display)
}

#[tauri::command]
pub async fn display_list(
	state: tauri::State<'_, AppState>,
) -> Result<Vec<packet_server::WvrDisplay>, String> {
	handle_result(
		"fetch displays",
		WayVRClient::fn_wvr_display_list(get_client(&state)?, state.serial_generator.increment_get())
			.await,
	)
}

#[tauri::command]
pub async fn display_get(
	state: tauri::State<'_, AppState>,
	handle: packet_server::WvrDisplayHandle,
) -> Result<packet_server::WvrDisplay, String> {
	let display = handle_result(
		"fetch display",
		WayVRClient::fn_wvr_display_get(
			get_client(&state)?,
			state.serial_generator.increment_get(),
			handle,
		)
		.await,
	)?;

	let display = handle_result("fetch display", display.ok_or("Display doesn't exist"))?;

	Ok(display)
}

#[tauri::command]
pub async fn display_remove(
	state: tauri::State<'_, AppState>,
	handle: packet_server::WvrDisplayHandle,
) -> Result<(), String> {
	handle_result(
		"remove display",
		WayVRClient::fn_wvr_display_remove(
			get_client(&state)?,
			state.serial_generator.increment_get(),
			handle,
		)
		.await,
	)
}

#[tauri::command]
pub async fn process_list(
	state: tauri::State<'_, AppState>,
) -> Result<Vec<packet_server::WvrProcess>, String> {
	handle_result(
		"fetch processes",
		WayVRClient::fn_wvr_process_list(get_client(&state)?, state.serial_generator.increment_get())
			.await,
	)
}

#[tauri::command]
pub async fn process_terminate(
	state: tauri::State<'_, AppState>,
	handle: packet_server::WvrProcessHandle,
) -> Result<(), String> {
	handle_result(
		"terminate process",
		WayVRClient::fn_wvr_process_terminate(get_client(&state)?, handle).await,
	)
}

#[tauri::command]
pub async fn process_launch(
	state: tauri::State<'_, AppState>,
	exec: String,
	name: String,
	env: Vec<String>,
	target_display: packet_server::WvrDisplayHandle,
	args: String,
) -> Result<packet_server::WvrProcessHandle, String> {
	handle_result(
		"launch process",
		WayVRClient::fn_wvr_process_launch(
			get_client(&state)?,
			state.serial_generator.increment_get(),
			packet_client::WvrProcessLaunchParams {
				env,
				exec,
				name,
				target_display,
				args,
			},
		)
		.await,
	)
}
