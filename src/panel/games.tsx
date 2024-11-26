import { GameCover, Title } from "../gui"
import style from "../app.module.scss"

export function PanelGames({ }: {}) {
	return <>
		<Title title="Games" />
		<div className={style.games_list}>
			Steam games scanner WIP
			{
				/*
				<GameCover icon="cover_game_a.jpg" />
				<GameCover icon="cover_game_b.jpg" />
				<GameCover icon="cover_game_c.jpg" />
				*/
			}
		</div>
	</>
}