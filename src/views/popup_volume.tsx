import { Globals } from "@/globals";
import { BoxDown, BoxRight, Button, Checkbox, Container, Icon, Slider, TooltipSimple } from "@/gui/gui";
import { ipc } from "@/ipc";
import { unfocusAll } from "@/utils";
import { Dispatch, StateUpdater, useEffect, useState } from "preact/hooks";
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

function getCardFromSource(source: ipc.AudioSource, cards: ipc.AudioCard[]): ipc.AudioCard | undefined {
	const source_dev_name = ipc.mapGet(source.properties, "device.name");
	if (!source_dev_name) {
		return undefined;
	}
	for (const card of cards) {
		if (source_dev_name === card.name) {
			return card;
		}
	}
}

function VolumePip({ volume, setVolume, checked, setChecked, disp, alt_desc, highlighted, muted, on_volume_request, on_check, on_mute_toggle, on_volume_change }: {
	volume: number | undefined,
	setVolume: Dispatch<StateUpdater<number | undefined>>,
	checked: boolean,
	setChecked: Dispatch<StateUpdater<boolean>>,
	disp: ProfileDisplayName | undefined,
	alt_desc: string,
	highlighted: boolean,
	muted: boolean,
	on_volume_request: () => Promise<number>
	on_check: () => Promise<void>,
	on_mute_toggle: () => Promise<void>,
	on_volume_change: (volume: number) => Promise<void>,
}) {
	const mult = 1.5;

	useEffect(() => {
		(async () => {
			setVolume((await on_volume_request()) / mult);
		})();
	}, []);

	if (volume === undefined) {
		return <></>;
	}

	return <Container highlighted={highlighted} >
		<BoxDown center>
			<BoxRight>
				{disp && disp.icon_path ? <Icon width={16} height={16} path={disp.icon_path} /> : undefined}
				<small style={{
					textWrap: "nowrap",
				}}> {disp ? disp.name : alt_desc}</small>
			</BoxRight>
			<BoxRight>
				<Checkbox pair={[checked, setChecked]} onChange={async (n) => {
					if (!n) {
						setChecked(true);
					}
					else {
						await on_check();
					}
				}} />
				<Button icon={muted ? "icons/volume_off.svg" : "icons/volume.svg"} on_click={async () => {
					on_mute_toggle();
				}} />
				<Slider value={volume} setValue={setVolume} width={200} on_change={(volume) => {
					setVolume(volume);
					on_volume_change(volume * mult);
				}} />
				<div style={{ width: "40px", fontWeight: "bold", color: ((volume * mult) > 1.0 ? "#F88" : "white") }}>
					{Math.round(volume * 100.0 * mult)}%
				</div>
			</BoxRight>
		</BoxDown>
	</Container>
}

function VolumeSink({ sink, cards, on_refresh, default_sink, setDefaultSink }: {
	sink: ipc.AudioSink,
	cards: ipc.AudioCard[],
	on_refresh: () => void,
	default_sink: ipc.AudioSink | undefined,
	setDefaultSink: (sink: ipc.AudioSink) => void
}) {
	const [volume, setVolume] = useState<number | undefined>(undefined);
	const [checked, setChecked] = useState(default_sink ? (sink.index == default_sink.index) : false);
	const card = getCardFromSink(sink, cards);

	return <VolumePip
		volume={volume}
		setVolume={setVolume}
		checked={checked}
		setChecked={setChecked}
		disp={card ? getProfileDisplayName(card.active_profile, card) : undefined}
		highlighted={default_sink !== undefined && (sink.name == default_sink.name)}
		muted={sink.mute}
		alt_desc={sink.description}
		on_volume_request={async () => {
			return await ipc.audio_get_sink_volume({ sink: sink });
		}}
		on_check={async () => {
			await ipc.audio_set_default_sink({ sinkIndex: sink.index });
			setDefaultSink(sink);
		}}
		on_mute_toggle={async () => {
			await ipc.audio_set_sink_mute({
				sinkIndex: sink.index,
				mute: !sink.mute
			});
			on_refresh();
		}}
		on_volume_change={async (volume) => {
			await ipc.audio_set_sink_volume({
				sinkIndex: sink.index,
				volume: volume,
			})
		}}
	/>
}


