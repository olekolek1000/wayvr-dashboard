import { useEffect, useRef, useState } from "preact/hooks";
import scss from "../app.module.scss"
import { ipc } from "../ipc";
import { get_app_details_json, getDashboardDisplay, getDesktopFileURL, listDisplays, openURL, vibrate_down, vibrate_hover, vibrate_up } from "../utils";
import { WindowManager, WindowParams } from "./window_manager";
import { Globals } from "@/globals";
import { CSSProperties, JSX, Ref } from "preact/compat";
import { createWindowAddDisplay, DisplayList } from "@/views/display_list";
import { global_scale } from "@/main";

export function Icon({ path, width, height, color, className }: { path: string, width?: number, height?: number, color?: string, className?: string }) {
	return <img className={`${scss.icon} ${className ? className : ""}`} src={path} style={{
		width: width && (width + "px"),
		height: height && (height + "px"),
		color: color
	}}>
	</img>
}

export function TextField(
	{ required, placeholder, valfunc, type }:
		{
			required?: boolean,
			placeholder?: string,
			valfunc: [value: string, func: (str: string) => void],
			type?: React.HTMLInputTypeAttribute,
		}) {
	return <span className={scss.text_input_bg}>
		<input
			className={scss.text_input}
			required={required}
			type={type}
			placeholder={placeholder}
			onChange={(e) => {
				valfunc[1]((e.target as any).value)
			}}
			onKeyUp={(e) => {
				valfunc[1]((e.target as any).value)
			}} />
	</span>
}

export function PanelButton({ ext_ref, icon, icon_size, height, on_click, square, opacity, children }: { ext_ref?: Ref<HTMLDivElement>, icon: string, icon_size?: number, height?: number, on_click: () => void, square?: boolean, opacity?: number, children?: any }) {
	return <div ref={ext_ref} onPointerDown={on_click} onMouseEnter={vibrate_hover} onMouseDown={vibrate_down} onMouseUp={vibrate_up} className={square ? scss.panel_button_square : scss.panel_button} style={{
		height: height ? (height + "px") : "undefined",
		opacity: opacity
	}}>
		<Icon width={icon_size} height={icon_size} path={icon} />
		{children}
	</div>
}

function mix(x: number, y: number, a: number) {
	return x * (1.0 - a) + y * a;
}

function quantize(value: number, steps: number) {
	return Math.round(value * steps) / steps;
}

function getSliderParams(el: HTMLDivElement, value: number, steps?: number) {
	value = Math.max(value, 0.0);
	value = Math.min(value, 1.0);
	const rect = el.getBoundingClientRect();

	const margin = 12.0;
	const width = rect.width - margin * 2.0;
	const left = rect.x + margin;
	const right = left + width;

	return {
		handle_shift: mix(margin, rect.width - margin, steps === undefined ? value : quantize(value, steps)),
		top: rect.top,
		width: width,
		left: left,
		right: right,
		margin: margin,
	};
}


