import { useEffect, useRef, useState } from "preact/hooks";
import style from "./app.module.scss"
import { ipc } from "./ipc";
import { JSX } from "preact/jsx-runtime";
import { get_app_details_json } from "./utils";

export function Icon({ path, width, height }: { path: string, width?: number, height?: number }) {
	return <img className={style.icon} src={path} style={{
		width: width ? (width + "px") : undefined,
		height: height ? (height + "px") : undefined,
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

export function ApplicationCover({ icon, name }: { icon?: string, name: string }) {
	return <div className={style.application_cover}>
		<div className={style.application_cover_icon} style={{
			background: "url('" + (icon ? icon : "icons/unknown.svg") + "')",
			backgroundSize: "contain",
			backgroundPosition: "center",
			backgroundRepeat: "no-repeat"
		}}>

		</div>
		<div className={style.application_cover_title}>
			{name}
		</div>
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
					ipc.launch_game(manifest.app_id);
					setPreview(<PreviewLaunched on_close={on_close} />);
				}} />
			</div>
		</div>
	</div>
}

function PreviewLaunched({ on_close }: { on_close: () => void }) {
	return <div className={style.previewer_parent}>
		<WindowDecoration title={"Info"} on_close={on_close} />
		<div className={style.previewer_content}>
			<div className={style.info_launched}>
				Application launched.
				<BigButton type={BigButtonType.hide} on_click={on_close} />
			</div>
		</div>
	</div>
}


class Previewer {
	setManifest!: (manifest: ipc.AppManifest) => void;
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