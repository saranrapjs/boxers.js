var boxers = {};

boxers.browse = function(selector,dimensions) {
	var self = this,
		imageOriginal = document.getElementById(selector);
	this.dimensions = dimensions;
	imageOriginal.onload = function() {
		var wrapped = boxers.wrap(this)
			wrapper = wrapped.wrapper;
			image = wrapped.image;
		image.className = 'box-image';
		wrapper.style.height = 'auto';
		image.style.width = '100%';
		image.style.height = 'auto';
		image.ondragstart = function() { return false; }
		self.boxes = create(self.dimensions);
		function create() {
			var boxes = [],
				width = image.width,
				height = image.height;
			for (var i=0;i<dimensions.length;i++) {
				var element = boxers.scale(dimensions[i],image,wrapper);
				boxes.push( new boxers.interactive( element, dimensions[i] ).link( image, wrapper ) );
			}
		}
	}
}
boxers.loupe = function(element) {

}
boxers.scale = function(dims,image,wrapper) {
		var dimension = dims,
			height = image.height,
			width = image.width,
			ratioOld = dimension.parentWidth/dimension.parentHeight,
			ratioNew = image.width/image.height,
			ratioX = width/dimension.parentWidth,
			ratioY = height/dimension.parentHeight,
			multiplier = Math.min(ratioX,ratioY),
			parentDimension = Math.min(width,height);
		dimension.width = boxers.relative(dimension.width * multiplier,width);
		dimension.height = boxers.relative(dimension.height * multiplier,height);
		dimension.left = boxers.relative(dimension.left * multiplier,width);
		dimension.top = boxers.relative(dimension.top * multiplier,height);
		var element = boxers.createBox(
			dimension.left,
			dimension.top,
			dimension.width,
			dimension.height,
			wrapper
		);
	return element;
}

boxers.interactive = function(element,data) {
	var self = this;
		self.element = element;
		self.data = data;
}
boxers.interactive.prototype.link = function( image,wrapper ) {
	var self = this;
	
	wrapper.style['-webkit-transition'] = 'all ease-out 2s';
	wrapper.style.transition = 'width,height linear 2s';
	this.element.onclick = function() {
		function calculate(key,image,data) {
			var ratio = (key =='top') 
					? (image.height/image.width) * image.naturalWidth
					: (image.width/image.height) * image.naturalHeight,
				windowAdd = (key=='top')
					? (window.innerHeight/2) - ( ((parseFloat(data.width)/100) * ratio) /2)
					: (window.innerWidth/2) - ( ((parseFloat(data.height)/100) * ratio) /2);
			console.log(((parseFloat(data.height)/100) * ratio));
			return ( -1 * (parseFloat(data[key])/100) * ratio );
			
		}
		wrapper.style.width = image.naturalWidth;
		wrapper.style.height = image.naturaHeight;
		wrapper.style.top = calculate('top',image,self.data) + 'px';
		wrapper.style.left = calculate('left',image,self.data) + 'px';
	}
}
boxers.relative = function(value,parent) {
	return (value/parent)*100 + "%";
}

