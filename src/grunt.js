module.exports = function(grunt) {
	grunt.initConfig({
		concat: {
			dist: {
				src: [
				    './license.js',
				    './header.js.txt',
						'./main.js',
						'./ccv.js',
						'./cascade.js',
						'./whitebalance.js',
						'./smoother.js',
						'./camshift.js',
						'./facetrackr.js',
						'./ui.js',
						'./headposition.js',
						'./controllers.js',
						'./footer.js.txt'],
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