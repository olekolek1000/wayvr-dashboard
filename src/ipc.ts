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
}