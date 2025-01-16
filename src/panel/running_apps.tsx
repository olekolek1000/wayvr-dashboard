import { useEffect, useState } from "preact/hooks";
import { BoxRight, Icon, Title } from "../gui/gui";
import { ipc } from "../ipc";
import { ProcessList } from "../views/process_list";
import { listDisplays } from "../utils";
import { Globals } from "@/globals";
import { createWindowAddDisplay, DisplayList } from "@/views/display_list";
import { createWindowDisplayOptions } from "@/views/display_options";

export function PanelRunningApps({ globals }: { globals: Globals }) {
	const [displays, setDisplays] = useState<Array<ipc.Display> | undefined>(undefined);
	const [processes, setProcesses] = useState<Array<ipc.Process> | undefined>(undefined);

	const refresh = async () => {
		setDisplays(await listDisplays());
		setProcesses(await ipc.process_list());
	}

	const load = () => {
		refresh();
	}

	useEffect(() => {
		load();

		// Refresh every 1.5s if something has changed externally.
		// TODO: implement feedback from the server
		// instead of refreshing it
		const interval = setInterval(() => {
			load();
		}, 1500);

		return () => {
			clearInterval(interval);
		}
	}, []);
	return <>
		<BoxRight>
			<Icon path="icons/display.svg" />
			<Title title="Display list" />
		</BoxRight>

		{displays ? <DisplayList displays={displays} params={{
			on_add: () => {
				createWindowAddDisplay(globals, displays, () => {
					refresh();
				});
			},
			on_click: (display) => {
				createWindowDisplayOptions(globals, display);
			}
		}} /> : undefined}
		<BoxRight>
			<Icon path="icons/cpu.svg" />
			<Title title="Process list" />
		</BoxRight>
		{(processes && displays) ? <ProcessList processes={processes} displays={displays} on_refresh={load} /> : undefined}
	</>
}