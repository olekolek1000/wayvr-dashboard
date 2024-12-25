use serde::Serialize;

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
