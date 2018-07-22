import gulp from 'gulp';
import uglify from 'gulp-uglify-es'; // uglify with es6 support :)
import del from 'del'; // a simple npm package (not gulp plugin) for deleting stuff
import gzip from 'gulp-gzip'; // for compression
import responsive from 'gulp-responsive';
import injectCss from 'gulp-inject-css';
import cleanCss from 'gulp-clean-css';
import newer from 'gulp-newer';
import rename from 'gulp-rename';

const paths = {
  styles: {
    src: ['src/css/**/*.css', '!src/css/critical.css'],
    dest: 'dist/css/'
  },
  scripts: {
    src: 'src/**/*.js', // root of src so sw.js is included
    dest: 'dist/'
  },
  images: {
    src: 'src/img/**/*.{jpg,png}',
    dest: 'dist/img/'
  }
};

const htmlminOptions = {
  collapseWhitespace: true,
  minifyCSS: true,
  removeComments: true
}

// Small tasks I can use arrow functions
export const clean = () => del([ 'dist/' ]);

export function scripts() {
  return gulp.src(paths.scripts.src, {sourcemaps: true})
    .pipe(uglify())
    .pipe(gzip())
    .pipe(gulp.dest(paths.scripts.dest));
}

export function jpgImages() {
  return gulp.src('src/img/**/*.jpg')
    .pipe(rename( {suffix: '-large'} )) // necessary for gulp-newer to work, so it can compare
    .pipe(newer('dist/img/'))           // against a single destination file. Basically adding one
    .pipe(rename( opt => {              // of the suffixes on the fly, then renaming back.
      opt.basename = opt.basename.replace('-large', '');
      return opt;
    } ))
    .pipe(responsive({
      // Resize all jpg images to three different sizes: 280, 400 and 800
      '**/*.jpg': [{
        width: 280,
        quality: 30,
        rename: { suffix: '-small'}
      }, {
        width: 400,
        quality: 40,
        rename: { suffix: '-medium'}
      }, {
        width: 800,
        quality: 50,
        rename: { suffix: '-large'}
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
    .pipe(gulp.dest("dist/img/"));
}

export function pngImages() {
  return gulp.src('src/img/**/*.png')
    .pipe(newer('dist/img/')) // only process newer images.
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

export function styles() {
  return gulp.src(paths.styles.src, {sourcemaps: true})
    .pipe(cleanCss())
    .pipe(gzip())
    .pipe(gulp.dest(paths.styles.dest));
}

export function critical() {
  gulp.src('src/index.html')
    .pipe(injectCss())
    .pipe(htmlmin(htmlminOptions))
    .pipe(gzip())
    .pipe(gulp.dest('dist/'));
}

export function html() {
  gulp.src(['src/**/*.html', '!src/index.html'])
    .pipe(htmlmin(htmlminOptions))
    .pipe(gzip())
    .pipe(gulp.dest('dist/'));
}

export function json() {
  gulp.src('src/**/*.json')
    .pipe(gzip())
    .pipe(gulp.dest('dist/'));
}
