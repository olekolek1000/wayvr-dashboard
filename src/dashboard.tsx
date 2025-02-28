
import { Clock } from "./clock";
import scss from "./app.module.scss"
import { Icon, PanelButton, Popup, Button, TooltipSimple, TooltipSide } from "./gui/gui";
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
import { BatteryLevels } from "./views/battery_levels";
import { preferences } from "./preferences";

function MenuButton({ icon, on_click }: { icon: string, on_click: () => void }) {
	return <div onClick={on_click} onMouseDown={vibrate_down} onMouseUp={vibrate_up} onMouseEnter={vibrate_hover} className={scss.menu_button}>
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
<TooltipSimple extend simple title={"Menu"}>
	<PanelButton square icon="icons/burger.svg" on_click={() => {
		globals.toast_manager.push("Not implemented");
	}} />
</TooltipSimple>
<TooltipSimple extend simple title={"Camera passthrough"}>
	<PanelButton square icon="icons/eye.svg" on_click={() => {
		globals.toast_manager.push("Not implemented");
	}} />
</TooltipSimple>
<TooltipSimple extend simple title={"Recenter"}>
	<PanelButton square icon="icons/recenter.svg" on_click={async () => {
		if (!await ipc.is_monado_present()) {
			globals.toast_manager.pushMonadoNotPresent();
		}
		await ipc.monado_recenter();
	}} />
</TooltipSimple>
<TooltipSimple extend simple title={"Fix floor"}>
	<PanelButton square icon="icons/fix_floor.svg" on_click={async () => {
		if (!await ipc.is_monado_present()) {
			globals.toast_manager.pushMonadoNotPresent();
		}
		await ipc.monado_fix_floor();
	}} />
</TooltipSimple>
*/

const color_bg_opaque = `radial-gradient(
	circle,
	rgb(30, 40, 60) 60%,
	rgb(0,0,40) 150%
)
`;

export function Dashboard({ globals }: { globals: Globals }) {
	const [current_panel, setCurrentPanel] = useState(<PanelHome globals={globals} />);
	const [popup_volume, setPopupVolume] = useState<JSX.Element | null>(null);
	const ref_volume = useRef<HTMLDivElement>(null);

	const [generation_state, setGenerationState] = useState(0);
	const [showing_process, setShowingProcess] = useState<ipc.Process | undefined>(undefined);

	const [prefs, setPrefs] = useState<preferences.Preferences>(preferences.loadPreferences());

	// The dashboard is visible by default after startup
	const [visible, setVisible] = useState(true);

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

	globals.visible = visible;
	globals.setVisible = setVisible;

	globals.prefs = prefs;
	globals.setPrefs = setPrefs;

	useEffect(() => {
		configureLayout().catch((e) => {
			console.error(e);
		})

		/*const t = setInterval(async () => {
			const state = await ipc.get_input_state();
			//console.log(state);
		}, 50);

		return () => {
			clearInterval(t);
		}*/
	}, []);

	let content = undefined;

	if (showing_process) {
		content = <div className={scss.content_showing_process} >
			<div className={scss.showing_process_bottom_bar}>
				<Button size={16} icon="icons/back.svg" on_click={() => {
					unfocusAll(globals);
				}}>Hide window</Button>
			</div>
		</div>;
	}
	else {
		content = <div className={scss.content} style={{
			background: globals.prefs.opaque_background ? color_bg_opaque : undefined
		}}>
			<div className={scss.current_panel}>
				{current_panel}
			</div>
			<Overlays globals={globals} />
		</div>;
	}

	return (
		<>
			{popup_volume}
			<div className={`${scss.separator_menu_rest} ${visible ? scss.dashboard_showup : ""}`} style={{
				opacity: visible ? 1.0 : 0.0,
			}}>
				<div className={scss.menu} >
					<TooltipSide title={"Home screen"}>
						<MenuButton icon="wayvr_dashboard_transparent.webp" on_click={async () => {
							await unfocusAll(globals);
							setCurrentPanel(<PanelHome globals={globals} />);
						}} />
					</TooltipSide>
					<TooltipSide title={"Applications"}>
						<MenuButton icon="icons/apps.svg" on_click={async () => {
							await unfocusAll(globals);
							setCurrentPanel(<PanelApplications globals={globals} />);
						}} />
					</TooltipSide>
					<TooltipSide title={"Games"}>
						<MenuButton icon="icons/games.svg" on_click={async () => {
							await unfocusAll(globals);
							setCurrentPanel(<PanelGames globals={globals} />);
						}} />
					</TooltipSide>

					<TooltipSide title={"Process manager"}>
						<MenuButton icon="icons/window.svg" on_click={async () => {
							await unfocusAll(globals);
							setCurrentPanel(<PanelRunningApps globals={globals} />);
						}} />
					</TooltipSide>

					<div className={scss.menu_separator} />

					<TooltipSide title={"Settings"}>
						<MenuButton icon="icons/settings.svg" on_click={async () => {
							await unfocusAll(globals);
							setCurrentPanel(<PanelSettings globals={globals} />);
						}} />
					</TooltipSide>
				</div>
				<div className={scss.separator_content_panel}>
					{content}
					<div className={scss.panel}>
						<div className={scss.panel_left}>
							<TooltipSimple extend title={"Volume"}>
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
							</TooltipSimple>
							<TooltipSimple extend title={"Recenter"}>
								<PanelButton square icon="icons/recenter.svg" on_click={async () => {
									if (!await ipc.is_monado_present()) {
										globals.toast_manager.pushMonadoNotPresent();
									}
									await ipc.monado_recenter();
								}} />
							</TooltipSimple>
						</div>
						<div className={scss.panel_center}>
							<div className={scss.panel_window_list}>
								<WindowList globals={globals} key={generation_state} />
							</div>
						</div>
						<div className={scss.panel_right}>
							<BatteryLevels dash_visible={visible} />
							<Clock key={prefs.twelve_hour_clock} twelve_hour={prefs.twelve_hour_clock ?? false} />
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
