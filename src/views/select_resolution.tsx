import { Globals } from "@/globals";
import { Button, Checkbox, Slider } from "@/gui/gui";
import { useEffect, useState } from "preact/hooks";

function gcd(a: number, b: number): number {
	return (b == 0) ? a : gcd(b, a % b);
}

function But({ width, height, on_click }: { width: number, height: number, on_click: () => void }) {
	const div = 10.0;

	const r = gcd(width, height);

	return <Button on_click={on_click} style={{
		width: Math.max(64, width / div) + "px",
		height: Math.max(48, height / div) + "px",
	}} >
		{width}x{height}
		<br />
		{width / r}:{height / r}
	</Button>
}

const resolution_list = [
	[256, 256],
	[512, 256],
	[512, 512],
	[640, 480],
	[800, 600],
	[960, 540],
	[1024, 512],
	[1536, 512],
	[1280, 720],
	[1440, 720],
	[1800, 720],
	[1600, 900],
	[1024, 1024],
	[1536, 1024],
	[2048, 1024],
	[1440, 1080],
	[1920, 1080],
	[2560, 1440],
	[2048, 2048],
	[3200, 1800],
	[3840, 2160],
	[4096, 2048],
]

class Resolution {
	x!: number;
	y!: number;
}

function SelectResolution({ on_submit }: { on_submit: (res: Resolution) => void }) {
	const [value, setValue] = useState(0.4);
	const [res, setRes] = useState(resolution_list[0]);
	const [portrait, setPortrait] = useState(false);

	const on_change = (val: number) => {
		const index = Math.round(val * (resolution_list.length - 1));
		setRes(resolution_list[index]);
	};

	useEffect(() => {
		on_change(value);
	}, []);

	return <>
		<Checkbox pair={[portrait, setPortrait]} title="Portrait" />

		<Slider width={500} value={value} setValue={setValue} on_change={on_change} />

		<But width={res[portrait ? 1 : 0]} height={res[portrait ? 0 : 1]} on_click={() => {
			on_submit({
				x: res[portrait ? 1 : 0],
				y: res[portrait ? 0 : 1]
			})
		}} />

		Click the display to confirm.
	</>
}


export function createWindowSelectResolution(globals: Globals, on_submit: (res: Resolution) => void) {
	globals.wm.push({
		title: "Select resolution",
		content: <SelectResolution on_submit={on_submit} />
	});
}