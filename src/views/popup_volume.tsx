import { Globals } from "@/globals";
import { BoxDown, BoxRight, Button, Checkbox, Container, Slider } from "@/gui/gui";
import { ipc } from "@/ipc";
import { unfocusAll } from "@/utils";
import { useEffect, useState } from "preact/hooks";

function VolumeSink({ sink, on_refresh, default_sink, setDefaultSink }: {
	sink: ipc.AudioSink,
	on_refresh: () => void,
	default_sink: ipc.AudioSink | undefined,
	setDefaultSink: (sink: ipc.AudioSink) => void
}) {
	const mult = 1.5;

	const [volume, setVolume] = useState<number | undefined>(undefined);
	useEffect(() => {
		(async () => {
			const vol = await ipc.audio_get_sink_volume({ sink: sink });
			setVolume(vol / mult);
		})();
	}, []);

	const [checked, setChecked] = useState(default_sink ? (sink.index == default_sink.index) : false);

	if (volume === undefined) {
		return <></>;
	}

	return <Container>
		<BoxDown center>
			<small style={{
				textWrap: "nowrap"
			}}>{sink.description}</small>
			<BoxRight>
				<Checkbox pair={[checked, setChecked]} onChange={async (n) => {
					if (!n) {
						setChecked(true);
					}
					else {
						await ipc.audio_set_default_sink({ sinkIndex: sink.index });
						setDefaultSink(sink);
					}
				}} />
				<Button icon={sink.mute ? "icons/volume_off.svg" : "icons/volume.svg"} on_click={async () => {
					await ipc.audio_set_sink_mute({
						sinkIndex: sink.index,
						mute: !sink.mute
					});

					on_refresh();
				}} />
				<Slider value={volume} setValue={setVolume} width={280} on_change={(volume) => {
					setVolume(volume);
					ipc.audio_set_sink_volume({
						sinkIndex: sink.index,
						volume: volume * mult,
					})
				}} />
				<div style={{ width: "40px", fontWeight: "bold", color: ((volume * mult) > 1.0 ? "#F88" : "white") }}>
					{Math.round(volume * 100.0 * mult)}%
				</div>
			</BoxRight>
		</BoxDown>
	</Container>
}

export function PopupVolume({ globals }: { globals: Globals }) {
	const [sinks, setSinks] = useState<Array<ipc.AudioSink> | undefined>(undefined);
	const [default_sink, setDefaultSink] = useState<ipc.AudioSink | undefined>(undefined);

	console.log(default_sink);

	const refresh = async () => {
		console.log("refreshing sink list");
		await unfocusAll(globals);
		const sinks = await ipc.audio_list_sinks();
		const def_sink = await ipc.audio_get_default_sink({ sinks: sinks });
		setSinks(sinks);

		if (!def_sink) {
			setDefaultSink(undefined);
		}
		else if (!default_sink || default_sink.index != def_sink.index) {
			setDefaultSink(def_sink);
		}
	}

	useEffect(() => {
		refresh();
	}, [default_sink]);

	if (sinks === undefined) {
		return <></>;
	}

	return <BoxDown key={default_sink ? default_sink.index : 0}>
		{sinks.map((sink) => {
			return <VolumeSink key={sink.index} sink={sink} on_refresh={refresh} default_sink={default_sink} setDefaultSink={setDefaultSink} />
		})}
	</BoxDown>
}