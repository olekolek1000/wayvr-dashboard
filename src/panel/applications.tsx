import { ApplicationCover, BoxRight, Button, createWindowApplication, Icon, Title } from "../gui/gui"
import style from "../app.module.scss"
import { ipc } from "../ipc"
import scss from "../app.module.scss"
import { useEffect, useState } from "preact/hooks"
import { Globals } from "../globals";
import { JSX } from "preact/jsx-runtime";

enum SortingType {
	by_name,
	by_category,
};

export function PanelApplications({ globals, desktop_files }: { globals: Globals, desktop_files: Array<ipc.DesktopFile> }) {
	const [list, setList] = useState(<></>);
	const [sorting_type, setSortingType] = useState(SortingType.by_name);

	useEffect(() => {
		let by_category = new Map<string, Array<ipc.DesktopFile>>();
		for (const desktop_file of desktop_files) {
			let key = "";
			switch (sorting_type) {
				case SortingType.by_name: {
					key = desktop_file.name.length > 0 ? desktop_file.name[0].toUpperCase() : "";
					break;
				}
				case SortingType.by_category: {
					key = desktop_file.categories.length > 0 ? desktop_file.categories[0] : "Other";
					break;
				}
			}

			let arr = by_category.get(key) ?? [];
			arr.push(desktop_file);
			by_category.set(key, arr);
		}

		let arr = new Array<JSX.Element>();

		const by_category_sorted = [...by_category.entries()].sort((a, b) => {
			return String(a).localeCompare(String(b));
		});

		for (const pair of by_category_sorted) {
			const key = pair[0];
			const category = pair[1];

			const category_sorted = category.sort((a, b) => {
				return String(a).localeCompare(String(b));
			});

			arr.push(<b className={scss.applications_list_sticky_top} >{key}</b>);

			arr.push(<div className={style.applications_list}>
				{
					category_sorted.map((dfile) => {
						return <ApplicationCover application={dfile} key={dfile.exec_path + "" + dfile.exec_args.join(" ")} on_click={() => {
							createWindowApplication(globals, dfile);
						}} />;
					})
				}
			</div>);
		}

		setList(<>
			{arr}
		</>);

	}, [sorting_type]);

	return <>
		<BoxRight>
			<Icon path="icons/apps.svg" />
			<Title title="Applications" />
		</BoxRight>

		<BoxRight>
			<Button size={24} icon="icons/alphabetical.svg" on_click={() => {
				setSortingType(SortingType.by_name);
			}} />
			<Button size={24} icon="icons/category_search.svg" on_click={() => {
				setSortingType(SortingType.by_category);
			}} />
		</BoxRight>

		{list}
	</>
}

export async function enterPanelApplications(globals: Globals) {
	const desktop_files = await ipc.desktop_file_list();
	globals.setCurrentPanel(<PanelApplications globals={globals} desktop_files={desktop_files} />);
}