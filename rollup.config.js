import svelte from "rollup-plugin-svelte";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { terser } from "rollup-plugin-terser";
import sveltePreprocess from "svelte-preprocess";
import typescript from "@rollup/plugin-typescript";
import replace from '@rollup/plugin-replace';
import path from "path";
import fs from "fs";
import * as dotenv from "dotenv";

dotenv.config();

const production = !process.env.ROLLUP_WATCH;

export default fs
  .readdirSync(path.join(__dirname, "svelte", "pages"))
  .map((input) => {
    const name = input.split(".")[0];
    return {
      input: "svelte/pages/" + input,
      output: {
        sourcemap: true,
        format: "iife",
        name: "app",
        file: "out/compiled/" + name + ".js",
      },
      plugins: [
        svelte({
          // enable run-time checks when not in production
          dev: !production,
          // we'll extract any component CSS out into
          // a separate file - better for performance
          css: (css) => {
            css.write(name + ".css");
          },
          preprocess: sveltePreprocess(),
        }),

        // If you have external dependencies installed from
        // npm, you'll most likely need these plugins. In
        // some cases you'll need additional configuration -
        // consult the documentation for details:
        // https://github.com/rollup/plugins/tree/master/packages/commonjs
        resolve({
          browser: true,
          dedupe: ["svelte"],
        }),
        commonjs(),
        typescript({
          tsconfig: "svelte/tsconfig.json",
          sourceMap: !production,
          inlineSources: !production,
        }),
        replace({
          firebaseSecrets: JSON.stringify({
            env: {
              apiKey: process.env.API_KEY,
              authDomain: process.env.AUTH_DOMAIN,
              databaseUrl: process.env.DATABASE_URL,
              projectId: process.env.PROJECT_ID,
              storageBucket: process.env.STORAGE_BUCKET,
              messagingSenderId: process.env.MESSAGING_SENDER_ID,
              appId: process.env.APP_ID
            }
          })
        }),

        // In dev mode, call `npm run start` once
        // the bundle has been generated
        // !production && serve(),

        // Watch the `public` directory and refresh the
        // browser on changes when not in production
        // !production && livereload("public"),

        // If we're building for production (npm run build
        // instead of npm run dev), minify
        production && terser(),
      ],
      watch: {
        clearScreen: false,
      },
    };
  });
