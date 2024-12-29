import { invoke } from "@tauri-apps/api/core";

export namespace ipc {
	export class DesktopFile {
		name!: string;
		icon?: string;
		exec!: string;
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



	export class DisplayHandle {
		idx!: number;
		generation!: number;
	}

	export class Display {
		width!: number;
		height!: number;
		name!: string;
		visible!: boolean;
		handle!: DisplayHandle;
	}

	export class ProcessHandle {
		idx!: number;
		generation!: number;
	}

	export class Process {
		name!: string;
		display_handle!: DisplayHandle;
		handle!: ProcessHandle;
	}

	export async function desktop_file_list(): Promise<Array<DesktopFile>> {
		return await invoke("desktop_file_list");
	}

	export async function game_list(): Promise<Games> {
		return await invoke("game_list");
	}

	export async function game_launch(app_id: number): Promise<void> {
		return await invoke("game_launch", { appId: app_id })
	}

	export async function display_list(): Promise<Array<Display>> {
		return await invoke("display_list");
	}

	export async function display_get(handle: DisplayHandle): Promise<Display> {
		return await invoke("display_get", { handle: handle });
	}

	export async function process_list(): Promise<Array<Process>> {
		return await invoke("process_list");
	}

	export async function process_terminate(handle: ProcessHandle): Promise<undefined> {
		return await invoke("process_terminate", { handle: handle });
	}
}