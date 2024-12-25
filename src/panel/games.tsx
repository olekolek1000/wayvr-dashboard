import { GameCover, initPreviewer, Title } from "../gui"
import style from "../app.module.scss"
import { useMemo, useState } from "preact/hooks";
import { ipc } from "../ipc";

export function PanelGames({ }: {}) {
	const [list, setList] = useState(<></>);
	const previewer = initPreviewer();

	useMemo(async () => {
		const games = await ipc.get_games();

		const arr = games.manifests.map((manifest) => {
			return <GameCover on_click={() => {
				previewer.setManifest(manifest);
			}} manifest={manifest} />
		});

		setList(<>
			{arr}
		</>);
	}, [])

	return <>
		{previewer.element}
		<Title title="Games" />
		<div className={style.games_list}>
			{list}
		</div>
	</>
}