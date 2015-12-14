headtrackr
==========

**headtrackr** is a javascript library for real-time *face tracking* and *head tracking*, tracking the position of a users head in relation to the computer screen, via a web camera and the [webRTC](http://www.webrtc.org/)/[getUserMedia](http://dev.w3.org/2011/webrtc/editor/getusermedia.html) standard.

For a demonstration see [this video](https://vimeo.com/44049736) or try out some of the examples with a laptop that has a camera and a browser that has camera webRTC/getUserMedia support. For an overview of browsers supporting the getUserMedia standard see [http://caniuse.com/stream](http://caniuse.com/stream).

[Reference](http://auduno.github.com/headtrackr/documentation/reference.html) - [Overview](http://auduno.tumblr.com/post/25125149521/head-tracking-with-webrtc)

### Examples ###

[![facetracking](http://auduno.github.com/headtrackr/examples/media/facetracking_thumbnail.png)](https://auduno.github.com/headtrackr/examples/facetracking.html)
[![sprites](http://auduno.github.com/headtrackr/examples/media/sprites_thumbnail.png)](https://auduno.github.com/headtrackr/examples/sprites_canvas.html)
<!--[![facekat](http://auduno.github.com/headtrackr/examples/media/facekat_thumbnail.png)](http://www.shinydemos.com/facekat/)-->
[![targets](http://auduno.github.com/headtrackr/examples/media/targets_thumbnail.png)](https://auduno.github.com/headtrackr/examples/targets.html)

### Usage ###

**NB!** Recent versions of Chrome only enable getUserMedia for https sites, so in Chrome this example will only work for https sites.

Download the minified library [headtrackr.js](https://github.com/auduno/headtrackr/raw/master/headtrackr.js) and include it in your webpage.

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

To get some more idea about usage look at the source code for the examples above, [this overview](http://auduno.tumblr.com/post/25125149521/head-tracking-with-webrtc), or [the reference](http://auduno.github.com/headtrackr/documentation/reference.html).

### Projects that have used headtrackr ###

<!--[![movembergames](http://auduno.github.com/headtrackr/examples/media/movembergames_thumbnail.png)](http://movembergames.com)-->
[![street-facing](http://auduno.github.com/headtrackr/examples/media/street-facing_thumbnail.jpg)](https://github.com/alexhancock/street-facing)
<!--[![Real-time responsive typography](http://auduno.github.com/headtrackr/examples/media/responsive_text.png)](http://webdesign.maratz.com/lab/responsivetypography/realtime/)-->
<!--[![snake](http://nicolas-beauvais.com/Snake/thumbs.png)](http://nicolas-beauvais.com/Snake/)-->

### Building from source ###

Make sure you have [grunt](http://gruntjs.com/) and [node](http://nodejs.org/download/) installed.
To install the development dependencies run ```npm install``` and to build it run ```grunt``` in the root directory.

### License ###

Headtrackr.js is distributed under the [MIT License](http://www.opensource.org/licenses/MIT), and includes some code bits (courtesy [Liu Liu](https://github.com/liuliu) and Benjamin Jung) that are under the [BSD-3 License](http://www.opensource.org/licenses/BSD-3-Clause) and the [MIT License](http://www.opensource.org/licenses/MIT) respectively.
