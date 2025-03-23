import { ApplicationCover, BoxRight, Button, createWindowApplication, Icon, TextField, Title, TooltipSimple } from "../gui/gui"
import style from "../app.module.scss"
import { ipc } from "../ipc"
import scss from "../app.module.scss"
import { useEffect, useState } from "preact/hooks"
import { Globals } from "../globals";
import { Fragment, JSX } from "preact/jsx-runtime";

enum SortingType {
	by_name,
	by_category,
};

export function PanelApplications({ globals, desktop_files }: { globals: Globals, desktop_files: Array<ipc.DesktopFile> }) {
	const [list, setList] = useState(<></>);
	const [sorting_type, setSortingType] = useState(SortingType.by_name);
	const [filter, setFilter] = useState("");

	useEffect(() => {
		let by_category = new Map<string, Array<ipc.DesktopFile>>();
		const filter_lowercase = filter.toLocaleLowerCase();

		for (const desktop_file of desktop_files) {
			if (filter.length > 0) {
				if (!desktop_file.name.toLocaleLowerCase().includes(filter_lowercase)) {
					continue;
				}
			}

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

			let index = 0;
			arr.push(<div className={style.applications_list}>
				{
					category_sorted.map((dfile) => {
						return <ApplicationCover application={dfile} key={index++} on_click={() => {
							createWindowApplication(globals, dfile);
						}} />;
					})
				}
			</div>);
		}

		setList(<Fragment key={filter + sorting_type}>
			{arr}
		</Fragment>);

	}, [sorting_type, filter]);


	return <>
		<BoxRight>
			<Icon path="icons/apps.svg" />
			<Title title="Applications" />
		</BoxRight>

		<div className={scss.applications_list_top_bar}>
			<TooltipSimple title={"Sort alphabetically"}>
				<Button size={24} icon="icons/alphabetical.svg" on_click={() => {
					setSortingType(SortingType.by_name);
				}} />
			</TooltipSimple>

			<TooltipSimple title={"Sort by category"}>
				<Button size={24} icon="icons/category_search.svg" on_click={() => {
					setSortingType(SortingType.by_category);
				}} />
			</TooltipSimple>

			<Icon path="icons/search.svg" />

			<TextField placeholder="Search" valfunc={[filter, setFilter]} />

			<TooltipSimple title={"Refresh entries from the disk"}>
				<Button size={24} icon="icons/refresh.svg" on_click={async () => {
					clearDesktopFilesCache();
					enterPanelApplications(globals);
				}} />
			</TooltipSimple>
		</div>

		{list}
	</>
}

export function clearDesktopFilesCache() {
	const storage = window.localStorage;
	storage.removeItem("desktop_files");
}

export async function enterPanelApplications(globals: Globals) {
	// Read desktop file list from the system only once (for performance reasons)
	const storage = window.localStorage;
	let desktop_files_str = storage.getItem("desktop_files");

	let desktop_files;
	if (desktop_files_str === null) {
		desktop_files = await ipc.desktop_file_list();
		storage.setItem("desktop_files", JSON.stringify(desktop_files));
	}
	else {
		desktop_files = JSON.parse(desktop_files_str) as Array<ipc.DesktopFile>;
	}

	globals.setCurrentPanel(<PanelApplications key={Math.random()} globals={globals} desktop_files={desktop_files} />);
}