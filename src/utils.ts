import { fetch as tauri_fetch } from '@tauri-apps/plugin-http';
import { getVersion } from '@tauri-apps/api/app';
import { ipc } from './ipc';
import { Globals } from './globals';
import { Howl, Howler } from 'howler';
import { createWindowMessage } from './gui/gui';

export function get_external_url(absolute_path: string): string {
	let api_path = (window as any).__TAURI_INTERNALS__.convertFileSrc(absolute_path)
	return api_path;
}

export async function get_version(): Promise<string> {
	return await getVersion();
}

export class AppDetails {
	short_description!: string;
	developers?: any;
}

class AppDetailItem {
	fetched!: number; // Unix timestamp in milliseconds
	data!: AppDetails;
}

export async function get_app_details_json(app_id: string) {
	const key = "app_details_" + app_id;

	const storage = window.localStorage;

	const storage_item_str = storage.getItem(key);

	if (storage_item_str == null) {
		// Fetch from Steam API
		console.log("Fetching app detail ID " + app_id);
		const response_json = await (await tauri_fetch("https://store.steampowered.com/api/appdetails?appids=" + app_id, {
			method: "GET"
		})).json();
		const body = response_json["" + app_id];
		if (!body["success"]) {
			throw new Error("Failed to get details for AppID " + app_id);
		}

		const item: AppDetailItem = {
			data: body.data,
			fetched: (new Date()).getTime()
		};

		storage.setItem(key, JSON.stringify(item));
		return item.data;
	}
	else {
		const storage_item = JSON.parse(storage_item_str) as AppDetailItem;
		return storage_item.data;
	}
}

const dashboard_display_name = "_DASHBOARD";

export async function getDashboardDisplay(): Promise<ipc.Display | null> {
	const displays = (await ipc.display_list()).filter((disp) => { return disp.name == dashboard_display_name });
	if (displays.length == 0) {
		return null;
	}
	return displays[0];
}

// lists displays except our own dashboard display
export async function listDisplays(): Promise<Array<ipc.Display>> {
	const displays = (await ipc.display_list()).filter((disp) => { return disp.name != dashboard_display_name });
	return displays;
}

export function getUniqueDisplayName(displays: Array<ipc.Display>, candidate: string): string {
	let num = 1;
	while (true) {
		let str = candidate;
		if (num > 1) {
			str += "_" + num;
		}
		if (displays.find((disp) => {
			return disp.name == str;
		}) === undefined) {
			return str;
		}
		num++;
	}
}

export async function getDefaultDisplay(): Promise<ipc.DisplayHandle> {
	const displays = await listDisplays();
	if (displays.length > 0) {
		// Get first one for now
		return displays[0].handle;
	}

	const handle = await ipc.display_create({
		width: 1280,
		height: 720,
		attachTo: ipc.AttachTo.None,
		name: getUniqueDisplayName(displays, "wvr"),
	});

	return handle;
}

export async function getAllWindows(): Promise<Array<ipc.Window>> {
	let windows = new Array<ipc.Window>;

	const displays = await ipc.display_list();
	for (const display of displays) {
		const window_list = await ipc.display_window_list({
			handle: display.handle
		});
		if (!window_list) {
			continue;
		}

		for (const window of window_list) {
			windows.push(window);
		}
	}

	return windows;
}

async function openURLInternal(disp: ipc.DisplayHandle, url: string) {
	let params = {
		env: [],
		exec: "xdg-open",
		name: "OpenURL",
		targetDisplay: disp,
		args: url,
		userdata: new Map<string, string>()
	};

	await ipc.display_set_visible({ handle: disp, visible: true });
	await ipc.process_launch(params);

	playAudio("sounds/app_start.opus", 1.0);
}



export async function openURL(url: string, globals: Globals) {
	const target_disp = await getDefaultDisplay();
	openURLInternal(target_disp, url).then(() => {
		globals.toast_manager.push("Webpage opened");
	}).catch((e) => {
		globals.wm.push(createWindowMessage(globals.wm, "Failed to open URL: " + e));
	})
}

