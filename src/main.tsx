import { render } from "preact";
import { Dashboard } from "./dashboard";
import { Globals } from "./globals";
import { run_listeners } from "./event";
import { get_version } from "./utils";
import { clearDesktopFilesCache } from "./panel/applications";
import { preferences } from "./preferences";
import { ipc } from "./ipc";

if (!import.meta.env.DEV) {
	document.oncontextmenu = (event) => {
		event.preventDefault()
	}
}
export var globals: Globals | null = null;

export var global_scale: number;

function Main({ globals, initial_preferences }: { globals: Globals, initial_preferences: preferences.Preferences }) {
	run_listeners(globals);

	return <Dashboard globals={globals} initial_preferences={initial_preferences} />
}

var el_root = document.getElementById("root")!;
el_root.style.position = "absolute";

// scale dashboard to window size
window.addEventListener("resize", on_resize);

function on_resize() {
	const target_width = 960;
	const target_height = 540;
	const target_aspect = target_width / target_height;

	const window_width = window.innerWidth;
	const window_height = window.innerHeight;
	const window_aspect = window_width / window_height;

	// scale container accordingly
	const scale_x = window_width / target_width;
	const scale_y = window_height / target_height;

	const scale = Math.min(scale_x, scale_y);

	global_scale = scale;
	if (globals) {
		globals.global_scale = scale;
	}

	el_root.style.zoom = "" + scale;

	el_root.style.width = (target_width) + "px";
	el_root.style.height = (target_height) + "px";

	// center container
	if (target_aspect > window_aspect) {
		el_root.style.top = (window_height / 2.0 - (target_height / 2.0) * scale) / scale + "px";
		el_root.style.left = "0px";
	}
	else {
		el_root.style.top = "0px";
		el_root.style.left = (window_width / 2.0 - (target_width / 2.0) * scale) / scale + "px";
	}
}

on_resize();

async function prepare() {
	globals = new Globals();
	globals.global_scale = global_scale;
	globals.is_nvidia = await ipc.is_nvidia();

	let pref = preferences.loadPreferences();
	if (globals.is_nvidia) {
		pref.opaque_background = true;
		// Disable window transparency completely
		document.getElementById("body")!.style.backgroundColor = "black";
	}

	const storage = window.localStorage;
	const version = await get_version();
	const last_version = storage.getItem("last_version");

	// Clear various caches in case if the dashboard version changed
	if (last_version !== version) {
		storage.setItem("last_version", version);
		clearDesktopFilesCache();
	}

	render(<Main globals={globals} initial_preferences={pref} />, el_root);
}


prepare()


