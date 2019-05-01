const gulp = require('gulp')
const imagemin = require('gulp-imagemin')

function imageSquash() {
    return gulp.src("./public/images/home/*")
        .pipe(imagemin([
            imagemin.gifsicle({
                interlaced: true
            }),
            imagemin.jpegtran({
                progressive: true
            }),
            imagemin.optipng({
                optimizationLevel: 5
            }),
            imagemin.svgo({
                plugins: [{
                        removeViewBox: true
                    },
                    {
                        cleanupIDs: false
                    }
                ]
            })
        ]))
        .pipe(gulp.dest("./dist/images/home"))
}

gulp.task("imageSquash", imageSquash);

gulp.task("watch", () => {
    gulp.watch("./img/*", imageSquash);
});

gulp.task("default", gulp.series("imageSquash", "watch"));