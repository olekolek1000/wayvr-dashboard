use std::sync::Arc;

use libsteamium::Steamium;
use tauri::{Emitter, Manager};
use tokio::sync::Mutex;
use wayvr_ipc::{
	client::{WayVRClient, WayVRClientMutex},
	ipc,
	packet_server::PacketServer,
};

pub struct AppParams {
	pub is_nvidia: bool,
}

pub struct AppState {
	pub steamium: Steamium,
	pub wayvr_client: Option<WayVRClientMutex>,
	pub serial_generator: ipc::SerialGenerator,
	pub monado: Option<Arc<Mutex<libmonado::Monado>>>,
	pub params: AppParams,
}

fn init_monado() -> Option<Arc<Mutex<libmonado::Monado>>> {
	match libmonado::Monado::auto_connect() {
		Ok(monado) => {
			log::info!("Connected to Monado IPC");
			Some(Arc::new(Mutex::new(monado)))
		}
		Err(e) => {
			log::warn!("Couldn't connect to Monado IPC: {}. You will not be able to reset playspace or alter your XR runtime.", e);
			None
		}
	}
}

impl AppState {
	pub async fn new(params: AppParams) -> anyhow::Result<Self> {
		let serial_generator = ipc::SerialGenerator::new();

		let steamium = Steamium::new()?;

		let wayvr_client = match WayVRClient::new("WayVR Dashboard").await {
			Ok(c) => Some(c),
			Err(e) => {
				log::warn!("WayVR Client failed to initialize, will run without any remote communication features: {}", e);
				None
			}
		};

		let monado = init_monado();

		log::info!("WayVR Dashboard v{} started.", env!("CARGO_PKG_VERSION"));

		Ok(Self {
			steamium,
			wayvr_client,
			serial_generator,
			monado,
			params,
		})
	}

	pub async fn get_monado(&self) -> Option<tokio::sync::OwnedMutexGuard<libmonado::Monado>> {
		let monado = self.monado.clone()?;
		Some(monado.lock_owned().await)
	}

	pub fn restart_monado_ipc_dirty_hack(&mut self) {
		self.monado = init_monado();
	}

	pub async fn configure_signal_handler(handle: tauri::AppHandle) {
		let app = handle.app_handle().state::<Mutex<AppState>>();
		let Some(wayvr_client) = &app.lock().await.wayvr_client else {
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
