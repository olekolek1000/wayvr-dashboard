import { Globals } from "@/globals";
import { BoxDown, BoxRight, Button, Checkbox, Container, Icon, Slider, Tooltip } from "@/gui/gui";
import { ipc } from "@/ipc";
import { unfocusAll } from "@/utils";
import { useEffect, useState } from "preact/hooks";
import { JSX } from "preact/jsx-runtime";


function getCardFromSink(sink: ipc.AudioSink, cards: ipc.AudioCard[]): ipc.AudioCard | undefined {
	const sink_dev_name = ipc.mapGet(sink.properties, "device.name");
	if (!sink_dev_name) {
		return undefined;
	}
	for (const card of cards) {
		if (sink_dev_name === card.name) {
			return card;
		}
	}
}

function VolumeSink({ sink, cards, on_refresh, default_sink, setDefaultSink }: {
	sink: ipc.AudioSink,
	cards: ipc.AudioCard[],
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

	const card = getCardFromSink(sink, cards);

	let disp = undefined;
	if (card) {
		disp = getProfileDisplayName(card.active_profile, card);
	}

	return <Container highlighted={default_sink && (sink.name == default_sink.name)} >
		<BoxDown center>
			<BoxRight>
				{disp && disp.icon_path ? <Icon width={16} height={16} path={disp.icon_path} /> : undefined}
				<small style={{
					textWrap: "nowrap",
				}}> {disp ? disp.name : sink.description}</small>
			</BoxRight>
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
				<Slider value={volume} setValue={setVolume} width={200} on_change={(volume) => {
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
	const [cards, setCards] = useState<Array<ipc.AudioCard> | undefined>(undefined);
	const [default_sink, setDefaultSink] = useState<ipc.AudioSink | undefined>(undefined);

	const refresh = async () => {
		console.log("refreshing sink list");
		const sinks = await ipc.audio_list_sinks();
		const cards = await ipc.audio_list_cards();
		const def_sink = await ipc.audio_get_default_sink({ sinks: sinks });
		setSinks(sinks);
		setCards(cards);

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

	if (sinks === undefined || cards === undefined) {
		return <></>;
	}

	return <BoxDown key={default_sink ? default_sink.index : 0}>
		{sinks.map((sink) => {
			return <VolumeSink key={sink.index} sink={sink} cards={cards} on_refresh={refresh} default_sink={default_sink} setDefaultSink={setDefaultSink} />
		})}
	</BoxDown>
}

interface SelectorCell {
	key: string,
	display_text: string,
	icon_path?: string,
}

function MultiSelector({ cells, def_cell, onSelect }: {
	cells: Array<SelectorCell>,
	def_cell: string,
	onSelect: (name: string) => void
}) {

	return <BoxDown>
		{cells.map((cell) => {
			return <Button icon={cell.icon_path} key={cell.key} highlighted={cell.key === def_cell} on_click={() => {
				onSelect(cell.key);
			}}>
				{cell.display_text}
			</Button>
		})}
	</BoxDown>
}

interface ProfileDisplayName {
	name: string;
	icon_path?: string;
	is_vr: boolean,
}

function getProfileDisplayName(profile_name: string, card: ipc.AudioCard): ProfileDisplayName {
	const profile = ipc.mapGet(card.profiles, profile_name);
	if (profile === undefined) {
		return {
			name: profile_name,
			is_vr: false,
		}; // fallback
	}

	let out_name = "";
	let out_icon_path: string;
	let is_vr = false;

	const prof = profile_name.toLowerCase();
	if (prof.includes("analog")) {
		out_icon_path = "icons/minijack.svg";
	}
	else if (prof.includes("iec")) { // digital
		out_icon_path = "icons/binary.svg";
	}
	else if (prof.includes("hdmi")) {
		out_icon_path = "icons/displayport.svg";
	}
	else if (prof.includes("off")) {
		out_icon_path = "icons/sleep.svg";
	}
	else if (prof.includes("input")) {
		out_icon_path = "icons/microphone.svg";
	}
	else {
		out_icon_path = "icons/volume.svg"; // Default fallback
	}

	ipc.mapIter(card.ports, (_port_name, port) => {
		// Find profile
		for (const port_profile of port.profiles) {
			if (!port_profile.includes("stereo")) {
				continue; // we only want stereo, not surround or other types
			}

			if (port_profile === profile_name) {
				// Exact match! Use its device name
				const product_name = ipc.mapGet(port.properties, "device.product.name");
				if (product_name !== undefined) {
					out_name = product_name;

					const pname = product_name.toLowerCase();
					if (
						pname.includes("hmd") // generic hmd name detected
						|| pname.includes("index") // Valve Index
						|| pname.includes("rift") // Oculus Rift
					) {
						// VR icon
						out_icon_path = "icons/vr.svg";
						is_vr = true;
					} else {
						// Monitor icon
						out_icon_path = "icons/display.svg";
					}
				}
				break;
			}
		}
	});

	if (out_name.length != 0) {
		return {
			name: out_name,
			icon_path: out_icon_path,
			is_vr: is_vr,
		};
	}

	return {
		name: profile.description,
		icon_path: out_icon_path,
		is_vr: is_vr,
	};
}

function Card({ card, setProfileSelector }: { card: ipc.AudioCard, setProfileSelector: (el: JSX.Element | undefined) => void }) {
	const desc = card.properties["device.description"];

	const disp_name = getProfileDisplayName(card.active_profile, card);

	return <Container>
		<BoxDown center>
			<small>{desc}</small>
			<Button icon={disp_name.icon_path} style={{ width: "100%" }} on_click={() => {
				let cells = new Array<SelectorCell>;
				ipc.mapIter(card.profiles, (profile_name, _profile) => {
					if (profile_name.includes("surround")) {
						return; // we aren't interested in that
					}
					const disp_name = getProfileDisplayName(profile_name, card);
					cells.push({
						key: profile_name,
						display_text: disp_name.name,
						icon_path: disp_name.icon_path,
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
				{disp_name.name}
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


async function switchToVRAudio(globals: Globals, on_change: () => void) {
	let switched = false;

	const cards = await ipc.audio_list_cards();
	for (const card of cards) {
		ipc.mapIter(card.profiles, (profile_name, _profile) => {
			if (switched) {
				return;
			}

			const name = getProfileDisplayName(profile_name, card);
			if (!name.is_vr) {
				return;
			}

			switched = true;

			const sw = async () => {
				// Found!
				try {
					await ipc.audio_set_card_profile({
						cardIndex: card.index,
						profile: profile_name
					});

					const sinks = await ipc.audio_list_sinks();
					let sink_set = false;
					// find sink by card name
					for (const sink of sinks) {
						const sink_dev_name = ipc.mapGet(sink.properties, "device.name");
						if (sink_dev_name === card.name) {
							await ipc.audio_set_default_sink({
								sinkIndex: sink.index
							})
							sink_set = true;
							break;
						}
					}

					if (sink_set) {
						globals.toast_manager.push("Switched to \"" + name.name + "\" successfully!");
					}
					else {
						// shouldn't happen but inform the user
						globals.toast_manager.push("\"" + name.name + "\" found and initialized! (not switched)");
					}

					on_change();
				}
				catch (e) {
					globals.toast_manager.push("Failed to set card profile: " + JSON.stringify(e));
				}
			};

			sw();
		});

		if (switched) {
			return;
		}
	}

	if (!switched) {
		globals.toast_manager.push("No VR device found. Switch it manually.");
	}
}

export function PopupVolume({ globals }: { globals: Globals }) {
	const [mode, setMode] = useState<Mode>(Mode.sinks);
	const [key, setKey] = useState(0);

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

	return <BoxDown key={key}>
		{content}
		<BoxRight>
			<Tooltip title="Auto-switch to VR audio" simple >
				<Button bgcolor="#00CCFFAA" icon="icons/magic_wand.svg" on_click={async () => {
					await switchToVRAudio(globals, () => {
						setKey(key + 1);
					});
				}} />
			</Tooltip>
			<Button icon="icons/volume.svg" style={{ width: "100%" }} highlighted={mode == Mode.sinks} on_click={() => {
				setMode(Mode.sinks);
			}}>Sinks</Button>
			<Button icon="icons/cpu.svg" style={{ width: "100%" }} highlighted={mode == Mode.cards} on_click={() => {
				setMode(Mode.cards);
			}}>Cards</Button>
		</BoxRight>
	</BoxDown>
} 