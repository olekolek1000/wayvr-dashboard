import { invoke } from "@tauri-apps/api/core";

export namespace ipc {
	export class DesktopFile {
		name!: string;
		icon?: string;
		exec!: string;
	}

	export async function get_desktop_files(): Promise<Array<DesktopFile>> {
		return await invoke("get_desktop_files");
	}

	export class AppManifest {
		app_id!: number;
		name!: string;
		raw_state_flags!: number;
		last_played?: number
	}

	export class Games {
		manifests!: Array<AppManifest>;
	}

	export async function get_games(): Promise<Games> {
		return await invoke("get_games");
	}

	export async function launch_game(app_id: number): Promise<void> {
		return await invoke("launch_game", { appId: app_id })
	}
}