function VolumeSource({ source, cards, on_refresh, default_source, setDefaultSource }: {
	source: ipc.AudioSource,
	cards: ipc.AudioCard[],
	on_refresh: () => void,
	default_source: ipc.AudioSource | undefined,
	setDefaultSource: (source: ipc.AudioSource) => void
}) {
	const [volume, setVolume] = useState<number | undefined>(undefined);
	const [checked, setChecked] = useState(default_source ? (source.index == default_source.index) : false);
	const card = getCardFromSource(source, cards);

	return <VolumePip
		volume={volume}
		setVolume={setVolume}
		checked={checked}
		setChecked={setChecked}
		disp={card ? getProfileDisplayName(card.active_profile, card) : undefined}
		highlighted={default_source !== undefined && (source.name == default_source.name)}
		muted={source.mute}
		alt_desc={source.description}
		on_volume_request={async () => {
			return await ipc.audio_get_source_volume({ source: source });
		}}
		on_check={async () => {
			await ipc.audio_set_default_source({ sourceIndex: source.index });
			setDefaultSource(source);
		}}
		on_mute_toggle={async () => {
			await ipc.audio_set_source_mute({
				sourceIndex: source.index,
				mute: !source.mute
			});
			on_refresh();
		}}
		on_volume_change={async (volume) => {
			await ipc.audio_set_source_volume({
				sourceIndex: source.index,
				volume: volume,
			})
		}}
	/>
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

function ModeSources() {
	const [sources, setSources] = useState<Array<ipc.AudioSource> | undefined>(undefined);
	const [cards, setCards] = useState<Array<ipc.AudioCard> | undefined>(undefined);
	const [default_source, setDefaultSource] = useState<ipc.AudioSource | undefined>(undefined);

	const refresh = async () => {
		console.log("refreshing source list");
		const sources = await ipc.audio_list_sources();
		const cards = await ipc.audio_list_cards();
		const def_source = await ipc.audio_get_default_source({ sources: sources });
		setSources(sources);
		setCards(cards);

		if (!def_source) {
			setDefaultSource(undefined);
		}
		else if (!default_source || default_source.index != default_source.index) {
			setDefaultSource(def_source);
		}
	}

	useEffect(() => {
		refresh();
	}, [default_source]);

	if (sources === undefined || cards === undefined) {
		return <></>;
	}

	return <BoxDown key={default_source ? default_source.index : 0}>
		{sources.map((source) => {
			return <VolumeSource key={source.index} source={source} cards={cards} on_refresh={refresh} default_source={default_source} setDefaultSource={setDefaultSource} />
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

function doesStringMentionHMDSink(input: string) {
	const name = input.toLowerCase();
	return (
		name.includes("hmd") // generic hmd name detected
		|| name.includes("index") // Valve Index
		|| name.includes("oculus")  // Oculus
		|| name.includes("rift") // Also Oculus
	);
}

function doesStringMentionHMDSource(input: string) {
	const name = input.toLowerCase();
	return (
		name.includes("hmd") // generic hmd name detected
		|| name.includes("valve") // Valve Index
		|| name.includes("oculus") // Oculus
	);
}

function isCardMentioningHMD(card: ipc.AudioCard) {
	const card_device_name = card.properties["device.description"];
	if (card_device_name === undefined) {
		return false;
	}

	return doesStringMentionHMDSink(card_device_name);
}

function isSourceMentioningHMD(source: ipc.AudioSource) {
	const source_card_name = source.properties["alsa.card_name"];

	if (source_card_name !== undefined) {
		if (doesStringMentionHMDSource(source_card_name)) {
			return true;
		}
	}

	//WiVRn
	if (source.name == "wivrn.source") {
		return true;
	}

	return false;
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

	// All ports are tied to this VR headset, assign all of them to the VR icon
	if (isCardMentioningHMD(card)) {
		if (prof.includes("mic")) {
			// Probably microphone
			out_icon_path = "icons/microphone.svg";
		}
		else {
			out_icon_path = "icons/vr.svg";
		}
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

					if (doesStringMentionHMDSink(product_name)) {
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

	return {
		name: out_name.length != 0 ? out_name : profile.description,
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
	sources,
	cards
}

async function switch_source(globals: Globals, source: ipc.AudioSource) {
	try {
		await ipc.audio_set_default_source({
			sourceIndex: source.index
		});

		const card_name = source.properties["alsa.card_name"];

		globals.toast_manager.push("Microphone set to \"" + (card_name !== undefined ? card_name : source.description) + "\" successfully!");
	}
	catch (e) {
		globals.toast_manager.push("Failed to switch microphone: " + JSON.stringify(e));
	}
}

async function switch_card(globals: Globals, card: ipc.AudioCard, profile_name: string, name: ProfileDisplayName) {
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
			globals.toast_manager.push("Speakers set to \"" + name.name + "\" successfully!");
		}
		else {
			// shouldn't happen but inform the user
			globals.toast_manager.push("\"" + name.name + "\" found and initialized! (not switched)");
		}
	}
	catch (e) {
		globals.toast_manager.push("Failed to set card profile: " + JSON.stringify(e));
	}
};

async function switchToVRMicrophone(globals: Globals) {
	let switched = false;

	const sources = await ipc.audio_list_sources();

	for (const source of sources) {
		if (isSourceMentioningHMD(source)) {
			switch_source(globals, source);
			switched = true;
			break;
		}
	}

	if (!switched) {
		globals.toast_manager.push("No VR microphone found. Switch it manually.");
	}
}

async function switchToVRSpeakers(globals: Globals) {
	let switched = false;

	const cards = await ipc.audio_list_cards();
	for (const card of cards) {
		if (isCardMentioningHMD(card)) {
			// Get the profile with the largest priority value
			let best_priority = 0;
			let best_profile_name = "";
			let best_profile = undefined;
			ipc.mapIter(card.profiles, (profile_name, profile) => {
				if (profile.priority > best_priority) {
					best_priority = profile.priority;
					best_profile = profile;
					best_profile_name = profile_name;
				}
			});

			if (best_profile) {
				const name = getProfileDisplayName(best_profile_name, card);
				switched = true;
				switch_card(globals, card, best_profile_name, name);
			}
			return;
		}

		ipc.mapIter(card.profiles, (profile_name, _profile) => {
			if (switched) {
				return;
			}

			const name = getProfileDisplayName(profile_name, card);
			if (!name.is_vr) {
				return;
			}

			switched = true;

			switch_card(globals, card, profile_name, name);
		});

		if (switched) {
			return;
		}
	}

	if (!switched) {
		globals.toast_manager.push("No VR speakers found. Switch them manually.");
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
		case Mode.sources: {
			content = <ModeSources />
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
			<TooltipSimple title="Auto-switch to VR audio" >
				<Button bgcolor="#00CCFFAA" icon="icons/magic_wand.svg" on_click={async () => {
					await switchToVRSpeakers(globals);
					await switchToVRMicrophone(globals);
					setKey(key + 1);
				}} />
			</TooltipSimple>
			<Button icon="icons/volume.svg" style={{ width: "100%" }} highlighted={mode == Mode.sinks} on_click={() => {
				setMode(Mode.sinks);
			}}>Speakers</Button>
			<Button icon="icons/microphone.svg" style={{ width: "100%" }} highlighted={mode == Mode.sources} on_click={() => {
				setMode(Mode.sources);
			}}>Microphones</Button>
			<Button icon="icons/cpu.svg" style={{ width: "100%" }} highlighted={mode == Mode.cards} on_click={() => {
				setMode(Mode.cards);
			}}>Cards</Button>
		</BoxRight>
	</BoxDown>
} 