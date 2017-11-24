const gulp = require('gulp');
const ts = require('gulp-typescript');
const jshint = require('gulp-jshint');

// pull in the project TypeScript config
const tsProject = ts.createProject('tsconfig.json');

// transpile typescript
gulp.task('scripts', () => {
    const tsResult = tsProject.src()
        .pipe(tsProject());
    return tsResult.js.pipe(gulp.dest('dist'));
});


// Lint Task
gulp.task('lint', () => {
    return gulp.src('js/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

// watch files changes
gulp.task('watch', ['scripts'], () => {
    gulp.watch('src/**/*.ts', ['scripts']);

    // JavaScript changes
    gulp.watch('**.js', ['lint', 'scripts']);
});

gulp.task('default', ['watch']);