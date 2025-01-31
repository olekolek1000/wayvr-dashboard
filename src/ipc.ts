import { invoke } from "@tauri-apps/api/core";

export namespace ipc {
	export interface DesktopFile {
		name: string;
		icon?: string;
		exec: string;
	}

	export interface AppManifest {
		app_id: number;
		name: string;
		raw_state_flags: number;
		last_played?: number
	}

	export interface Games {
		manifests: Array<AppManifest>;
	}

	export interface AudioDevice {
		name: string;
		long_name: string;
		index: number;
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

	export interface AuthInfo {
		runtime: String;
	};

	export interface DisplayHandle {
		idx: number;
		generation: number;
	}

	export interface WindowHandle {
		idx: number;
		generation: number;
	}

	export interface ProcessHandle {
		idx: number;
		generation: number;
	}

	interface Margins {
		left: number;
		right: number;
		top: number;
		bottom: number;
	}

	interface StackingOptions {
		margins_first: Margins;
		margins_rest: Margins;
	}

	type DisplayWindowLayout =
		| "Tiling"
		| {
			"Stacking": StackingOptions;
		};
	export interface Display {
		width: number;
		height: number;
		name: string;
		visible: boolean;
		handle: DisplayHandle;
	}

	export interface Window {
		pos_x: number;
		pos_y: number;
		size_x: number;
		size_y: number;
		visible: number;
		handle: WindowHandle;
		process_handle: ProcessHandle;
		display_handle: DisplayHandle;
	}

	export interface Process {
		name: string;
		display_handle: DisplayHandle;
		handle: ProcessHandle;
		userdata: any;
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

	export async function display_set_visible(params: {
		handle: DisplayHandle,
		visible: boolean,
	}): Promise<void> {
		return await invoke("display_set_visible", params);
	}

	export async function display_set_layout(params: {
		handle: DisplayHandle,
		layout: DisplayWindowLayout
	}): Promise<void> {
		return await invoke("display_set_layout", params);
	}

	export async function display_window_list(params: {
		handle: DisplayHandle
	}): Promise<Array<Window> | undefined> {
		return await invoke("display_window_list", params);
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

	export async function window_set_visible(params: {
		handle: WindowHandle,
		visible: boolean,
	}): Promise<void> {
		return await invoke("window_set_visible", params);
	}

	export async function process_get(handle: ProcessHandle): Promise<Process | undefined> {
		return await invoke("process_get", { handle: handle });
	}

	export async function process_list(): Promise<Array<Process>> {
		return await invoke("process_list");
	}

	export async function process_terminate(handle: ProcessHandle): Promise<void> {
		return await invoke("process_terminate", { handle: handle });
	}

	export async function process_launch(params: {
		exec: string,
		name: string,
		env: Array<string>,
		targetDisplay: DisplayHandle,
		args: string,
		userdata: Map<string, string>
	}): Promise<ProcessHandle> {
		return await invoke("process_launch", params);
	}

	export async function haptics(params: {
		intensity: number,
		duration: number,
		frequency: number
	}): Promise<void> {
		return await invoke("haptics", params);
	}
}