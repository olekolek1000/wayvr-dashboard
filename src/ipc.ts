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

	export class AudioDevice {
		name!: string;
		long_name!: string;
		index!: number;
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

	export async function audio_list_devices(): Promise<Array<AudioDevice>> {
		return await invoke("audio_list_devices");
	}

	export async function audio_set_device_volume(params: {
		deviceIndex: number,
		volume: number
	}): Promise<void> {
		return await invoke("audio_set_device_volume", params);
	}

	export async function audio_get_device_volume(params: {
		deviceIndex: number,
	}): Promise<number> {
		return await invoke("audio_get_device_volume", params);
	}

	export async function get_username(): Promise<string> {
		return await invoke("get_username");
	}

	export async function open_devtools(): Promise<void> {
		return await invoke("open_devtools");
	}


	// ================================================================================
	// WayVR related below
	// ================================================================================

	export class AuthInfo {
		runtime!: String;
	};

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

	export enum AttachTo {
		None = "None",
		HandLeft = "HandLeft",
		HandRight = "HandRight",
		Head = "Head",
		Stage = "Stage"
	}

	export async function auth_get_info(): Promise<AuthInfo | undefined> {
		return await invoke("auth_info");
	}

	export async function display_list(): Promise<Array<Display>> {
		return await invoke("display_list");
	}

	export async function display_get(handle: DisplayHandle): Promise<Display> {
		return await invoke("display_get", { handle: handle });
	}

	export async function display_remove(handle: DisplayHandle): Promise<void> {
		return await invoke("display_remove", { handle: handle });
	}

	export async function display_create(params: {
		width: number,
		height: number,
		name: string,
		scale?: number,
		attachTo: AttachTo
	}): Promise<DisplayHandle> {
		console.log("Creating display with name " + params.name);
		return await invoke("display_create", params)
	}

	export async function process_list(): Promise<Array<Process>> {
		return await invoke("process_list");
	}

	export async function process_terminate(handle: ProcessHandle): Promise<undefined> {
		return await invoke("process_terminate", { handle: handle });
	}

	export async function process_launch(params: {
		exec: string,
		name: string,
		env: Array<string>,
		targetDisplay: DisplayHandle,
		args: string,
	}): Promise<ProcessHandle> {
		return await invoke("process_launch", params);
	}
}