
import { Clock } from "./clock";
import style from "./app.module.scss"
import { Icon, Tooltip, PanelButton, Popup, Button } from "./gui/gui";
import { useEffect, useRef, useState } from "preact/hooks";
import { PanelHome } from "./panel/home";
import { PanelGames } from "./panel/games";
import { PanelApplications } from "./panel/applications";
import { PanelRunningApps } from "./panel/running_apps";
import { ipc } from "./ipc";
import { Globals } from "./globals";
import { PanelSettings } from "./panel/settings";
import { JSX } from "preact/jsx-runtime";
import { getDashboardDisplay, unfocusAll, vibrate_down, vibrate_hover, vibrate_up } from "./utils";
import { WindowList } from "./views/window_list";
import { PopupVolume } from "./views/popup_volume";

function MenuButton({ icon, on_click }: { icon: string, on_click: () => void }) {
	return <div onClick={on_click} onMouseDown={vibrate_down} onMouseUp={vibrate_up} onMouseEnter={vibrate_hover} className={style.menu_button}>
		<Icon path={icon} />
	</div>
}

function Overlays({ globals, error_text }: { globals: Globals, error_text?: JSX.Element }) {
	return <>
		{globals.wm.render()}
		{globals.toast_manager.render()}
		{error_text}
	</>
}

async function configureLayout() {
	const display = await getDashboardDisplay();
	if (display === null) {
		console.log("Cannot set layout, Dashboard display not found.");
		return;
	}

	const native_width = 960;
	const display_width = display.width;
	const scale = display_width / native_width;

	await ipc.display_set_layout({
		handle: display.handle,
		layout: {
			Stacking: {
				margins_first: { left: 0, right: 0, bottom: 0, top: 0 }, /* our dashboard */
				margins_rest: { left: 64 * scale, right: 8 * scale, bottom: 88 * scale, top: 8 * scale } /* any other app */
			}
		}
	})
}

// To be implemented later

/*
<Tooltip extend simple title={"Menu"}>
	<PanelButton square icon="icons/burger.svg" on_click={() => {
		globals.toast_manager.push("Not implemented");
	}} />
</Tooltip>
<Tooltip extend simple title={"Recenter"}>
	<PanelButton square icon="icons/recenter.svg" on_click={() => {
		globals.toast_manager.push("Not implemented");
	}} />
</Tooltip>
<Tooltip extend simple title={"Camera passthrough"}>
	<PanelButton square icon="icons/eye.svg" on_click={() => {
		globals.toast_manager.push("Not implemented");
	}} />
</Tooltip>
*/

export function Dashboard({ globals }: { globals: Globals }) {
	const [current_panel, setCurrentPanel] = useState(<PanelHome globals={globals} />);
	const [popup_volume, setPopupVolume] = useState<JSX.Element | null>(null);
	const ref_volume = useRef<HTMLDivElement>(null);

	const [generation_state, setGenerationState] = useState(0);
	const [showing_process, setShowingProcess] = useState<ipc.Process | undefined>(undefined);

	const [wm_key, setWmKey] = useState(0);
	globals.wm.key = wm_key;
	globals.wm.setKey = setWmKey;

	globals.generation_state = generation_state;
	globals.setGenerationState = setGenerationState;

	globals.setShowingProcess = setShowingProcess;

	const [tm_key, setTmKey] = useState(0);
	globals.toast_manager.key = tm_key;
	globals.toast_manager.setKey = setTmKey;

	globals.setCurrentPanel = setCurrentPanel;

	useEffect(() => {
		configureLayout().catch((e) => {
			console.error(e);
		})
	}, []);

	let content = undefined;

	if (showing_process) {
		content = <div className={style.content_showing_process} >
			<div className={style.showing_process_bottom_bar}>
				<Button size={16} icon="icons/back.svg" on_click={() => {
					unfocusAll(globals);
				}}>Hide window</Button>
			</div>
		</div>;
	}
	else {
		content = <div className={style.content}>
			<div className={style.current_panel}>
				{current_panel}
			</div>
			<Overlays globals={globals} />
		</div>;
	}

	return (
		<>
			{popup_volume}
			<div className={style.separator_menu_rest}>
				<div className={style.menu} >
					<Tooltip title={"Home screen"}>
						<MenuButton icon="wayvr_dashboard_transparent.webp" on_click={async () => {
							await unfocusAll(globals);
							setCurrentPanel(<PanelHome globals={globals} />);
						}} />
					</Tooltip>
					<Tooltip title={"Applications"}>
						<MenuButton icon="icons/apps.svg" on_click={async () => {
							await unfocusAll(globals);
							setCurrentPanel(<PanelApplications globals={globals} />);
						}} />
					</Tooltip>
					<Tooltip title={"Games"}>
						<MenuButton icon="icons/games.svg" on_click={async () => {
							await unfocusAll(globals);
							setCurrentPanel(<PanelGames globals={globals} />);
						}} />
					</Tooltip>

					<Tooltip title={"Process manager"}>
						<MenuButton icon="icons/window.svg" on_click={async () => {
							await unfocusAll(globals);
							setCurrentPanel(<PanelRunningApps globals={globals} />);
						}} />
					</Tooltip>

					<div className={style.menu_separator} />

					<Tooltip title={"Settings"}>
						<MenuButton icon="icons/settings.svg" on_click={async () => {
							await unfocusAll(globals);
							setCurrentPanel(<PanelSettings globals={globals} />);
						}} />
					</Tooltip>
				</div>
				<div className={style.separator_content_panel}>
					{content}
					<div className={style.panel}>
						<div className={style.panel_left}>
							<Tooltip extend simple title={"Volume"}>
								<PanelButton ext_ref={ref_volume} square icon="icons/volume.svg" on_click={() => {
									if (popup_volume !== null) {
										setPopupVolume(null);
									}
									else {
										setPopupVolume(<Popup on_close={() => { setPopupVolume(null) }} ref_element={ref_volume}>
											<PopupVolume globals={globals} />
										</Popup>);
									}
								}} />
							</Tooltip>

						</div>
						<div className={style.panel_center}>
							<div className={style.panel_window_list}>
								<WindowList globals={globals} key={generation_state} />
							</div>
						</div>
						<div className={style.panel_right}>
							<Clock />
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
