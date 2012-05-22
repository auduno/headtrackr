/**
 * Optional controllers for handling headtrackr events
 *
 * @author auduno / github.com/auduno
 */

headtrackr.controllers = {};

// NB! made for three.js revision 48. May not work with other revisions.

headtrackr.controllers.three = {};

/**
 * Controls a THREE.js camera to create pseudo-3D effect
 *
 * Needs the position of "screen" in 3d-model to be given up front, and to be static (i.e. absolute) during headtracking
 *
 * @param {THREE.PerspectiveCamera} camera
 * @param {number} scaling The scaling of the "screen" in the 3d model. 
 *   This is the vertical size of screen in 3d-model relative to vertical size of computerscreen in real life
 * @param {array} fixedPosition array with attributes x,y,z, position of "screen" in 3d-model
 * @param {THREE.Vector3} lookAt the object/position the camera should be pointed towards
 * @param {object} params optional object with optional parameters
 *
 * Optional parameters:
 *   screenHeight : vertical size of computer screen (default is 20 cm, i.e. typical laptop size)
 */
headtrackr.controllers.three.realisticAbsoluteCameraControl = function(camera, scaling, fixedPosition, lookAt, params) {
	
	if (params === undefined) params = {};
	if (params.screenHeight === undefined) {
		var screenHeight_cms = 20;
	} else {
		var screenHeight_cms = params.screenHeight;
	}
	if (params.damping === undefined) {
	  params.damping = 1;
	}
	
	camera.position.x = fixedPosition[0];
	camera.position.y = fixedPosition[1];
	camera.position.z = fixedPosition[2];
	camera.lookAt(lookAt);
	
	var wh = screenHeight_cms * scaling;
	var ww = wh * camera.aspect;
	
	document.addEventListener('headtrackingEvent', function(event) {
		
		// update camera
		var xOffset = event.x > 0 ? 0 : -event.x * 2 * params.damping * scaling;
		var yOffset = event.y < 0 ? 0 : event.y * 2 * params.damping * scaling;
		camera.setViewOffset(ww + Math.abs(event.x * 2 * params.damping * scaling), wh + Math.abs(event.y * params.damping * 2 * scaling), xOffset, yOffset, ww, wh);
		
		camera.position.x = fixedPosition[0] + (event.x * scaling * params.damping );
		camera.position.y = fixedPosition[1] + (event.y * scaling * params.damping );
		camera.position.z = fixedPosition[2] + (event.z * scaling);
		
		// update lookAt?
		
		// when changing height of window, we need to change field of view
		camera.fov = Math.atan((wh/2 + Math.abs(event.y * scaling * params.damping ))/(Math.abs(event.z*scaling)))*360/Math.PI;
		//debugger;
		
		camera.updateProjectionMatrix();
		
	}, false);
};

/**
 * Controls a THREE.js camera to create pseudo-3D effect
 *
 * Places "screen" in 3d-model in relation to original cameraposition at any given time
 * Currently not sure if this works properly
 *
 * @param {THREE.PerspectiveCamera} camera
 * @param {number} scaling The scaling of the "screen" in the 3d model. 
 *   This is the vertical size of screen in 3d-model relative to vertical size of computerscreen in real life
 * @param {array} relativeFixedDistance how long in front of (or behind) original cameraposition the fixed frame will be
 * @param {object} params optional object with optional parameters
 *
 * Optional parameters:
 *   screenHeight : vertical size of computer screen (default is 20 cm, i.e. typical laptop size)
 */
headtrackr.controllers.threerealisticRelativeCameraControl = function(camera, scaling, relativeFixedDistance, params) {
	
	// we assume that the parent of camera is the scene
	
	if (params === undefined) params = {};
	if (params.screenHeight === undefined) {
		var screenHeight_cms = 20;
	} else {
		var screenHeight_cms = params.screenHeight;
	}
	
	var scene = camera.parent;
	
	var init = true;
	
	// create an object to offset camera without affecting existing camera interaction
	var offset = new THREE.Object3D();
	offset.position.set(0,0,0);
	offset.add(camera);
	scene.add(offset);
	
	// TODO : we maybe need to offset functions like lookAt as well
	//	use prototype function replacement for this?
	
	var wh = screenHeight_cms * scaling;
	var ww = wh * camera.aspect;
	
	// set fov
	document.addEventListener('headtrackingEvent', function(event) {
		
		// update camera
		var xOffset = event.x > 0 ? 0 : -event.x * 2 * scaling;
		var yOffset = event.y > 0 ? 0 : -event.y * 2 * scaling;
		camera.setViewOffset(ww + Math.abs(event.x * 2 * scaling), wh + Math.abs(event.y * 2 * scaling), xOffset, yOffset, ww, wh);
		
		offset.rotation = camera.rotation;
		offset.position.x = 0;
		offset.position.y = 0;
		offset.position.z = 0;
		offset.translateX(event.x * scaling);
		offset.translateY(event.y * scaling);
		offset.translateZ((event.z * scaling)+relativeFixedDistance);
		
		//offset.position.x = (event.x * scaling);
		//offset.position.y = (event.y * scaling);
		//offset.position.z = (event.z * scaling)+relativeFixedDistance;
		
		// when changing height of window, we need to change field of view
		camera.fov = Math.atan((wh/2 + Math.abs(event.y * scaling))/(Math.abs(event.z*scaling)))*360/Math.PI;
		
		camera.updateProjectionMatrix();
		
	}, false);
}