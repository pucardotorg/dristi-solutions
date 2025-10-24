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
    require("postcss-import"),
    require("tailwindcss"),
    postcssPresetEnv({ stage: 2, autoprefixer: { cascade: false }, features: { "custom-properties": true } }),
    require("autoprefixer"),
    require("cssnano"),
    header({ header: headerString }),
  ];

  return (
    src("src/index.scss")
      // Step 1: Replace theme() with placeholder before Sass processes it
      .pipe(replace(/theme\(([^)]+)\)/g, "__THEME__$1__END__"))
      // Step 2: Compile SCSS
      .pipe(sass({ quietDeps: true }).on("error", sass.logError))
      // Step 3: Restore theme() calls for PostCSS/Tailwind to process
      .pipe(replace(/__THEME__([^_]+)__END__/g, "theme($1)"))
      // Step 4: Run PostCSS with Tailwind
      .pipe(postcss(plugins))
      .pipe(dest(output))
  );
}

function minify() {
  return src(`${output}/index.css`).pipe(cleanCSS()).pipe(rename(`index.min.css`)).pipe(dest(output));
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
