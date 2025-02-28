export namespace preferences {
	export class Preferences {
		twelve_hour_clock?: boolean; // 24-hour clock
		hide_username?: boolean;
		opaque_background?: boolean;
	}

	export function savePreferences(preferences: Preferences) {
		const storage = window.localStorage;
		storage.setItem("preferences", JSON.stringify(preferences));
	}

	export function loadPreferences(): Preferences {
		const storage = window.localStorage;

		const preferences = storage.getItem("preferences");

		if (preferences !== null) {
			return JSON.parse(preferences) as Preferences;
		}
		else {
			return new Preferences();
		}
	}
}