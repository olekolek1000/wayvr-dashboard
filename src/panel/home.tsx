import { BoxRight, Icon, Title } from "../gui";

export function PanelHome({ }: {}) {
	return <>
		<BoxRight>
			<Icon path="wayvr_logo.svg" width={64} height={32} />
			<Title title="Home" />
		</BoxRight>
	</>
}