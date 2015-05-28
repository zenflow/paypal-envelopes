var gulp = require('gulp');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var sourcemaps = require('gulp-sourcemaps');
var nodemon = require('gulp-nodemon');
var nodemon_json = require('./nodemon');
var uglify = require('gulp-uglify');
var gif = require('gulp-if');
var yargs = require('yargs');
var minifyCss = require('gulp-minify-css');
var concat = require('gulp-concat');
var del = require('del');

console.log('setting up '+(yargs.argv.production?'production':'developer')+' build...');
var config = function(key, value){
    console.log('config', key, typeof value, value);
    eval(key + ' = ' + JSON.stringify(value) + '; ');
};
config('skip_sourcemaps', yargs.argv.production?true:yargs.argv.skip_sourcemaps);
config('do_minimize', yargs.argv.production?true:yargs.argv.do_minimize);
config('browserify_transforms', ['brfs', ['riotify', {}]]);
config('browserify_node_modules', ['lodash', 'riot', 'riotcontrol', 'riot-bootstrap']);

var cleaned = false;
gulp.task('clean', function(cb){
    if (cleaned){return cb(null);}
    cleaned = true;
    del('./client/build', cb);
});

gulp.task('scripts:node_modules', ['clean'], function () {
    var b = browserify({debug: !skip_sourcemaps});
    browserify_node_modules.forEach(function(module_name){
        b.require(module_name);
    });
    return b.bundle()
        .pipe(source('node_modules.js'))
        .pipe(buffer())
        .pipe(gif(!skip_sourcemaps, sourcemaps.init({loadMaps: true})))
        .pipe(gif(do_minimize, uglify()))
        .pipe(gif(!skip_sourcemaps, sourcemaps.write('./')))
        .pipe(gulp.dest('./client/build/scripts'))
});
gulp.task('scripts:index', ['clean'], function () {
    var b = browserify('./client/src/scripts/index.js', {debug: !skip_sourcemaps})
        .external(browserify_node_modules)
        .transform(browserify_transforms);
    return b.bundle()
        .pipe(source('index.js'))
        .pipe(buffer())
        .pipe(gif(!skip_sourcemaps, sourcemaps.init({loadMaps: true})))
        .pipe(gif(do_minimize, uglify()))
        .pipe(gif(!skip_sourcemaps, sourcemaps.write('./')))
        .pipe(gulp.dest('./client/build/scripts'));
});
gulp.task('scripts', ['scripts:node_modules', 'scripts:index']);

gulp.task('styles', ['clean'], function(){
    return gulp.src('./client/src/styles/**/**')
        .pipe(gif(!skip_sourcemaps, sourcemaps.init()))
        .pipe(concat('index.css'))
        .pipe(gif(do_minimize, minifyCss()))
        .pipe(gif(!skip_sourcemaps, sourcemaps.write('./')))
        .pipe(gulp.dest('./client/build/styles'))
});

gulp.task('assets', ['clean'], function(){
    return gulp.src('./client/src/assets/**')
        .pipe(gulp.dest('./client/build'));
});

gulp.task('build', ['scripts', 'styles', 'assets']);

gulp.task('watch', ['build'], function() {
    // scripts
    gulp.watch(['./shared/**/**', './client/src/scripts/**/**'], ['scripts:index']);
    // styles
    gulp.watch(['./client/src/styles/**/**'], ['styles']);
    // assets
    gulp.watch(['./client/src/assets/**/**'], ['assets']);
});

gulp.task('dev', ['watch'], function(cb){
    nodemon(nodemon_json);
});

gulp.task('default', ['dev']);
