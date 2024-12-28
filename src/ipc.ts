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

	export async function get_games(): Promise<Games> {
		return await invoke("get_games");
	}

	export async function launch_game(app_id: number): Promise<void> {
		return await invoke("launch_game", { appId: app_id })
	}

	export async function list_displays(): Promise<Array<Display>> {
		return await invoke("list_displays");
	}

	export async function get_display(handle: DisplayHandle): Promise<Display> {
		return await invoke("get_display", { handle: handle });
	}

	export async function list_processes(): Promise<Array<Process>> {
		return await invoke("list_processes");
	}

	export async function terminate_process(handle: ProcessHandle): Promise<undefined> {
		return await invoke("terminate_process", { handle: handle });
	}
}