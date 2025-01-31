
import { Clock } from "./clock";
import style from "./app.module.scss"
import { Icon, Tooltip, PanelButton, Popup, Slider, BoxDown, BoxRight, Button } from "./gui/gui";
import { useEffect, useState } from "preact/hooks";
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

function MenuButton({ icon, on_click }: { icon: string, on_click: () => void }) {
	return <div onClick={on_click} onMouseDown={vibrate_down} onMouseUp={vibrate_up} onMouseEnter={vibrate_hover} className={style.menu_button}>
		<Icon path={icon} />
	</div>
}


function VolumeDevice({ device }: { device: ipc.AudioDevice }) {
	const [volume, setVolume] = useState<number | undefined>(undefined);

	useEffect(() => {
		ipc.audio_get_device_volume({
			deviceIndex: device.index
		}).then((vol) => {
			setVolume(vol);
		});
	}, []);

	if (volume === undefined) {
		return <></>;
	}

	return <div>
		{device.index}: {device.name}
		<BoxRight>
			<Slider value={volume} setValue={setVolume} on_change={(volume) => {
				setVolume(volume);
				ipc.audio_set_device_volume({
					deviceIndex: device.index,
					volume: volume,
				})
			}} />
		</BoxRight>
	</div>
}

function PopupVolume({ globals }: { globals: Globals }) {
	const [sliders, setSliders] = useState(<></>);

	useEffect(() => {
		(async () => {
			await unfocusAll(globals);
			const devices = await ipc.audio_list_devices();
			const res = devices.map((device) => {
				return <VolumeDevice key={device.index} device={device} />
			});
			setSliders(<BoxDown>
				{res}
			</BoxDown>);
		})();
	}, []);

	return <>
		{sliders}
	</>
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

export function Dashboard({ globals }: { globals: Globals }) {
	const [current_panel, setCurrentPanel] = useState(<PanelHome globals={globals} />);
	const [popup_volume, setPopupVolume] = useState(false);
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
			<Overlays globals={globals} />
			<div className={style.current_panel}>
				{current_panel}
			</div>
		</div>;
	}

	return (
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
						<Tooltip extend simple title={"Volume"}>
							<Popup pair={[popup_volume, setPopupVolume]}>
								<PopupVolume globals={globals} />
							</Popup>
							<PanelButton square icon="icons/volume.svg" on_click={() => {
								setPopupVolume(!popup_volume);
							}} />
						</Tooltip>
						<Tooltip extend simple title={"Camera passthrough"}>
							<PanelButton square icon="icons/eye.svg" on_click={() => {
								globals.toast_manager.push("Not implemented");
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
	);
}
