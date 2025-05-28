use libmonado::ReferenceSpaceType;
use serde::Serialize;
use std::collections::HashMap;
use tauri::{AppHandle, Emitter};
use tokio::sync::Mutex;
use wayvr_ipc::{
	client::{WayVRClient, WayVRClientMutex},
	packet_client, packet_server,
};

use crate::util::{self, pactl_wrapper};
use std::env;
use std::path::PathBuf;
type AppStateType = Mutex<crate::app::AppState>;

#[derive(Debug, Serialize)]
pub struct DesktopFile {
	name: String,
	icon: Option<String>,
	exec_path: String,
	exec_args: Vec<String>,
	categories: Vec<String>,
}

#[derive(Serialize)]
pub struct Games {
	manifests: Vec<libsteamium::AppManifest>,
}

fn handle_result<T, E>(msg: &str, result: Result<T, E>) -> Result<T, String>
where
	E: std::fmt::Display,
{
	result.map_err(|e| format!("failed to {}: {}", msg, e))
}

fn handle_err<T, E>(result: Result<T, E>) -> Result<T, String>
where
	E: std::fmt::Display,
{
	result.map_err(|e| format!("error: {}", e))
}

#[tauri::command]
pub fn desktop_file_list() -> Result<Vec<DesktopFile>, String> {
	Ok(
		handle_result(
			"find desktop file entries",
			util::desktop_finder::find_entries(),
		)?
		.into_iter()
		.map(|entry| DesktopFile {
			exec_path: entry.exec_path,
			exec_args: entry.exec_args,
			icon: entry.icon_path,
			name: entry.app_name,
			categories: entry.categories,
		})
		.collect::<Vec<DesktopFile>>(),
	)
}

#[tauri::command]
pub async fn game_list(state: tauri::State<'_, AppStateType>) -> Result<Games, String> {
	Ok(Games {
		manifests: handle_result(
			"list game entries",
			state
				.lock()
				.await
				.steamium
				.list_installed_games(libsteamium::GameSortMethod::PlayDateDesc),
		)?,
	})
}


#[tauri::command]
pub fn copy_png_to_frontend_public(app_id_str: String) -> Result<(), String> {
    // Parse the app ID string to u32
    let app_id = app_id_str
        .parse::<u32>()
        .map_err(|e| format!("Invalid app ID: {}", e))?;


    // Create the relative path to "public/covers"
    let relative = PathBuf::from("public").join("covers");

    // Resolve absolute path from current directory
    let current_dir = env::current_dir()
        .map_err(|e| format!("Failed to get current directory: {}", e))?;

    let absolute = current_dir.join("../../../").join(&relative).join(format!("{}.png",app_id_str));
    
	let _ = libsteamium::Steamium::copy_cover_to_front(&app_id,&absolute);
    Ok(())
}


#[tauri::command]
pub fn game_launch(app_id: String) -> Result<(), String> {
	println!("app id received {}", app_id);
	handle_result("launch a game", libsteamium::launch(app_id))
}

#[tauri::command]
pub fn game_stop(app_id: String, force: bool) -> Result<(), String> {
	handle_result("stop a game", libsteamium::stop(app_id, force))
}

#[tauri::command]
pub fn running_game_list() -> Result<Vec<libsteamium::RunningGame>, String> {
	handle_result("list running games", libsteamium::list_running_games())
}

#[tauri::command]
pub async fn audio_list_cards() -> Result<Vec<pactl_wrapper::Card>, String> {
	handle_result("list audio cards", pactl_wrapper::list_cards())
}

#[tauri::command]
pub async fn audio_set_card_profile(card_index: u32, profile: String) -> Result<(), String> {
	handle_result(
		"set card profile",
		pactl_wrapper::set_card_profile(card_index, profile.as_str()),
	)
}

// ######## sinks ########

#[tauri::command]
pub async fn audio_list_sinks() -> Result<Vec<pactl_wrapper::Sink>, String> {
	handle_result("list audio sinks", pactl_wrapper::list_sinks())
}

