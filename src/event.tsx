import { listen } from "@tauri-apps/api/event";
import { Globals } from "./globals";
import { focusWindow, getDashboardDisplay, isDashboardWindow } from "./utils";
import { ipc } from "./ipc";

async function scanForFocusedWindows(globals: Globals) {
	const dash_display = await getDashboardDisplay();
	if (!dash_display) {
		return;
	}

	const window_list = await ipc.display_window_list({
		handle: dash_display.handle
	});

	if (!window_list) {
		return;
	}

	// check which one is visible
	for (const window of window_list) {
		if (await isDashboardWindow(window)) {
			continue;
		}

		if (window.visible) {
			// focus this window
			await focusWindow(globals, window);
			return;
		}
	}
}

export function run_listeners(globals: Globals) {
	listen("signal_state_changed", (event) => {
		const payload = event.payload as string;
		if (payload === "WindowCreated") {
			scanForFocusedWindows(globals);
		}

		globals.setGenerationState(globals.generation_state + 1);
	});

}