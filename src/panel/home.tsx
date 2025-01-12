import { Globals } from "../globals";
import { BoxRight, Icon, Title } from "../gui/gui";

export function PanelHome({ globals }: { globals: Globals }) {
	globals;

	return <>
		<BoxRight>
			<Icon path="wayvr_dashboard.webp" width={32} height={32} />
			<Title title="Home" />
		</BoxRight>
	</>
}