// Volume: from 0.0 to 1.0 (100%), can exceed up to 150%
#[tauri::command]
pub async fn audio_set_sink_volume(sink_index: u32, volume: f32) -> Result<(), String> {
	handle_result(
		"set sink volume",
		pactl_wrapper::set_sink_volume(sink_index, volume),
	)?;
	Ok(())
}

#[tauri::command]
pub async fn audio_set_sink_mute(sink_index: u32, mute: bool) -> Result<(), String> {
	handle_result(
		"set sink mute",
		pactl_wrapper::set_sink_mute(sink_index, mute),
	)?;
	Ok(())
}

// Volume: from 0.0 to 1.0
#[tauri::command]
pub async fn audio_get_sink_volume(sink: pactl_wrapper::Sink) -> Result<f32, String> {
	handle_result("get sink volume", pactl_wrapper::get_sink_volume(&sink))
}

#[tauri::command]
pub async fn audio_get_default_sink(
	sinks: Vec<pactl_wrapper::Sink>,
) -> Result<Option<pactl_wrapper::Sink>, String> {
	handle_result("get default sink", pactl_wrapper::get_default_sink(&sinks))
}

#[tauri::command]
pub async fn audio_set_default_sink(sink_index: u32) -> Result<(), String> {
	handle_result(
		"set default sink",
		pactl_wrapper::set_default_sink(sink_index),
	)
}

// ######## sources ########

#[tauri::command]
pub async fn audio_list_sources() -> Result<Vec<pactl_wrapper::Source>, String> {
	handle_result("list audio sources", pactl_wrapper::list_sources())
}

// Volume: from 0.0 to 1.0 (100%), can exceed up to 150%
#[tauri::command]
pub async fn audio_set_source_volume(source_index: u32, volume: f32) -> Result<(), String> {
	handle_result(
		"set source volume",
		pactl_wrapper::set_source_volume(source_index, volume),
	)?;
	Ok(())
}

#[tauri::command]
pub async fn audio_set_source_mute(source_index: u32, mute: bool) -> Result<(), String> {
	handle_result(
		"set source mute",
		pactl_wrapper::set_source_mute(source_index, mute),
	)?;
	Ok(())
}

// Volume: from 0.0 to 1.0
#[tauri::command]
pub async fn audio_get_source_volume(source: pactl_wrapper::Source) -> Result<f32, String> {
	handle_result(
		"get source volume",
		pactl_wrapper::get_source_volume(&source),
	)
}

#[tauri::command]
pub async fn audio_get_default_source(
	sources: Vec<pactl_wrapper::Source>,
) -> Result<Option<pactl_wrapper::Source>, String> {
	handle_result(
		"get default source",
		pactl_wrapper::get_default_source(&sources),
	)
}

#[tauri::command]
pub async fn audio_set_default_source(source_index: u32) -> Result<(), String> {
	handle_result(
		"set default source",
		pactl_wrapper::set_default_source(source_index),
	)
}

// ######## ########

#[tauri::command]
pub async fn is_ipc_connected(state: tauri::State<'_, AppStateType>) -> Result<bool, String> {
	Ok(state.lock().await.wayvr_client.is_some())
}

#[tauri::command]
pub async fn is_nvidia(state: tauri::State<'_, AppStateType>) -> Result<bool, String> {
	Ok(state.lock().await.params.is_nvidia)
}

#[tauri::command]
pub fn open_devtools(window: tauri::WebviewWindow) {
	if window.is_devtools_open() {
		window.close_devtools();
	} else {
		window.open_devtools();
	}
}

#[tauri::command]
pub fn get_username() -> String {
	match std::env::var("USER") {
		Ok(user) => user,
		Err(_) => String::from("anonymous"),
	}
}

fn get_err_monado() -> String {
	String::from("Monado is not present")
}

#[tauri::command]
pub async fn is_monado_present(state: tauri::State<'_, AppStateType>) -> Result<bool, String> {
	Ok(state.lock().await.monado.is_some())
}

