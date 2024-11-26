use std::{collections::HashSet, path::Path};

use ini::Ini;
use walkdir::WalkDir;

use crate::util::icon_finder::find_icons;

#[derive(Debug)]
pub struct DesktopEntry {
	pub desktop_file_path: String,
	pub exec_path: String,
	pub app_name: String,
	pub icon_path: Option<String>,
}

pub struct EntrySearchCell {
	pub desktop_file_path: String,
	pub exec_path: String,
	pub app_name: String,
	pub icon_name: Option<String>,
}

fn search(path: &str) -> anyhow::Result<Vec<DesktopEntry>> {
	println!("searching in path {}", path);

	let mut search_cells = Vec::<EntrySearchCell>::new();

	for entry in WalkDir::new(path)
		.into_iter()
		.filter_map(|e| e.ok())
		.filter(|e| e.file_type().is_file())
	{
		let Some(extension) = Path::new(entry.file_name()).extension() else {
			continue;
		};

		if extension != "desktop" {
			continue; // ignore, go on
		}

		let file_path = format!("{}/{}", path, entry.file_name().to_string_lossy());

		let Ok(ini) = Ini::load_from_file(&file_path) else {
			println!("failed to read INI for .desktop file {}", file_path);
			continue; // failed to read ini, go on
		};

		let Some(section) = ini.section(Some("Desktop Entry")) else {
			println!(
				"failed to get [Desktop Entry] section for file {}",
				file_path
			);
			continue;
		};

		if let Some(no_display) = section.get("NoDisplay") {
			if no_display.eq_ignore_ascii_case("true") {
				continue; // This application is hidden
			}
		}

		let Some(app_name) = section.get("Name") else {
			println!(
				"failed to get desktop entry application name for file {}",
				file_path
			);
			continue;
		};

		let Some(exec) = section.get("Exec") else {
			println!("failed to get desktop entry Exec for file {}", file_path);
			continue;
		};

		let icon_name = section.get("Icon").map(String::from);

		search_cells.push(EntrySearchCell {
			app_name: String::from(app_name),
			exec_path: String::from(exec),
			desktop_file_path: file_path,
			icon_name,
		});
	}

	// generate unique list of icon names
	let unique_icons: HashSet<&str> = search_cells
		.iter()
		.filter_map(|cell| cell.icon_name.as_deref())
		.collect();

	let found_icons = find_icons(unique_icons)?;

	let mut entries = Vec::<DesktopEntry>::new();
	for cell in search_cells {
		let icon_path: Option<String> = if let Some(icon_name) = &cell.icon_name {
			found_icons.get(icon_name).cloned()
		} else {
			println!("Icon for {} not found", cell.desktop_file_path);
			None
		};

		entries.push(DesktopEntry {
			app_name: cell.app_name,
			exec_path: cell.exec_path,
			desktop_file_path: cell.desktop_file_path,
			icon_path,
		});
	}

	Ok(entries)
}

pub fn find_entries() -> anyhow::Result<Vec<DesktopEntry>> {
	let xdg = xdg::BaseDirectories::new()?;

	let mut entries: Vec<DesktopEntry> = Vec::new();

	// read all system desktop entries
	{
		entries.append(&mut search("/usr/share/applications")?);
	}

	// read all local desktop entries
	{
		// usually "~/.local/share"
		let mut path = xdg.get_data_home();
		path.push("applications");
		entries.append(&mut search(&path.to_string_lossy())?);
	}

	Ok(entries)
}
