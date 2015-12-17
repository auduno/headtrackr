module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.initConfig({
    concat: {
      dist: {
        src: [
            'src/license.js',
            'src/header.js.txt',
            'src/main.js',
            'src/webcam.js',
            'src/ccv.js',
            'src/cascade.js',
            'src/whitebalance.js',
            'src/smoother.js',
            'src/camshift.js',
            'src/facetrackr.js',
            'src/ui.js',
            'src/headposition.js',
            'src/controllers.js',
            'src/footer.js.txt'],
        dest: './headtrackr.js'
      }
    },
    uglify: {
      options: {
        report: 'gzip',
        preserveComments: 'false',
        mangle: {
          except: ['headtrackr']
        }
      },
      dist: {
        src: ['./headtrackr.js'],
        dest: './headtrackr.min.js'
      }
    }
  });

  // Default task.
  grunt.registerTask('default', [
    'concat',
    'uglify'
  ]);
};
