import { ipc } from "../ipc";
import style from "../app.module.scss"
import { Icon } from "@/gui/gui";
import { Globals } from "@/globals";
import { createWindowNewDisplay } from "./new_display";

export function Display({ display, icon, on_click, selected }: { display?: ipc.Display, icon?: string, on_click?: () => void, selected?: boolean }) {
	let aspect = display ? (display.width / display.height) : 0.5
	const height = 80;
	const width = Math.max(60, height * aspect);

	let visible = display ? display.visible : false;
	let name = display ? display.name : undefined;

	return <div onClick={on_click} className={`${style.wayvr_display} ${on_click ? style.wayvr_display_hover : ""} ${selected ? style.wayvr_display_sel : ""}`} style={{
		color: visible ? "#FFF" : "rgba(255, 255, 255, 0.6)",
		border: visible ? "2px solid rgba(255, 255, 255, 0.8)" : "2px solid rgba(255, 255, 255, 0.2)",
		width: width + "px",
		height: height + "px",
	}}>
		<div>
			<b>{name}</b>
		</div>
		{display ? <div>
			{display.width}x{display.height}
		</div> : undefined}
		{(display && !display.visible) ? <div>(hidden)</div> : undefined}
		{icon ? <Icon path={icon} width={32} height={32} /> : undefined}
	</div>
}

class Params {
	on_add?: () => void;
	on_click?: (display: ipc.Display) => void;
	selected_display?: ipc.Display;
}

export function DisplayList({ displays, params }: { displays: Array<ipc.Display>, params: Params }) {
	let max_height = 0;

	for (const display of displays) {
		max_height = Math.max(max_height, display.height);
	}

	let elements = displays.length == 0 ? [<>No displays found</>] : displays.map((display) => {
		const c = params.on_click;
		const on_click = c ? () => { c(display); } : undefined;

		return <Display selected={params.selected_display && params.selected_display.handle.idx == display.handle.idx} display={display} on_click={on_click} />
	});

	if (params.on_add) {
		const p = params.on_add;
		elements.push(<Display icon="icons/add.svg" on_click={() => {
			p();
		}} />)
	}

	return <div className={style.wayvr_displays} >
		{elements}
	</div>
}

export function createWindowAddDisplay(globals: Globals, on_add: (handle: ipc.DisplayHandle) => void) {
	createWindowNewDisplay(globals, async (res) => {
		const handle = await ipc.display_create({
			name: res.name,
			width: res.resolution.x,
			height: res.resolution.y,
			attachTo: res.attach_to,
		});

		on_add(handle);
		globals.wm.pop();
	});
}