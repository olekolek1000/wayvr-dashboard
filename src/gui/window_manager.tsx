import { JSX } from "preact/jsx-runtime";

import style_wm from "./wm.module.scss"
import { PanelButton } from "./gui";

function WindowDecoration({ title, on_close }: { title: string, on_close: () => void }) {
	return <div className={style_wm.decoration}>
		<div className={style_wm.decoration_buttons}>
			<PanelButton square icon="icons/back.svg" on_click={on_close} />
		</div>
		<div className={style_wm.decoration_title}>
			{title}
		</div>
	</div>
}


export interface WindowParams {
	centered?: boolean;
	title: string;
	content: JSX.Element;
}

export class WindowManager {
	windows = new Array<WindowParams>;

	key: number = 0;
	setKey: any = undefined;

	render() {
		if (this.windows.length == 0) {
			return <></>; // No windows are present
		}

		// Display only the last window
		const params = this.windows[this.windows.length - 1];

		return <div key={this.key} className={style_wm.wm}>
			<div key={this.key} className={style_wm.window}>
				<WindowDecoration title={params.title} on_close={() => {
					this.pop();
				}} />
				<div className={style_wm.content} style={{
					alignItems: params.centered ? "center" : undefined,
					justifyContent: params.centered ? "center" : undefined
				}}>
					{params.content}
				</div>
			</div>
		</div>;
	}

	replace(params: WindowParams) {
		this.windows.pop();
		this.windows.push(params);
		this.refresh();
	}

	push(params: WindowParams) {
		this.windows.push(params);
		this.refresh();
	}

	pop() {
		if (this.windows.length == 0) {
			return; // Silently ignore
		}
		this.windows.pop();
		this.refresh();
	}

	popAll() {
		this.windows = [];
		this.refresh();
	}

	refresh() {
		this.setKey(this.key + 1);
	}
}

