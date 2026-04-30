import { DateTime } from "luxon";
import markdownItAnchor from "markdown-it-anchor";
import { InputPathToUrlTransformPlugin, HtmlBasePlugin } from "@11ty/eleventy";
import pluginSyntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import pluginBundle from "@11ty/eleventy-plugin-bundle";
import pluginNavigation from "@11ty/eleventy-navigation";
import definePicjs from "./_plugins/prism-picjs.js";
import pluginToc from "eleventy-plugin-toc";
import picjsPlugin from "./_plugins/picjs.js";
import deflist from "markdown-it-deflist";

export default async function(eleventyConfig) {
	eleventyConfig.addPassthroughCopy({ "./public/": "/" });
	eleventyConfig.addPassthroughCopy({ "../dist/runtime.js": "assets/runtime.js" });
	eleventyConfig.addPassthroughCopy({ "./assets/": "assets/" });

	eleventyConfig.ignores.add("superpowers/**");
	eleventyConfig.ignores.add("tools/**");

	eleventyConfig.addPlugin(picjsPlugin);
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
		wrapperClass: 'p-3 bold',
		ul: true,
		flat: false,
	});
	eleventyConfig.addPlugin(HtmlBasePlugin);
	eleventyConfig.addPlugin(InputPathToUrlTransformPlugin);

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
		pathPrefix: process.env.PATH_PREFIX || "/",
		dir: {
			input: ".",
			includes: "_includes",
			data: "_data",
			output: "_html"
		},
	};
};
