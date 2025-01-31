import { Globals } from "@/globals";
import { BigButton, BigButtonColor, Button, Checkbox, Container, Inline, RadioSelect, Slider, Title } from "@/gui/gui";
import { ipc } from "@/ipc";
import { getUniqueDisplayName } from "@/utils";
import { useEffect, useState } from "preact/hooks";

function gcd(a: number, b: number): number {
	return (b == 0) ? a : gcd(b, a % b);
}

function But({ width, height }: { width: number, height: number }) {
	const div = 8.0;

	const r = gcd(width, height);

	return <Button style={{
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
	//[2048, 2048],
	//[3200, 1800],
	//[3840, 2160],
	//[4096, 2048],
]

interface Resolution {
	x: number;
	y: number;
}

interface NewWindowResult {
	resolution: Resolution;
	attach_to: ipc.AttachTo;
	name: string;
}

function NewWindow({ on_submit }: { on_submit: (res: NewWindowResult) => void }) {
	const [value, setValue] = useState(0.4);
	const [res, setRes] = useState(resolution_list[0]);
	const [portrait, setPortrait] = useState(false);
	const [attach_to, setAttachTo] = useState(ipc.AttachTo.None);
	const [displays, setDisplays] = useState<ipc.Display[] | undefined>(undefined);

	const on_change = (val: number) => {
		const index = Math.round(val * (resolution_list.length - 1));
		setRes(resolution_list[index]);
	};

	useEffect(() => {
		(async () => {
			const displays = await ipc.display_list();
			setDisplays(displays);
		})();

		on_change(value);
	}, []);

	if (displays === undefined) {
		return <></>;
	}

	const calcName = () => {
		let name = "wvr";
		switch (attach_to) {
			case ipc.AttachTo.None: break;
			case ipc.AttachTo.HandLeft: name += "_left"; break;
			case ipc.AttachTo.HandRight: name += "_right"; break;
			case ipc.AttachTo.Head: name += "_head"; break;
		}

		return getUniqueDisplayName(displays, name);
	}

	return <>
		<Inline>
			<Container>
				<Title title="Resolution" />
				<Checkbox pair={[portrait, setPortrait]} title="Portrait" />
				<Slider width={350} steps={resolution_list.length - 1} value={value} setValue={setValue} on_change={on_change} />
				<But width={res[portrait ? 1 : 0]} height={res[portrait ? 0 : 1]} />
			</Container>
			<Container>
				<Title title="Attachment" />
				<RadioSelect pair={[attach_to, setAttachTo]} items={[
					ipc.AttachTo.None,
					ipc.AttachTo.HandLeft,
					ipc.AttachTo.HandRight,
					ipc.AttachTo.Head,
				]} />
			</Container>
		</Inline>
		<BigButton title="Create display" type={BigButtonColor.green} icon="icons/display.svg" on_click={() => {
			on_submit({
				resolution: {
					x: res[portrait ? 1 : 0],
					y: res[portrait ? 0 : 1]
				},
				attach_to: attach_to,
				name: calcName(),
			})
		}} />
		<Title title={calcName()} />
	</>
}


export function createWindowNewDisplay(globals: Globals, on_submit: (res: NewWindowResult) => void) {
	globals.wm.push({
		centered: true,
		title: "New display",
		content: <NewWindow on_submit={on_submit} />
	});
}