import { useEffect, useRef, useState } from "preact/hooks";
import style from "../app.module.scss"
import { ipc } from "../ipc";
import { get_app_details_json, get_external_url, getDefaultDisplay, openURL } from "../utils";
import { WindowManager, WindowParams } from "./window_manager";

export function Icon({ path, width, height }: { path: string, width?: number, height?: number }) {
	return <img className={style.icon} src={path} style={{
		width: width && (width + "px"),
		height: height && (height + "px"),
	}}>
	</img>
}

export function PanelButton({ icon, height, on_click, square, children }: { icon: string, height?: number, on_click: () => void, square?: boolean, children?: any }) {
	return <div onClick={on_click} className={square ? style.panel_button_square : style.panel_button} style={{
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
		left: left,
		right: right,
		margin: margin,
	};
}

export function Slider({ value, setValue, on_change }: { value: number, setValue: any, on_change: (value: number) => void }) {
	const ref_bar = useRef<HTMLDivElement | null>(null);

	const [handle_shift, setHandleShift] = useState(0.0);
	const [filling_width, setFillingWidth] = useState(0.0);
	const [down, setDown] = useState(false);

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
	}

	return <div className={style.slider}
		onMouseDown={(e) => {
			setDown(true);
			updatePos(e.clientX);
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
		onMouseLeave={() => {
			setDown(false);
		}}
	>
		<div ref={ref_bar} className={style.slider_bar}>
			<div className={style.slider_filling}
				style={{
					width: filling_width + "px"
				}}
			/>
			<div className={style.slider_handle}
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
		content = <div ref={ref_tooltip} className={simple ? style.tooltip_simple : style.tooltip}>
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
		<img className={style.game_cover_image} src="/no_cover.webp" />
		<span className={style.game_cover_title}>{manifest.name}</span>
	</>;
}

export function GameCover({ manifest, big, on_click }: { manifest: ipc.AppManifest, big?: boolean, on_click?: () => void }) {
	const [content, setContent] = useState(<></>);

	useEffect(() => {
		const failed_covers = failed_covers_get();

		const ret = failed_covers.covers.find((val) => { return val == manifest.app_id });
		if (ret === undefined) {
			const url = "https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/" + manifest.app_id + "/library_600x900.jpg";
			setContent(<img className={style.game_cover_image} src={url} onError={() => {
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

	return <div onClick={on_click} className={big ? style.game_cover_big : style.game_cover} style={{
	}}>
		{content}
		<div className={style.game_cover_shine} />
	</div>
}

export function ApplicationCover({ big, application, on_click }: { big?: boolean, application: ipc.DesktopFile, on_click?: () => void }) {
	return <div className={big ? style.application_cover_big : style.application_cover} onClick={on_click}>
		<div className={style.application_cover_icon} style={{
			background: "url('" + (application.icon ? get_external_url(application.icon) : "icons/unknown.svg") + "')",
			backgroundSize: "contain",
			backgroundPosition: "center",
			backgroundRepeat: "no-repeat"
		}}>

		</div>
		{big ? undefined : <div className={style.application_cover_title}>
			{application.name}
		</div>}
	</div>
}

export function Title({ title }: { title: string }) {
	return <div className={style.title}>
		{title}
	</div>
}

export function BoxRight({ children }: { children: any }) {
	return <div className={style.box_right}>
		{children}
	</div>
}

export function BoxDown({ children }: { children: any }) {
	return <div className={style.box_down}>
		{children}
	</div >
}


function Checkbox({ checked, setChecked, title, onChange }: { checked: boolean, setChecked: any, title: string, onChange?: (n: boolean) => void }) {
	checked;
	setChecked;
	return <div className={style.checkbox_body} onClick={() => {
		setChecked(!checked);
		if (onChange) {
			onChange(!checked);
		}
	}}>
		<div className={`${style.checkbox_checkmark} ${checked ? style.checkbox_checkmark_checked : ""}`} >
			{checked && "✔️"}
		</div>
		<div>
			{title}
		</div>
	</div>
}

function ApplicationView({ wm, application, }: { wm: WindowManager, application: ipc.DesktopFile }) {
	const [details, setDetails] = useState(<></>);
	const [xwayland_mode, setXWaylandMode] = useState(false);
	const [force_wayland, setForceWayland] = useState(true);

	useEffect(() => {
		setDetails(<>Executable: {application.exec}</>);
	}, []);

	return <div className={style.previewer_content}>
		<ApplicationCover big application={application} />
		<div className={style.previewer_info}>
			<div className={style.previewer_title}>{application.name}</div>
			{details}
			<Checkbox title="Run in X11 mode via XWayland (cage)" checked={xwayland_mode} setChecked={setXWaylandMode} onChange={(n) => {
				if (n) {
					setForceWayland(false);
				}
			}} />
			<Checkbox title="Force-enable Wayland for various backends - Qt/GTK/SDL (...)" checked={force_wayland} setChecked={setForceWayland} onChange={(n) => {
				if (n) {
					setXWaylandMode(false);
				}
			}} />
			<BigButton title="Launch" type={BigButtonColor.green} on_click={async () => {
				const target_disp = await getDefaultDisplay();

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
					targetDisplay: target_disp,
					args: "-- " + application.exec
				} : {
					env: env,
					exec: application.exec,
					name: application.name,
					targetDisplay: target_disp,
					args: ""
				};

				ipc.process_launch(params).then(() => {
					wm.replace(createWindowMessage(wm, "Application launched"));
				}).catch((e) => {
					wm.replace(createWindowMessage(wm, "Error: " + e));
				})
			}} />
		</div>
	</div>
}

function ManifestView({ wm, manifest }: { wm: WindowManager, manifest: ipc.AppManifest }) {
	const [details, setDetails] = useState(<></>);

	useEffect(() => {
		const run = async () => {
			const data = await get_app_details_json(manifest.app_id);
			setDetails(<>
				<div>
					by&nbsp;
					<span className={style.previewer_developers}>
						{data.developers[0]}
					</span>
				</div>
				<div className={style.previewer_desc}>
					{data.short_description}
				</div>

			</>)
		}
		run().catch((e) => {
			setDetails(<>{"Failed to fetch details: " + e}</>);
		});
	}, []);

	return <div className={style.previewer_content}>
		<GameCover big manifest={manifest} />
		<div className={style.previewer_info}>
			<div className={style.previewer_title}>{manifest.name}</div>
			{details}
			<BigButton title="Launch" type={BigButtonColor.green} on_click={() => {
				ipc.game_launch(manifest.app_id);
				wm.replace(createWindowMessage(wm, "Game launched"));
			}} />
			<BoxRight>
				<BigButton title="Product page" type={BigButtonColor.blue} on_click={async () => {
					const target_disp = await getDefaultDisplay();
					openURL(target_disp, "https://store.steampowered.com/app/" + manifest.app_id).then(() => {
						wm.push(createWindowMessage(wm, "Webpage opened."));
					}).catch((e) => {
						wm.replace(createWindowMessage(wm, "Failed to open URL: " + e));
					})
				}} />
				<BigButton title="Reviews" type={BigButtonColor.blue} on_click={async () => {
					const target_disp = await getDefaultDisplay();
					openURL(target_disp, "https://steamcommunity.com/app/" + manifest.app_id + "/reviews").then(() => {
						wm.push(createWindowMessage(wm, "Webpage opened."));
					}).catch((e) => {
						wm.replace(createWindowMessage(wm, "Failed to open URL: " + e));
					})
				}} />
			</BoxRight>
		</div>
	</div>
}

export function createWindowApplication(wm: WindowManager, application: ipc.DesktopFile): WindowParams {
	return {
		title: application.name,
		content: <ApplicationView wm={wm} application={application} />
	};
}

export function createWindowManifest(wm: WindowManager, manifest: ipc.AppManifest): WindowParams {
	return {
		title: manifest.name,
		content: <ManifestView wm={wm} manifest={manifest} />
	};
}

export function createWindowMessage(wm: WindowManager, msg: string) {
	return {
		title: "Info",
		content: <div className={style.previewer_content}>
			<div className={style.previewer_message}>
				{msg}
				<BigButton title="OK" type={BigButtonColor.blue} on_click={() => {
					wm.pop()
				}} />
			</div>
		</div>
	};
}


enum BigButtonColor {
	green,
	blue
}

export function BigButton({ type, title, on_click }: { type: BigButtonColor, title: string, on_click: () => void }) {
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

	return <div onClick={on_click} className={style.big_button} style={{ background: bg }}>
		{title}
	</div>
}

export function Popup({ children, pair }: { children: any, pair: [shown: boolean, setShown: any] }) {
	const shown = pair[0];
	//const setShown = pair[1];

	if (!shown) {
		return <></>;
	}

	return <div className={style.popup}>
		{children}
	</div>
}