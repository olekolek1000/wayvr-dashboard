use wayvr_ipc::{
	client::{WayVRClient, WayVRClientMutex},
	ipc,
};

use crate::util::steam_bridge::SteamBridge;

pub struct AppState {
	pub steam_bridge: SteamBridge,
	pub wayvr_client: WayVRClientMutex,

	pub serial_generator: ipc::SerialGenerator,
}

impl AppState {
	pub async fn new() -> anyhow::Result<Self> {
		let serial_generator = ipc::SerialGenerator::new();

		let steam_bridge = SteamBridge::new()?;

		let ipc_client = match WayVRClient::new("WayVR Dashboard").await {
			Ok(c) => c,
			Err(e) => anyhow::bail!("WayVR Client failed: {}", e),
		};

		Ok(Self {
			steam_bridge,
			wayvr_client: ipc_client,
			serial_generator,
		})
	}
}
