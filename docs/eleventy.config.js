import { DateTime } from "luxon";
import markdownItAnchor from "markdown-it-anchor";
import { InputPathToUrlTransformPlugin, HtmlBasePlugin } from "@11ty/eleventy";
import pluginSyntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import pluginBundle from "@11ty/eleventy-plugin-bundle";
import pluginNavigation from "@11ty/eleventy-navigation";
import Prism from "prismjs";
import pluginToc from "eleventy-plugin-toc";
import picjsPlugin from "../extras/plugins/eleventy/picjs.js";
import definePicjs from "../extras/syntax-highlighters/prism-picjs.js";
import deflist from "markdown-it-deflist";

export default async function(eleventyConfig) {
	const pathPrefix = process.env.PATH_PREFIX || "/";

	eleventyConfig.addPassthroughCopy({ "./public/": "/" });
	eleventyConfig.addPassthroughCopy({ "../dist/runtime.js": "assets/runtime.js" });
	eleventyConfig.addPassthroughCopy({ "../dist/playground.js": "assets/playground.js" });
	eleventyConfig.addPassthroughCopy({ "../examples/": "examples/" });
	eleventyConfig.addPassthroughCopy({ "./assets/": "assets/" });

	eleventyConfig.ignores.add("superpowers/**");
	eleventyConfig.ignores.add("tools/**");

	eleventyConfig.addPlugin(picjsPlugin, { prism: Prism, pathPrefix });
	eleventyConfig.addPlugin(pluginSyntaxHighlight, {
		preAttributes: { tabindex: 0 },
		init: function({ Prism }) {
			definePicjs(Prism);
		},
	});
	eleventyConfig.addPlugin(pluginNavigation);
	eleventyConfig.addPlugin(pluginBundle);
	eleventyConfig.addPlugin(pluginToc, {
		tags: ['h2', 'h3', 'h4'],
		wrapper: 'div',
		wrapperClass: '',
		ul: true,
		flat: false,
	});
	eleventyConfig.addPlugin(HtmlBasePlugin);
	eleventyConfig.addPlugin(InputPathToUrlTransformPlugin);

	eleventyConfig.addFilter("tocDisclosure", (html) => {
		if (!html || !html.trim()) return "";
		function convertList(ul, open) {
			const items = [...ul.matchAll(/<li>([\s\S]*?)(?=<li>|<\/ul>$)/g)];
			if (!items.length) return ul;
			let result = "";
			const liRegex = /<li>([\s\S]*?)<\/li>/g;
			const topUl = ul.match(/^<ul>([\s\S]*)<\/ul>$/);
			if (!topUl) return ul;
			const inner = topUl[1];
			const lis = [];
			let depth = 0, start = 0;
			for (let i = 0; i < inner.length; i++) {
				if (inner.slice(i, i+4) === "<li>") {
					if (depth === 0) start = i;
					depth++;
				} else if (inner.slice(i, i+5) === "</li>") {
					depth--;
					if (depth === 0) lis.push(inner.slice(start, i + 5));
				}
			}
			for (const li of lis) {
				const content = li.slice(4, -5);
				const subUlMatch = content.match(/<ul>[\s\S]*<\/ul>/);
				if (subUlMatch) {
					const link = content.slice(0, subUlMatch.index);
					const subHtml = convertList(subUlMatch[0], false);
					result += `<details${open ? " open" : ""}><summary>${link.trim()}</summary>${subHtml}</details>`;
				} else {
					result += `<div class="toc-leaf">${content.trim()}</div>`;
				}
			}
			return result;
		}
		const divMatch = html.match(/<div[^>]*>([\s\S]*)<\/div>/);
		const ulHtml = divMatch ? divMatch[1].trim() : html.trim();
		return convertList(ulHtml, true);
	});

	eleventyConfig.addFilter("readableDate", (dateObj, format, zone) => {
		return DateTime.fromJSDate(dateObj, { zone: zone || "utc" }).toFormat(format || "dd LLLL yyyy");
	});

	eleventyConfig.addFilter("htmlDateString", (dateObj) => {
		return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toFormat('yyyy-LL-dd');
	});

	eleventyConfig.amendLibrary("md", mdLib => {
		mdLib.use(markdownItAnchor, {
			permalink: markdownItAnchor.permalink.ariaHidden({
				placement: "after",
				class: "header-anchor",
				symbol: "",
				ariaHidden: false,
			}),
			level: [1, 2, 3, 4],
			slugify: eleventyConfig.getFilter("slugify")
		});
		mdLib.use(deflist);
	});

	eleventyConfig.setServerOptions({ domDiff: false });

	return {
		templateFormats: ["md", "njk", "html"],
		markdownTemplateEngine: false,
		htmlTemplateEngine: "njk",
		pathPrefix,
		dir: {
			input: ".",
			includes: "_includes",
			data: "_data",
			output: "_html"
		},
	};
};
