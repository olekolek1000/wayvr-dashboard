import { BoxDown, BoxRight, Button, Container, createWindowManifest, GameCover, Icon, Separator, Title, TooltipSimple } from "../gui/gui"
import style from "../app.module.scss"
import { useEffect, useState } from "preact/hooks";
import { ipc } from "../ipc";
import { Globals } from "../globals";
import { get_external_url } from "@/utils";

interface GameIcon {
	app_id: string;
	icon_path?: string;
}

async function game_icon_list(): Promise<GameIcon[]> {
	let out: GameIcon[] = [];
	const list = await ipc.desktop_file_list();
	for (const cell of list) {
		if (cell.exec_path !== "steam") {
			continue;
		}
		if (cell.exec_args.length == 0) {
			continue;
		}

		const appid_str = cell.exec_args[0].split("steam://rungameid/")[1];
		if (appid_str === undefined) {
			continue;
		}

		out.push({
			app_id: appid_str,
			icon_path: cell.icon
		});
		
	}

	return out;
}

function RunningGamesList({ globals, games }: { globals: Globals, games: ipc.Games }) {
	const [running_games, setRunningGames] = useState<ipc.SteamiumRunningGame[] | undefined>(undefined);
	const [icon_list, setIconList] = useState<GameIcon[]>([]);

	const search = async () => {
		setRunningGames(await ipc.running_game_list());
	}

	useEffect(() => {
		game_icon_list().then((list) => {
			setIconList(list);
		})
	}, []);

	useEffect(() => {
		search();

		let timer = undefined;

		if (globals.visible) {
			// refresh every 5s (if the dashboard is visible of course).
			// `running_game_list` itself takes about 10ms on my machine in the current implementation.
			timer = setInterval(async () => {
				search();
			}, 5000);
		}

		return () => {
			if (timer !== undefined) {
				clearInterval(timer);
			}
		}
	}, [globals.visible]);

	if (!running_games) {
		return <></>; // not yet loaded
	}

	let list = undefined;

	if (running_games.length == 0) {
		list = <>No running games found</>
	}
	else {
		list = <>
			{running_games.map((running_game) => {
				let icon = undefined;
				let name = undefined;

				for (const manifest of games.manifests) {
					if (manifest.app_id == running_game.app_id) {
						name = manifest.name;
						break;
					}
				}

				for (const cell of icon_list) {
					if (cell.app_id == running_game.app_id && cell.icon_path !== undefined) {
						icon = <Icon path={get_external_url(cell.icon_path)} />;
						break;
					}
				}

				const but_stop = <TooltipSimple title={name ? ("Stop \"" + name + "\"") : "Stop"}>
					<Button icon="icons/remove_circle.svg" on_click={async () => {
						await ipc.game_stop(running_game.app_id, false);
						search();
						setTimeout(search, 1000);
					}} />
				</TooltipSimple>

				const but_kill = <TooltipSimple title={name ? ("Force-kill \"" + name + "\"") : "Force-kill"}>
					<Button icon="icons/knife.svg" on_click={async () => {
						await ipc.game_stop(running_game.app_id, true);
						search();
						setTimeout(search, 1000);
					}} />
				</TooltipSimple>

				return <Container>
					<BoxRight>
						{icon}
						<div style={{ minWidth: "200px" }}>
							{name ? name : ("Unknown AppID" + running_game.app_id)}
						</div>
						{but_stop} {but_kill}
					</BoxRight>
				</Container>
			})}
		</>;
	}

	return <BoxDown>
		<BoxRight>
			<Icon path="icons/cpu.svg" />
			<Title title="Running games" />
			<Button icon="icons/refresh.svg" on_click={async () => {
				await search();
			}} />
		</BoxRight>
		{list}
	</BoxDown>
}

export function PanelGames({ globals }: { globals: Globals }) {
	const [list, setList] = useState(<></>);
	const [games, setGames] = useState<ipc.Games | undefined>(undefined);


	useEffect(() => {
		const fetchGames = async () => {
			const games = await ipc.game_list();
			setGames(games);

			const arr = games.manifests.map((manifest) => (
				<GameCover
					key={manifest.app_id}
					on_click={() => createWindowManifest(globals, manifest)}
					manifest={manifest}
				/>
			));

			setList(<>{arr}</>);
		};

		fetchGames();
	}, []);

	return <>
		{games ? <RunningGamesList globals={globals} games={games} /> : undefined}

		<Separator />

		<BoxRight>
			<Icon path="icons/games.svg" />
			<Title title="Games" />
		</BoxRight>

		<Separator />

		<div className={style.games_list}>
			{list}
		</div>
	</>
}