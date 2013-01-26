/**
 * @author auduno / github.com/auduno
 * @constructor
 */
 
headtrackr.Ui = function() {

	var timeout;

	// create element and attach to body
	var d = document.createElement('div'),
        d2 = document.createElement('div'),
        p = document.createElement('p');
	d.setAttribute('id', 'headtrackerMessageDiv');
	
	d.style.left = "20%";
	d.style.right = "20%";
	d.style.top = "30%";
	d.style.fontSize = "90px";
	d.style.color = "#777";
	d.style.position = "absolute";
	d.style.fontFamily = "Helvetica, Arial, sans-serif";
	d.style.zIndex = '100002';
	
	d2.style.marginLeft = "auto";
	d2.style.marginRight = "auto";
	d2.style.width = "100%";
	d2.style.textAlign = "center";
	d2.style.color = "#fff";
	d2.style.backgroundColor = "#444";
	d2.style.opacity = "0.5";
	
	p.setAttribute('id', 'headtrackerMessage');
	d2.appendChild(p);
	d.appendChild(d2);
	document.body.appendChild(d);
  
  var supportMessages = {
    "no getUserMedia" : "getUserMedia is not supported in your browser :(",
    "no camera" : "no camera found :("
  };
  
  var statusMessages = {
    "whitebalance" : "Waiting for camera whitebalancing",
    "detecting" : "Please wait while camera is detecting your face...",
    "hints" : "We seem to have some problems detecting your face. Please make sure that your face is well and evenly lighted, and that your camera is working.",
    "redetecting" : "Lost track of face, trying to detect again..",
    "lost" : "Lost track of face :(",
    "found" : "Face found! Move your head!"
  };
  
  var override = false;
  
	// function to call messages (and to fade them out after a time)
  document.addEventListener("headtrackrStatus", function(event) {
    if (event.status in statusMessages) {
      window.clearTimeout(timeout);
		  if (!override) {
		    var messagep = document.getElementById('headtrackerMessage');
		    messagep.innerHTML = statusMessages[event.status];
		    timeout = window.setTimeout(function() {messagep.innerHTML = ''; }, 3000);
		  }
		} else if (event.status in supportMessages) {
		  override = true;
		  window.clearTimeout(timeout);
		  var messagep = document.getElementById('headtrackerMessage');
		  messagep.innerHTML = supportMessages[event.status];
		  window.setTimeout(function() {messagep.innerHTML = 'added fallback video for demo'; }, 2000);
		  window.setTimeout(function() {messagep.innerHTML = '';override = false;}, 4000);
		}
  }, true);
	
}