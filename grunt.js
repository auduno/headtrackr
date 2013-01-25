module.exports = function(grunt) {
	// Your grunt code goes in here.
	grunt.initConfig({
		concat: {
			dist: {
				src: [  'src/main.js',
						'src/ccv.js',
						'src/cascade.js',
						'src/whitebalance.js',
						'src/smoother.js',
						'src/camshift.js',
						'src/facetrackr.js',
						'src/ui.js',
						'src/headposition.js',
						'src/controllers.js'],
				dest: './headtrackr.js'
			}
		}, 
		min: {
			dist: {
				src: ['./headtrackr.js'],
				dest: './headtrackr.min.js'
			}
		}
	});

	// Default task.
	grunt.registerTask('default', 'concat min');
};