export function getDesktopFileURL(desktop_file: ipc.DesktopFile) {
	return (desktop_file.icon ? get_external_url(desktop_file.icon) : "icons/terminal.svg");
}

interface AudioCacheCell {
	sound: Howl;
}

let audio_cache = new Map<string, AudioCacheCell>();

function playAudioInternal(cell: AudioCacheCell, volume: number) {
	const id = cell.sound.play();
	cell.sound.volume(volume, id);
	cell.sound.mute(false, id);
}

export function playAudio(path: string, volume: number) {
	Howler.autoUnlock = false;
	Howler.autoSuspend = false;

	let cell = audio_cache.get(path);
	if (cell === undefined) {
		const sound = new Howl({
			src: [path],
		});

		const new_cell: AudioCacheCell = {
			sound: sound
		};

		audio_cache.set(path, new_cell);
		playAudioInternal(new_cell, volume);
	}
	else {
		playAudioInternal(cell, volume);
	}
}

export async function vibrate_hover() {
	playAudio("sounds/hover.opus", 0.4);

	if (!await ipc.is_ipc_connected()) {
		return;
	}
	ipc.haptics({
		intensity: 0.15,
		duration: 0.1,
		frequency: 0.08,
	}).catch((e) => {
		console.error("Failed to vibrate: ", e);
	})
}

export async function vibrate_down() {
	playAudio("sounds/press_in.opus", 0.2);

	if (!await ipc.is_ipc_connected()) {
		return;
	}
	ipc.haptics({
		intensity: 0.35,
		duration: 0.08,
		frequency: 0.75,
	}).catch((e) => {
		console.error("Failed to vibrate: ", e);
	})
}

export async function vibrate_up() {
	playAudio("sounds/press_out.opus", 0.2);

	if (!await ipc.is_ipc_connected()) {
		return;
	}
	ipc.haptics({
		intensity: 0.25,
		duration: 0.08,
		frequency: 0.3,
	}).catch((e) => {
		console.error("Failed to vibrate: ", e);
	})
}

// yes, I know.
export function obj_equals<T>(a: T, b: T): boolean {
	return JSON.stringify(a) === JSON.stringify(b);
}

export async function isDashboardWindow(window: ipc.Window) {
	const process = await ipc.process_get(window.process_handle);
	if (!process) {
		return false;
	}

	const type = process.userdata.type as string | undefined;
	if (type !== undefined && type == "dashboard") {
		return true;
	}

	return false;
}

async function hideAllDashboardWindows() {
	const dash_display = await getDashboardDisplay();
	if (!dash_display) {
		return;
	}

	const windows = await ipc.display_window_list({
		handle: dash_display.handle
	});

	if (!windows) {
		return;
	}

	for (const window of windows) {
		if (await isDashboardWindow(window)) {
			continue; // skip hiding our dashboard window
		}

		await ipc.window_set_visible({
			handle: window.handle,
			visible: false
		});
	}
}

export async function unfocusAll(globals: Globals) {
	globals.wm.popAll();

	if (!await ipc.is_ipc_connected()) {
		return;
	}
	await hideAllDashboardWindows();
	globals.focused_window = undefined;
	globals.setShowingProcess(undefined);
	globals.setGenerationState(globals.generation_state + 1);
}

export async function focusWindow(globals: Globals, window: ipc.Window) {
	const dash_disp = await getDashboardDisplay();
	if (dash_disp === null) {
		return; // not running in VR mode
	}

	if (!obj_equals(dash_disp.handle, window.display_handle)) {
		return; // this application is not contained in a dashboard display
	}

	await hideAllDashboardWindows();

	const process = await ipc.process_get(window.process_handle);
	if (process === undefined) {
		return;
	}


	if (!obj_equals(globals.focused_window, window.handle)) {
		// if focusing another window
		globals.focused_window = window.handle;
		globals.setShowingProcess(process);
		await ipc.window_set_visible({
			handle: window.handle,
			visible: true
		});
	}
	else {
		// window has been unfocused
		globals.focused_window = undefined;
		globals.setShowingProcess(undefined);
	}

	globals.setGenerationState(globals.generation_state + 1);
}