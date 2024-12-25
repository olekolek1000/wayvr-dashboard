use std::{
	collections::{HashMap, HashSet},
	path::PathBuf,
};

use ini::Ini;

#[derive(Debug, Clone)]
pub struct DirList {
	pub dirs: Vec<PathBuf>,
	pub theme: String,
}

const PRIORITIES: &[&str] = &["scalable", "128x128", "64x64", "32x32", "16x16"];

fn sort_by_priority<'a>(directories: &'a Vec<&str>) -> Vec<(usize, &'a str)> {
	let mut priorities: Vec<(usize /* priority */, &str /* dir */)> = directories
		.iter()
		.map(|dir| {
			(
				PRIORITIES
					.iter()
					.position(|p| dir.contains(p))
					.unwrap_or(usize::MAX),
				*dir,
			)
		})
		.collect();

	priorities.sort_by_key(|cell| cell.0);
	priorities
}

pub fn find_icons(
	icon_list: HashSet<&str>,
) -> anyhow::Result<HashMap<String /* icon name */, String /* icon path */>> {
	let xdg = xdg::BaseDirectories::new()?;

	let mut res: HashMap<String, String> = HashMap::new();

	// list all icon files from the dirs only once
	struct Cell {
		filename_without_ext: String,
		full_path: PathBuf,
	}
	let mut all_icon_files = Vec::<Cell>::new();

	let mut scan_dir = |path: &PathBuf| {
		let Ok(scanner) = std::fs::read_dir(path) else {
			log::error!("Failed to scan directory {:?}", path);
			return;
		};

		for entry in scanner.into_iter().flatten() {
			let Ok(ftype) = entry.file_type() else {
				continue;
			};

			if !ftype.is_file() {
				continue;
			}

			let filename = entry.file_name();
			let filename_str = filename.to_string_lossy();

			if !match filename_str.rsplit_once(".") {
				Some((_left, ext)) => ext.eq_ignore_ascii_case("png") || ext.eq_ignore_ascii_case("svg"),
				None => false,
			} {
				continue; // unknown file format
			}

			let filename_without_ext = match filename_str.rsplit_once(".") {
				Some((left, _right)) => left,
				None => &filename_str,
			};

			all_icon_files.push(Cell {
				filename_without_ext: String::from(filename_without_ext),
				full_path: PathBuf::from(&path).join(filename),
			});
		}
	};

	// Generate additional icon entries from non-standard dirs (only /usr/share/pixmaps for now)
	scan_dir(&PathBuf::from("/usr/share/pixmaps"));

	let mut theme_dirs: Vec<String> = Vec::new();

	let local_share_path = xdg.get_data_home();

	// Get currently set user icon theme
	let config_path = xdg.get_config_home();
	let theme_settings_path = config_path.join("gtk-4.0/settings.ini");
	if let Ok(settings_ini) = Ini::load_from_file(theme_settings_path) {
		if let Some(section_settings) = settings_ini.section(Some("Settings")) {
			if let Some(icon_theme_name) = section_settings.get("gtk-icon-theme-name") {
				// system icons
				theme_dirs.push(format!("/usr/share/icons/{}", icon_theme_name));
				// locally installed icons
				theme_dirs.push(
					local_share_path
						.join(format!("icons/{}", icon_theme_name))
						.to_string_lossy()
						.to_string(),
				);
			}
		}
	}

	// system hicolor icons
	theme_dirs.push(String::from("/usr/share/icons/hicolor")); // fallback, this should always be present

	// local hicolor icons (steam uses them)
	theme_dirs.push(
		local_share_path
			.join("icons/hicolor")
			.to_string_lossy()
			.to_string(),
	);
	for theme_dir in theme_dirs.iter() {
		let theme_dir_path = PathBuf::from(theme_dir);

		if !theme_dir_path.exists() {
			continue;
		}

		let path_index = theme_dir_path.join("index.theme");
		log::debug!("Loading ini {:?}", path_index);

		if let Ok(ini) = Ini::load_from_file(path_index) {
			let Some(section_icon_theme) = ini.section(Some("Icon Theme")) else {
				log::warn!("[Icon theme] section not found");
				continue;
			};

			let Some(directories_str) = section_icon_theme.get("Directories") else {
				log::warn!("\"Directories\" missing");
				continue;
			};

			let directories: Vec<&str> = directories_str.split(",").collect();
			let directories_sorted = sort_by_priority(&directories);
			for (_priority, dir) in &directories_sorted {
				let full_dir = theme_dir_path.join(dir);
				scan_dir(&full_dir);
			}
		} else {
			// somewhat common, just go on
			log::info!("index.theme invalid or not found, using predefined paths");
			// for steam
			scan_dir(&theme_dir_path.join("128x128/apps"));
			scan_dir(&theme_dir_path.join("64x64/apps"));
			scan_dir(&theme_dir_path.join("48x48/apps"));
			scan_dir(&theme_dir_path.join("32x32/apps"));
			scan_dir(&theme_dir_path);
		}
	}

	// Match found icons
	for icon in &icon_list {
		//check if icon name is an icon path
		let path_icon = PathBuf::from(icon);
		if path_icon.is_absolute() && path_icon.exists() {
			// absolute path icon name, match directly
			res.insert(String::from(*icon), String::from(*icon));
		} else {
			// normal icon name
			for cell in &all_icon_files {
				if cell.filename_without_ext == *icon {
					//found!
					res.insert(
						String::from(*icon),
						String::from(cell.full_path.to_string_lossy()),
					);
					break;
				}
			}
		}
	}

	Ok(res)
}
