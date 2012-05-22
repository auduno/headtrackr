/**
 * Smoother for smoothing tracked positions of face
 *
 * Double Exponential Smoothing-based Prediction
 *	 see: http://www.cs.brown.edu/people/jjl/pubs/kfvsexp_final_laviola.pdf
 *	 "Double Exponential Smoothing: An alternative to Kalman Filter-based Predictive Tracking"
 *
 * @author auduno / github.com/auduno
 * @param {number} a Smoothing parameter, between 0 and 1. 0 is max smoothing, 1 no smoothing.
 * @param {number} interval The ms interval between tracking events
 * @constructor
 */
headtrackr.Smoother = function(alpha, interval) {
	
	// alpha = 0.35 smoothes ok while not introducing too much lag
	
	var sp, sp2, sl, newPositions, positions;
	var updateTime = new Date();
	
	this.initialized = false;
	
	// whether to use linear interpolation for times in intervals
	this.interpolate = false;
	
	this.init = function(initPos) {
		this.initialized = true;
		sp = [initPos.x, initPos.y, initPos.z, initPos.width, initPos.height];
		sp2 = sp;
		sl = sp.length;
	}
	
	this.smooth = function(pos) {
		
		positions = [pos.x, pos.y, pos.z, pos.width, pos.height];
		
		if (this.initialized) {
			// update
			for (var i = 0;i < sl;i++) {
				sp[i] = alpha*positions[i]+(1-alpha)*sp[i];
				sp2[i] = alpha*sp[i]+(1-alpha)*sp2[i];
			}
			
			// set time
			updateTime = new Date();
			
			var msDiff = (new Date())-updateTime;
			var newPositions = predict(msDiff);
			
			pos.x = newPositions[0];
			pos.y = newPositions[1];
			pos.z = newPositions[2];
			pos.width = newPositions[3];
			pos.height = newPositions[4];
			
			return pos;
		} else {
			return false;
		}
	}
	
	function predict(time) {
		
		var retPos = [];
		
		if (this.interpolate) {
			var step = time/interval;
			var stepLo = step >> 0;
			var ratio = alpha/(1-alpha);
			
			var a = (step-stepLo)*ratio;
			var b = (2 + stepLo*ratio);
			var c = (1 + stepLo*ratio);
			
			for (var i = 0;i < sl;i++) {
				retPos[i] = a*(sp[i]-sp2[i]) + b*sp[i] - c*sp2[i];
			}
		} else {
			var step = time/interval >> 0;
			var ratio = (alpha*step)/(1-alpha);
			var a = 2 + ratio;
			var b = 1 + ratio;
			for (var i = 0;i < sl;i++) {
				retPos[i] = a*sp[i] - b*sp2[i];
			}
		}
		
		return retPos;
	}
}