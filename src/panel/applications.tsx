import { ApplicationCover, BoxRight, createWindowApplication, Icon, Separator, Title } from "../gui/gui"
import style from "../app.module.scss"
import { ipc } from "../ipc"
import { useMemo, useState } from "preact/hooks"
import { Globals } from "../globals";

export function PanelApplications({ globals }: { globals: Globals }) {
	const [list, setList] = useState(<></>);

	useMemo(async () => {
		const desktop_files = await ipc.desktop_file_list();

		const arr = desktop_files.map((dfile) => {
			return <ApplicationCover application={dfile} key={dfile.exec + "." + dfile.name} on_click={() => {
				createWindowApplication(globals, dfile);
			}} />
		});

		setList(<>
			{arr}
		</>);
	}, []);

	return <>
		<BoxRight>
			<Icon path="icons/apps.svg" />
			<Title title="Applications" />
		</BoxRight>

		<Separator />

		<div className={style.applications_list}>
			{list}
		</div>
	</>
}