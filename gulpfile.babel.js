import gulp from 'gulp';
import uglify from 'gulp-uglify-es'; // uglify with es6 support :)
import del from 'del'; // a simple npm package (not gulp plugin) for deleting stuff
import gzip from 'gulp-gzip'; // for compression
import responsive from 'gulp-responsive';
import injectCss from 'gulp-inject-css';
import cleanCss from 'gulp-clean-css';
import newer from 'gulp-newer';
import rename from 'gulp-rename';
import htmlmin from 'gulp-htmlmin';
import sourcemaps from 'gulp-sourcemaps';

const paths = {
  styles: {
    src: ['src/css/**/*.css', '!src/css/critical.css'], // Ignore critical.css which is injected in html files
    dest: 'dist/css/'
  },
  scripts: {
    src: ['src/**/*.js', '!src/js/vendor/**/*.js'], // root of src so sw.js is included, ignore vendor scripts
    dest: 'dist/'
  },
  vendorScripts: {
    src: 'src/js/vendor/**/*.js',
    dest: 'dist/js/vendor/'
  },
  images: {
    jpg: {
      src: 'src/img/**/*.jpg',
      dest: 'dist/img/'
    },
    png: {
      src: 'src/**/*.png', // png images will only be copied. Copy from any location (so leaflet images are included too)
      dest: 'dist/'
    },
    icon: {
      src: 'src/img/icons/icon.png', // icon dimensions should be 512 x 512 or greater, and of png format.
      dest: 'dist/img/icons/'
    }
  },
  html: {
    src: ['src/**/*.html'],
    dest: 'dist/'
  }
};

const htmlminOptions = {
  collapseWhitespace: true,
  minifyCSS: true,
  minifyJS: true,
  removeComments: true
};

// Small tasks I can use arrow functions
export const clean = (done) => del([ 'dist/' ], done);

export function scripts() {
  return gulp.src(paths.scripts.src)
    .pipe(sourcemaps.init())
    .pipe(newer(paths.scripts.dest))
    .pipe(uglify())
    .pipe(sourcemaps.write('.'))
    .pipe(gzip())
    .pipe(gulp.dest(paths.scripts.dest));
}

// Vendor scripts on separate task, because we don't need sourcemaps for them.
export function vendorScripts() {
  return gulp.src(paths.vendorScripts.src)
    .pipe(newer(paths.vendorScripts.dest))
    .pipe(uglify()) // in case file isn't minified already
    .pipe(gzip())
    .pipe(gulp.dest(paths.vendorScripts.dest));
}

export function pngImages() {
  // just copy
  return gulp.src(paths.images.png.src)
    .pipe(gulp.dest(paths.images.png.dest));
}

export function jpgImages() {
  return gulp.src(paths.images.jpg.src)
    .pipe(rename( {suffix: '-large'} )) // necessary for gulp-newer to work, so it can compare
    .pipe(newer(paths.images.jpg.dest)) // against a single destination file. Basically adding one
    .pipe(rename( opt => {              // of the suffixes on the fly, then renaming back.
      opt.basename = opt.basename.replace('-large', '');
      return opt;
    } ))
    .pipe(responsive({
      // Resize all jpg images to three different sizes: 280, 400 and 800
      '**/*.jpg': [{
        width: 800,
        quality: 50,
        rename: { suffix: '-large'}
      }, {
        width: 400,
        quality: 40,
        rename: { suffix: '-medium'}
      }, {
        width: 280,
        quality: 30,
        rename: { suffix: '-small'}
      }, {
        width: 64,
        quality: 10,
        sharp: true,
        rename: { suffix: '-placeholder'}
      }]
    }, {
      // global settings for all jpg images
      progressive: true,
      // needed to avoid errors when images aren't "newer"
      // since gulp-responsive won't have anything to do.
      errorOnUnusedConfig: false,
      // Strip all metadata
      withMetadata: false
    }))
    .pipe(gulp.dest(paths.images.jpg.dest));
}

export function icons() {
  // Create different size icons for app. Original should be 512x512 or greater.
  return gulp.src(paths.images.icon.src)
    .pipe(responsive({
      '**/*.png': [{
        width: 72,
        height: 72,
        withoutEnlargement: false,
        rename: { suffix: '-72x72'}
      }, {
        width: 96,
        height: 96,
        withoutEnlargement: false,
        rename: { suffix: '-96x96'}
      },  {
        width: 128,
        height: 128,
        withoutEnlargement: false,
        rename: { suffix: '-128x128'}
      },  {
        width: 144,
        height: 144,
        withoutEnlargement: false,
        rename: { suffix: '-144x144'}
      },  {
        width: 152,
        height: 152,
        withoutEnlargement: false,
        rename: { suffix: '-152x152'}
      },  {
        width: 192,
        height: 192,
        withoutEnlargement: false,
        rename: { suffix: '-192x192'}
      },  {
        width: 384,
        height: 384,
        withoutEnlargement: false,
        rename: { suffix: '-384x384'}
      },  {
        width: 512,
        height: 512,
        withoutEnlargement: false,
        rename: { suffix: '-512x512'}
      }]
    }, {
      // Global configuration for all images
      // Strip all metadata
      withMetadata: false,
      // Images are smaller in size if progressive is set to false
      progressive: false
    }))
    .pipe(gulp.dest(paths.images.icon.dest));
}

// Run Image tasks in parallel
const images = gulp.parallel(jpgImages, pngImages, icons);


export function styles() {
  return gulp.src(paths.styles.src, {sourcemaps: true})
    .pipe(newer(paths.styles.dest))
    .pipe(cleanCss())
    .pipe(gzip())
    .pipe(gulp.dest(paths.styles.dest));
}

export function html() {
  return gulp.src(paths.html.src)
    .pipe(newer(paths.html.dest))
    .pipe(injectCss()) // requires following comment in html file: <!-- inject-css path/to/critical.css -->
    .pipe(htmlmin(htmlminOptions))
    .pipe(gzip())
    .pipe(gulp.dest(paths.html.dest));
}

//TODO: delete once migration to API is done. Delete src/data/**  as well.
export function json() {
  return gulp.src('src/**/*.json')
    .pipe(gzip())
    .pipe(gulp.dest('dist/'));
}

export function watch() {
  console.log("Watching ./src folder.");

  const logEvent = event => {console.log(`File ${event.path} was ${event.type}, running specific task for it.`)};

  gulp.watch(paths.scripts.src, scripts).on('change', logEvent);
  gulp.watch(paths.vendorScripts.src, vendorScripts).on('change', logEvent);
  gulp.watch(paths.styles.src, styles).on('change', logEvent);
  gulp.watch(paths.html.src, html).on('change', logEvent);
  gulp.watch(paths.images.jpg.src, jpgImages).on('change', logEvent);
  gulp.watch(paths.images.png.src, pngImages).on('change', logEvent);
  gulp.watch(paths.images.icon.src, icons).on('change', logEvent);
}

// Run build in the following sequence: first clean, then everything else in parallel
exports.build = gulp.series(
  clean,
  gulp.parallel(scripts, vendorScripts, styles, html, json, images),
);

