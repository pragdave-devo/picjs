import type { Plugin, LoadContext } from "@docusaurus/types";
import remarkPicjs from "./remark-picjs.js";
import { picjsStyles } from "./styles.js";

export interface PluginOptions {
  runtimePath?: string;
}

export default function pluginPicjs(
  context: LoadContext,
  options: PluginOptions = {}
): Plugin<void> {
  const { runtimePath } = options;

  return {
    name: "docusaurus-plugin-picjs",

    configureWebpack() {
      return {
        resolve: {
          fallback: {
            // picjs doesn't need node polyfills in browser
          },
        },
      };
    },

    injectHtmlTags() {
      const runtimeSrc =
        runtimePath ?? "https://unpkg.com/@strike48/picjs/dist/runtime.js";

      return {
        headTags: [
          {
            tagName: "style",
            attributes: { "data-picjs": "styles" },
            innerHTML: picjsStyles,
          },
        ],
        postBodyTags: [
          {
            tagName: "script",
            attributes: { type: "module" },
            innerHTML: `
              if (document.querySelector('[data-picjs-player]')) {
                import('${runtimeSrc}').then(m => m.initAnimations?.());
              }
            `,
          },
        ],
      };
    },
  };
}

export function remarkPlugin() {
  return remarkPicjs;
}

export { remarkPicjs };
