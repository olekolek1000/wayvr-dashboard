use serde::Serialize;

use crate::{
	app::AppState,
	client_ipc::WayVRClient,
	util::{self, steam_bridge},
	wlx_client_ipc::packet_server,
};

#[derive(Debug, Serialize)]
pub struct DesktopFile {
	name: String,
	icon: Option<String>,
	exec: String,
}

#[tauri::command]
pub fn get_desktop_files() -> Result<Vec<DesktopFile>, String> {
	let entries = match util::desktop_finder::find_entries() {
		Ok(res) => res,
		Err(err) => {
			return Err(format!("Couldn't find desktop file entries: {}", err));
		}
	};

	let mut res: Vec<DesktopFile> = Vec::new();

	for entry in entries {
		res.push(DesktopFile {
			exec: entry.exec_path,
			icon: entry.icon_path,
			name: entry.app_name,
		});
	}

	Ok(res)
}

#[derive(Serialize)]
pub struct Games {
	manifests: Vec<steam_bridge::AppManifest>,
}

#[tauri::command]
pub async fn get_games(state: tauri::State<'_, AppState>) -> Result<Games, String> {
	let manifests = match state
		.steam_bridge
		.list_installed_games(steam_bridge::GameSortMethod::PlayDateDesc)
	{
		Ok(res) => res,
		Err(err) => return Err(format!("Couldn't list game entries: {}", err)),
	};

	Ok(Games { manifests })
}

#[tauri::command]
pub fn launch_game(app_id: i32) -> Result<(), String> {
	println!("Launching game {}", app_id);

	let child = std::process::Command::new("xdg-open")
		.arg(format!("steam://run/{}", app_id))
		.spawn();

	if let Err(e) = child {
		return Err(format!("failed to execute xdg-open: {}", e));
	}

	Ok(())
}

#[tauri::command]
pub async fn list_displays(
	state: tauri::State<'_, AppState>,
) -> Result<Vec<packet_server::Display>, String> {
	let displays = match WayVRClient::list_displays(
		state.wavyr_client.clone(),
		state.serial_generator.increment_get(),
	)
	.await
	{
		Ok(d) => d,
		Err(e) => return Err(format!("failed to fetch displays: {}", e)),
	};

	Ok(displays)
}

#[tauri::command]
pub async fn get_display(
	state: tauri::State<'_, AppState>,
	handle: packet_server::DisplayHandle,
) -> Result<packet_server::Display, String> {
	let display = match WayVRClient::get_display(
		state.wavyr_client.clone(),
		state.serial_generator.increment_get(),
		handle,
	)
	.await
	{
		Ok(d) => d,
		Err(e) => return Err(format!("failed to fetch display: {}", e)),
	}
	.ok_or("Display not found")?;

	Ok(display)
}

#[tauri::command]
pub async fn list_processes(
	state: tauri::State<'_, AppState>,
) -> Result<Vec<packet_server::Process>, String> {
	let processes = match WayVRClient::list_processes(
		state.wavyr_client.clone(),
		state.serial_generator.increment_get(),
	)
	.await
	{
		Ok(d) => d,
		Err(e) => return Err(format!("failed to fetch processes: {}", e)),
	};

	Ok(processes)
}

#[tauri::command]
pub async fn terminate_process(
	state: tauri::State<'_, AppState>,
	handle: packet_server::ProcessHandle,
) -> Result<(), String> {
	match WayVRClient::terminate_process(state.wavyr_client.clone(), handle).await {
		Ok(d) => d,
		Err(e) => return Err(format!("failed to terminate process: {}", e)),
	};

	Ok(())
}
