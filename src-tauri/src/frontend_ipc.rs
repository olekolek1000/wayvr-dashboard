use serde::Serialize;
use wayvr_ipc::{client::WayVRClient, packet_server};

use crate::{
	app::AppState,
	util::{self, steam_bridge},
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
pub async fn display_list(
	state: tauri::State<'_, AppState>,
) -> Result<Vec<packet_server::Display>, String> {
	handle_result(
		"fetch displays",
		WayVRClient::fn_display_list(
			state.wavyr_client.clone(),
			state.serial_generator.increment_get(),
		)
		.await,
	)
}

#[tauri::command]
pub async fn display_get(
	state: tauri::State<'_, AppState>,
	handle: packet_server::DisplayHandle,
) -> Result<packet_server::Display, String> {
	let display = handle_result(
		"fetch display",
		WayVRClient::fn_display_get(
			state.wavyr_client.clone(),
			state.serial_generator.increment_get(),
			handle,
		)
		.await,
	)?;

	let display = handle_result("fetch display", display.ok_or("Display doesn't exist"))?;

	Ok(display)
}

#[tauri::command]
pub async fn process_list(
	state: tauri::State<'_, AppState>,
) -> Result<Vec<packet_server::Process>, String> {
	handle_result(
		"fetch processes",
		WayVRClient::fn_process_list(
			state.wavyr_client.clone(),
			state.serial_generator.increment_get(),
		)
		.await,
	)
}

#[tauri::command]
pub async fn process_terminate(
	state: tauri::State<'_, AppState>,
	handle: packet_server::ProcessHandle,
) -> Result<(), String> {
	handle_result(
		"terminate process",
		WayVRClient::fn_process_terminate(state.wavyr_client.clone(), handle).await,
	)
}
