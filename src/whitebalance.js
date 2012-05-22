/**
 * @author auduno / github.com/auduno
 */

headtrackr.getWhitebalance = function(canvas) {
	
	// returns average gray value in canvas
	
	var avggray,avgr,avgb,avgg;
	
	var canvasContext = canvas.getContext('2d');
	var image = canvasContext.getImageData(0, 0, canvas.width, canvas.height);
	var id = image.data;
	var imagesize = image.width * image.height;
	var r = g = b = 0;
	
	for (var i = 0;i < imagesize;i++) {
		r += id[4*i];
		g += id[(4*i)+1];
		b += id[(4*i)+2];
	}
	
	avgr = r/imagesize;
	avgg = g/imagesize;
	avgb = b/imagesize;
	avggray = (avgr+avgg+avgb)/3;
	
	return avggray;
	
}