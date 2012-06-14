/**
 * Library for detecting and tracking the position of a face in a canvas object
 *
 * usage:
 *	 // create a new tracker
 *	 var ft = new headtrackr.facetrackr.Tracker();
 *	 // initialize it with a canvas
 *	 ft.init(some_canvas);
 *	 // track in canvas
 *	 ft.track();
 *	 // get position of found object
 *	 var currentPos = ft.getTrackObj();
 *	 currentPos.x // x-coordinate of center of object on canvas 
 *	 currentPos.y // y-coordinate of center of object on canvas 
 *	 currentPos.width // width of object
 *	 currentPos.height // height of object
 *	 currentPos.angle // angle of object in radians
 *	 currentPos.confidence // returns confidence (doesn't work for CS yet)
 *	 currentPos.detection // current detectionmethod (VJ or CS)
 *	 currentPos.time // time spent
 * 
 * @author auduno / github.com/auduno
 */

headtrackr.facetrackr = {};

/**
 * optional parameters to params:
 *	 smoothing : whether to use smoothing on output (default is true)
 *	 smoothingInterval : should be the same as detectionInterval plus time of tracking (default is 35 ms)
 *	 sendEvents : whether to send events (default is true)
 *	 whitebalancing : whether to wait for camera whitebalancing before starting detection (default is true)
 *   calcAnglss : whether to calculate orientation of tracked object (default for facetrackr is false)
 *
 * @constructor
 */
