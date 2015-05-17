var gulp   = require('gulp'),
	del    = require('del'),
	uglify = require('gulp-uglify'),
	concat = require('gulp-concat'),
	header = require('gulp-header'),
	rename = require('gulp-rename');

var config = {
	header: '/* dominar.js - Copyright 2015 Gary Green. Licensed under the Apache License, Version 2.0 */'
};

function outputDist(stream, output) {
	return stream
		.pipe(concat('dominar.js'))
		.pipe(uglify())
		.pipe(header('/* dominar.js - Copyright 2015 Gary Green. Licensed under the Apache License, Version 2.0 */'))
		.pipe(rename(output))
		.pipe(gulp.dest('dist'));
}

// Clean dist folder
gulp.task('clean', function() {
	return del(['dist/*']);
});

// Copy
gulp.task('dist', function() {
	return gulp.src('src/dominar.js')
		.pipe(concat('dominar.js'))
		.pipe(uglify())
		.pipe(header(config.header))
		.pipe(gulp.dest('dist'));
});

// Copy
gulp.task('dist-standalone', function() {
		return gulp.src(['node_modules/validatorjs/dist/validator.js', 'src/dominar.js'])
		.pipe(concat('dominar.js'))
		.pipe(uglify())
		.pipe(header(config.header))
		.pipe(rename('dominar-standalone.js'))
		.pipe(gulp.dest('dist'));
});

gulp.task('default', ['clean', 'dist', 'dist-standalone']);