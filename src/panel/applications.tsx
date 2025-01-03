import { ApplicationCover, initPreviewer, Title } from "../gui"
import style from "../app.module.scss"
import { ipc } from "../ipc"
import { useMemo, useState } from "preact/hooks"

export function PanelApplications({ }: {}) {
	const [list, setList] = useState(<></>);
	const previewer = initPreviewer();

	useMemo(async () => {
		const desktop_files = await ipc.desktop_file_list();

		const arr = desktop_files.map((dfile) => {
			return <ApplicationCover application={dfile} key={dfile.exec + "." + dfile.name} on_click={() => {
				previewer.setApplication(dfile);
			}} />
		});

		setList(<>
			{arr}
		</>);
	}, []);

	return <>
		{previewer.element}
		<Title title="Applications" />
		<div className={style.applications_list}>
			{list}
		</div>
	</>
}