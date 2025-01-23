
import { Clock } from "./clock";
import style from "./app.module.scss"
import { Icon, Tooltip, PanelButton, Popup, Slider, BoxDown, BoxRight } from "./gui/gui";
import { useEffect, useState } from "preact/hooks";
import { PanelHome } from "./panel/home";
import { PanelGames } from "./panel/games";
import { PanelApplications } from "./panel/applications";
import { PanelRunningApps } from "./panel/running_apps";
import { ipc } from "./ipc";
import { Globals } from "./globals";
import { PanelSettings } from "./panel/settings";
import { JSX } from "preact/jsx-runtime";
import { vibrate_down, vibrate_hover, vibrate_up } from "./utils";

function MenuButton({ icon, on_click }: { icon: string, on_click: () => void }) {
	return <div onClick={on_click} onMouseDown={vibrate_down} onMouseUp={vibrate_up} onMouseEnter={vibrate_hover} className={style.menu_button}>
		<Icon path={icon} />
	</div>
}


/*
function PanelWindow({ icon }: { icon: string }) {
	return <div className={`${style.panel_button} ${style.panel_window}`}>
		<Icon path={icon} />
	</div>
}*/

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

function PopupVolume({ }: {}) {
	const [sliders, setSliders] = useState(<></>);

	useEffect(() => {
		ipc.audio_list_devices().then((devices) => {
			const res = devices.map((device) => {
				return <VolumeDevice key={device.index} device={device} />
			});
			setSliders(<BoxDown>
				{res}
			</BoxDown>);
		})
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

export function Dashboard({ globals }: { globals: Globals }) {
	const [current_panel, setCurrentPanel] = useState(<PanelHome globals={globals} />);
	const [popup_volume, setPopupVolume] = useState(false);
	const [error_text, setErrorText] = useState<JSX.Element | undefined>(undefined);

	const [wm_key, setWmKey] = useState(0);
	globals.wm.key = wm_key;
	globals.wm.setKey = setWmKey;

	const [tm_key, setTmKey] = useState(0);
	globals.toast_manager.key = tm_key;
	globals.toast_manager.setKey = setTmKey;

	globals.setErrorText = setErrorText;
	globals.setCurrentPanel = setCurrentPanel;

	return (
		<div className={style.separator_menu_rest}>
			<div className={style.menu} >
				<Tooltip title={"Home screen"}>
					<MenuButton icon="wayvr_dashboard_transparent.webp" on_click={() => {
						setCurrentPanel(<PanelHome globals={globals} />);
					}} />
				</Tooltip>
				<Tooltip title={"Applications"}>
					<MenuButton icon="icons/apps.svg" on_click={() => {
						setCurrentPanel(<PanelApplications globals={globals} />);
					}} />
				</Tooltip>
				<Tooltip title={"Games"}>
					<MenuButton icon="icons/games.svg" on_click={() => {
						setCurrentPanel(<PanelGames globals={globals} />);
					}} />
				</Tooltip>

				<Tooltip title={"Process manager"}>
					<MenuButton icon="icons/window.svg" on_click={() => {
						setCurrentPanel(<PanelRunningApps globals={globals} />);
					}} />
				</Tooltip>

				<div className={style.menu_separator} />

				<Tooltip title={"Settings"}>
					<MenuButton icon="icons/settings.svg" on_click={() => {
						setCurrentPanel(<PanelSettings globals={globals} />);
					}} />
				</Tooltip>
			</div>
			<div className={style.separator_content_panel}>
				<div className={style.content}>
					<Overlays globals={globals} error_text={error_text} />
					<div className={style.current_panel}>
						{current_panel}
					</div>
				</div>
				<div className={style.panel}>
					<div className={style.panel_left}>
						<Tooltip title={"Menu (TODO)"}>
							<PanelButton square icon="icons/burger.svg" on_click={() => {

							}} />
						</Tooltip>
						<Tooltip title={"Recenter (TODO)"}>
							<PanelButton square icon="icons/recenter.svg" on_click={() => {

							}} />
						</Tooltip>
						<Tooltip title={"Volume"}>
							<Popup pair={[popup_volume, setPopupVolume]}>
								<PopupVolume />
							</Popup>
							<PanelButton square icon="icons/volume.svg" on_click={() => {
								setPopupVolume(!popup_volume);
							}} />
						</Tooltip>
						<Tooltip title={"Camera passthrough (TODO)"}>
							<PanelButton square icon="icons/eye.svg" on_click={() => {

							}} />
						</Tooltip>
					</div>
					<div className={style.panel_center}>
						<div className={style.panel_window_list}>
							{
								/*
							<PanelWindow icon="discord.png" />
							<PanelWindow icon="firefox.png" />
							<PanelWindow icon="vscode.png" />
								*/
							}
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
