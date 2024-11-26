import { ApplicationCover, Title } from "../gui"
import style from "../app.module.scss"
import { ipc } from "../ipc"
import { useMemo, useState } from "preact/hooks"
import { get_external_url } from "../utils";

export function PanelApplications({ }: {}) {
	const [list, setList] = useState(<></>);

	useMemo(async () => {
		const desktop_files = await ipc.get_desktop_files();

		const arr = desktop_files.map((dfile) => {
			return <ApplicationCover icon={dfile.icon ? get_external_url(dfile.icon) : undefined} name={dfile.name} key={dfile.exec + "." + dfile.name} />
		});

		setList(<>
			{arr}
		</>);
	}, []);

	return <>
		<Title title="Applications" />
		<div className={style.applications_list}>
			{list}
		</div>
	</>
}