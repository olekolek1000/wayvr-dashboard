import { ipc } from "../ipc";
import style from "../app.module.scss"

function Display({ display, scale }: { display: ipc.Display, scale: number }) {
	return <div className={style.wayvr_display} style={{
		color: display.visible ? "#FFF" : "rgba(255, 255, 255, 0.6)",
		border: display.visible ? "2px solid rgba(255, 255, 255, 0.8)" : "2px solid rgba(255, 255, 255, 0.2)",
		width: (display.width * scale) + "px",
		height: (display.height * scale) + "px",
	}}>
		<div>
			<b>{display.name}</b>
		</div>
		<div>
			{display.width}x{display.height}
		</div>
		{display.visible ? undefined : <div>(hidden)</div>}
	</div>
}

export function DisplayList({ displays }: { displays: Array<ipc.Display> }) {
	let max_height = 0;

	for (const display of displays) {
		max_height = Math.max(max_height, display.height);
	}

	return <div className={style.wayvr_displays}>
		{displays.length == 0 ? "No displays found" : displays.map((display) => {
			return <Display scale={0.2} display={display} />
		})}
	</div>
}