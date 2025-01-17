import { fetch as tauri_fetch } from '@tauri-apps/plugin-http';
import { getVersion } from '@tauri-apps/api/app';
import { ipc } from './ipc';

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

export async function get_app_details_json(app_id: number) {
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

// lists displays except our own dashboard display
export async function listDisplays(): Promise<Array<ipc.Display>> {
	const displays = (await ipc.display_list()).filter((disp) => { return disp.name != dashboard_display_name });
	return displays;
}

export function getUniqueDisplayName(displays: Array<ipc.Display>): string {
	let num = 0;
	while (true) {
		const str = "wvr_" + num;
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
		name: getUniqueDisplayName(displays),
	});

	return handle;
}

export async function openURL(disp: ipc.DisplayHandle, url: string) {
	let params = {
		env: [],
		exec: "xdg-open",
		name: "OpenURL",
		targetDisplay: disp,
		args: url
	};

	await ipc.process_launch(params);
}