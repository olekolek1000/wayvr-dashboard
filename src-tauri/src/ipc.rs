use serde::Serialize;

use crate::util;

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
			return Err(format!("Couldn't find entries: {}", err));
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