#[derive(Serialize)]
pub struct BatteryLevel {
	device_name: String,
	percent: f32,
	charging: bool,
}

#[tauri::command]
pub async fn monado_get_battery_levels(
	state: tauri::State<'_, AppStateType>,
) -> Result<Vec<BatteryLevel>, String> {
	let Some(monado) = state.lock().await.get_monado().await else {
		return Err(get_err_monado());
	};

	let mut res = Vec::<BatteryLevel>::new();

	for device in handle_err(monado.devices())? {
		let Ok(bat) = device.battery_status() else {
			continue; // just ignore
		};

		if !bat.present {
			continue; // battery not present
		}

		res.push(BatteryLevel {
			device_name: device.name,
			charging: bat.charging,
			percent: bat.charge,
		})
	}

	Ok(res)
}

const CLIENT_NAME_BLACKLIST: [&str; 2] = ["wlx-overlay-s", "libmonado"];

fn list_clients_filtered(
	monado: &mut libmonado::Monado,
) -> anyhow::Result<Vec<libmonado::Client<'_>>> {
	let mut clients: Vec<_> = monado.clients()?.into_iter().collect();

	let clients: Vec<_> = clients
		.iter_mut()
		.filter_map(|client| {
			let Ok(name) = client.name() else {
				return None;
			};

			for cell in CLIENT_NAME_BLACKLIST {
				if cell == name {
					// blacklisted!
					return None;
				}
			}

			Some(client.clone())
		})
		.collect();

	Ok(clients)
}

#[derive(Serialize)]
pub struct MonadoClient {
	pub name: String,
	pub is_primary: bool,
	pub is_active: bool,
	pub is_visible: bool,
	pub is_focused: bool,
	pub is_overlay: bool,
	pub is_io_active: bool,
}

#[tauri::command]
pub async fn monado_client_list(
	state: tauri::State<'_, AppStateType>,
) -> Result<Vec<MonadoClient>, String> {
	let Some(mut monado) = state.lock().await.get_monado().await else {
		return Err(get_err_monado());
	};

	let clients = handle_err(list_clients_filtered(&mut monado))?;

	let mut res = Vec::<MonadoClient>::new();

	for mut client in clients {
		let name = handle_err(client.name())?;
		let state = handle_err(client.state())?;

		res.push(MonadoClient {
			name,
			is_primary: state.contains(libmonado::ClientState::ClientPrimaryApp),
			is_active: state.contains(libmonado::ClientState::ClientSessionActive),
			is_visible: state.contains(libmonado::ClientState::ClientSessionVisible),
			is_focused: state.contains(libmonado::ClientState::ClientSessionFocused),
			is_overlay: state.contains(libmonado::ClientState::ClientSessionOverlay),
			is_io_active: state.contains(libmonado::ClientState::ClientIoActive),
		});
	}

	Ok(res)
}

#[tauri::command]
pub async fn monado_client_focus(
	state: tauri::State<'_, AppStateType>,
	name: String,
) -> Result<(), String> {
	let mut state = state.lock().await;

	let Some(mut monado) = state.get_monado().await else {
		return Err(get_err_monado());
	};

	let clients = handle_err(list_clients_filtered(&mut monado))?;

	for mut client in clients {
		let client_name = handle_err(client.name())?;
		if client_name != name {
			continue;
		}

		log::info!("Focus set to {}", client_name);
		handle_err(client.set_primary())?;
		state.restart_monado_ipc_dirty_hack();
		return Ok(());
	}

	Err(String::from("Client not found"))
}

