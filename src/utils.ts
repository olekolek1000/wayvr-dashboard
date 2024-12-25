import { fetch as tauri_fetch } from '@tauri-apps/plugin-http';

export function get_external_url(absolute_path: string): string {
	let api_path = (window as any).__TAURI_INTERNALS__.convertFileSrc(absolute_path)
	return api_path;
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