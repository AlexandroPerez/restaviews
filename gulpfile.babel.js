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

const paths = {
  styles: {
    src: ['src/css/**/*.css', '!src/css/critical.css'], // Ignore critical.css which is injected in html files
    dest: 'dist/css/'
  },
  scripts: {
    src: 'src/**/*.js', // root of src so sw.js is included
    dest: 'dist/'
  },
  images: {
    jpg: 'src/img/**/*.jpg',
    png: 'src/img/**/*.png',
    dest: 'dist/img/'
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
export const clean = () => del([ 'dist/' ]);

export function scripts() {
  return gulp.src(paths.scripts.src, {sourcemaps: true})
    .pipe(newer(paths.scripts.dest))
    .pipe(uglify())
    .pipe(gzip())
    .pipe(gulp.dest(paths.scripts.dest));
}

export function jpgImages() {
  return gulp.src(paths.images.jpg)
    .pipe(rename( {suffix: '-large'} )) // necessary for gulp-newer to work, so it can compare
    .pipe(newer(paths.images.dest))     // against a single destination file. Basically adding one
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
    .pipe(gulp.dest(paths.images.dest));
}

export function pngImages() {
//return gulp.src('src/img/**/*.png')
  return gulp.src(paths.images.png)
    .pipe(newer(paths.images.dest)) // only process newer images.
    .pipe(responsive({
      '**/*.png': [{
        // Keeping original sizes, but make sure sizes are smaller by setting
        // progressive to false
        progressive: false
      }]
    }, {
      // Global configuration for all images

      // needed to avoid errors when images aren't "newer"
      // since gulp-responsive won't have anything to do.
      errorOnUnusedConfig: false,
      // Strip all metadata
      withMetadata: false
    }))
    .pipe(gulp.dest(paths.images.dest));
}

gulp.task('images', ['jpgImages', 'pngImages']);

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
  console.log("Watching: html styles and scripts. If images are added, run: gulp images");
  gulp.watch(paths.scripts.src, scripts)
    .on('change', (event) => {console.log(`File ${event.path} was ${event.type}, running task`)});
  gulp.watch(paths.styles.src, styles)
    .on('change', (event) => {console.log(`File ${event.path} was ${event.type}, running task`)});
  gulp.watch(paths.html.src, html)
    .on('change', (event) => {console.log(`File ${event.path} was ${event.type}, running task`)});
}

// TODO: Find a way to execute clean task before build task.
gulp.task('build', ['scripts','styles','critical','html','json','images']);


// TODO: set build as the default task
//export default build;
