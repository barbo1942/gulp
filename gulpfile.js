var gulp=require('gulp');
var $ = require('gulp-load-plugins')();
// var pug=require('gulp-pug');
// var sass = require('gulp-sass');
// var plumber = require('gulp-plumber');
// var postcss = require('gulp-postcss');
var watch = require('gulp-watch');
var autoprefixer = require('autoprefixer');
var mainBowerFiles = require('main-bower-files');
var browserSync = require('browser-sync').create();
var minimist = require('minimist');
var gulpSequence = require('gulp-sequence');
var request = require('request-json');

var envOptions = {
  string: 'env',
  default: { env: 'dev'}
}
var options = minimist(process.argv.slice(2),envOptions)
console.log(options)

var client = request.createClient('https://randomuser.me/');

gulp.task('getapi', function () {
 client.get('api/', function (err, res, body) {
 return console.log(body.results[0].name);
 });
});


gulp.task('clean', function () {
  return gulp.src(['./.tmp','./public'], {read: false})
    .pipe($.clean());
});

gulp.task('copyHTML',function () {  
  return gulp.src('./source/**/*.html')
             .pipe(gulp.dest('./public/'))
});

gulp.task('pug', function buildHTML() {
  return gulp.src('./source/**/*.pug')
    .pipe($.plumber())
    .pipe($.data(function () {
      var khData = require('./source/data/data.json')
      var menu = require('./source/data/menu.json')
      var source = {
        'khData': khData,
        'menu': menu
      }
      // console.log('pug',source)
      return source
    }))
    .pipe($.pug({
      pretty: true 
      }))
    .pipe(gulp.dest('./public/'))
    .pipe(browserSync.stream())
});

gulp.task('sass', function () {
  var plugins = [
      autoprefixer({browsers: ['last 2 version','>5%']})
  ];  
  return gulp.src('./source/sass/**/*.sass')
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.sass().on('error', $.sass.logError))
    .pipe($.postcss(plugins))
    .pipe($.if(options.env==='pro',$.cleanCss()))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('./public/css'))
    .pipe(browserSync.stream())
});

gulp.task('babel', () =>
    gulp.src('./source/js/**/*.js')
        .pipe($.sourcemaps.init())
        .pipe($.babel({
            presets: ['es2015']
        }))
        .pipe($.concat('all.js'))
        .pipe($.if(options.env==='pro',$.uglify({
          compress: {
            drop_console: true
          }
        })))
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest('./public/js'))
        .pipe(browserSync.stream())
);

gulp.task('bower', function() {
    return gulp.src(mainBowerFiles(
    //   {
    //   "overrides": {
    //     "vue": {
    //       "main": "dist/vue.js"
    //     }
    //   }
    // }
  ))
        .pipe(gulp.dest('./.tmp/vendors'))
        cb(err)
});

gulp.task('vendorJs',['bower'],function () {
  return gulp.src('./.tmp/vendors/**/*.js')
    .pipe($.order([
      'jquery.js',
      'bootstrap.js'
    ]))
    .pipe($.concat('vendors.js'))
    .pipe($.if(options.env==='pro',$.uglify()))
    .pipe(gulp.dest('./public/js'))
  });

gulp.task('browser-sync', function() {
    browserSync.init({
        server: {
            baseDir: "./public"
        }
    });
});

gulp.task('image-min', function () { 
    gulp.src('./source/images/*')
        .pipe($.if(options.env==='pro',$.imagemin()))
        .pipe(gulp.dest('./public/images'))
});


gulp.task('watch', function () {
  gulp.watch('./source/sass/**/*.sass', ['sass']);
  gulp.watch('./source/**/*.pug', ['pug']);
  gulp.watch('./source/js/**/*.js', ['babel']);
});

gulp.task('deploy', function() {
  return gulp.src('./public/**/*')
    .pipe($.ghPages());
});

gulp.task('build', gulpSequence(['clean','pug','sass','babel','vendorJs','image-min']))

gulp.task('default',['pug','sass','babel','vendorJs','browser-sync','image-min','watch']);