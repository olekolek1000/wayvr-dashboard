import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import sass from 'vite-plugin-sass';
import sassDts from 'vite-plugin-sass-dts';
import path from 'path'
import { Importer, NodePackageImporter } from "sass";
import tsconfigPaths from 'vite-tsconfig-paths';

const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig(async () => ({
	css: {
		preprocessorOptions: {
			scss: {
				api: 'modern-compiler'
			}
		},
		modules: {
			exportGlobals: true,
		},
	},

	plugins: [
		preact(),
		tsconfigPaths(),
		sassDts({
			enabledMode: ['development', 'production'],
			esmExport: true,
		}),
	],

	// Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
	//
	// 1. prevent vite from obscuring rust errors
	clearScreen: false,
	// 2. tauri expects a fixed port, fail if that port is not available
	server: {
		port: 1420,
		strictPort: true,
		host: host || false,
		hmr: host
			? {
				protocol: "ws",
				host,
				port: 1421,
			}
			: undefined,
		watch: {
			// 3. tell vite to ignore watching `src-tauri`
			ignored: ["**/src-tauri/**"],
		},
	},
}));
