import { ipc } from "../ipc";
import { Globals } from "../globals";
import { BoxRight, Button, Container, Icon, Separator, Title } from "../gui/gui";
import { useEffect, useState } from "preact/hooks";
import { get_version } from "@/utils";

export function PanelSettings({ globals }: { globals: Globals }) {
	globals;

	const [auth, setAuth] = useState<ipc.AuthInfo | undefined>(undefined);
	const [version, setVersion] = useState("");

	useEffect(() => {
		const run = async () => {
			setVersion(await get_version());
			setAuth(await ipc.auth_get_info());
		};
		run().catch(() => {
			setAuth(undefined);
		})
	}, [])


	return <>
		<BoxRight>
			<Icon path="icons/settings.svg" />
			<Title title="Settings" />
		</BoxRight>

		<Separator />

		<Container>
			<BoxRight>
				<Icon path="icons/usage.svg" />
				<Title title="Runtime" />
			</BoxRight>
			<Separator />
			{auth ? <span>Connected to: <b>{auth.runtime}</b></span> : "Not connected to IPC"}
		</Container>

		<Container>
			<BoxRight>
				<Icon path="wayvr_dashboard.svg" />
				<Title title="WayVR Dashboard" />
			</BoxRight>
			<Separator />
			Version: <b>{version}</b>
		</Container>

		<Button icon="icons/refresh.svg" on_click={() => {
			window.location.reload();
		}} >
			Refresh dashboard (F5)
		</Button>

		Created by oo8.dev and its contributors.
	</>
}