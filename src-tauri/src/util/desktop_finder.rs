use std::{collections::HashSet, path::Path};

use ini::Ini;
use walkdir::WalkDir;

use crate::util::icon_finder::find_icons;

#[derive(Debug)]
pub struct DesktopEntry {
	pub desktop_file_path: String,
	pub exec_path: String,
	pub exec_args: Vec<String>,
	pub app_name: String,
	pub icon_path: Option<String>,
	pub categories: Vec<String>,
}

pub struct EntrySearchCell {
	pub desktop_file_path: String,
	pub exec_path: String,
	pub exec_args: Vec<String>,
	pub app_name: String,
	pub icon_name: Option<String>,
	pub categories: Vec<String>,
}

const DESKTOP_FILE_BLACKLIST: [&str; 1] = [
	"in.lsp_plug.lsp_plugins", // LSP Plugins collection. They clutter the application list a lot
];

const CATEGORY_TYPE_BLACKLIST: [&str; 4] = ["GTK", "Qt", "GNOME", "KDE"];

fn search_internal(path: &str, icon_share_path: &str) -> anyhow::Result<Vec<DesktopEntry>> {
	log::debug!("Searching in path {}", path);

	let mut search_cells = Vec::<EntrySearchCell>::new();

	'outer: for entry in WalkDir::new(path)
		.into_iter()
		.filter_map(|e| e.ok())
		.filter(|e| !e.file_type().is_dir())
	{
		let Some(extension) = Path::new(entry.file_name()).extension() else {
			continue;
		};

		if extension != "desktop" {
			continue; // ignore, go on
		}

		let file_name = entry.file_name().to_string_lossy();

		let file_path = format!("{}/{}", path, file_name);

		for pat in DESKTOP_FILE_BLACKLIST {
			if file_name.contains(pat) {
				continue 'outer;
			};
		}

		let ini = match Ini::load_from_file(&file_path) {
			Ok(ini) => ini,
			Err(e) => {
				log::debug!(
					"Failed to read INI for .desktop file {}: {:?}, skipping",
					file_path,
					e
				);
				continue;
			}
		};

		let Some(section) = ini.section(Some("Desktop Entry")) else {
			log::debug!(
				"Failed to get [Desktop Entry] section for file {}, skipping",
				file_path
			);
			continue;
		};

		if section.contains_key("OnlyShowIn") {
			continue; // probably XFCE, KDE, GNOME or other DE-specific stuff
		}

		if let Some(term) = section.get("Terminal") {
			if term == "true" {
				continue;
			}
		}

		let Some(exec) = section.get("Exec") else {
			log::debug!(
				"Failed to get desktop entry Exec for file {}, skipping",
				file_path
			);
			continue;
		};

		let (exec_path, exec_args) = match exec.split_once(" ") {
			Some((left, right)) => (
				left,
				right
					.split(" ")
					.filter(|arg| !arg.starts_with('%')) // exclude arguments like "%f"
					.map(String::from)
					.collect(),
			),
			None => (exec, Vec::new()),
		};

		if let Some(no_display) = section.get("NoDisplay") {
			if no_display.eq_ignore_ascii_case("true") {
				continue; // This application is hidden
			}
		}

		let Some(app_name) = section.get("Name") else {
			log::debug!(
				"Failed to get desktop entry application name for file {}, skipping",
				file_path
			);
			continue;
		};

		let icon_name = section.get("Icon").map(String::from);

		let categories: Vec<String> = if let Some(categories) = section.get("Categories") {
			categories
				.split(";")
				.filter(|category| {
					if category.trim().is_empty() {
						return false;
					}

					for cell in CATEGORY_TYPE_BLACKLIST {
						if *category == cell {
							return false;
						}
					}

					true
				})
				.map(String::from)
				.collect()
		} else {
			Vec::new()
		};

		search_cells.push(EntrySearchCell {
			app_name: String::from(app_name),
			exec_path: String::from(exec_path),
			exec_args,
			desktop_file_path: file_path,
			icon_name,
			categories,
		});
	}

	// generate unique list of icon names
	let unique_icons: HashSet<&str> = search_cells
		.iter()
		.filter_map(|cell| cell.icon_name.as_deref())
		.collect();

	let found_icons = find_icons(unique_icons, icon_share_path)?;

	let mut entries = Vec::<DesktopEntry>::new();
	for cell in search_cells {
		let icon_path: Option<String> = if let Some(icon_name) = &cell.icon_name {
			found_icons.get(icon_name).cloned()
		} else {
			log::debug!("Icon for {} not found", cell.desktop_file_path);
			None
		};

		entries.push(DesktopEntry {
			app_name: cell.app_name,
			exec_path: cell.exec_path,
			exec_args: cell.exec_args,
			desktop_file_path: cell.desktop_file_path,
			categories: cell.categories,
			icon_path,
		});
	}

	Ok(entries)
}

fn search(path: &str, icon_share_path: &str) -> Vec<DesktopEntry> {
	match search_internal(path, icon_share_path) {
		Ok(res) => res,
		Err(e) => {
			log::error!("search_internal failed for path {path}: {:?}", e);
			Vec::new() /* return an empty list instead of erroring out */
		}
	}
}

pub fn find_entries() -> anyhow::Result<Vec<DesktopEntry>> {
	let xdg = xdg::BaseDirectories::new()?;

	#[allow(deprecated)] // we are not using windows
	let path_local_share = xdg.get_data_home(); /* usually "~/.local/share"  */
	//let path_home = std::env::home_dir().ok_or(anyhow::anyhow!("home missing"))?;
	//let path_var = path_home.join(".var");

	let mut entries: Vec<DesktopEntry> = Vec::new();

	// Search for system-installed user entries
	entries.append(&mut search("/usr/share/applications", "/usr/share/"));

	// Search for user-installed desktop entries
	entries.append(&mut search(
		&path_local_share.join("applications").to_string_lossy(),
		&path_local_share.to_string_lossy(),
	));

	/*
	// Search for flatpak steam apps
	entries.append(&mut search(
			&path_var
			.join("app/com.valvesoftware.Steam/.local/share/applications/")
				.to_string_lossy(),
				)?);
	 */

	// Search for system-installed flatpak apps
	entries.append(&mut search(
		"/var/lib/flatpak/exports/share/applications/",
		"/var/lib/flatpak/exports/share/",
	));

	// Search for user-installed flatpak apps
	entries.append(&mut search(
		&path_local_share
			.join("flatpak/exports/share/applications/")
			.to_string_lossy(),
		&path_local_share
			.join("flatpak/exports/share/")
			.to_string_lossy(),
	));

	Ok(entries)
}