headtrackr.facetrackr.Tracker = function(params) {
  
  if (!params) params = {};
  
  if (params.sendEvents === undefined) params.sendEvents = true;
  if (params.whitebalancing === undefined) params.whitebalancing = true;
  if (params.debug === undefined) {
    params.debug = false;
  } else {
    if (params.debug.tagName != 'CANVAS') params.debug = false;
  }
  if (params.whitebalancing) {
    var _currentDetection = "WB";
  } else {
    var _currentDetection = "VJ";
  }
  if (params.calcAngles == undefined) params.calcAngles = false;
  
  var _inputcanvas, _curtracked, _cstracker;
  
  var _confidenceThreshold = -10; // needed confidence before switching to Camshift
  var previousWhitebalances = []; // array of previous 10 whitebalance values
  var pwbLength = 15;
  
  this.init = function(inputcanvas) {
    _inputcanvas = inputcanvas
    // initialize cs tracker
    _cstracker = new headtrackr.camshift.Tracker({calcAngles : params.calcAngles});
  }
  
  this.track = function() {
    var result;
    // do detection
    if (_currentDetection == "WB") {
      result = checkWhitebalance();
    } else if (_currentDetection == "VJ") {
      result = doVJDetection();
    } else if (_currentDetection == "CS") {
      result = doCSDetection();
    }
    
    // check whether whitebalance is stable before starting detection
    if (result.detection == "WB") {
      if (previousWhitebalances.length >= pwbLength) previousWhitebalances.pop();
      previousWhitebalances.unshift(result.wb);
      if (previousWhitebalances.length == pwbLength) {
        //get max
        var max = Math.max.apply(null, previousWhitebalances);
        //get min
        var min = Math.min.apply(null, previousWhitebalances);
        
        // if difference between the last ten whitebalances is less than 2,
        //   we assume whitebalance is stable
        if ((max-min) < 2) {
          // switch to facedetection
          _currentDetection = "VJ";
        }
      }
    }
    // check if Viola-Jones has found a viable face
    if (result.detection == "VJ" && result.confidence > _confidenceThreshold) {
      // switch to Camshift
      _currentDetection = "CS";
      // when switching, we initalize camshift with current found face
      var cRectangle = new headtrackr.camshift.Rectangle(
        Math.floor(result.x), 
        Math.floor(result.y), 
        Math.floor(result.width), 
        Math.floor(result.height)
      );
      _cstracker.initTracker(_inputcanvas, cRectangle);
    }
    
    _curtracked = result;
    
    if (result.detection == "CS" && params.sendEvents) {
      // send events
      var evt = document.createEvent("Event");
      evt.initEvent("facetrackingEvent", true, true);
      evt.height = result.height;
      evt.width = result.width;
      evt.angle = result.angle;
      evt.x = result.x;
      evt.y = result.y;
      evt.confidence = result.confidence;
      evt.detection = result.detection;
      evt.time = result.time;
      document.dispatchEvent(evt);
    }
  }
  
  this.getTrackingObject = function() {
    return _curtracked.clone();
  }
  
  // Viola-Jones detection
  function doVJDetection() {
    // start timing
    var start = (new Date).getTime();
    
    // we seem to have to copy canvas to avoid interference with camshift
    // not entirely sure why
    // TODO: ways to avoid having to copy canvas every time
    var ccvCanvas = document.createElement('canvas');
    ccvCanvas.width = _inputcanvas.width;
    ccvCanvas.height = _inputcanvas.height;
    ccvCanvas.getContext("2d").drawImage(
      _inputcanvas, 0, 0, ccvCanvas.width, ccvCanvas.height
    );
    
    var comp = headtrackr.ccv.detect_objects(
        headtrackr.ccv.grayscale(ccvCanvas), headtrackr.cascade, 5, 1
    );
    
    // end timing
    var diff = (new Date).getTime() - start;
    
    // loop through found faces and pick the most likely one
    // TODO: check amount of neighbors and size as well?
    // TODO: choose the face that is most in the center of canvas?
    var candidate;
    if (comp.length > 0) {
      candidate = comp[0];
    }
    for (var i = 1; i < comp.length; i++) {
      if (comp[i].confidence > candidate.confidence) {
        candidate = comp[i];
      }
    }
    
    // copy information from ccv object to a new trackObj
    var result = new headtrackr.facetrackr.TrackObj();
    if (!(candidate === undefined)) {
      result.width = candidate.width;
      result.height = candidate.height;
      result.x = candidate.x;
      result.y = candidate.y;
      result.confidence = candidate.confidence;
    }
    
    // copy timing to object
    result.time = diff;
    result.detection = "VJ";
    
    return result;
  }
  
  // Camshift detection
  function doCSDetection() {
    
    // start timing
    var start = (new Date).getTime();
    // detect
    _cstracker.track(_inputcanvas);
    var csresult = _cstracker.getTrackObj();
    
    // if debugging, draw backprojection image on debuggingcanvas
    if (params.debug) {
      params.debug.getContext('2d').putImageData(_cstracker.getBackProjectionImg(),0,0);
    }
    
    // end timing
    var diff = (new Date).getTime() - start;
    
    // copy information from CS object to a new trackObj
    var result = new headtrackr.facetrackr.TrackObj();
    result.width = csresult.width;
    result.height = csresult.height;
    result.x = csresult.x;
    result.y = csresult.y;
    // TODO: should we adjust this angle to be "clockwise"?
    result.angle = csresult.angle;
    // TODO: camshift should pass along some sort of confidence?
    result.confidence = 1;
    
    // copy timing to object
    result.time = diff;
    result.detection = "CS";
    
    return result;
  }
  
  // Whitebalancing
  function checkWhitebalance() {
    var result = new headtrackr.facetrackr.TrackObj();
    // get whitebalance value
    result.wb = headtrackr.getWhitebalance(_inputcanvas);
    result.detection = "WB";

    return result
  }
};

/**
 * @constructor
 */
headtrackr.facetrackr.TrackObj = function() {
  this.height = 0;
  this.width = 0;
  this.angle = 0;
  this.x = 0;
  this.y = 0;
  this.confidence = -10000;
  this.detection = '';
  this.time = 0;
  
  this.clone = function() {
    var c = new headtrackr.facetrackr.TrackObj();
    c.height = this.height;
    c.width = this.width;
    c.angle = this.angle;
    c.x = this.x;
    c.y = this.y;
    c.confidence = this.confidence;
    c.detection = this.detection;
    c.time = this.time;
    return c;
  }
};
