use crate::util::steam_bridge::SteamBridge;

pub struct AppState {
	pub steam_bridge: SteamBridge,
}

impl AppState {
	pub fn new() -> anyhow::Result<Self> {
		let steam_bridge = SteamBridge::new()?;

		Ok(Self { steam_bridge })
	}
}
