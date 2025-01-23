import { render } from "preact";
import { Dashboard } from "./dashboard";
import { Globals } from "./globals";

if (!import.meta.env.DEV) {
	document.oncontextmenu = (event) => {
		event.preventDefault()
	}
}


export var global_scale: number;

var globals: Globals | null = null;

function Main({ }: {}) {
	if (!globals) {
		globals = new Globals();
		globals.global_scale = global_scale;
	}

	return <Dashboard globals={globals} />
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

render(<Main />, el_root);

/*
window.addEventListener("erorr", (message) => {
	if (globals) {
		globals.setGlobalError(JSON.stringify(message));
	}
})

window.addEventListener("unhandledrejection", (event) => {
	if (globals) {
		globals.setGlobalError(event.reason);
	}
});
*/