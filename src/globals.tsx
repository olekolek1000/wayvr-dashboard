import { JSX } from "preact/jsx-runtime";
import { ToastManager } from "./gui/toast_manager";
import { WindowManager } from "./gui/window_manager"
import { Dispatch, StateUpdater } from "preact/hooks";
import { ipc } from "./ipc";

export class Globals {
	wm = new WindowManager;
	toast_manager = new ToastManager;
	global_scale!: number;
	focused_window?: ipc.WindowHandle;

	generation_state!: number;
	setGenerationState!: (generation: number) => void;

	setShowingProcess!: (process: ipc.Process | undefined) => void;

	setCurrentPanel!: Dispatch<StateUpdater<JSX.Element>>;

	constructor() {

	}
}
