import { Icon, TooltipSimple } from "@/gui/gui";
import { ipc } from "@/ipc";
import scss from "../app.module.scss"
import { useEffect, useState } from "preact/hooks";

function getBatPath(percent: number, charging: boolean) {
	return "icons/bat_" + (charging ? "chr_" : "") + Math.round(percent * 10.0) * 10.0 + ".svg";
}

function Battery({ bat }: { bat: ipc.MonadoBatteryLevel }) {
	return <TooltipSimple title={bat.device_name}>
		<div className={scss.battery_container}>
			<Icon path={getBatPath(bat.percent, bat.charging)} height={24} width={24} />
			{Math.round(bat.percent * 100.0)}%
		</div>
	</TooltipSimple>
}

export function BatteryLevels({ dash_visible }: { dash_visible: boolean }) {
	const [bats, setBats] = useState<ipc.MonadoBatteryLevel[] | undefined>(undefined);

	const refresh = async () => {
		if (!await ipc.is_monado_present()) {
			return;
		}

		setBats(await ipc.monado_get_battery_levels());
	}

	useEffect(() => {
		const interval = setInterval(() => {
			refresh();
		}, dash_visible ? 2500 : 30000);

		refresh();

		return () => {
			clearInterval(interval);
		}
	}, []);


	if (bats === undefined) {
		return <></>;
	}

	return <>
		{bats.map((bat) => {
			return <Battery bat={bat} />
		})}
	</>
}