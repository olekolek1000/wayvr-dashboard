import { ipc } from "../ipc";
import style from "../app.module.scss"
import { Icon, Tooltip } from "../gui";

function ProcessEntry({ process, display, on_refresh }: { process: ipc.Process, display?: ipc.Display, on_refresh: () => any }) {
	let e_disp = undefined;

	if (display) {
		e_disp = <>
			on <Icon width={20} height={20} path="icons/display.svg" />
			<b>{display.name}</b>
		</>
	}

	return <div className={style.wayvr_process}>
		<Tooltip simple title={"Terminate process \"" + process.name + "\""}>
			<div className={style.wayvr_process_name} onClick={async () => {
				await ipc.terminate_process(process.handle);
				setTimeout(() => {
					on_refresh();
				}, 100);
			}}>
				<Icon path="icons/remove_circle.svg" />
			</div>
		</Tooltip>
		<div className={style.wayvr_process_name} >
			<b>{process.name}</b>
			{e_disp}
		</div>
	</div>
}

export function ProcessList({ processes, displays, on_refresh }: { processes: Array<ipc.Process>, displays: Array<ipc.Display>, on_refresh: () => void }) {
	return <div className={style.wayvr_processes}>
		{processes.length == 0 ? "No processes found" : processes.map((process) => {
			let display = displays.find((display) => {
				return JSON.stringify(display.handle) === JSON.stringify(process.display_handle);
			});

			return <ProcessEntry process={process} display={display} on_refresh={on_refresh} />
		})}
	</div>
}