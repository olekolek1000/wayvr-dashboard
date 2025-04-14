use std::{path::PathBuf, str::FromStr};

fn set_envs() {
	// Make this extremely visible to the user
	log::error!("Detected NVIDIA GPU with AppImage. Disabling various effects, expect graphical glitches.\nhttps://github.com/tauri-apps/tauri/issues/9394\nIf you are using AMD as your main GPU, you can safely set WAYVR_DASH_DISABLE_MITIGATIONS=1 environment variable to disable this behavior. You can also consider installing WayVR Dashboard directly via your package manager.");
	log::warn!("Applying WEBKIT_DISABLE_DMABUF_RENDERER=1 and __NV_DISABLE_EXPLICIT_SYNC=1");
	std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
}

pub fn check_nvidia() -> bool {
	// Make sure this is set to 1, even with disabling mitigations
	// https://github.com/tauri-apps/tauri/issues/9394#issuecomment-2746517933
	std::env::set_var("__NV_DISABLE_EXPLICIT_SYNC", "1");

	if let Ok(var) = std::env::var("WAYVR_DASH_DISABLE_MITIGATIONS") {
		if var == "1" {
			log::warn!("Disabling NVIDIA GPU mitigations");
			return false;
		} else if var == "0" {
			set_envs();
			return true;
		}
	}

	let Ok(dir) = std::fs::read_dir(PathBuf::from_str("/proc/driver/nvidia/gpus/").unwrap()) else {
		// definitely not using nvidia, everything should just work
		return false;
	};

	if dir.count() == 0 {
		// has a driver, but not using it
		return false;
	}

	if std::env::var("APPDIR").is_err() {
		log::info!("Detected nvidia, but not applying mitigations (not running in appimage)");
		return false;
	}

	set_envs();

	true
}
