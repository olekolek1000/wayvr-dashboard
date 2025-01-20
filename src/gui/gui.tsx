import { useEffect, useRef, useState } from "preact/hooks";
import scss from "../app.module.scss"
import { ipc } from "../ipc";
import { get_app_details_json, get_external_url, getDefaultDisplay, listDisplays, openURL } from "../utils";
import { WindowManager, WindowParams } from "./window_manager";
import { Globals } from "@/globals";
import { CSSProperties } from "preact/compat";
import { createWindowAddDisplay, DisplayList } from "@/views/display_list";

export function Icon({ path, width, height, color, className }: { path: string, width?: number, height?: number, color?: string, className?: string }) {
	return <img className={`${scss.icon} ${className ? className : ""}`} src={path} style={{
		width: width && (width + "px"),
		height: height && (height + "px"),
		color: color
	}}>
	</img>
}

export function PanelButton({ icon, height, on_click, square, children }: { icon: string, height?: number, on_click: () => void, square?: boolean, children?: any }) {
	return <div onClick={on_click} className={square ? scss.panel_button_square : scss.panel_button} style={{
		height: height ? (height + "px") : "undefined",

	}}>
		<Icon path={icon} />
		{children}
	</div>
}

function mix(x: number, y: number, a: number) {
	return x * (1.0 - a) + y * a;
}

function getSliderParams(el: HTMLDivElement, value: number) {
	value = Math.max(value, 0.0);
	value = Math.min(value, 1.0);
	const rect = el.getBoundingClientRect();

	const margin = 12.0;
	const width = rect.width - margin * 2.0;
	const left = rect.x + margin;
	const right = left + width;

	return {
		handle_shift: mix(margin, rect.width - margin, value),
		filling_width: mix(margin, rect.width - margin, value),
		top: rect.top,
		left: left,
		right: right,
		margin: margin,
	};
}

export function Line({ from, to }: { from: [number, number], to: [number, number] }) {
	const angle = Math.atan2(to[1] - from[1], to[0] - from[0]);
	const dist = Math.sqrt(Math.pow(to[0] - from[0], 2.0) + Math.pow(to[1] - from[1], 2.0));

	return <div style={{
		position: "fixed",
		top: 0,
		left: 0,
		zIndex: 10,
		backgroundColor: "white",
		width: "1px",
		height: "2px",
		transformOrigin: "center left",
		transform: "translateX(" + from[0] + "px) translateY(" + from[1] + "px) rotate(" + angle + "rad) scaleX(" + dist + ")"
	}}>

	</div>
}

export function Slider({ value, setValue, width, on_change }: { value: number, setValue: any, on_change: (value: number) => void, width?: number }) {
	const ref_bar = useRef<HTMLDivElement | null>(null);
	const [handle_shift, setHandleShift] = useState(0.0);
	const [filling_width, setFillingWidth] = useState(0.0);
	const [down, setDown] = useState(false);
	const [mouse_pos, setMousePos] = useState<[number, number]>([0, 0]);
	const [target, setTarget] = useState<[number, number]>([0, 0]);

	useEffect(() => {
		const el = ref_bar.current;
		if (!el) {
			return;
		}

		const par = getSliderParams(el, value);
		setHandleShift(par.handle_shift);
		setFillingWidth(par.filling_width);
	}, [ref_bar]);

	const updatePos = (mouse_x: number) => {
		const el = ref_bar.current!;
		const par = getSliderParams(el, value);
		const rel_x = mouse_x - par.left;
		const norm_x = rel_x / (par.right - par.left);

		value = norm_x;
		setValue(value);
		on_change(Math.max(0.0, Math.min(1.0, value)));

		const par2 = getSliderParams(el, value);
		setHandleShift(par2.handle_shift);
		setFillingWidth(par2.filling_width);

		setTarget([par2.left + par2.handle_shift - 12, par2.top + 6]);
	}

	useEffect(() => {
		if (!down) {
			return;
		}

		const func_move = (e: any) => {
			updatePos(e.clientX);
			setMousePos([e.clientX, e.clientY]);
		};

		const func_up = () => {
			setDown(false);
		}

		document.addEventListener("mousemove", func_move);
		document.addEventListener("mouseup", func_up);

		return () => {
			document.removeEventListener("mousemove", func_move);
			document.removeEventListener("mouseup", func_up);
		}
	}, [down]);

	return <div className={scss.slider}
		style={{
			width: (width ? width : 160) + "px"
		}}
		onMouseDown={(e) => {
			setDown(true);
			updatePos(e.clientX);
			setMousePos([e.clientX, e.clientY]);
		}}
		onMouseMove={(e) => {
			if (!down) {
				return;
			}
			updatePos(e.clientX);
		}}
		onMouseUp={() => {
			setDown(false);
		}}
	>
		{down ? <Line from={mouse_pos} to={target} /> : undefined}

		<div ref={ref_bar} className={scss.slider_bar}>
			<div className={scss.slider_filling}
				style={{
					width: filling_width + "px"
				}}
			/>
			<div className={scss.slider_handle}
				style={{
					visibility: (ref_bar && ref_bar.current) ? "visible" : "hidden",
					transform: "translateX(-12px) translateY(-12px) translateX(" + handle_shift + "px)",
				}}>

			</div>
		</div>
	</div>
}

