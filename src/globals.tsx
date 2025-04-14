import { JSX } from "preact/jsx-runtime";
import { ToastManager } from "./gui/toast_manager";
import { WindowManager } from "./gui/window_manager"
import { Dispatch, StateUpdater } from "preact/hooks";
import { ipc } from "./ipc";
import { preferences } from "./preferences";

export class Globals {
	wm = new WindowManager;
	toast_manager = new ToastManager;
	global_scale!: number;
	focused_window?: ipc.WindowHandle;

	generation_state!: number;
	setGenerationState!: (generation: number) => void;

	prefs!: preferences.Preferences;
	setPrefs!: (prefs: preferences.Preferences) => void;

	visible!: boolean;
	setVisible!: (visible: boolean) => void;

	setShowingProcess!: (process: ipc.Process | undefined) => void;

	setCurrentPanel!: Dispatch<StateUpdater<JSX.Element>>;

	is_nvidia!: boolean;

	constructor() {

	}
}
