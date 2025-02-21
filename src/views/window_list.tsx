import { BoxRight, PanelButton, TooltipSimple } from "@/gui/gui";
import { ipc } from "@/ipc";
import { focusWindow, getAllWindows, getDesktopFileURL } from "@/utils";
import { useEffect, useState } from "preact/hooks";
import { useDesktopFile } from "./process_list";
import { Globals } from "@/globals";



function WindowEntry({ globals, windows, window }: {
	globals: Globals,
	windows: Array<ipc.Window>,
	window: ipc.Window
}) {
	const [process, setProcess] = useState<ipc.Process | undefined>(undefined);

	useEffect(() => {
		(async () => {
			setProcess(await ipc.process_get(window.process_handle));
		})();
	}, []);

	if (!process) {
		return;
	}

	const desktop_file = useDesktopFile(process, windows);

	if (!desktop_file) {
		return;
	}

	return <TooltipSimple extend title={desktop_file.name}>
		<PanelButton icon_size={32} square icon={getDesktopFileURL(desktop_file)} opacity={window.visible ? 1.0 : 0.5} on_click={() => {
			focusWindow(globals, window);
		}} />
	</TooltipSimple>
}


export function WindowList({ globals }: { globals: Globals }) {
	const [windows, setWindows] = useState<Array<ipc.Window> | null>(null);
	useEffect(() => {
		(async () => {
			setWindows(await getAllWindows());
		})();
	}, []);

	if (windows === null) {
		return <></>;
	}

	return <BoxRight>
		{windows.map((window) => {
			return <WindowEntry globals={globals} key={window.handle.generation} windows={windows} window={window} />
		})}
	</BoxRight>
}