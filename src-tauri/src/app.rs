use crate::{client_ipc::WayVRClient, util::steam_bridge::SteamBridge};

pub struct AppState {
	pub steam_bridge: SteamBridge,
	pub ipc_client: WayVRClient,
}

impl AppState {
	pub fn new() -> anyhow::Result<Self> {
		let steam_bridge = SteamBridge::new()?;
		let ipc_client = WayVRClient::new()?;

		Ok(Self {
			steam_bridge,
			ipc_client,
		})
	}
}
