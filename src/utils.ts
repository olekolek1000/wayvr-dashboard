export function get_external_url(absolute_path: string): string {
	let api_path = (window as any).__TAURI_INTERNALS__.convertFileSrc(absolute_path)
	return api_path;
}