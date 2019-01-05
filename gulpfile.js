(function() {
  'use strict';

  /* Require Gulp plugins */
  var autoprefixer = require('gulp-autoprefixer'),
    bulkSass = require('gulp-sass-bulk-import'),
    cleanCSS = require('gulp-clean-css'),
    concat = require('gulp-concat'),
    del = require('del'),
    gulp = require('gulp'),
    newer = require('gulp-newer'),
    notify = require('gulp-notify'),
    modernizr = require('gulp-modernizr'),
    modernizrSettings = {
      'options': ['setClasses'],
      'tests': [
        ['cssgrid', 'cssgridlegacy'], 'csspointerevents'
      ]
    },
    phpipe = require('gulp-phpipe'),
    prettify = require('gulp-html-prettify'),
    pxtorem = require('gulp-pxtorem'),
    rename = require('gulp-rename'),
    runSequence = require('run-sequence'),
    sass = require('gulp-sass'),
    svgmin = require('gulp-svgmin'),
    svgSprite = require('gulp-svg-sprites'),
    uglify = require('gulp-uglify-es').default,
    useref = require('gulp-useref');

  const directories = {
    src: 'app',
    dest: 'dist',
    node: 'node_modules'
  };

  const locations = {
    components: directories.src + '/views/modules/**'
  };

  const paths = {
    styles: {
      src: [
        directories.src + '/styles/'
      ],
      base: [
        directories.src + '/styles/vendor.scss',
        directories.src + '/styles/global.scss',
        directories.src + '/styles/modules.scss',
      ],
      vendor: [
        directories.node + '/foundation-sites/dist/css/foundation.css',
        directories.node + '/magnific-popup/dist/magnific-popup.css'
      ],
      dest: directories.dest + '/css'
    },
    scripts: {
      src: [
        directories.src + '/scripts/'
      ],
      components: [
        directories.src + '/scripts/modules/*.js'
      ],
      vendor: [
        directories.node + '/jquery/dist/jquery.js',
        directories.node + '/popper.js/dist/umd/popper.js',
        directories.node + '/bootstrap/dist/js/bootstrap.js',
        directories.node + '/collect.js/build/collect.js',
        directories.node + '/moment/moment.js',
        directories.node + '/geolocation-marker/geolocation-marker.js',
        directories.src + '/scripts/vendor/**/*.js'
      ],
      dest: directories.dest + '/js'
    },
    html: {
      components_src: [
        locations.components + '/*.html',
        locations.components + '/*.php'
      ],
      components_dest: directories.dest + '/components'
    },
    api: {
      src: [
        directories.src + '/api/*.php'
      ],
      dest: directories.dest + '/api'
    },
    assets: {
      data: {
        src: [
          directories.src + '/assets/data/*'
        ],
        dest: directories.dest + '/assets/data/'
      },
      fonts: {
        src: [
          directories.src + '/assets/fonts/**/*'
        ],
        dest: directories.dest + '/assets/fonts/'
      },
      images: {
        src: [
          directories.src + '/assets/images/**/*.png',
          directories.src + '/assets/images/**/*.jpg',
          directories.src + '/assets/images/**/*.gif'
        ],
        dest: directories.dest + '/assets/images/'
      },
      svg: {
        src: [
          directories.src + '/assets/svg/*.svg'
        ],
        sprite: directories.dest + '/views/elements/',
        dest: directories.dest + '/assets/svg/'
      },
      other: {
        src: [
          directories.src + '/assets/other/**/*'
        ],
        dest: directories.dest + '/assets/other/'
      }
    }
  };

  // Clean dist
  gulp.task('clean', function() {
    return del('./dist');
  });

  // Build templates and export
  gulp.task('createTemplates', function() {
    return gulp.src(['!app/compiler.php', 'app/*.php', 'app/*.html'])
      .pipe(newer('dist'))
      .pipe(phpipe())
      .pipe(prettify({
        indent_char: ' ',
        indent_size: 2
      }))
      .pipe(rename(function(path) {
        path.extname = ".html";
        return path;
      }))
      .pipe(gulp.dest('dist'));
  });

  gulp.task('handlebarsTemplates', function() {
    return gulp.src(['app/views/*.handlebars'])
      .pipe(newer('dist/views'))
      .pipe(gulp.dest('dist/views'));
  });

  gulp.task('handlebarsPartials', function() {
    return gulp.src(['app/views/modules/**/*.handlebars'])
      .pipe(newer('dist/views/modules'))
      .pipe(gulp.dest('dist/views/modules'));
  });

  gulp.task('handlebarsElements', function() {
    return gulp.src(['app/views/elements/*.handlebars'])
      .pipe(newer('dist/views/elements'))
      .pipe(gulp.dest('dist/views/elements'));
  });

  // Combine and Minify the JS and CSS sources.
  gulp.task('combineSources', function() {
    return gulp.src(['dist/*.php', 'dist/*.html'])
      .pipe(useref())
      .pipe(gulp.dest('dist'));
  });

  gulp.task('assets:all', function() {
    return gulp.start('assets:fonts', 'assets:data', 'assets:images', 'assets:svg', 'assets:svg-sprite', 'assets:other');
  });

  // Export the fonts to their appropriate locations
  gulp.task('assets:data', function() {
    return gulp.src(paths.assets.data.src)
      .pipe(newer(paths.assets.data.dest))
      .pipe(gulp.dest(paths.assets.data.dest));
  });

  // Export the fonts to their appropriate locations
  gulp.task('assets:fonts', function() {
    return gulp.src(paths.assets.fonts.src)
      .pipe(newer(paths.assets.fonts.dest))
      .pipe(gulp.dest(paths.assets.fonts.dest));
  });

  // Optimizes Images (also SVG, but not using that extension)
  gulp.task('assets:images', function() {
    return gulp.src(paths.assets.images.src)
      .pipe(newer(paths.assets.images.dest))
      .pipe(gulp.dest(paths.assets.images.dest));
  });

  // Minimize SVG images and export
  gulp.task('assets:svg', function() {
    return gulp.src(paths.assets.svg.src)
      .pipe(newer(paths.assets.svg.dest))
      .pipe(svgmin())
      .pipe(gulp.dest(paths.assets.svg.dest));
  });

  gulp.task('assets:svg-sprite', function() {
    return gulp.src('source/assets/icon-svg/*.svg')
      .pipe(svgSprite({
        mode: "symbols",
        preview: false,
        svg: {
          symbols: "svg-sprite.php"
        }
      }))
      .pipe(gulp.dest('template-parts'));
  });

  gulp.task('assets:other', function() {
    return gulp.src(paths.assets.other.src)
      .pipe(newer(paths.assets.other.dest))
      .pipe(gulp.dest(paths.assets.other.dest))
  });

  gulp.task('css', ['css:vendor', 'css:modules'], function() {
    return gulp.src(paths.styles.base)
      .pipe(concat('style.scss'))
      .pipe(pxtorem())
      .pipe(sass({}))
      .pipe(autoprefixer({
          browsers: ['last 2 versions'],
          cascade: false
      }))
      .pipe(gulp.dest(paths.styles.dest))
      .pipe(rename({
        suffix: '.min'
      }))
      .pipe(cleanCSS())
      .pipe(gulp.dest(paths.styles.dest))
      .pipe(notify({
        message: 'css task done'
      }))
  });

  gulp.task('css:modules', function() {
    return gulp.src('app/views/modules/**/scss/*.scss')
      .pipe(concat('modules.scss'))
      .pipe(gulp.dest(paths.styles.src + '/'))
      .pipe(bulkSass())
      .pipe(notify({
        message: 'css:modules task done'
      }));
  });

  gulp.task('css:vendor', function() {
    return gulp.src(paths.styles.vendor)
      .pipe(concat('vendor.scss'))
      .pipe(gulp.dest(paths.styles.src + '/'))
      .pipe(bulkSass())
      .pipe(notify({
        message: 'css:vendor task done'
      }));
  });

  gulp.task('js:all', function() {
    return gulp.start('js', 'js:vendor');
  });

  gulp.task('js', ['js:build'], function() {
    return gulp.src(['app/scripts/modules.js', 'app/scripts/base.js'])
      .pipe(concat('script.js'))
      .pipe(gulp.dest(paths.scripts.dest))
      .pipe(rename({
        suffix: '.min'
      }))
      .pipe(uglify())
      .pipe(gulp.dest(paths.scripts.dest))
      .pipe(notify({
        message: 'js task done'
      }))
  });

  gulp.task('js:build', function() {
    return gulp.src(paths.scripts.components)
      .pipe(concat('modules.js'))
      .pipe(gulp.dest(paths.scripts.src + '/'))
      .pipe(notify({
        message: 'js:build task done'
      }));
  });

  gulp.task('js:vendor', function() {
    return gulp.src(paths.scripts.vendor)
      .pipe(concat('vendor.js'))
      .pipe(gulp.dest(paths.scripts.dest))
      .pipe(rename({
        suffix: '.min'
      }))
      .pipe(uglify())
      .pipe(gulp.dest(paths.scripts.dest))
      .pipe(notify({
        message: 'js:vendor task done'
      }));
  });

  gulp.task('api', function() {
    return gulp.src(paths.api.src)
      .pipe(gulp.dest(paths.api.dest))
      .pipe(notify({
        message: 'api task done'
      }));
  });

  gulp.task('watch', function() {
    gulp.watch(['app/views/modules/**/scss/*.scss', 'app/styles/modules/*.scss', 'app/styles/global/*.scss', 'app/styles/*.scss', paths.styles.src, directories.src + '/scss/*.scss'], ['styling']);
    gulp.watch([paths.scripts.src, directories.src + '/scripts/*.js'], ['js']);
    gulp.watch(['app/views/*.handlebars', 'app/views/modules/**/*.handlebars', 'app/views/elements/*.handlebars', 'app/views/modules/**/*.html', 'app/views/modules/**/*.php', 'app/views/*.html', 'app/views/*.php'], ['html']);
    gulp.watch([paths.assets.fonts.src], ['assets:fonts']);
    gulp.watch([paths.assets.data.src], ['assets:data']);
    gulp.watch([paths.assets.images.src], ['assets:images']);
    gulp.watch(['app/assets/svg/*.svg', paths.assets.svg.src], ['assets:svg', 'assets:svg-sprite']);
    gulp.watch([paths.assets.other.src], ['assets:other']);
  });

  // Actions run from the browser or from a Watcher
  gulp.task('default', ['clean'], function(cb) {
    runSequence('media', 'scripting', 'styling', cb);
  });
  gulp.task('all', function(cb) {
    runSequence('media', 'scripting', 'styling', cb);
  });
  gulp.task('media', function(cb) {
    runSequence('assets:all', cb);
  });
  gulp.task('styling', function(cb) {
    runSequence('css', 'html', cb);
  });
  gulp.task('scripting', function(cb) {
    runSequence('js:all', cb);
  });
  gulp.task('html', function(cb) {
    runSequence('api', 'createTemplates', 'handlebarsElements', 'handlebarsPartials', 'handlebarsTemplates', 'combineSources', cb);
  });
  gulp.task('files', function(cb) {
    runSequence('clean', 'sass', 'createTemplates', 'combineSources', 'scripts', cb);
  });
}());