#[tauri::command]
pub async fn monado_recenter(state: tauri::State<'_, AppStateType>) -> Result<(), String> {
	let client = get_client(&state).await?;

	let Some(monado) = state.lock().await.get_monado().await else {
		return Err(get_err_monado());
	};

	let input_state = handle_result(
		"fetch input state",
		WayVRClient::fn_wlx_input_state(client, state.lock().await.serial_generator.increment_get())
			.await,
	)?;

	let mut pose = handle_result(
		"get reference space offset",
		monado.get_reference_space_offset(ReferenceSpaceType::Stage),
	)?;

	log::info!("pose: {:?}", pose);

	log::info!("input state: {:?}", input_state);

	pose.position.x += input_state.hmd_pos[0];
	pose.position.z += input_state.hmd_pos[2];

	handle_result(
		"set reference space offset",
		monado.set_reference_space_offset(ReferenceSpaceType::Stage, pose),
	)?;

	Ok(())
}

#[tauri::command]
pub async fn monado_fix_floor(state: tauri::State<'_, AppStateType>) -> Result<(), String> {
	let Some(_monado) = state.lock().await.get_monado().await else {
		return Err(get_err_monado());
	};

	todo!();

	//Ok(())
}

// ############################

#[tauri::command]
pub fn signal_state_changed(app: AppHandle, state: packet_server::WvrStateChanged) {
	app.emit("state_changed", state).unwrap();
}

// TODO: refactor
async fn get_client(state: &AppStateType) -> Result<WayVRClientMutex, String> {
	match &state.lock().await.wayvr_client {
		Some(client) => Ok(client.clone()),
		None => Err(String::from("Couldn't connect to WayVR Server")),
	}
}

#[tauri::command]
pub async fn wvr_auth_info(
	state: tauri::State<'_, AppStateType>,
) -> Result<Option<wayvr_ipc::client::AuthInfo>, String> {
	if state.lock().await.wayvr_client.is_none() {
		return Ok(None);
	}

	let c = get_client(&state).await?;
	let client = c.lock().await;
	Ok(client.auth.clone())
}

#[tauri::command]
pub async fn wvr_display_create(
	state: tauri::State<'_, AppStateType>,
	width: u16,
	height: u16,
	name: String,
	scale: Option<f32>,
	attach_to: packet_client::AttachTo,
) -> Result<packet_server::WvrDisplayHandle, String> {
	let display = handle_result(
		"create display",
		WayVRClient::fn_wvr_display_create(
			get_client(&state).await?,
			state.lock().await.serial_generator.increment_get(),
			packet_client::WvrDisplayCreateParams {
				width,
				height,
				name,
				scale,
				attach_to,
			},
		)
		.await,
	)?;

	Ok(display)
}

#[tauri::command]
pub async fn wvr_display_list(
	state: tauri::State<'_, AppStateType>,
) -> Result<Vec<packet_server::WvrDisplay>, String> {
	handle_result(
		"fetch displays",
		WayVRClient::fn_wvr_display_list(
			get_client(&state).await?,
			state.lock().await.serial_generator.increment_get(),
		)
		.await,
	)
}

#[tauri::command]
pub async fn wvr_display_get(
	state: tauri::State<'_, AppStateType>,
	handle: packet_server::WvrDisplayHandle,
) -> Result<Option<packet_server::WvrDisplay>, String> {
	let display = handle_result(
		"fetch display",
		WayVRClient::fn_wvr_display_get(
			get_client(&state).await?,
			state.lock().await.serial_generator.increment_get(),
			handle,
		)
		.await,
	)?;
	Ok(display)
}

#[tauri::command]
pub async fn wvr_display_window_list(
	state: tauri::State<'_, AppStateType>,
	handle: packet_server::WvrDisplayHandle,
) -> Result<Option<Vec<packet_server::WvrWindow>>, String> {
	handle_result(
		"list window displays",
		WayVRClient::fn_wvr_display_window_list(
			get_client(&state).await?,
			state.lock().await.serial_generator.increment_get(),
			handle,
		)
		.await,
	)
}

#[tauri::command]
pub async fn wvr_display_remove(
	state: tauri::State<'_, AppStateType>,
	handle: packet_server::WvrDisplayHandle,
) -> Result<(), String> {
	handle_result(
		"remove display",
		WayVRClient::fn_wvr_display_remove(
			get_client(&state).await?,
			state.lock().await.serial_generator.increment_get(),
			handle,
		)
		.await,
	)
}