export function Slider({ value, setValue, width, on_change, steps }: {
	value: number,
	setValue: any,
	on_change: (value: number) => void,
	width?: number,
	steps?: number
}) {
	const ref_bar = useRef<HTMLDivElement | null>(null);
	const [handle_shift, setHandleShift] = useState(0.0);
	const [down, setDown] = useState(false);
	const [line_width, setLineWidth] = useState(0.0);

	useEffect(() => {
		const el = ref_bar.current;
		if (!el) {
			return;
		}

		const par = getSliderParams(el, value, steps);
		setHandleShift(par.handle_shift);
		setLineWidth(par.width);
	}, [ref_bar]);

	const updatePos = (mouse_x: number) => {
		const el = ref_bar.current!;
		const par = getSliderParams(el, value);
		const rel_x = mouse_x - par.left;
		const norm_x = rel_x / (par.right - par.left);

		value = norm_x;
		setValue(value);
		on_change(Math.max(0.0, Math.min(1.0, value)));

		const par2 = getSliderParams(el, value, steps);
		setHandleShift(par2.handle_shift);
		setLineWidth(par2.width);
	}

	useEffect(() => {
		if (!down) {
			return;
		}

		const func_move = (e: MouseEvent) => {
			updatePos(e.clientX / global_scale);
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

	let lines: Array<JSX.Element> | undefined = undefined;

	const calc_width = width ? width : 160;

	if (steps !== undefined) {
		lines = [];
		for (let i = 0; i <= steps; i++) {
			lines.push(<div className={scss.slider_line} style={{
				left: ((i + 0.5) * (line_width / (steps))) + "px"
			}} />);
		}
	}

	return <div className={scss.slider}
		style={{
			width: (calc_width) + "px"
		}}
		onMouseDown={(e) => {
			setDown(true);
			updatePos(e.clientX / global_scale);
		}}
		onMouseMove={(e) => {
			if (!down) {
				return;
			}
			updatePos(e.clientX / global_scale);
		}}
		onMouseUp={() => {
			setDown(false);
		}}
	>
		<div ref={ref_bar} className={scss.slider_bar}>
			<div className={scss.slider_filling}
				style={{
					width: handle_shift + "px"
				}}
			/>
			{lines}
			<div className={scss.slider_handle}
				style={{
					visibility: (ref_bar && ref_bar.current) ? "visible" : "hidden",
					transform: "translateX(-12px) translateY(-12px) translateX(" + handle_shift + "px)",
				}}>
			</div>
		</div>
	</div>
}

export function TooltipSide({ children, title }: { children: any, title: any }) {
	const [hovered, setHovered] = useState(false);
	const ref_tooltip = useRef<HTMLDivElement | null>(null);

	return <div style={{
		position: "relative",
		width: "100%",
		height: "100%",
	}} onMouseEnter={() => {
		setHovered(true);
	}} onMouseLeave={() => {
		setHovered(false);
	}}>
		<>
			{hovered ? <div style={{
				position: "absolute",
				top: "0",
				right: "0"
			}}>
				<div ref={ref_tooltip} className={scss.tooltip}>
					{title}
				</div>
			</div> : undefined}
			{children}
		</>
	</div>

}


export function TooltipSimple({ children, title, extend }: { children: any, title: any, extend?: boolean }) {
	const [hovered, setHovered] = useState(false);
	const [left_side, setLeftSide] = useState(false);
	const ref_tooltip = useRef<HTMLDivElement | null>(null);

	let trans = "translateY(calc(-100% - 2px))";

	if (!left_side) {
		trans += " translateX(-100%)"
	}

	return <div style={{
		position: "relative",
		width: extend ? "100%" : undefined,
		height: extend ? "100%" : undefined,
	}} onMouseEnter={(e) => {
		const percent = e.pageX / window.innerWidth;
		setLeftSide(percent < 0.5);
		setHovered(true);
	}} onMouseLeave={() => {
		setHovered(false);
	}}>
		<>
			{hovered ? <div style={{
				position: "absolute",
				right: left_side ? undefined : "0"
			}}>
				<div ref={ref_tooltip} className={scss.tooltip_simple} style={{
					transform: trans
				}}>
					{title}
				</div>
			</div> : undefined}
			{children}
		</>
	</div>

}

class FailedCovers {
	covers = new Array<string>;
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

async function get_alt_cover(manifest: ipc.AppManifest) {

	if(manifest.cover!= ""){
		console.log("Runnning copy png to frontend")
		return <>
			<img className={scss.game_cover_image} src={manifest.cover}/>
		</>;
	}
	else{
		return <>
			<img className={scss.game_cover_image} src="/no_cover.webp" />
			<span className={scss.game_cover_title}>{manifest.name}</span>
		</>;
	}

}

export function GameCover({ manifest, big, on_click }: { manifest: ipc.AppManifest, big?: boolean, on_click?: () => void }) {
	const [content, setContent] = useState(<></>);

	useEffect(() => {
		const run = async () => {
			try {
				const failed_covers = failed_covers_get();
				const already_failed = failed_covers.covers.includes(manifest.app_id);

				if (!already_failed) {
					const url = `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${manifest.app_id}/library_600x900.jpg`;
					setContent(
						<img
							className={scss.game_cover_image}
							src={url}
							onError={async () => {
								try {
									console.log("Alt cover " + manifest.app_id + " failed to load, remembering it to prevent unnecessary requests to Steam API ");
									const updated_covers = failed_covers_get();
									updated_covers.covers.push(manifest.app_id);
									failed_covers_set(updated_covers);
									setContent(await get_alt_cover(manifest));
								} catch (err) {
									console.error("Failed to load alt cover:", err);
								}
							}}
						/>
					);
				} else {
					console.log("using previously failed cover");
					setContent(await get_alt_cover(manifest));
				}
			} catch (err) {
				console.error("Unhandled error in GameCover useEffect:", err);
			}
		};

		run();
	}, [manifest]);

	return (
		<div
			onClick={on_click}
			onMouseEnter={vibrate_hover}
			onMouseDown={vibrate_down}
			onMouseUp={vibrate_up}
			className={big ? scss.game_cover_big : scss.game_cover}
		>
			{content}
			<div className={scss.game_cover_shine} />
		</div>
	);
}

export function ApplicationCover({ big, application, on_click }: { big?: boolean, application: ipc.DesktopFile, on_click?: () => void }) {
	return <div className={big ? scss.application_cover_big : scss.application_cover} onMouseDown={vibrate_down} onMouseUp={vibrate_up} onMouseEnter={on_click !== undefined ? vibrate_hover : undefined} onClick={on_click}>
		<div className={scss.application_cover_icon} style={{
			background: "url('" + getDesktopFileURL(application) + "')",
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

export function Container({ children, className, on_click, highlighted }: { children?: any, className?: string, on_click?: () => void, highlighted?: boolean }) {
	return <div className={`${scss.container} ${highlighted ? scss.container_highlighted : ""} ${className ? className : ""}`} onMouseDown={vibrate_down} onMouseUp={vibrate_up} onMouseEnter={on_click !== undefined ? vibrate_hover : undefined} onClick={on_click}>
		{children}
	</div>
}

export function BoxRight({ children, style, className }: { children?: any, style?: CSSProperties, className?: string }) {
	return <div className={`${scss.box_right} ${className ? className : ""}`} style={style}>
		{children}
	</div>
}

export function BoxDown({ children, center }: { children?: any, center?: boolean }) {
	return <div className={scss.box_down} style={{
		alignItems: center ? "center" : undefined,
	}}>
		{children}
	</div >
}


export function Checkbox({
	pair,
	title,
	onChange,
	disabled }: {
		pair: [checked: boolean, setChecked?: (checked: boolean) => void],
		title?: string, onChange?: (n: boolean) => void,
		disabled?: boolean
	}) {
	const checked = pair ? pair[0] : undefined;
	const setChecked = pair ? pair[1] : undefined;
	return <div
		style={{
			opacity: disabled ? 0.5 : undefined
		}}
		className={scss.checkbox_body} onMouseDown={!disabled ? vibrate_down : undefined} onMouseUp={!disabled ? vibrate_up : undefined} onMouseEnter={!disabled ? vibrate_hover : undefined} onClick={!disabled ? () => {
			if (setChecked) {
				setChecked(!checked);
			}
			if (onChange) {
				onChange(!checked);
			}
		} : undefined} >
		<div className={`${scss.checkbox_checkmark} ${checked ? scss.checkbox_checkmark_checked : ""}`} >
			{checked && "✔️"}
		</div>
		{title ? <div>
			{title}
		</div> : undefined}
	</div>
}

function RadioItem({ item, checked, setValue }: { item: string, checked: boolean, setValue: (value: string) => void }) {
	return <Checkbox title={item} key={item} pair={[checked, undefined]} onChange={() => {
		setValue(item);
	}} />
}

export function RadioSelect({ items, pair }: { items: Array<string>, pair: [value: string, setValue: (value: any) => void] }) {
	const value = pair[0];
	const setValue = pair[1];

	return <BoxDown>
		{items.map((item) => {
			return <RadioItem checked={value === item} item={item} setValue={setValue} />
		})}
	</BoxDown>
}

async function launch(
	globals: Globals,
	selected_display: ipc.Display,
	application: ipc.DesktopFile,
	force_wayland: boolean,
	xwayland_mode: boolean,
) {
	let env: Array<string> = [];

	if (force_wayland) {
		// This list could be larger, feel free to expand it
		env.push("QT_QPA_PLATFORM=wayland");
		env.push("GDK_BACKEND=wayland");
		env.push("SDL_VIDEODRIVER=wayland");
		env.push("XDG_SESSION_TYPE=wayland");
		env.push("ELECTRON_OZONE_PLATFORM_HINT=wayland");
	}

	let userdata = new Map<string, string>();
	userdata.set("desktop_file", JSON.stringify(application));

	let exec_args_str = application.exec_args.join(" ");

	let params = xwayland_mode ? {
		env: env,
		exec: "cage",
		name: application.name,
		targetDisplay: selected_display.handle,
		args: "-- " + application.exec_path + " " + exec_args_str,
		userdata: userdata,
	} : {
		env: env,
		exec: application.exec_path,
		name: application.name,
		targetDisplay: selected_display.handle,
		args: exec_args_str,
		userdata: userdata,
	};

	ipc.display_set_visible({ handle: params.targetDisplay, visible: true }).catch(() => { });

	ipc.process_launch(params).then(() => {
		globals.toast_manager.push("Application launched on \"" + selected_display.name + "\"");
		globals.wm.pop();
	}).catch((e) => {
		globals.wm.push(createWindowMessage(globals.wm, "Error: " + e));
	})
}

function ApplicationView({ globals, application, }: { globals: Globals, application: ipc.DesktopFile }) {
	const [details, setDetails] = useState(<></>);
	const [xwayland_mode, setXWaylandMode] = useState(false);
	const [force_wayland, setForceWayland] = useState(true);
	const [displays, setDisplays] = useState<ipc.Display[] | null>(null);

	const refreshDisplays = async () => {
		setDisplays(await listDisplays());
	}

	useEffect(() => {
		setDetails(<BoxDown>
			<small><b>Exec:</b> {application.exec_path}</small>
			{application.exec_args.length > 0 ? <small><b>Args:</b> {application.exec_args.join(" ")}</small> : undefined}
		</BoxDown>);
		refreshDisplays();
	}, []);


	return <div className={scss.previewer_content}>
		<ApplicationCover big application={application} />
		<div className={scss.previewer_info}>
			<div className={scss.previewer_title}>{application.name}</div>
			{details}
			<Separator />
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
			<Separator />
			<BoxRight>
				<BigButton icon="icons/play.svg" title="Launch embedded" disabled={globals.is_nvidia} type={BigButtonColor.green} on_click={async () => {
					const display = await getDashboardDisplay();
					if (display !== null) {
						await launch(globals, display, application, force_wayland, xwayland_mode);
					}
				}} />
				{globals.is_nvidia ? <span className={scss.text_red}>Not supported on your GPU</span> : undefined}
			</BoxRight>
			<Separator />
			<Container>
				<b>Or launch it detached</b>
				{
					displays !== null ? <DisplayList displays={displays} params={{
						on_add: () => {
							createWindowAddDisplay(globals, async (display_handle) => {
								// make it invisible by default so it wouldn't block input in front of the user
								await ipc.display_set_visible({ handle: display_handle, visible: false });
								const display = await ipc.display_get(display_handle);
								await launch(globals, display, application, force_wayland, xwayland_mode);
							});
						},
						on_click: async (disp) => {
							await launch(globals, disp, application, force_wayland, xwayland_mode);
						},
					}} /> : undefined
				}
			</Container>
		</div>
	</div>
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
				ipc.game_launch(manifest.run_game_id);
				globals.toast_manager.push("Game launched. This might take a while");
			}} />
			<BoxRight>
				<BigButton title="Product page" type={BigButtonColor.blue} on_click={async () => {
					const url = "https://store.steampowered.com/app/" + manifest.app_id;
					await openURL(url, globals);
				}} />
				<BigButton title="Reviews" type={BigButtonColor.blue} on_click={async () => {
					const url = "https://steamcommunity.com/app/" + manifest.app_id + "/reviews";
					await openURL(url, globals);
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
	purple,
	blue
}

export function Button({ children, size, icon, style, on_click, className, highlighted, bgcolor }: {
	children?: any,
	size?: number,
	icon?: string,
	on_click?: () => void,
	style?: CSSProperties,
	className?: string,
	highlighted?: boolean,
	bgcolor?: string,
}) {
	if (!style) {
		style = {};
	}

	if (bgcolor) {
		style.backgroundColor = bgcolor;
	}

	return <div
		onMouseDown={vibrate_down}
		onMouseUp={vibrate_up}
		onMouseEnter={on_click !== undefined ? vibrate_hover : undefined}
		onClick={on_click}
		style={style}
		className={`${scss.button} ${highlighted ? scss.button_highlighted : ""} ${className}`} >
		{icon ? <Icon width={size ? size : 16} height={size ? size : 16} path={icon} /> : undefined}
		{children}
	</div>
}

export function BigButton({ type, title, icon, extend, disabled, on_click }: {
	type: BigButtonColor,
	title: string,
	icon?: string,
	extend?: boolean,
	disabled?: boolean,
	on_click: () => void
}) {
	let bg = "";
	switch (type) {
		case BigButtonColor.blue: {
			bg = "linear-gradient( #506fcb, #003f9b)";
			break;
		}
		case BigButtonColor.green: {
			bg = "linear-gradient(rgb(118, 202, 73),rgb(44, 151, 62))";
			break;
		}
		case BigButtonColor.purple: {
			bg = "linear-gradient(rgb(83, 175, 255),rgb(94, 69, 255))";
			break;
		}
	}

	return <div
		onMouseDown={disabled ? undefined : vibrate_down}
		onMouseUp={disabled ? undefined : vibrate_up}
		onMouseEnter={disabled ? undefined : vibrate_hover}
		onClick={disabled ? undefined : on_click}
		className={scss.big_button}
		style={{
			background: bg,
			width: extend ? "100%" : undefined,
			opacity: disabled ? "0.5" : undefined,
		}}>
		{icon ? <Icon path={icon} /> : undefined}
		{title}
	</div>
}

export function Popup({ children, on_close, ref_element }: { children: any, on_close: () => void, ref_element: Ref<HTMLDivElement> }) {
	const element = ((ref_element) as any).current as HTMLDivElement;
	const rect = element.getBoundingClientRect();
	const [hovered, setHovered] = useState(false);

	useEffect(() => {
		const func_down = (_e: MouseEvent) => {
			if (!hovered) {
				on_close();
			}
		}

		document.addEventListener("mousedown", func_down);

		return () => {
			document.removeEventListener("mousedown", func_down);
		}
	}, [hovered]);

	if (!ref_element) {
		return;
	}

	return <div
		className={scss.popup}
		onMouseEnter={() => { setHovered(true) }}
		onMouseLeave={() => { setHovered(false) }}
		style={{
			top: (rect.y) + "px",
			left: rect.x + "px"
		}}>
		{children}
	</div>
}
