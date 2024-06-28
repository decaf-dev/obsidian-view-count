import { writable } from "svelte/store";
import ViewCountPlugin from "src/main";

const plugin = writable<ViewCountPlugin>();
export default { plugin };
