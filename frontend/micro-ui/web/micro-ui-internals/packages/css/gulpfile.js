const fs = require("fs");
const { name, version, author, cssConfig } = JSON.parse(fs.readFileSync("package.json"));

const headerString = `
@charset "UTF-8";
/*!
 * ${name} - ${version}
 *
 * Copyright (c) ${new Date().getFullYear()} ${author}
 * 
 */
  `;
const { series, src, dest, watch, task } = require("gulp");
const header = require("postcss-header");
const path = require("path");

const clean = require("gulp-clean");
const postcss = require("gulp-postcss");
const replace = require("gulp-replace");
const dartSass = require("sass");
const sass = require("gulp-sass")(dartSass);

const postcssPresetEnv = require("postcss-preset-env");
const cleanCSS = require("gulp-clean-css");
const rename = require("gulp-rename");
const livereload = require("gulp-livereload");

let output = "./example";
if (process.env.NODE_ENV === "production") {
  output = "./dist";
}

function cleanStyles() {
  return src(`${output}/*.css`, { read: false }).pipe(clean());
}

function styles() {
  const plugins = [
    require("postcss-import")({
      filter: (path) => {
        // Only process Tailwind and CSS imports, skip SCSS files
        return !path.endsWith(".scss");
      },
    }),
    require("tailwindcss"),
    postcssPresetEnv({ stage: 2, autoprefixer: { cascade: false }, features: { "custom-properties": true } }),
    require("autoprefixer"),
    require("cssnano"),
    header({ header: headerString }),
  ];

  const fs = require("fs");

  const sassOptions = {
    quietDeps: true,
    importer: [
      function (url, prev) {
        // Skip Tailwind imports - PostCSS will handle them
        if (url.startsWith("tailwindcss/")) {
          return { contents: `/* Tailwind: ${url} */` };
        }

        // For local SCSS files, preprocess theme() calls
        if (url.startsWith("./") || url.startsWith("../")) {
          const basedir = path.dirname(prev === "stdin" ? "src/index.scss" : prev);
          let filepath = path.resolve(basedir, url);

          // Add .scss extension if missing
          if (!filepath.endsWith(".scss") && !filepath.endsWith(".css")) {
            filepath += ".scss";
          }

          if (fs.existsSync(filepath)) {
            let contents = fs.readFileSync(filepath, "utf8");
            // Replace theme() with placeholders
            contents = contents.replace(/theme\(([^)]+)\)/g, (match, p1) => {
              const encoded = Buffer.from(p1).toString("base64").replace(/=/g, "_");
              return `var(--twtheme-${encoded})`;
            });
            return { contents };
          }
        }

        return null; // Use default resolution
      },
    ],
  };

  return (
    src("src/index.scss")
      .pipe(
        replace(/theme\(([^)]+)\)/g, (match, p1) => {
          const encoded = Buffer.from(p1).toString("base64").replace(/=/g, "_");
          return `var(--twtheme-${encoded})`;
        })
      )
      .pipe(sass(sassOptions).on("error", sass.logError))
      .pipe(
        replace(/var\(--twtheme-([A-Za-z0-9_]+)\)/g, (match, encoded) => {
          const decoded = Buffer.from(encoded.replace(/_/g, "="), "base64").toString();
          return `theme(${decoded})`;
        })
      )
      .pipe(
        replace(/\/\*\s*Tailwind:\s*tailwindcss\/([^\s]+)\s*\*\//g, (match, p1) => {
          return `@import "tailwindcss/${p1}";`;
        })
      )
      .pipe(postcss(plugins))
      // Remove any leftover SCSS @import statements
      .pipe(replace(/@import\s+url\(["'][^"']*\.scss["']\);?/g, ""))
      .pipe(dest(output))
  );
}

function minify() {
  return (
    src(`${output}/index.css`)
      // Remove any leftover SCSS @import statements before minification
      .pipe(replace(/@import\s+url\(["'][^"']*\.scss["']\);?/g, ""))
      .pipe(
        cleanCSS({
          level: 2,
          rebaseTo: output,
          returnPromise: false,
        })
      )
      .pipe(rename(`index.min.css`))
      .pipe(dest(output))
  );
}

function stylesLive() {
  styles().pipe(livereload({ start: true }));
}

function livereloadStyles() {
  livereload.listen();
  watch("src/**/*.scss", series(stylesLive));
}

exports.styles = styles;
exports.default = series(styles);
exports.watch = livereloadStyles;
if (process.env.NODE_ENV === "production") {
  exports.build = series(cleanStyles, styles, minify);
} else {
  exports.build = series(styles, livereloadStyles);
}

// gulp.task("watch:styles", function () {
//   livereload.listen();
//   gulp.watch("**/*.scss", ["styles"]);
// });
