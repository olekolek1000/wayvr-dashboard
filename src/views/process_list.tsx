import { ipc } from "../ipc";
import style from "../app.module.scss"
import { BoxRight, Button, Icon, TooltipSimple } from "../gui/gui";
import { getAllWindows, getDesktopFileURL, obj_equals } from "@/utils";
import { useEffect, useState } from "preact/hooks";

async function getDesktopFileFromProcess(windows: Array<ipc.Window>, process: ipc.Process): Promise<ipc.DesktopFile | null> {
	for (const window of windows) {
		if (obj_equals(window.process_handle, process.handle)) {
			const dfile_str = process.userdata.desktop_file as string | undefined;
			if (dfile_str) {
				const desktop_file: ipc.DesktopFile = JSON.parse(dfile_str)
				return desktop_file;
			}
		}
	}
	return null;
}

export function useDesktopFile(process: ipc.Process, windows: Array<ipc.Window>) {
	const [desktop_file, setDesktopFile] = useState<ipc.DesktopFile | null>(null);

	useEffect(() => {
		(async () => {
			setDesktopFile(await getDesktopFileFromProcess(windows, process));
		})();
	}, []);

	return desktop_file;
}

function ProcessEntry({ process, display, windows, on_refresh }: { process: ipc.Process, display?: ipc.Display, windows: Array<ipc.Window>, on_refresh: () => any }) {
	let e_disp = undefined;

	const desktop_file = useDesktopFile(process, windows);

	if (display) {
		e_disp = <BoxRight>
			on <Icon width={24} height={24} path="icons/display.svg" />
			<b>{display.name}</b>
		</BoxRight>
	}

	const process_name = desktop_file !== null ? desktop_file.name : process.name;

	let name = undefined;

	if (desktop_file) {
		name = <><Icon width={28} height={28} path={getDesktopFileURL(desktop_file)} /> <b>{process_name}</b></>
	}
	else {
		name = <b>{process_name}</b>;
	}

	return <div className={style.wayvr_process}>
		<TooltipSimple title={"Terminate process \"" + process_name + "\""}>
			<Button icon="icons/remove_circle.svg" on_click={async () => {
				await ipc.process_terminate(process.handle);
				setTimeout(() => {
					on_refresh();
				}, 100);
			}} />
		</TooltipSimple>
		<div className={style.wayvr_process_name} >
			{name}
			{e_disp}
		</div>
	</div>
}

export function ProcessList({ processes, displays, on_refresh }: { processes: Array<ipc.Process>, displays: Array<ipc.Display>, on_refresh: () => void }) {
	const [windows, setWindows] = useState<Array<ipc.Window> | null>(null);

	useEffect(() => {
		(async () => {
			setWindows(await getAllWindows());
		})();
	}, []);

	if (windows === null) {
		return <></>;
	}

	return <div className={style.wayvr_processes}>
		{processes.length == 0 ? "No processes found" : processes.map((process) => {
			let display = displays.find((display) => {
				return obj_equals(display.handle, process.display_handle);
			});

			return <ProcessEntry process={process} display={display} windows={windows} on_refresh={on_refresh} />
		})}
	</div>
}