boxers.create = function(element,options) {
	options = (options) ? options : {};
	var self = this,
		image = document.getElementById(element);
	this.callbacks = [];
	this.boxes = (options.boxes) ? options.boxes : [];
	this.data = [];
	image.onload = function() {
		self.load(image);
	}
	return self;
};
boxers.create.prototype.load = function(image) {
	var self = this;
	this.start = {x:null,y:null};
	this.end = {x:null,y:null};
	var wrapped = boxers.wrap(image);
	this.image = wrapped.image;
	this.wrapper = wrapped.wrapper;
	this.import(this.boxes);
	this.image.ondragstart = function() { return false; }
	this.wrapper.onmousedown = function(event) {
		self.startingPoint(event);
		self.startRecording();
	}
}
boxers.wrap = function(element) {
	var	browser = document.createElement('div'),
		wrapper = document.createElement('div'),
		image = wrapper.appendChild(element.cloneNode(true)); //replace reference to original
	browser.appendChild(wrapper);
	element.parentNode.replaceChild(browser, element);
	browser.className = 'box-browser';
	wrapper.className = 'boxWrapper';
	wrapper.style.position = 'relative';
	wrapper.style.width = wrapper.width = image.offsetWidth + 'px';
	wrapper.style.height = wrapper.height = image.offsetHeight + 'px';
	return {wrapper:wrapper,image:image};
}
boxers.create.prototype.startRecording = function() {
	var self = this;
	function finished(event) {
		self.endingPoint(event);
		self.seal();
		self.wrapper.onmousemove = self.wrapper.onmouseout = null;
	}
	this.wrapper.onmousemove = function(event) {
		self.endingPoint(event);
		return true;
	}
	function checkChild(child,parent) {
		while ( child.parentNode ) {
			if( (child = child.parentNode) == parent ) return true;
		}
		return false;
	}
	this.wrapper.onmouseup = finished;
	this.wrapper.onmouseout = function(event) {
		var parent = (event.toElement) ? event.toElement : event.relatedTarget;
	}
}
boxers.create.prototype.seal = function() {
	var offset = {
		left:Math.min(this.start.x,this.end.x),
		top:Math.min(this.start.y,this.end.y),
		width:this.width,
		height:this.height,
		parentWidth:this.image.width,
		parentHeight:this.image.height
	}
	this.box = null;
	this.data.push(offset);
	this.created(offset);
}
boxers.create.prototype.clickOffsetFromElement = function(e,element) {
	var elementOffset = this.offset(element),
		offsetY = e.pageY,
		offsetX = e.pageX;
	return  { x: offsetX - elementOffset.left, y: offsetY - elementOffset.top };
}

boxers.create.prototype.startingPoint = function( event ) {
	var offset = this.clickOffsetFromElement(event,this.wrapper);
	this.start.x = this.end.x = offset.x;
	this.start.y = this.end.y = offset.y;
	this.width = this.height = 0;
	this.box = boxers.createBox(this.start.x,this.start.y,1,1,this.wrapper);
	this.boxes.push(this.box);
}
boxers.create.prototype.import = function(boxes) {
	for (var i in boxes) {
		var box = boxes[i];
		this.data.push(box); //add to the list
		boxers.createBox(box.left,box.top,box.width,box.height,this.wrapper); //and visually create
	}
}
boxers.createBox = function(x,y,width,height,wrapper) {
	var box = document.createElement('div');
	box.setAttribute('class','box'); 
	box.style.left = x + 'px'; 
	box.style.top = y + 'px'; 
	box.style.width = width + 'px'; 
	box.style.height = height + 'px'; 
	wrapper.appendChild(box); //replace reference to original
	return box;
}
boxers.create.prototype.endingPoint = function( event ) {
	var offset = this.clickOffsetFromElement(event,this.wrapper);
	this.end.x = offset.x;
	this.end.y = offset.y;
	var deltaX = this.start.x - this.end.x,
		deltaY = this.start.y - this.end.y,
		width = Math.abs(deltaX),
		height = Math.abs(deltaY);
	this.width = width;
	this.height = height;
	if (deltaX > 0) this.box.style.left = this.end.x + 'px';
	if (deltaY > 0) this.box.style.top = this.end.y + 'px';
	this.box.style.width = width + 'px';
	this.box.style.height = height + 'px';
}

//cribbed from http://stackoverflow.com/questions/442404/dynamically-retrieve-html-element-x-y-position-with-javascript
boxers.create.prototype.offset = function(el) {
    var _x = 0;
    var _y = 0;
    return $(el).offset(); //NB - this is a total hack!
    while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
        _x += el.offsetLeft - el.scrollLeft;
        _y += el.offsetTop - el.scrollTop;
        el = el.offsetParent;
    }
    return { top: _y, left: _x };
}
boxers.create.prototype.created = function(box) {
	for(var i=0;i<this.callbacks.length;i++) {
		this.callbacks[i].call(this,box);
	}
}
boxers.create.prototype.onFinish = function(callback) {
	this.callbacks.push(callback);
};
boxers.create.prototype.clear = function() {
	for (var i=0;i<this.boxes.length;i++) {
		this.boxes[i].parentNode.removeChild(this.boxes[i]);
	}
	this.boxes = [];
}
