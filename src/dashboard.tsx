
import { Clock } from "./clock";
import style from "./app.module.scss"
import { Icon, Tooltip, PanelButton } from "./gui";
import { useState } from "preact/hooks";
import { PanelHome } from "./panel/home";
import { PanelGames } from "./panel/games";
import { PanelApplications } from "./panel/applications";
import { PanelRunningApps } from "./panel/running_apps";

function MenuButton({ icon, on_click }: { icon: string, on_click: () => void }) {
	return <div onClick={on_click} className={style.menu_button}>
		<Icon path={icon} />
	</div>
}


/*
function PanelWindow({ icon }: { icon: string }) {
	return <div className={`${style.panel_button} ${style.panel_window}`}>
		<Icon path={icon} />
	</div>
}*/


export function Dashboard() {
	const [current_panel, setCurrentPanel] = useState(<PanelHome />);

	return (
		<div className={style.separator_menu_rest}>
			<div className={style.menu} >
				<Tooltip title={"Home screen"}>
					<MenuButton icon="icons/home.svg" on_click={() => {
						setCurrentPanel(<PanelHome />);
					}} />
				</Tooltip>
				<Tooltip title={"Applications"}>
					<MenuButton icon="icons/apps.svg" on_click={() => {
						setCurrentPanel(<PanelApplications />);
					}} />
				</Tooltip>
				<Tooltip title={"Games"}>
					<MenuButton icon="icons/games.svg" on_click={() => {
						setCurrentPanel(<PanelGames />);
					}} />
				</Tooltip>

				<Tooltip title={"Running apps"}>
					<MenuButton icon="icons/window.svg" on_click={() => {
						setCurrentPanel(<PanelRunningApps />);
					}} />
				</Tooltip>

				<div className={style.menu_separator} />

				<Tooltip title={"Refresh dasbhoard"}>
					<MenuButton icon="icons/refresh.svg" on_click={() => {
						window.location.reload();
					}} />
				</Tooltip>
				<Tooltip title={"Settings"}>
					<MenuButton icon="icons/settings.svg" on_click={() => {

					}} />
				</Tooltip>
			</div>
			<div className={style.separator_content_panel}>
				<div className={style.content}>
					{current_panel}
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
						<Tooltip title={"Volume (TODO)"}>
							<PanelButton square icon="icons/volume.svg" on_click={() => {

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