export function Tooltip({ children, title, simple }: { children: any, title: any, simple?: boolean }) {
	const [hovered, setHovered] = useState(false);
	const ref_tooltip = useRef<HTMLDivElement | null>(null);

	let content = undefined;

	if (hovered) {
		content = <div ref={ref_tooltip} className={simple ? scss.tooltip_simple : scss.tooltip}>
			{title}
		</div>
	};

	return <div style={{
		position: "relative",
		width: "100%",
		height: "100%"
	}} onMouseEnter={() => {
		setHovered(true);
	}} onMouseLeave={() => {
		setHovered(false);
	}}>
		<>
			{hovered ? <div style={{
				position: "absolute",
				right: simple ? undefined : "0",
				top: simple ? undefined : "0",
				bottom: simple ? "0" : undefined,
			}}>
				{content}
			</div> : undefined}
			{children}
		</>
	</div>
}

class FailedCovers {
	covers = new Array<number>;
}

export function failed_covers_clear() {
	localStorage.removeItem("failed_covers");
}

function failed_covers_get() {
	const covers = localStorage.getItem("failed_covers");
	if (!covers) {
		return new FailedCovers();
	}

	return JSON.parse(covers) as FailedCovers;
};

function failed_covers_set(covers: FailedCovers) {
	localStorage.setItem("failed_covers", JSON.stringify(covers));
}

function get_alt_cover(manifest: ipc.AppManifest) {
	return <>
		<img className={scss.game_cover_image} src="/no_cover.webp" />
		<span className={scss.game_cover_title}>{manifest.name}</span>
	</>;
}

export function GameCover({ manifest, big, on_click }: { manifest: ipc.AppManifest, big?: boolean, on_click?: () => void }) {
	const [content, setContent] = useState(<></>);

	useEffect(() => {
		const failed_covers = failed_covers_get();

		const ret = failed_covers.covers.find((val) => { return val == manifest.app_id });
		if (ret === undefined) {
			const url = "https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/" + manifest.app_id + "/library_600x900.jpg";
			setContent(<img className={scss.game_cover_image} src={url} onError={() => {
				console.log("Alt cover " + manifest.app_id + " failed to load, remembering it to prevent unnecessary requests to Steam API ");
				const covers = failed_covers_get();
				covers.covers.push(manifest.app_id);
				failed_covers_set(covers);
				setContent(get_alt_cover(manifest));
			}} />);
		}
		else {
			console.log("using previously failed cover");
			setContent(get_alt_cover(manifest));
		}
	}, []);

	return <div onClick={on_click} className={big ? scss.game_cover_big : scss.game_cover} style={{
	}}>
		{content}
		<div className={scss.game_cover_shine} />
	</div>
}

export function ApplicationCover({ big, application, on_click }: { big?: boolean, application: ipc.DesktopFile, on_click?: () => void }) {
	return <div className={big ? scss.application_cover_big : scss.application_cover} onClick={on_click}>
		<div className={scss.application_cover_icon} style={{
			background: "url('" + (application.icon ? get_external_url(application.icon) : "icons/unknown.svg") + "')",
			backgroundSize: "contain",
			backgroundPosition: "center",
			backgroundRepeat: "no-repeat"
		}}>

		</div>
		{big ? undefined : <div className={scss.application_cover_title}>
			{application.name}
		</div>}
	</div>
}

