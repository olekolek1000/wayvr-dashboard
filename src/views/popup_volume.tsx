import { Globals } from "@/globals";
import { BoxDown, BoxRight, Button, Checkbox, Container, Slider } from "@/gui/gui";
import { ipc } from "@/ipc";
import { unfocusAll } from "@/utils";
import { useEffect, useState } from "preact/hooks";
import { JSX } from "preact/jsx-runtime";

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

function ModeSinks() {
	const [sinks, setSinks] = useState<Array<ipc.AudioSink> | undefined>(undefined);
	const [default_sink, setDefaultSink] = useState<ipc.AudioSink | undefined>(undefined);

	const refresh = async () => {
		console.log("refreshing sink list");
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

interface SelectorCell {
	key: string,
	display_text: string,
}

function MultiSelector({ cells, def_cell, onSelect }: {
	cells: Array<SelectorCell>,
	def_cell: string,
	onSelect: (name: string) => void
}) {
	return <BoxDown>
		{cells.map((cell) => {
			return <Button key={cell.key} highlighted={cell.key === def_cell} on_click={() => {
				onSelect(cell.key);
			}}>
				{cell.display_text}
			</Button>
		})}
	</BoxDown>
}

function getProfileDisplayName(profile_name: string, card: ipc.AudioCard) {
	const profile = ipc.mapGet(card.profiles, profile_name);
	if (profile === undefined) {
		return profile_name; // fallback
	}

	return profile.description;
}

function Card({ card, setProfileSelector }: { card: ipc.AudioCard, setProfileSelector: (el: JSX.Element | undefined) => void }) {
	const desc = card.properties["device.description"];

	return <Container>
		<BoxDown center>
			<small>{desc}</small>
			<Button style={{ width: "100%" }} on_click={() => {
				let cells = new Array<SelectorCell>;
				ipc.mapIter(card.profiles, (profile_name, profile) => {
					cells.push({
						key: profile_name,
						display_text: profile.description
					});
				});

				setProfileSelector(<BoxDown>
					<BoxRight>
						<Button icon="icons/back.svg" on_click={() => {
							setProfileSelector(undefined);
						}} />
						Select profile
					</BoxRight>
					<MultiSelector cells={cells} def_cell={card.active_profile} onSelect={async (profile) => {
						await ipc.audio_set_card_profile({
							cardIndex: card.index,
							profile: profile
						})
						setProfileSelector(undefined);
					}} />
				</BoxDown>);
			}}>
				{getProfileDisplayName(card.active_profile, card)}
			</Button>
		</BoxDown>
	</Container>
}

function ModeCards() {
	const [cards, setCards] = useState<Array<ipc.AudioCard> | undefined>(undefined);
	const [profile_selector, setProfileSelector] = useState<JSX.Element | undefined>(undefined);

	const refresh = async () => {
		console.log("refreshing card list");
		const cards = await ipc.audio_list_cards();
		setCards(cards);
	}

	useEffect(() => {
		refresh();
	}, [profile_selector]);

	if (cards === undefined) {
		return <></>;
	}

	if (profile_selector !== undefined) {
		return profile_selector;
	}

	return <BoxDown>
		{cards.map((card) => {
			return <Card key={card.index} card={card} setProfileSelector={setProfileSelector} />
		})}
	</BoxDown>
}

enum Mode {
	sinks,
	cards
}

export function PopupVolume({ globals }: { globals: Globals }) {
	const [mode, setMode] = useState<Mode>(Mode.sinks);

	useEffect(() => {
		unfocusAll(globals);
	}, []);

	let content = undefined;

	switch (mode) {
		case Mode.sinks: {
			content = <ModeSinks />
			break;
		}
		case Mode.cards: {
			content = <ModeCards />
			break;
		}
	}

	return <BoxDown>
		{content}
		<BoxRight>
			<Button style={{ width: "100%" }} highlighted={mode == Mode.sinks} on_click={() => {
				setMode(Mode.sinks);
			}}>Sinks</Button>
			<Button style={{ width: "100%" }} highlighted={mode == Mode.cards} on_click={() => {
				setMode(Mode.cards);
			}}>Cards</Button>
		</BoxRight>
	</BoxDown>
}