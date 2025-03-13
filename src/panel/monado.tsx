import { BoxDown, BoxRight, Checkbox, Container, Icon, Separator, Title } from "../gui/gui"
import { useEffect, useState } from "preact/hooks";
import { ipc } from "../ipc";
import { Globals } from "../globals";

function Client({ client, on_refresh }: { client: ipc.MonadoClient, on_refresh: () => void }) {
	const [checked, setChecked] = useState(client.is_primary);

	return <Container key={client.name}>
		<BoxRight>
			<Checkbox pair={[checked, setChecked]} onChange={async (_) => {
				console.log("Setting focus to ", client.name);
				await ipc.monado_client_focus({
					name: client.name
				});

				on_refresh();
			}} />
			<b>{client.name}</b>
		</BoxRight>
		<BoxRight>
			<div>active: {client.is_active ? "1" : "0"}</div>
			<div>focused: {client.is_focused ? "1" : "0"}</div>
			<div>io_active: {client.is_io_active ? "1" : "0"}</div>
			<div>overlay: {client.is_overlay ? "1" : "0"}</div>
			<div>primary: {client.is_primary ? "1" : "0"}</div>
			<div>visible: {client.is_visible ? "1" : "0"}</div>
		</BoxRight>
	</Container>
}

export function PanelMonado({ globals }: { globals: Globals }) {
	globals;
	const [clients, setClients] = useState<Array<ipc.MonadoClient> | undefined>(undefined);
	const [key, setKey] = useState(0);

	const refresh = async () => {
		const clients = await ipc.monado_client_list();
		//console.log(clients);
		setClients(clients);
	}

	const refresh_full = async () => {
		await refresh();
		setKey(key + 1);
	}

	useEffect(() => {
		refresh();

		const timer = setInterval(async () => {
			await refresh();
		}, 10000); // refresh every 10s

		return () => {
			clearInterval(timer);
		}
	}, []);

	if (!clients) {
		return <></>;
	}

	return <>
		<BoxRight>
			<Icon path="icons/monado.svg" />
			<Title title="Monado clients" />
		</BoxRight>

		<Separator />

		Currently, we are restarting Monado IPC each time you change focus to trigger Monado's internal events due to a bug. This requires further investigation. Click the checkbox to change focus. Repeat if it doesn’t work.
		<br />
		https://gitlab.freedesktop.org/monado/monado/-/issues/497

		<Separator />

		<b>Set application focus state</b>

		<BoxDown key={key}>
			{clients.map((client) => {
				return <Client client={client} on_refresh={() => {
					refresh_full();
				}} />
			})}
		</BoxDown>
	</>
}