export function Separator({ }: {}) {
	return <div className={scss.separator}></div>
}

export function Title({ title }: { title: string }) {
	return <div className={scss.title}>
		{title}
	</div>
}

export function Inline({ children }: { children?: any }) {
	return <div className={scss.inline}>
		{children}
	</div>
}

export function Container({ children, className, on_click }: { children?: any, className?: string, on_click?: () => void }) {
	return <div className={`${scss.container} ${className ? className : ""}`} onClick={on_click}>
		{children}
	</div>
}

export function BoxRight({ children, style, className }: { children?: any, style?: CSSProperties, className?: string }) {
	return <div className={`${scss.box_right} ${className ? className : ""}`} style={style}>
		{children}
	</div>
}

export function BoxDown({ children }: { children?: any }) {
	return <div className={scss.box_down}>
		{children}
	</div >
}


export function Checkbox({ pair, title, onChange }: { pair: [checked: boolean, setChecked: any], title: string, onChange?: (n: boolean) => void }) {
	const checked = pair[0];
	const setChecked = pair[1];
	return <div className={scss.checkbox_body} onClick={() => {
		setChecked(!checked);
		if (onChange) {
			onChange(!checked);
		}
	}}>
		<div className={`${scss.checkbox_checkmark} ${checked ? scss.checkbox_checkmark_checked : ""}`} >
			{checked && "✔️"}
		</div>
		<div>
			{title}
		</div>
	</div>
}

function ApplicationView({ globals, application, }: { globals: Globals, application: ipc.DesktopFile }) {
	const [details, setDetails] = useState(<></>);
	const [xwayland_mode, setXWaylandMode] = useState(false);
	const [force_wayland, setForceWayland] = useState(true);
	const [displays, setDisplays] = useState<ipc.Display[] | null>(null);
	const [selected_display, setSelectedDisplay] = useState<ipc.Display | null>(null);

	const refreshDisplays = async () => {
		setDisplays(await listDisplays());
	}

	useEffect(() => {
		setDetails(<>Executable: {application.exec}</>);
		refreshDisplays();
	}, []);

	let button = undefined;

	if (selected_display) {
		button = <BigButton title="Launch" type={BigButtonColor.green} on_click={async () => {
			let env: Array<string> = [];

			if (force_wayland) {
				// This list could be larger, feel free to expand it
				env.push("QT_QPA_PLATFORM=wayland");
				env.push("GDK_BACKEND=wayland");
				env.push("SDL_VIDEODRIVER=wayland");
				env.push("XDG_SESSION_TYPE=wayland");
				env.push("ELECTRON_OZONE_PLATFORM_HINT=wayland");
			}

			let params = xwayland_mode ? {
				env: env,
				exec: "cage",
				name: application.name,
				targetDisplay: selected_display.handle,
				args: "-- " + application.exec
			} : {
				env: env,
				exec: application.exec,
				name: application.name,
				targetDisplay: selected_display.handle,
				args: ""
			};

			ipc.process_launch(params).then(() => {
				globals.toast_manager.push("Application launched on \"" + selected_display.name + "\"");
				globals.wm.pop();
			}).catch((e) => {
				globals.wm.push(createWindowMessage(globals.wm, "Error: " + e));
			})
		}} />
	}

	return <div className={scss.previewer_content}>
		<ApplicationCover big application={application} />
		<div className={scss.previewer_info}>
			<div className={scss.previewer_title}>{application.name}</div>
			{details}
			<Checkbox title="Run in X11 mode via XWayland (cage)" pair={[xwayland_mode, setXWaylandMode]} onChange={(n) => {
				if (n) {
					setForceWayland(false);
				}
			}} />
			<Checkbox title="Force-enable Wayland for various backends - Qt/GTK/SDL (...)" pair={[force_wayland, setForceWayland]} onChange={(n) => {
				if (n) {
					setXWaylandMode(false);
				}
			}} />

			<Title title="Select display to run app from" />
			{displays !== null ? <DisplayList displays={displays} params={{
				on_add: () => {
					createWindowAddDisplay(globals, displays, () => {
						refreshDisplays();
					});
				},
				on_click: (disp) => {
					setSelectedDisplay(disp);
				},
				selected_display: selected_display ?? undefined
			}} /> : undefined}

			{button}
		</div>
	</div>
}

