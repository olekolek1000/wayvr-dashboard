import { ToastManager } from "./gui/toast_manager";
import { WindowManager } from "./gui/window_manager"

export class Globals {
	wm = new WindowManager;
	toast_manager = new ToastManager;

	constructor() {

	}
}