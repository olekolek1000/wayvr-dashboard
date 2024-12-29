import { useEffect, useState } from "preact/hooks";
import { BoxRight, Icon, PanelButton, Title } from "../gui";
import { ipc } from "../ipc";
import { DisplayList } from "../views/display_list";
import { ProcessList } from "../views/process_list";

export function PanelRunningApps({ }: {}) {
	const [displays, setDisplays] = useState<Array<ipc.Display> | undefined>(undefined);
	const [processes, setProcesses] = useState<Array<ipc.Process> | undefined>(undefined);
	const [key, setKey] = useState(0);

	const refresh = () => {
		setKey(key + 1);
	}

	useEffect(() => {
		const run = async () => {
			setDisplays(await ipc.display_list());
			setProcesses(await ipc.process_list());
		}

		run().catch((e) => {
			console.error(e);
		});
	}, [key]);
	return <>
		<Title title="Display list" />
		{displays ? <DisplayList key={key} displays={displays} /> : undefined}
		<Title title="Process list" />
		{(processes && displays) ? <ProcessList key={key} processes={processes} displays={displays} on_refresh={refresh} /> : undefined}
		<PanelButton height={32} icon="icons/refresh.svg" on_click={refresh} >
			Refresh all (refreshed {key} times)
		</PanelButton>
	</>
}