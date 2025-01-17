import { Globals } from "../globals";
import { BoxRight, Container, Icon } from "../gui/gui";
import scss_home from "./home.module.scss"
import { useEffect, useState } from "preact/hooks";
import { ipc } from "@/ipc";
import scss from "../app.module.scss"
import { PanelApplications } from "./applications";
import { PanelGames } from "./games";
import { PanelSettings } from "./settings";
import { PanelRunningApps } from "./running_apps";

function Hello({ }: {}) {
	const [username, setUsername] = useState<string | undefined>(undefined);

	useEffect(() => {
		(async () => {
			let username = await ipc.get_username();
			username = username.substring(0, 1).toUpperCase() + username.substring(1);
			setUsername(username);
		})();
	}, []);

	return <div className={scss_home.big_title}>Hello, {username}!</div>
}

function Auth({ }: {}) {
	const [auth, setAuth] = useState(<></>);

	useEffect(() => {
		(async () => {
			const auth = await ipc.auth_get_info();
			if (auth) {
				setAuth(<BoxRight className={scss.text_green} style={{ fontWeight: "600" }}>⦿ Connected to {auth.runtime}</BoxRight>);
			}
			else {
				setAuth(<BoxRight className={scss.text_red} style={{ fontWeight: "600" }}>Connection to WayVR Server failed</BoxRight>);
			}
		})();
	}, []);

	return auth;
}

var first_run = true;

export function PanelHome({ globals }: { globals: Globals }) {

	const [categories, setCategories] = useState(<></>);
	const [icon_class, setIconClass] = useState<string | undefined>(undefined);

	useEffect(() => {
		const timeout = setTimeout(() => {
			setIconClass(scss_home.icon_dec_size);

			setCategories(<div className={scss_home.categories}>
				<Hello />
				<Auth />

				<BoxRight>
					<Container className={scss_home.category} on_click={() => {
						globals.setCurrentPanel(<PanelApplications globals={globals} />)
					}}>
						<Icon path="icons/apps.svg" width={32} height={32} />
						Apps
					</Container>
					<Container className={scss_home.category} on_click={() => {
						globals.setCurrentPanel(<PanelGames globals={globals} />)
					}}>
						<Icon path="icons/games.svg" width={32} height={32} />
						Games
					</Container>
					<Container className={scss_home.category} on_click={() => {
						globals.setCurrentPanel(<PanelRunningApps globals={globals} />)
					}}>
						<Icon path="icons/window.svg" width={32} height={32} />
						Processes
					</Container>
					<Container className={scss_home.category} on_click={() => {
						globals.setCurrentPanel(<PanelSettings globals={globals} />)
					}}>
						<Icon path="icons/settings.svg" width={32} height={32} />
						Settings
					</Container>
				</BoxRight>
			</div>);
		}, first_run ? 500 : 0);

		first_run = false;

		return () => {
			clearTimeout(timeout);
		}
	}, []);

	return <div className={scss_home.centered}>
		<Icon path="wayvr_dashboard.svg" width={160} height={160} className={icon_class} />
		{categories}
	</div>
}