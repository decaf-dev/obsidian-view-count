import { writable } from "svelte/store";
import { App } from "obsidian";
import ViewCountCache from "src/storage/view-count-cache";

export interface ViewCountPluginStore {
	app: App;
	cache: ViewCountCache;
}

const pluginStore = writable<ViewCountPluginStore>();
export default { pluginStore };
