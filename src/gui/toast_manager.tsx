import style_tm from "./toast_manager.module.scss"

export interface ToastParams {
	text: string;
}

export class ToastManager {
	toasts = new Array<ToastParams>;
	timeout_id: NodeJS.Timeout | null = null;

	key: number = 0;
	setKey: any = undefined;

	render() {
		if (this.toasts.length == 0) {
			return <></>; // No toasts are present
		}

		// Display the first toast
		const params = this.toasts[0];

		return <div key={this.key} className={style_tm.toast_manager}>
			<div key={this.key} className={style_tm.toast}>
				{params.text}
			</div>
		</div>
	}

	push(content: string) {
		this.toasts.push({
			text: content
		});
		this.refresh();
		if (this.timeout_id === null) {
			this.setTimeoutForNextToast();
		}
	}

	pushMonadoNotPresent() {
		this.push("Monado is not present");
	}

	popFront() {
		if (this.toasts.length == 0) {
			return;
		}
		this.stopTimeout();
		this.toasts.splice(0, 1);
		this.refresh();
	}

	refresh() {
		this.setKey(this.key + 1);
	}

	setTimeoutForNextToast() {
		if (this.toasts.length > 0) {
			const timeout_id = setTimeout(() => {
				this.popFront();
				if (this.toasts.length > 0) {
					this.setTimeoutForNextToast();
				}
			}, 3000);
			this.timeout_id = timeout_id;
		} else {
			this.stopTimeout();
		}
	}

	stopTimeout() {
		if (this.timeout_id !== null) {
			clearTimeout(this.timeout_id);
			this.timeout_id = null;
		}
	}
}