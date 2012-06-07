headtrackr
==========

**headtrackr** is a javascript library for real-time *face tracking* and *head tracking*, tracking the position of a users head in relation to the computer screen, via a web camera and the [webRTC](http://www.webrtc.org/)/[getUserMedia](http://dev.w3.org/2011/webrtc/editor/getusermedia.html) standard.

For a demonstration see [this video]() or try out some of the examples with a laptop that has a camera and a browser that has camera webRTC/getUserMedia support (for instance [Opera 12](http://www.opera.com/browser/next/)). For an overview of browsers supporting the getUserMedia standard see [http://caniuse.com/stream](http://caniuse.com/stream).

### Examples ###

Canvas:

[![sprites](https://dl.dropbox.com/u/10557805/media/sprites_thumbnail.png)](https://dl.dropbox.com/u/10557805/sprites_canvas.html)
[![cube](https://dl.dropbox.com/u/10557805/media/cube_thumbnail.png)](https://dl.dropbox.com/u/10557805/cube.html)

WebGL:

[![targets](https://dl.dropbox.com/u/10557805/media/targets_thumbnail.png)](https://dl.dropbox.com/u/10557805/targets.html)

### Usage ###

Download the minified library [headtrackr.js](https://github.com/auduno/headtrackr/build/headtrackr.js) and include it in your webpage.

```html
<script src="js/headtrackr.js"></script>
```

The following code initiates the headtrackr with a video element which will be used for the mediastream, and a canvas element we will copy the videoframes to.

```html
<canvas id="inputCanvas" width="320" height="240" style="display:none"></canvas>
<video id="inputVideo" autoplay loop></video>
<script type="text/javascript">
  var videoInput = document.getElementById('inputVideo');
  var canvasInput = document.getElementById('inputCanvas');
  
  var htracker = new headtrackr.Tracker();
  htracker.init(videoInput, canvasInput);
  htracker.start();
</script>
```

When the headtracker is started, this will now regularly generate the events *headtrackingEvent* and *facetrackingEvent* on the document. The event *headtrackingEvent* has the attributes *x*, *y*, *z*, which tells us the estimated position of the users head in relation to the center of the screen, in centimeters. The event *facetrackingEvent* has the attributes *x*, *y*, *width*, *height* and *angle*, which tell us the estimated position and size of the face on the video.

You can now either create an eventlistener to handle these events somehow, or, if you're using [three.js](https://github.com/mrdoob/three.js/), try to use one of the pre-packaged controllers in this library to create pseudo-3D, aka [head-coupled perspective](http://en.wikipedia.org/wiki/Head-coupled_perspective) effects.

To get some more idea about usage look at the source code for the examples above or have a look at [an overview here](http://.).

### License ###

Headtrackr.js is distributed under the [MIT License](http://www.opensource.org/licenses/MIT), and includes some code bits (courtesy [Liu Liu](https://github.com/liuliu) and Benjamin Jung) that are under the [BSD-3 License](http://www.opensource.org/licenses/BSD-3-Clause) and the [MIT License](http://www.opensource.org/licenses/MIT) respectively.