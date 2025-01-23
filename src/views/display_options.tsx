import { BoxRight, Button, createWindowMessage } from "@/gui/gui";
import { ipc } from "@/ipc";
import { Display } from "./display_list";
import { Globals } from "@/globals";


function DisplayOptions({ globals, display, on_close }: { globals: Globals, display: ipc.Display, on_close: () => void }) {
	return <>
		Selected display
		<Display display={display} />
		<BoxRight>
			<Button icon="icons/remove_circle.svg" on_click={() => {
				ipc.display_remove(display.handle).then(() => {
					globals.toast_manager.push("Display removed");
					globals.wm.pop();
					on_close();
				}).catch((e) => {
					globals.wm.push(createWindowMessage(globals.wm, "Error: " + e));
				})
			}} >
				Remove display
			</Button>
			<Button icon="icons/eye.svg" on_click={async () => {
				await ipc.display_set_visible({ handle: display.handle, visible: !display.visible });
				on_close();
			}}>
				{display.visible ? "Hide" : "Show"}
			</Button>
		</BoxRight>
	</>
}


export function createWindowDisplayOptions(globals: Globals, display: ipc.Display, on_exit: () => void) {
	globals.wm.push({
		title: "Display options",
		content: <DisplayOptions globals={globals} display={display} on_close={() => {
			on_exit();
			globals.wm.pop();
		}} />
	});
}