async function open_url_wrapper(url: string, globals: Globals) {
	const target_disp = await getDefaultDisplay();
	openURL(target_disp, url).then(() => {
		globals.toast_manager.push("Webpage opened");
	}).catch((e) => {
		globals.wm.push(createWindowMessage(globals.wm, "Failed to open URL: " + e));
	})
}

function ManifestView({ globals, manifest }: { globals: Globals, manifest: ipc.AppManifest }) {
	const [details, setDetails] = useState(<></>);

	useEffect(() => {
		const run = async () => {
			const data = await get_app_details_json(manifest.app_id);
			setDetails(<>
				<div>
					by&nbsp;
					<span className={scss.previewer_developers}>
						{data.developers[0]}
					</span>
				</div>
				<div className={scss.previewer_desc}>
					{data.short_description}
				</div>

			</>)
		}
		run().catch((e) => {
			setDetails(<>{"Failed to fetch details: " + e}</>);
		});
	}, []);

	return <div className={scss.previewer_content}>
		<GameCover big manifest={manifest} />
		<div className={scss.previewer_info}>
			<div className={scss.previewer_title}>{manifest.name}</div>
			{details}
			<BigButton title="Launch" type={BigButtonColor.green} on_click={() => {
				ipc.game_launch(manifest.app_id);
				globals.toast_manager.push("Game launched. This might take a while");
			}} />
			<BoxRight>
				<BigButton title="Product page" type={BigButtonColor.blue} on_click={async () => {
					const url = "https://store.steampowered.com/app/" + manifest.app_id;
					await open_url_wrapper(url, globals);
				}} />
				<BigButton title="Reviews" type={BigButtonColor.blue} on_click={async () => {
					const url = "https://steamcommunity.com/app/" + manifest.app_id + "/reviews";
					await open_url_wrapper(url, globals);
				}} />
			</BoxRight>
		</div>
	</div>
}

export function createWindowApplication(globals: Globals, application: ipc.DesktopFile) {
	globals.wm.push({
		title: application.name,
		content: <ApplicationView globals={globals} application={application} />
	});
}

export function createWindowManifest(globals: Globals, manifest: ipc.AppManifest) {
	globals.wm.push({
		title: manifest.name,
		content: <ManifestView globals={globals} manifest={manifest} />
	});
}

export function createWindowMessage(wm: WindowManager, msg: string): WindowParams {
	return {
		title: "Info",
		content: <div className={scss.previewer_content}>
			<div className={scss.previewer_message}>
				{msg}
				<BigButton title="OK" type={BigButtonColor.blue} on_click={() => {
					wm.pop()
				}} />
			</div>
		</div>
	};
}


export enum BigButtonColor {
	green,
	blue
}

export function Button({ children, icon, style, on_click }: { children?: any, icon?: string, on_click: () => void, style?: CSSProperties }) {
	return <div onClick={on_click} className={scss.button} style={style}>
		{icon ? <Icon path={icon} /> : undefined}
		{children}
	</div>
}

export function BigButton({ type, title, icon, on_click }: { type: BigButtonColor, title: string, icon?: string, on_click: () => void }) {
	let bg = "";
	switch (type) {
		case BigButtonColor.blue: {
			bg = "linear-gradient(#506fcb, #003f9b)";
			break;
		}
		case BigButtonColor.green: {
			bg = "linear-gradient(#7bcb50, #3fae52)";
			break;
		}
	}

	return <div onClick={on_click} className={scss.big_button} style={{ background: bg }}>
		{icon ? <Icon path={icon} /> : undefined}
		{title}
	</div>
}

export function Popup({ children, pair }: { children: any, pair: [shown: boolean, setShown: any] }) {
	const shown = pair[0];
	//const setShown = pair[1];

	if (!shown) {
		return <></>;
	}

	return <div className={scss.popup}>
		{children}
	</div>
}