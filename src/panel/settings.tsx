import { ipc } from "../ipc";
import { Globals } from "../globals";
import { BoxRight, Button, Icon, Separator, Title } from "../gui/gui";
import { useEffect, useState } from "preact/hooks";

export function PanelSettings({ globals }: { globals: Globals }) {
	globals;

	const [auth, setAuth] = useState<ipc.AuthInfo | undefined>(undefined);

	useEffect(() => {
		const run = async () => {
			const auth = await ipc.auth_get_info();
			setAuth(auth);
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

		<Button icon="icons/refresh.svg" on_click={() => {
			window.location.reload();
		}} >
			Refresh dashboard (F5)
		</Button>

		<div>
			<BoxRight>
				<Icon path="icons/usage.svg" />
				<Title title="Runtime info" />
			</BoxRight>
			{auth ? <span>Connected to: <b>{auth.runtime}</b></span> : "Not connected to IPC"}
		</div>
	</>
}