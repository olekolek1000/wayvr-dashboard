import { createWindowManifest, GameCover, Title } from "../gui/gui"
import style from "../app.module.scss"
import { useMemo, useState } from "preact/hooks";
import { ipc } from "../ipc";
import { Globals } from "../globals";

export function PanelGames({ globals }: { globals: Globals }) {
	const [list, setList] = useState(<></>);

	useMemo(async () => {
		const games = await ipc.game_list();

		const arr = games.manifests.map((manifest) => {
			return <GameCover key={manifest.app_id} on_click={() => {
				globals.wm.push(createWindowManifest(globals.wm, manifest));
			}} manifest={manifest} />
		});

		setList(<>
			{arr}
		</>);
	}, [])

	return <>
		<Title title="Games" />
		<div className={style.games_list}>
			{list}
		</div>
	</>
}