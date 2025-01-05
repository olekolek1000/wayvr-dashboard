use alsa::mixer::SelemChannelId;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Device {
	pub name: String,
	pub long_name: String,
	pub index: i32,
}

pub fn list_devices() -> anyhow::Result<Vec<Device>> {
	let devices: Vec<Device> = alsa::card::Iter::new()
		.flatten()
		.filter_map(|card| {
			let Ok(name) = card.get_name() else {
				return None;
			};

			let Ok(long_name) = card.get_longname() else {
				return None;
			};

			if name == "Loopback" {
				return None; // skip this device for obvious reasons
			}

			Some(Device {
				index: card.get_index(),
				name,
				long_name,
			})
		})
		.collect();

	Ok(devices)
}

pub fn get_volume(device_idx: i32) -> anyhow::Result<f32> {
	let name = format!("hw:{}", device_idx);
	let mixer = alsa::mixer::Mixer::new(name.as_str(), false)?;
	let selem_id = alsa::mixer::SelemId::new("Master", 0);
	let Some(selem) = mixer.find_selem(&selem_id) else {
		log::info!("selem not found");
		return Ok(0.0);
	};

	let (_min, max) = selem.get_playback_volume_range();
	let volume = selem.get_playback_volume(SelemChannelId::FrontLeft)?;
	Ok(volume as f32 / max as f32)
}

pub fn set_volume(device_idx: i32, volume: f32) -> anyhow::Result<()> {
	let name = format!("hw:{}", device_idx);

	let mixer = alsa::mixer::Mixer::new(name.as_str(), false)?;
	let selem_id = alsa::mixer::SelemId::new("Master", 0);
	let Some(selem) = mixer.find_selem(&selem_id) else {
		log::info!("selem not found");
		return Ok(());
	};

	let (_min, max) = selem.get_playback_volume_range();
	selem.set_playback_volume_all((volume * max as f32) as i64)?;
	Ok(())
}
