import { JSX } from "preact/jsx-runtime";
import { ToastManager } from "./gui/toast_manager";
import { WindowManager } from "./gui/window_manager"
import scss from "./app.module.scss"
import { BoxRight, Button } from "./gui/gui";
import { Dispatch, StateUpdater } from "preact/hooks";

export class Globals {
	wm = new WindowManager;
	toast_manager = new ToastManager;
	global_scale!: number;


	setErrorText!: (el: JSX.Element | undefined) => void;
	setCurrentPanel!: Dispatch<StateUpdater<JSX.Element>>;

	constructor() {

	}

	setGlobalError(text: string) {
		if (!this.setErrorText) return;
		this.setErrorText(<div className={scss.error_text}>
			<BoxRight>
				<b>Error:</b> {text} <Button on_click={() => {
					this.setErrorText(undefined);
				}} >Close</Button>
			</BoxRight>
		</div>)
	}
}
