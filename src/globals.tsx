import { JSX } from "preact/jsx-runtime";
import { ToastManager } from "./gui/toast_manager";
import { WindowManager } from "./gui/window_manager"
import scss from "./app.module.scss"
import { BoxRight, Button } from "./gui/gui";

export class Globals {
	wm = new WindowManager;
	toast_manager = new ToastManager;

	setErrorText!: (el: JSX.Element | undefined) => void;

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
