import { useEffect, useState } from "preact/hooks";
import style from "./app.module.scss"

function getTimeString(twelve_hour: boolean) {
	let date = new Date();
	let options = {
		hour: "2-digit", minute: "2-digit"
	};

	return date.toLocaleTimeString(twelve_hour ? "en-US" : "en-GB", options as any)
}

export function Clock({ twelve_hour }: { twelve_hour: boolean }) {
	const [time, setTime] = useState(getTimeString(twelve_hour));

	useEffect(() => {
		const interval = setInterval(() => {
			setTime(getTimeString(twelve_hour));
		}, 60000 /* roughly every minute */);

		return () => {
			clearInterval(interval);
		}
	}, []);

	return <div className={style.clock}>
		{time}
	</div>
}