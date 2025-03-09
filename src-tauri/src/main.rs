// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tracing::level_filters::LevelFilter;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

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

#[tokio::main]
async fn main() {
	init_logging();

	log::info!("Starting WayVR Dashboard v{}", env!("CARGO_PKG_VERSION"));

	wayvr_dashboard_lib::run().await;
}
