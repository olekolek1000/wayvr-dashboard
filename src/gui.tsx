import { useRef, useState } from "preact/hooks";
import style from "./app.module.scss"

export function Icon({ path, width, height }: { path: string, width?: number, height?: number }) {
	return <img className={style.icon} src={path} style={{
		width: width ? (width + "px") : undefined,
		height: height ? (height + "px") : undefined,
	}}>
	</img>
}

export function Tooltip({ children, title }: { children: any, title: any }) {
	const [hovered, setHovered] = useState(false);
	const ref_tooltip = useRef<HTMLDivElement | null>(null);

	let content = undefined;

	if (hovered) {
		content = <div ref={ref_tooltip} className={style.tooltip}>
			{title}
		</div>
	};

	return <div style={{
		position: "relative",
		width: "100%",
		height: "100%"
	}} onMouseEnter={() => {
		setHovered(true);
	}} onMouseLeave={() => {
		setHovered(false);
	}}>
		<>
			{hovered ? <div style={{
				position: "absolute",
				right: "0",
				top: "0",
			}}>
				{content}
			</div> : undefined}
			{children}
		</>
	</div>
}

export function GameCover({ icon }: { icon: string }) {
	return <div className={style.game_cover} style={{
		background: "url('" + icon + "')",
		backgroundSize: "cover",
		backgroundPosition: "center",
		backgroundRepeat: "no-repeat",
	}}>
		<div className={style.game_cover_shine} />
	</div>
}

export function ApplicationCover({ icon, name }: { icon?: string, name: string }) {
	return <div className={style.application_cover}>
		<div className={style.application_cover_icon} style={{
			background: "url('" + (icon ? icon : "icons/unknown.svg") + "')",
			backgroundSize: "contain",
			backgroundPosition: "center",
			backgroundRepeat: "no-repeat"
		}}>

		</div>
		<div className={style.application_cover_title}>
			{name}
		</div>
	</div>
}

export function Title({ title }: { title: string }) {
	return <div className={style.title}>
		{title}
	</div>
}

export function BoxRight({ children }: { children: any }) {
	return <div className={style.box_right}>
		{children}
	</div>
}