import { ipc } from "../ipc";
import { Globals } from "../globals";
import scss from "@/app.module.scss"
import { BoxRight, Button, Checkbox, Container, failed_covers_clear, Icon, Separator, Title } from "../gui/gui";
import { useEffect, useState } from "preact/hooks";
import { get_version } from "@/utils";
import { preferences } from "@/preferences";

export function PanelSettings({ globals }: { globals: Globals }) {
	globals;

	const [auth, setAuth] = useState<ipc.AuthInfo | undefined>(undefined);
	const [version, setVersion] = useState("");

	const [pref_twelve, setPrefTwelve] = useState(globals.prefs.twelve_hour_clock ?? false);
	const [pref_hide_username, setPrefHideUsername] = useState(globals.prefs.hide_username ?? false);
	const [pref_opaque_background, setPrefOpaqueBackground] = useState(globals.prefs.opaque_background ?? false);

	useEffect(() => {
		const run = async () => {
			setVersion(await get_version());
			setAuth(await ipc.auth_get_info());
		};
		run().catch(() => {
			setAuth(undefined);
		})
	}, [])

	const prefs = globals.prefs;

	const refreshPrefs = () => {
		preferences.savePreferences(prefs);
		globals.setPrefs(preferences.loadPreferences());
	}

	let warn_nvidia = undefined;
	let checkbox_opaque;
	const cb_op = <Checkbox pair={[pref_opaque_background, setPrefOpaqueBackground]} title="Opaque background" disabled={globals.is_nvidia} onChange={(n) => {
		prefs.opaque_background = n;
		refreshPrefs();
	}} />;

	if (globals.is_nvidia) {
		checkbox_opaque = <BoxRight>
			{cb_op}
			<span className={scss.text_red}>Nvidia detected</span>
		</BoxRight>;

		warn_nvidia = <Container>
			<span className={scss.text_red} style={{ fontSize: "0.9em" }}>
				Various graphical effects (fade-in, semi-translucency, blur) and features are
				force-disabled because NVIDIA GPU has been detected on your system,
				which has problems with hardware-accelerated rendering in Webkit using AppImages.
				Expect minor graphical glitches. Set WAYVR_DASH_DISABLE_MITIGATIONS=1
				to disable this behavior. You can also try installing WayVR Dashboard via your package manager.
			</span>
		</Container>;
	}
	else {
		checkbox_opaque = cb_op;
	}

	return <>
		<BoxRight>
			<Icon path="icons/settings.svg" />
			<Title title="Settings" />
		</BoxRight>

		<Separator />

		<Container>
			<BoxRight>
				<Icon path="wayvr_dashboard.svg" />
				WayVR Dashboard
				<b>v.{version}</b>
			</BoxRight>
		</Container>

		{warn_nvidia}

		<Container>
			<Checkbox pair={[pref_hide_username, setPrefHideUsername]} title="Hide username in the Home screen" onChange={(n) => {
				prefs.hide_username = n;
				refreshPrefs();
			}} />
			<Checkbox pair={[pref_twelve, setPrefTwelve]} title="12-hour clock" onChange={(n) => {
				prefs.twelve_hour_clock = n;
				refreshPrefs();
			}} />
			{checkbox_opaque}
		</Container>

		<Container>
			<BoxRight>
				<Icon path="icons/usage.svg" />
				<Title title="Runtime info" />
			</BoxRight>
			<Separator />
			{auth ? <span>Connected to: <b>{auth.runtime}</b></span> : "Not connected to IPC"}
		</Container>

		<Container>
			<Title title="Advanced" />
			<Separator />
			<BoxRight>
				<Button icon="icons/refresh.svg" on_click={() => {
					window.location.reload();
				}} >
					Refresh dashboard (F5)
				</Button>
				<Button icon="icons/refresh.svg" on_click={async () => {
					await ipc.open_devtools();
				}}>
					Open devtools
				</Button>
				<Button icon="icons/refresh.svg" on_click={() => {
					failed_covers_clear();
				}}>
					Clear cover arts cache
				</Button>
			</BoxRight>
		</Container>

		<Container>
			<Title title="About" />
			<Separator />
			<span>Created by <b>oo8dev</b> and its contributors.</span>
			<BoxRight>
				<Icon path="icons/github.svg" width={20} height={20} />
				<code>github.com/olekolek1000/<b>wayvr-dashboard</b></code>
			</BoxRight>
			<BoxRight>
				<Icon path="icons/globe.svg" width={20} height={20} />
				<code>oo8.dev/<b>wayvr_dashboard</b></code>
			</BoxRight>
		</Container>
	</>
}