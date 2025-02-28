use std::sync::Arc;

use tauri::{Emitter, Manager};
use tokio::sync::Mutex;
use wayvr_ipc::{
	client::{WayVRClient, WayVRClientMutex},
	ipc,
	packet_server::PacketServer,
};

use crate::util::steam_bridge::SteamBridge;

pub struct AppState {
	pub steam_bridge: SteamBridge,
	pub wayvr_client: Option<WayVRClientMutex>,
	pub serial_generator: ipc::SerialGenerator,
	pub monado: Option<Arc<Mutex<libmonado::Monado>>>,
}

impl AppState {
	pub async fn new() -> anyhow::Result<Self> {
		let serial_generator = ipc::SerialGenerator::new();

		let steam_bridge = SteamBridge::new()?;

		let monado = match libmonado::Monado::auto_connect() {
			Ok(monado) => {
				log::info!("Connected to Monado IPC");
				Some(Arc::new(Mutex::new(monado)))
			}
			Err(e) => {
				log::warn!("Couldn't connect to Monado IPC: {}", e);
				None
			}
		};

		let wayvr_client = match WayVRClient::new("WayVR Dashboard").await {
			Ok(c) => Some(c),
			Err(e) => {
				log::error!("WayVR Client failed to initialize: {}", e);
				None
			}
		};

		Ok(Self {
			steam_bridge,
			wayvr_client,
			serial_generator,
			monado,
		})
	}

	pub async fn get_monado(&self) -> Option<tokio::sync::OwnedMutexGuard<libmonado::Monado>> {
		let monado = self.monado.clone()?;
		Some(monado.lock_owned().await)
	}

	pub async fn configure_signal_handler(handle: tauri::AppHandle) {
		let app = handle.app_handle().state::<AppState>();
		let Some(wayvr_client) = &app.wayvr_client else {
			return;
		};

		let mut client = wayvr_client.lock().await;

		// configure signal handler
		let handle = handle.clone();
		client.on_signal = Some(Box::new(move |signal| match signal {
			PacketServer::WvrStateChanged(wvr_state_changed) => {
				if let Err(e) = handle.emit("signal_state_changed", wvr_state_changed) {
					log::error!("Failed to send signal: {:?}", e);
				}
				true
			}
			_ => {
				// Ignore packet
				false
			}
		}));
	}

	pub fn configure_async(handle: tauri::AppHandle) {
		tokio::spawn(async move {
			AppState::configure_signal_handler(handle).await;
		});
	}
}
