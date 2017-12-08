/**
 * Wrapper for headtrackr library
 *
 * Usage:
 *	var htracker = new headtrackr.Tracker();
 *	htracker.init(videoInput, canvasInput);
 *	htracker.start();
 *
 * Optional parameters can be passed to Tracker like this:
 *	 new headtrackr.Tracker({ ui : false, altVideo : "somevideo.ogv" });
 *
 * Optional parameters:
 *	ui {boolean} : whether to create messageoverlay with messages like "found face" (default is true)
 *	altVideo {object} : urls to any alternative videos, if camera is not found or not supported
 *		the format is : {'ogv' : 'somevideo.ogv', 'mp4' : 'somevideo.mp4', 'webm' : 'somevideo.webm'}
 *	smoothing {boolean} : whether to use smoothing (default is true)
 *	debug {canvas} : pass along a canvas to paint output of facedetection, for debugging
 *	detectionInterval {number} : time we wait before doing a new facedetection (default is 20 ms)
 *	retryDetection {boolean} : whether to start facedetection again if we lose track of face (default is true)
 *	fov {number} : horizontal field of view of used camera in degrees (default is to estimate this)
 *	fadeVideo {boolean} : whether to fade out video when face is detected (default is false)
 *	cameraOffset {number} : distance from camera to center of screen, used to offset position of head (default is 11.5)
 *	calcAngles {boolean} : whether to calculate angles when doing facetracking (default is false)
 *	headPosition {boolean} : whether to calculate headposition (default is true)
 *
 * @author auduno / github.com/auduno
 */

var headtrackr = {};
headtrackr.rev = 2;

/**
 * @constructor
 */
