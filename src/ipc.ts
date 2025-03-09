import { invoke } from "@tauri-apps/api/core";

export namespace ipc {
	interface MapType<_Key, _Value> {

	}

	export function mapIter<Key, Value>(map: MapType<Key, Value>, callback: (key: string, value: Value) => void) {
		for (const key in map as any) {
			callback(key, (map as any)[key]);
		}
	}

	export function mapGet<Key, Value>(map: MapType<Key, Value>, key: string): Value | undefined {
		return (map as any)[key];
	}

	export interface DesktopFile {
		name: string;
		icon?: string;
		exec_path: string;
		exec_args: Array<string>,
		categories: Array<string>,
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

	export interface AudioVolumeChannel {
		value: number;
		value_percent: string; // "80%"
		db: string;
	}
	export interface AudioVolume {
		aux0?: AudioVolumeChannel;
		aux1?: AudioVolumeChannel;
		front_left?: AudioVolumeChannel;
		front_right?: AudioVolumeChannel;
	}

	export interface AudioSink {
		index: number;
		state: string;
		name: string;
		description: string;
		mute: boolean;
		properties: MapType<string, string>;
		volume: AudioVolume;
	}

	export interface CardProperties {
		"device.description": string; // Starship/Matisse HD Audio Controller
		"device.name": string; // alsa_card.pci-0000_0c_00.4
		"device.nick": string; // HD-Audio Generic
	}

	export interface CardProfile {
		description: string; // "Digital Stereo (HDMI 2) Output", "Analog Stereo Output",
		sinks: number; // 1
		sources: number; // 0
		priority: number; // 6500
		available: boolean; // true
	}

	export interface CardPort {
		description: string; // "HDMI / DisplayPort 2"
		type: string; // "HDMI"
		profiles: Array<string>; // "output:hdmi-stereo-extra1", "output:hdmi-surround-extra1", "output:analog-stereo", "output:analog-stereo+input:analog-stereo"

		// example:
		// "port.type": "hdmi"
		// "device.product_name": "Index HMD"
		properties: MapType<string, string>;
	}

	export interface AudioCard {
		index: number; // 57
		name: string; // alsa_card.pci-0000_0c_00.4
		active_profile: string; // output:analog-stereo
		properties: CardProperties;
		profiles: MapType<string, CardProfile>; // key: "output:analog-stereo"
		ports: MapType<string, CardPort>, // key: "analog-output-lineout"
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

	export async function audio_list_cards(): Promise<Array<AudioCard>> {
		return await invoke("audio_list_cards");
	}

	export async function audio_set_card_profile(params: {
		cardIndex: number,
		profile: string
	}): Promise<void> {
		return await invoke("audio_set_card_profile", params);
	}

	export async function audio_list_sinks(): Promise<Array<AudioSink>> {
		return await invoke("audio_list_sinks");
	}

	export async function audio_set_sink_volume(params: {
		sinkIndex: number,
		volume: number
	}): Promise<void> {
		return await invoke("audio_set_sink_volume", params);
	}

	export async function audio_set_sink_mute(params: {
		sinkIndex: number,
		mute: boolean
	}): Promise<void> {
		return await invoke("audio_set_sink_mute", params);
	}

	export async function audio_get_sink_volume(params: {
		sink: AudioSink,
	}): Promise<number> {
		return await invoke("audio_get_sink_volume", params);
	}

	export async function audio_get_default_sink(params: {
		sinks: Array<AudioSink>,
	}): Promise<AudioSink | undefined> {
		return await invoke("audio_get_default_sink", params);
	}

	export async function audio_set_default_sink(params: {
		sinkIndex: number,
	}): Promise<number> {
		return await invoke("audio_set_default_sink", params);
	}

	export async function get_username(): Promise<string> {
		return await invoke("get_username");
	}

	export async function open_devtools(): Promise<void> {
		return await invoke("open_devtools");
	}

	// ================================================================================
	// Monado related below
	// ================================================================================

	export interface MonadoBatteryLevel {
		device_name: string;
		percent: number;
		charging: boolean;
	}

	export async function is_monado_present(): Promise<boolean> {
		return await invoke("is_monado_present");
	}

	export async function monado_recenter(): Promise<void> {
		return await invoke("monado_recenter");
	}

	export async function monado_fix_floor(): Promise<void> {
		return await invoke("monado_fix_floor");
	}

	export async function monado_get_battery_levels(): Promise<MonadoBatteryLevel[]> {
		return await invoke("monado_get_battery_levels");
	}

	// ================================================================================
	// WLX related below
	// ================================================================================

	export interface WlxInputStatePointer {
		pos: [number, number, number];
	}
	export interface WlxInputState {
		hmd_pos: [number, number, number];
		left: WlxInputStatePointer;
		right: WlxInputStatePointer;
	}

	export async function haptics(params: {
		intensity: number,
		duration: number,
		frequency: number
	}): Promise<void> {
		return await invoke("wlx_haptics", params);
	}

	export async function get_input_state(): Promise<WlxInputState> {
		return await invoke("wlx_input_state");
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

	export async function is_ipc_connected(): Promise<boolean> {
		return await invoke("is_ipc_connected");
	}

	export async function auth_get_info(): Promise<AuthInfo | undefined> {
		return await invoke("wvr_auth_info");
	}

	export async function display_list(): Promise<Array<Display>> {
		return await invoke("wvr_display_list");
	}

	export async function display_get(handle: DisplayHandle): Promise<Display> {
		return await invoke("wvr_display_get", { handle: handle });
	}

	export async function display_remove(handle: DisplayHandle): Promise<void> {
		return await invoke("wvr_display_remove", { handle: handle });
	}

	export async function display_set_visible(params: {
		handle: DisplayHandle,
		visible: boolean,
	}): Promise<void> {
		return await invoke("wvr_display_set_visible", params);
	}

	export async function display_set_layout(params: {
		handle: DisplayHandle,
		layout: DisplayWindowLayout
	}): Promise<void> {
		return await invoke("wvr_display_set_layout", params);
	}

	export async function display_window_list(params: {
		handle: DisplayHandle
	}): Promise<Array<Window> | undefined> {
		return await invoke("wvr_display_window_list", params);
	}

	export async function display_create(params: {
		width: number,
		height: number,
		name: string,
		scale?: number,
		attachTo: AttachTo
	}): Promise<DisplayHandle> {
		console.log("Creating display with name " + params.name);
		return await invoke("wvr_display_create", params)
	}

	export async function window_set_visible(params: {
		handle: WindowHandle,
		visible: boolean,
	}): Promise<void> {
		return await invoke("wvr_window_set_visible", params);
	}

	export async function process_get(handle: ProcessHandle): Promise<Process | undefined> {
		return await invoke("wvr_process_get", { handle: handle });
	}

	export async function process_list(): Promise<Array<Process>> {
		return await invoke("wvr_process_list");
	}

	export async function process_terminate(handle: ProcessHandle): Promise<void> {
		return await invoke("wvr_process_terminate", { handle: handle });
	}

	export async function process_launch(params: {
		exec: string,
		name: string,
		env: Array<string>,
		targetDisplay: DisplayHandle,
		args: string,
		userdata: Map<string, string>
	}): Promise<ProcessHandle> {
		return await invoke("wvr_process_launch", params);
	}


}