import { useEffect, useRef, useState } from "preact/hooks";
import style from "./app.module.scss"
import { ipc } from "./ipc";
import { JSX } from "preact/jsx-runtime";
import { get_app_details_json, get_external_url } from "./utils";

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

function WindowDecoration({ title, on_close }: { title: string, on_close: () => void }) {
	return <div className={style.window_decoration}>
		<div className={style.window_decoration_title}>
			{title}
		</div>
		<div className={style.window_decoration_buttons}>
			<PanelButton icon="icons/close.svg" on_click={on_close} />
		</div>
	</div>
}

function Checkbox({ checked, setChecked, title }: { checked: boolean, setChecked: any, title: string }) {
	checked;
	setChecked;
	return <div className={style.checkbox_body} onClick={() => {
		setChecked(!checked);
	}}>
		<div className={`${style.checkbox_checkmark} ${checked ? style.checkbox_checkmark_checked : ""}`} >
			{checked && "✔️"}
		</div>
		<div>
			{title}
		</div>
	</div>
}

function PreviewApplication({ application, setPreview, on_close }: { application: ipc.DesktopFile, setPreview: any, on_close: () => void }) {
	const [details, _setDetails] = useState(<></>);
	const [xwayland_mode, setXWaylandMode] = useState(false);

	useEffect(() => {
		// TODO, fill in some details
	}, []);

	return <div className={style.previewer_parent}>
		<WindowDecoration title={application.name} on_close={on_close} />
		<div className={style.previewer_content}>
			<ApplicationCover big application={application} />
			<div className={style.previewer_info}>
				<div className={style.previewer_title}>{application.name}</div>
				{details}
				<Checkbox title="Run in XWayland mode (cage)" checked={xwayland_mode} setChecked={setXWaylandMode} />
				<BigButton type={BigButtonType.launch} on_click={async () => {
					const displays = await ipc.display_list();

					const target_disp = displays[0].handle;

					let params = xwayland_mode ? {
						env: [],
						exec: "cage",
						name: application.name,
						targetDisplay: target_disp,
						args: "-- " + application.exec
					} : {
						env: [],
						exec: application.exec,
						name: application.name,
						targetDisplay: target_disp,
						args: ""
					};

					ipc.process_launch(params).then(() => {
						setPreview(<PreviewMessage on_close={on_close} msg="Application launched" />);
					}).catch((e) => {
						setPreview(<PreviewMessage on_close={on_close} msg={"Error: " + e} />);
					})
				}} />
			</div>
		</div>
	</div>
}

function PreviewManifest({ manifest, setPreview, on_close }: { manifest: ipc.AppManifest, setPreview: any, on_close: () => void }) {
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

	return <div className={style.previewer_parent}>
		<WindowDecoration title={manifest.name} on_close={on_close} />
		<div className={style.previewer_content}>
			<GameCover big manifest={manifest} />
			<div className={style.previewer_info}>
				<div className={style.previewer_title}>{manifest.name}</div>
				{details}
				<BigButton type={BigButtonType.launch} on_click={() => {
					ipc.game_launch(manifest.app_id);
					setPreview(<PreviewMessage on_close={on_close} msg="Game launched." />);
				}} />
			</div>
		</div>
	</div>
}

function PreviewMessage({ on_close, msg }: { on_close: () => void, msg: string }) {
	return <div className={style.previewer_parent}>
		<WindowDecoration title={"Info"} on_close={on_close} />
		<div className={style.previewer_content}>
			<div className={style.preview_message}>
				{msg}
				<BigButton type={BigButtonType.hide} on_click={on_close} />
			</div>
		</div>
	</div>
}


class Previewer {
	setManifest!: (manifest: ipc.AppManifest) => void;
	setApplication!: (application: ipc.DesktopFile) => void;
	element!: JSX.Element;
};

export function initPreviewer() {
	const [preview, setPreview] = useState<JSX.Element>(<></>);

	const close_callback = () => {
		setPreview(<></>);
	}

	const previewer: Previewer = {
		setManifest: (manifest) => {
			setPreview(<PreviewManifest manifest={manifest} on_close={close_callback} setPreview={setPreview} />)
		},
		setApplication: (application) => {
			setPreview(<PreviewApplication application={application} on_close={close_callback} setPreview={setPreview} />)
		},
		element: preview,
	};

	return previewer;
}

enum BigButtonType {
	launch,
	hide
}

export function BigButton({ type, on_click }: { type: BigButtonType, on_click: () => void }) {
	let title = "";
	let bg = "";
	switch (type) {
		case BigButtonType.hide: {
			title = "Hide";
			bg = "linear-gradient(#506fcb, #003f9b)";
			break;
		}
		case BigButtonType.launch: {
			title = "Launch";
			bg = "linear-gradient(#7bcb50, #3fae52)";
			break;
		}
	}

	return <div onClick={on_click} className={style.big_button} style={{ background: bg }}>
		{title}
	</div>
}