headtrackr.Tracker = function(params) {

	if (!params) params = {};

	if (params.smoothing === undefined) params.smoothing = true;
	if (params.retryDetection === undefined) params.retryDetection = true;
	if (params.ui === undefined) params.ui = true;
	if (params.debug === undefined) {
		params.debug = false;
	} else {
		if (params.debug.tagName != 'CANVAS') {
			params.debug = false;
		} else {
			var debugContext = params.debug.getContext('2d');
		}
	}
	if (params.detectionInterval === undefined) params.detectionInterval = 20;
	if (params.fadeVideo === undefined) params.fadeVideo = false;
	if (params.cameraOffset === undefined) params.cameraOffset = 11.5;
	if (params.calcAngles === undefined) params.calcAngles = false;
	if (params.headPosition === undefined) params.headPosition = true;

	var ui, smoother, facetracker, headposition, canvasContext, videoElement, detector;
	var detectionTimer;
	var fov = 0;
	var initialized = true;
	var run = false;
	var faceFound = false;
	var firstRun = true;
	var videoFaded = false;
	var headDiagonal = [];

	this.status = "";
	this.stream = undefined;

	var statusEvent = document.createEvent("Event");
	statusEvent.initEvent("headtrackrStatus", true, true);

	var headtrackerStatus = function(message) {
		statusEvent.status = message;
		document.dispatchEvent(statusEvent);
		this.status = message;
	}.bind(this);

	var insertAltVideo = function(video) {
		if (params.altVideo !== undefined) {
			if (supports_video()) {
				if (params.altVideo.ogv && supports_ogg_theora_video()) {
					video.src = params.altVideo.ogv;
				} else if (params.altVideo.mp4 && supports_h264_baseline_video()) {
					video.src = params.altVideo.mp4;
				} else if (params.altVideo.webm && supports_webm_video()) {
					video.src = params.altVideo.webm;
				} else {
					return false;
				}
				video.play();
				return true;
			}
		} else {
			return false;
		}
	}

	this.init = function(video, canvas, setupVideo) {
		if (setupVideo === undefined || setupVideo == true) {
			navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
			window.URL = window.URL || window.webkitURL || window.msURL || window.mozURL;
			// check for camerasupport
			if (navigator.getUserMedia) {
				headtrackerStatus("getUserMedia");

				// chrome 19 shim
				var videoSelector = {video : true};
				if (window.navigator.appVersion.match(/Chrome\/(.*?) /)) {
					var chromeVersion = parseInt(window.navigator.appVersion.match(/Chrome\/(\d+)\./)[1], 10);
					if (chromeVersion < 20) {
						videoSelector = "video";
					}
				};

				// opera shim
				if (window.opera) {
					window.URL = window.URL || {};
					if (!window.URL.createObjectURL) window.URL.createObjectURL = function(obj) {return obj;};
				}

				// set up stream
				navigator.getUserMedia(videoSelector, (function( stream ) {
					headtrackerStatus("camera found");
					this.stream = stream;
					if (video.mozCaptureStream) {
					  video.mozSrcObject = stream;
					} else {
					  video.src = (window.URL && window.URL.createObjectURL(stream)) || stream;
					}
					video.play();
				}).bind(this), function() {
					headtrackerStatus("no camera");
					insertAltVideo(video);
				});
			} else {
				headtrackerStatus("no getUserMedia");
				if (!insertAltVideo(video)) {
					return false;
				}
			}

			// resize video when it is playing
			video.addEventListener('playing', function() {
				if(video.width > video.height) {
					video.width = 320;
				} else {
					video.height = 240;
				}
			}, false);
		}

		videoElement = video;
		canvasElement = canvas;
		canvasContext = canvas.getContext("2d");

		// create ui if needed
		if (params.ui) {
			ui = new headtrackr.Ui();
		}

		// create smoother if enabled
		smoother = new headtrackr.Smoother(0.35, params.detectionInterval+15);

		this.initialized = true;
	}

	var track = function() {
		// Copy video to canvas
		canvasContext.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

		// if facetracking hasn't started, initialize facetrackr
		if (facetracker === undefined) {
			facetracker = new headtrackr.facetrackr.Tracker({debug : params.debug, calcAngles : params.calcAngles});
			facetracker.init(canvasElement);
		}

		// track face
		facetracker.track()
		var faceObj = facetracker.getTrackingObject({debug : params.debug});

		if (faceObj.detection == "WB") headtrackerStatus("whitebalance");
		if (firstRun && faceObj.detection == "VJ") headtrackerStatus("detecting");

		// check if we have a detection first
		if (!(faceObj.confidence == 0)) {
			if (faceObj.detection == "VJ") {
				if (detectionTimer === undefined) {
					// start timing
					detectionTimer = (new Date).getTime();
				}
				if (((new Date).getTime() - detectionTimer) > 5000) {
					headtrackerStatus("hints");
				}

				var x = (faceObj.x + faceObj.width/2); //midpoint
				var y = (faceObj.y + faceObj.height/2); //midpoint

				if (params.debug) {
					// draw detected face on debuggercanvas
					debugContext.strokeStyle = "#0000CC";
					debugContext.strokeRect(faceObj.x, faceObj.y, faceObj.width, faceObj.height);
				}
			}
			if (faceObj.detection == "CS") {
				var x = faceObj.x; //midpoint
				var y = faceObj.y; //midpoint

				if (detectionTimer !== undefined) detectionTimer = undefined;

				if (params.debug) {
					// draw tracked face on debuggercanvas
					debugContext.translate(faceObj.x, faceObj.y)
					debugContext.rotate(faceObj.angle-(Math.PI/2));
					debugContext.strokeStyle = "#00CC00";
					debugContext.strokeRect((-(faceObj.width/2)) >> 0, (-(faceObj.height/2)) >> 0, faceObj.width, faceObj.height);
					debugContext.rotate((Math.PI/2)-faceObj.angle);
					debugContext.translate(-faceObj.x, -faceObj.y);
				}

				// fade out video if it's showing
				if (!videoFaded && params.fadeVideo) {
					fadeVideo();
					videoFaded = true;
				}

				this.status = 'tracking';

				//check if we've lost tracking of face
				if (faceObj.width == 0 || faceObj.height == 0) {
					if (params.retryDetection) {
						// retry facedetection
						headtrackerStatus("redetecting");

						facetracker = new headtrackr.facetrackr.Tracker({whitebalancing : false, debug: params.debug, calcAngles : params.calcAngles});
						facetracker.init(canvasElement);
						faceFound = false;
						headposition = undefined;

						// show video again if it's not already showing
						if (videoFaded) {
							videoElement.style.opacity = 1;
							videoFaded = false;
						}
					} else {
						headtrackerStatus("lost");
						this.stop();
					}
				} else {
					if (!faceFound) {
						headtrackerStatus("found");
						faceFound = true;
					}

					if (params.smoothing) {
						// smooth values
						if (!smoother.initialized) {
							smoother.init(faceObj);
						}
						faceObj = smoother.smooth(faceObj);
					}

					// get headposition
					if (headposition === undefined && params.headPosition) {
						// wait until headdiagonal is stable before initializing headposition
						var stable = false;

						// calculate headdiagonal
						var headdiag = Math.sqrt(faceObj.width*faceObj.width + faceObj.height*faceObj.height);

						if (headDiagonal.length < 6) {
							headDiagonal.push(headdiag);
						} else {
							headDiagonal.splice(0,1);
							headDiagonal.push(headdiag);
							if ((Math.max.apply(null, headDiagonal) - Math.min.apply(null, headDiagonal)) < 5) {
								stable = true;
							}
						}

						if (stable) {
							if (firstRun) {
								if (params.fov === undefined) {
									headposition = new headtrackr.headposition.Tracker(faceObj, canvasElement.width, canvasElement.height, {distance_from_camera_to_screen : params.cameraOffset});
								} else {
									headposition = new headtrackr.headposition.Tracker(faceObj, canvasElement.width, canvasElement.height, {fov : params.fov, distance_from_camera_to_screen : params.cameraOffset});
								}
								fov = headposition.getFOV();
								firstRun = false;
							} else {
								headposition = new headtrackr.headposition.Tracker(faceObj, canvasElement.width, canvasElement.height, {fov : fov, distance_from_camera_to_screen : params.cameraOffset});
							}
							headposition.track(faceObj);
						}
					} else if (params.headPosition) {
						headposition.track(faceObj);
					}
				}
			}
		}

		if (run) {
			detector = window.setTimeout(track, params.detectionInterval);
		}
	}.bind(this);

	var starter = function() {
		// does some safety checks before starting

		// sometimes canvasContext is not available yet, so try and catch if it's not there...
		try {
			canvasContext.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

			// in some cases, the video sends events before starting to draw
			// so check that we have something on video before starting to track
			var canvasContent = headtrackr.getWhitebalance(canvasElement);
			if (canvasContent > 0) {
				run = true;
				track();
			} else {
				window.setTimeout(starter, 100);
			}
		} catch (err) {
			window.setTimeout(starter, 100);
		}
	}

	this.start = function() {
		// check if initialized
		if (!this.initialized) return false;

		// check if video is playing, if not, return false
		if (!(videoElement.currentTime > 0 && !videoElement.paused && !videoElement.ended)) {

			run = true;
			//set event
			videoElement.addEventListener('playing', starter, false);

			return true;
		} else {
			starter();
		}

		return true;
	}

	this.stop = function() {
		window.clearTimeout(detector);
		run = false;
		headtrackerStatus("stopped");
		facetracker = undefined;
		faceFound = false;

		return true;
	}

	this.stopStream = function() {
		if (this.stream !== undefined) {
            // Support for pre-standardisation browsers
            if (this.stream.stop !== undefined) {
		         this.stream.stop();
            }
            // Standards-compliant (per-stream)
            else if (this.stream.getVideoTracks !== undefined) {
                this.stream.getVideoTracks().forEach( function(t){ t.stop(); })
            }
		}
	}

	this.getFOV = function() {
		return fov;
	}

	// fade out videoElement
	var fadeVideo = function() {
		if (videoElement.style.opacity == "") {
			videoElement.style.opacity = 0.98;
			window.setTimeout(fadeVideo, 50);
		} else if (videoElement.style.opacity > 0.30) {
			videoElement.style.opacity -= 0.02;
			window.setTimeout(fadeVideo, 50);
		} else {
			videoElement.style.opacity = 0.3;
		}
	}
};

// bind shim
// from https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind

if (!Function.prototype.bind) {
	Function.prototype.bind = function (oThis) {
		if (typeof this !== "function") {
			// closest thing possible to the ECMAScript 5 internal IsCallable function
			throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
		}

		var aArgs = Array.prototype.slice.call(arguments, 1),
				fToBind = this,
				fNOP = function () {},
				fBound = function () {
					return fToBind.apply(this instanceof fNOP
																 ? this
																 : oThis || window,
															 aArgs.concat(Array.prototype.slice.call(arguments)));
				};

		fNOP.prototype = this.prototype;
		fBound.prototype = new fNOP();

		return fBound;
	};
}

// video support utility functions

function supports_video() {
	return !!document.createElement('video').canPlayType;
}

function supports_h264_baseline_video() {
	if (!supports_video()) { return false; }
	var v = document.createElement("video");
	return v.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
}

function supports_ogg_theora_video() {
	if (!supports_video()) { return false; }
	var v = document.createElement("video");
	return v.canPlayType('video/ogg; codecs="theora, vorbis"');
}

function supports_webm_video() {
	if (!supports_video()) { return false; }
	var v = document.createElement("video");
	return v.canPlayType('video/webm; codecs="vp8, vorbis"');
}