#[tauri::command]
pub async fn wvr_display_set_visible(
	state: tauri::State<'_, AppStateType>,
	handle: packet_server::WvrDisplayHandle,
	visible: bool,
) -> Result<(), String> {
	handle_result(
		"set display visibility",
		WayVRClient::fn_wvr_display_set_visible(get_client(&state).await?, handle, visible).await,
	)
}

#[tauri::command]
pub async fn wvr_display_set_layout(
	state: tauri::State<'_, AppStateType>,
	handle: packet_server::WvrDisplayHandle,
	layout: packet_server::WvrDisplayWindowLayout,
) -> Result<(), String> {
	handle_result(
		"set display layout",
		WayVRClient::fn_wvr_display_set_layout(get_client(&state).await?, handle, layout).await,
	)
}

#[tauri::command]
pub async fn wvr_window_set_visible(
	state: tauri::State<'_, AppStateType>,
	handle: packet_server::WvrWindowHandle,
	visible: bool,
) -> Result<(), String> {
	handle_result(
		"set window visibility",
		WayVRClient::fn_wvr_window_set_visible(get_client(&state).await?, handle, visible).await,
	)
}

#[tauri::command]
pub async fn wvr_process_get(
	state: tauri::State<'_, AppStateType>,
	handle: packet_server::WvrProcessHandle,
) -> Result<Option<packet_server::WvrProcess>, String> {
	let process = handle_result(
		"fetch process",
		WayVRClient::fn_wvr_process_get(
			get_client(&state).await?,
			state.lock().await.serial_generator.increment_get(),
			handle,
		)
		.await,
	)?;

	Ok(process)
}

#[tauri::command]
pub async fn wvr_process_list(
	state: tauri::State<'_, AppStateType>,
) -> Result<Vec<packet_server::WvrProcess>, String> {
	handle_result(
		"fetch processes",
		WayVRClient::fn_wvr_process_list(
			get_client(&state).await?,
			state.lock().await.serial_generator.increment_get(),
		)
		.await,
	)
}

#[tauri::command]
pub async fn wvr_process_terminate(
	state: tauri::State<'_, AppStateType>,
	handle: packet_server::WvrProcessHandle,
) -> Result<(), String> {
	handle_result(
		"terminate process",
		WayVRClient::fn_wvr_process_terminate(get_client(&state).await?, handle).await,
	)
}

#[tauri::command]
pub async fn wvr_process_launch(
	state: tauri::State<'_, AppStateType>,
	exec: String,
	name: String,
	env: Vec<String>,
	target_display: packet_server::WvrDisplayHandle,
	args: String,
	userdata: HashMap<String, String>,
) -> Result<packet_server::WvrProcessHandle, String> {
	handle_result(
		"launch process",
		WayVRClient::fn_wvr_process_launch(
			get_client(&state).await?,
			state.lock().await.serial_generator.increment_get(),
			packet_client::WvrProcessLaunchParams {
				env,
				exec,
				name,
				target_display,
				args,
				userdata,
			},
		)
		.await,
	)
}

#[tauri::command]
pub async fn wlx_haptics(
	state: tauri::State<'_, AppStateType>,
	intensity: f32,
	duration: f32,
	frequency: f32,
) -> Result<(), String> {
	handle_result(
		"send haptics",
		WayVRClient::fn_wlx_haptics(
			get_client(&state).await?,
			packet_client::WlxHapticsParams {
				intensity,
				duration,
				frequency,
			},
		)
		.await,
	)
}

#[tauri::command]
pub async fn wlx_input_state(
	state: tauri::State<'_, AppStateType>,
) -> Result<packet_server::WlxInputState, String> {
	handle_result(
		"request input state",
		WayVRClient::fn_wlx_input_state(
			get_client(&state).await?,
			state.lock().await.serial_generator.increment_get(),
		)
		.await,
	)
}
