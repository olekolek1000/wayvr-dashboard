import { useEffect, useState } from "preact/hooks";
import { BoxRight, Icon, Title } from "../gui";
import { ipc } from "../ipc";
import { DisplayList } from "../views/display_list";

export function PanelRunningApps({ }: {}) {
	const [displays, setDisplays] = useState<Array<ipc.Display> | undefined>(undefined);

	useEffect(() => {
		const run = async () => {
			setDisplays(await ipc.list_displays());
		}

		run().catch((e) => {
			console.error(e);
		});
	}, []);
	return <>
		<Title title="Select display" />
		{displays ? <DisplayList displays={displays} /> : undefined}
	</>
}