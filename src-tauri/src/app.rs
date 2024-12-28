use crate::{
	client_ipc::{WayVRClient, WayVRClientMutex},
	util::steam_bridge::SteamBridge,
	wlx_client_ipc::ipc,
};

pub struct AppState {
	pub steam_bridge: SteamBridge,
	pub wavyr_client: WayVRClientMutex,

	pub serial_generator: ipc::SerialGenerator,
}

impl AppState {
	pub async fn new() -> anyhow::Result<Self> {
		let serial_generator = ipc::SerialGenerator::new();

		let steam_bridge = SteamBridge::new()?;
		let ipc_client = WayVRClient::new().await?;

		Ok(Self {
			steam_bridge,
			wavyr_client: ipc_client,
			serial_generator,
		})
	}
}
