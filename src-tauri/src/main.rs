// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tracing::level_filters::LevelFilter;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};
use wayvr_dashboard_lib::{app::AppParams, util::nvidia_detect};

fn init_logging() {
	tracing_subscriber::registry()
		.with(
			tracing_subscriber::fmt::layer()
				.pretty()
				.with_writer(std::io::stderr),
		)
		.with(
			/* read RUST_LOG env var */
			EnvFilter::builder()
				.with_default_directive(LevelFilter::INFO.into())
				.from_env_lossy(),
		)
		.init();
}

fn set_wayland() {
	log::debug!("Setting GDK_BACKEND to wayland");
	std::env::set_var("GDK_BACKEND", "wayland");
}

#[tokio::main]
async fn main() {
	init_logging();

	// Enable Wayland GTK if supported
	if std::env::var("WAYVR_DISPLAY_AUTH").is_ok() {
		// Running in WayVR Server
		set_wayland();
	} else if let Ok(t) = std::env::var("XDG_SESSION_TYPE") {
		if t == "wayland" {
			set_wayland();
		}
	}

	log::info!("Starting WayVR Dashboard v{}", env!("CARGO_PKG_VERSION"));

	let is_nvidia = nvidia_detect::check_nvidia();

	wayvr_dashboard_lib::run(AppParams { is_nvidia }).await;
}
