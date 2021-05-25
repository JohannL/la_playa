"use strict";

var µ = {};


µ.generate_canvas_texture = function(size_x, size_y, gen_func, data)
{
	var cv = document.createElement('canvas');
	cv.width = size_x;
	cv.height = size_y;
	var ctx = cv.getContext('2d');
	gen_func(ctx, size_x, size_y, data);
	return cv;
}



µ.canvas_webgl = function(la_playa, parent_el, old_canvas, scale, size_x, size_y, cameras, options)
{
	if (options.auto_resize)
	{
		size_x = Math.round((window.innerWidth - 0) / 1);
		size_y = Math.round((window.innerHeight - 4) / 1);
	}
	this.options = options;
	this.cameras = cameras;
	this.la_playa = la_playa;
	//var canvas = new µ.canvas(width, height);
	
	if (old_canvas === null)
	{
		this.canvas = document.createElement('canvas');
	}
	else
	{
		this.canvas = old_canvas;
	}
	var canvas = this.canvas;
	this.textures = [];
	this.texture_data = []; 	// the canvas or the data array
	this.texture_context = [];
	this.texture_width = [];
	this.texture_height = [];
	this.texture_count = 0;

	var gl = null;
	this.current_blending__source = 0;
	this.current_blending__destination = 0;
	this.current_blending__equation = 0;

	var	names	= ["webgl",	"experimental-webgl", "webkit-3d", "moz-webgl"];
	for	(var i = 0;	i <	names.length; ++i)
	{
		try
		{
			gl = this.canvas.getContext(names[i],
			//gl = WebGLDebugUtils.makeDebugContext(this.canvas.getContext(names[i],
				{
					antialias: (this.options.enable_antialias != undefined ? this.options.enable_antialias : true),
					alpha: (this.options.enable_alpha != undefined ? this.options.enable_alpha : false), // not that blending is always on, this is for compositing with the background
					depth: (this.options.enable_depth_test != undefined ? this.options.enable_depth_test : false), // !
					stencil: false,
					premultipliedAlpha: true,
					preserveDrawingBuffer: false
				}
			//));
			);
		}
		catch(e) {}
		if (gl)
		{
			break;
		}
	}

	if (!gl)
	{
		//alert("Could not initialise	WebGL, sorry :-(");
		this.canvas = null;
		this.gl = null;
		return false;
	}

	//gl.enable(gl.SAMPLE_COVERAGE);
	//gl.sampleCoverage(0.5, false);



 	this.supports_float_textures = gl.getExtension("OES_texture_float") /* && gl.getExtension("OES_float_linear") */;
	if (this.options.require_float_textures === true && !this.supports_float_textures)
	{
		//this.canvas = null;
		this.gl = null;
		return false;
	}

	this.gl = gl;

	////////////////////////////////////////////////
	// get all error codes
	gl.glEnums = [];
	for (var propertyName in gl)
	{
		if (typeof gl[propertyName] == 'number')
		{
			gl.glEnums[gl[propertyName]] = propertyName;
		}
	}

	gl.errorCheck = function(string)
	{
		var error = this.getError();
		if (error)
		{
			console.error(string + ": error "+ gl.glEnums[error] + "");
		}
	}


	this.blend_equations = [
		gl.FUNC_MIN,
		gl.FUNC_MAX,
		gl.FUNC_ADD,
		gl.FUNC_SUBTRACT,
		gl.FUNC_REVERSE_SUBTRACT,
	];
	this.blend_functions = [
		gl.ZERO,
		gl.ONE,
		gl.SRC_COLOR,
		gl.ONE_MINUS_SRC_COLOR,
		gl.DST_COLOR,
		gl.ONE_MINUS_DST_COLOR,
		gl.SRC_ALPHA,
		gl.ONE_MINUS_SRC_ALPHA,
		gl.DST_ALPHA,
		gl.ONE_MINUS_DST_ALPHA,
		gl.SRC_ALPHA_SATURATE,
		gl.CONSTANT_COLOR,
		gl.ONE_MINUS_CONSTANT_COLOR,
		gl.CONSTANT_ALPHA,
		gl.ONE_MINUS_CONSTANT_ALPHA,
	];

	if (options.canvas_id)
	{
		canvas.setAttribute('id', options.canvas_id);
	}

	canvas.setAttribute('width', size_x/scale);
	canvas.setAttribute('height', size_y/scale);
	canvas.style.cursor		= 'crosshair';
	//canvas.style.width		= (100 * 1 / scale) + '%';
	//canvas.style.height		= (100 * 1 / scale) +  '%';

	canvas.style.width		= '100%';
/*
	canvas.style.imageRendering = 'optimizeSpeed';
	canvas.style.imageRendering = '-o-crisp-edges';
	canvas.style.imageRendering = '-moz-crisp-edges';
	canvas.style.imageRendering = '-webkit-optimize-contrast';
	canvas.style.imageRendering = 'crisp-edges';
	canvas.style.imageRendering = 'pixelated';
	canvas.style['-ms-interpolation-mode'] = 'nearest-neighbor';
	*/

	if (old_canvas === null)
	{
		parent_el.insertBefore(canvas, parent_el.firstChild);
	}

	function addEventListener(element, eventType, eventHandler, useCapture)
	{
		if (element.addEventListener) element.addEventListener(eventType, eventHandler, useCapture);
		else if (element.attachEvent) element.attachEvent('on' + eventType, eventHandler);
		else element['on' + eventType] = eventHandler;
	}

	this.on_resize = function(e)
	{
		// heh
		size_x = canvas.parentElement.clientWidth;
		size_y = canvas.clientHeight;

		//size_x = Math.round((window.innerWidth - 0) / 1);
		//size_y = Math.round((window.innerHeight - 0) / 1);

		canvas.width = size_x/scale;
		canvas.height = size_y/scale;

		//console.log(canvas.width, canvas.height);
		if (gl)
		{
			gl.viewport(0, 0, Math.floor(size_x/scale), Math.floor(size_y/scale));
			//console.log('resized, viewport now', Math.floor(size_x/scale), Math.floor(size_y/scale))
		}
		cameras.resize(size_x/scale, size_y/scale);
		la_playa.update_fluid_canvases();
		la_playa.webgl_divider = la_playa.webgl_divider_fraction * (size_x / size_y);
	};

	if (this.options.autoresize || size_x == -1 || size_y == -1)
	{
		//window.onresize = on_resize;
		addEventListener(window, 'resize', this.on_resize, true);
		this.on_resize();
	}

	//µ.Cameras2D.prototype.handle_mousemove = function (mouse_x, mouse_y)

	if (this.options.enable_depth_test)
	{
		gl.enable(gl.DEPTH_TEST);
	}
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	gl.enable(gl.BLEND);
	gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
	gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, false);
	gl.errorCheck('WebGL Setup done');
};

/*
µ.update_canvas_texture = function(canvas, ctx, size_x, size_y, gen_func, data)
{
	gen_func(ctx, size_x, size_y, data);
	return canvas;
}
*/

µ.canvas_webgl.prototype.check_yoself = function()
{
	console.log('OES_texture_float', gl.getExtension("OES_texture_float"));
	console.log('OES_float_linear', gl.getExtension("OES_float_linear"));
}

µ.canvas_webgl.prototype.handle_texture_load = function(image, texture, texture_id, filter_nearest, callback, clamp_to_edge)
{
	//console.log('texture loaded', texture_id, filter_nearest, image);
	var gl = this.gl;
	this.texture_data[texture_id] = image;
	if (callback)
	{
		callback(image);
	}
	this.texture_context[texture_id] = image.getContext ? image.getContext('2d') : null;
	this.texture_width[texture_id] = image.width;
	this.texture_height[texture_id] = image.height;
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	if (filter_nearest)
	{
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
	}
	else
	{
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
	}
	if (clamp_to_edge === undefined)
	{
		clamp_to_edge = false;
	}
	if (clamp_to_edge)
	{
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	}
	gl.generateMipmap(gl.TEXTURE_2D);
	gl.bindTexture(gl.TEXTURE_2D, null);
}

µ.canvas_webgl.prototype.set_blending = function(source, destination, equation)
{
	if (source !== this.current_blending__source || destination !== this.current_blending__destination)
	{
		this.gl.blendFunc(source, destination);
		this.current_blending__source = source;
		this.current_blending__destination = destination;
	}
	if (equation !== this.current_blending__equation)
	{
		this.gl.blendEquation(equation);
		this.current_blending__equation = equation;
	}
};

// clear()
µ.canvas_webgl.prototype.clear = function()
{
	if (this.options.enable_depth_test)
	{
		this.gl.clear(this.gl.DEPTH_BUFFER_BIT);
	}
	this.gl.clear(this.gl.COLOR_BUFFER_BIT);
};

// bah
// draw_line();
µ.canvas_webgl.prototype.draw_line	= function(cam_id, pos1_x, pos1_y, pos2_x, pos2_y, width, color)
{
	var dist = µ.distance2D(pos1_x, pos1_y, pos2_x, pos2_y);
	var dist_x = pos2_x - pos1_x;
	var dist_y = pos2_y - pos1_y;
	var angle = µ.vector2D_to_angle(pos2_x - pos1_x, pos2_y - pos1_y);
	this.draw_rectangle(cam_id, pos1_x + dist_x/2, pos1_y + dist_y/2, width, dist, angle, color);
};

µ.canvas_webgl.prototype.load_texture = function(image_url, filter_nearest, callback, clamp_to_edge)
{
	var texture = this.gl.createTexture();
	var image = new Image();
	var self = this;
	var texture_count = this.texture_count;
	filter_nearest = filter_nearest || false;
	image.onload = function() {
		self.handle_texture_load(image, texture, texture_count, filter_nearest, callback, clamp_to_edge);
	};
	image.src = image_url;
	this.textures[this.texture_count] = texture;
	this.texture_count++;
	return this.texture_count - 1;
};

µ.canvas_webgl.prototype.texture_from_canvas = function(canvas, texture_id, filter_nearest, clamp_to_edge)
{
	if (texture_id === undefined || texture_id === -1)
	{
		var texture = this.gl.createTexture();
	}
	else
	{
		alert('this should not happen');
		var texture = this.textures[texture_id];
	}
	filter_nearest = filter_nearest || false;
	this.handle_texture_load(canvas, texture, this.texture_count, filter_nearest, null, clamp_to_edge);
	this.textures[this.texture_count] = texture;
	this.texture_count++;
	return this.texture_count - 1;
},

µ.canvas_webgl.prototype.update_texture_from_canvas = function(canvas, texture_id, filter_nearest, clamp_to_edge)
{
	filter_nearest = filter_nearest || false;
	this.handle_texture_load(canvas, this.textures[texture_id], texture_id, filter_nearest, null, clamp_to_edge);
	return texture_id;
}

µ.canvas_webgl.prototype.texture_from_array = function(data, size)
{
	var texture = this.gl.createTexture();
	this.upload_array_as_texture(texture, this.texture_count, data, size);
	this.textures[this.texture_count] = texture;
	this.texture_count++;
	return this.texture_count - 1;
};

µ.canvas_webgl.prototype.update_texture_from_array = function(data, size, texture_id)
{
	this.upload_array_as_texture(this.textures[texture_id], texture_id, data, size);
	return texture_id;
};

µ.canvas_webgl.prototype.update_texture_subimage_from_array = function(data, size, texture_id, start_x, start_y, size_x, size_y)
{
	this.upload_array_as_texture_subimage(this.textures[texture_id], data, start_x, start_y, size_x, size_y, 0);
	return texture_id;
};

µ.canvas_webgl.prototype.update_rgba_texture_subimage_from_array = function(data, size, texture_id, start_x, start_y, size_x, size_y)
{
	this.upload_array_as_texture_subimage(this.textures[texture_id], data, start_x, start_y, size_x, size_y, 1);
	return texture_id;
};

µ.canvas_webgl.prototype.empty_texture = function(size, filter_nearest, clamp_to_edge)
{
	var texture = this.gl.createTexture();
	this.upload_empty_texture(texture, this.texture_count, size, filter_nearest, clamp_to_edge);
	this.textures[this.texture_count] = texture;
	this.texture_count++;
	return this.texture_count - 1;
}


µ.canvas_webgl.prototype.empty_float_texture = function(size)
{
	var texture = this.gl.createTexture();
	this.upload_empty_float_texture(texture, this.texture_count, size);
	this.textures[this.texture_count] = texture;
	this.texture_count++;
	return this.texture_count - 1;
};

µ.canvas_webgl.prototype.upload_empty_float_texture = function(texture, texture_id, size)
{
	var gl = this.gl;
	this.texture_data[texture_id] = null;
	this.texture_context[texture_id] = null;
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.FLOAT, null);
}


µ.canvas_webgl.prototype.upload_empty_texture = function(texture, texture_id, size, filter_nearest, clamp_to_edge)
{
	var gl = this.gl;
	var data = new Float32Array(size * size * 4);
	this.texture_data[texture_id] = data;
	this.texture_context[texture_id] = null;
	gl.bindTexture(gl.TEXTURE_2D, texture);


	// FIXME
	if (filter_nearest)
	{
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	}
	else
	{
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
	}
	if (clamp_to_edge === undefined)
	{
		clamp_to_edge = true;
	}
	if (clamp_to_edge)
	{
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	}
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.FLOAT, data);
}

µ.canvas_webgl.prototype.upload_array_as_texture_subimage = function(texture, data, start_x, start_y, size_x, size_y, format)
{
	var gl = this.gl;
	gl.bindTexture(gl.TEXTURE_2D, texture);
	//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texSubImage2D(gl.TEXTURE_2D, 0, start_x, start_y, size_x, size_y, gl.RGBA, format == 0 ? gl.FLOAT : gl.UNSIGNED_BYTE, data);
	gl.bindTexture(gl.TEXTURE_2D, null);
}

µ.canvas_webgl.prototype.upload_array_as_texture = function(texture, texture_id, data, size)
{
	var gl = this.gl;
	this.texture_data[texture_id] = data;
	this.texture_context[texture_id] = null;
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.FLOAT, data);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.bindTexture(gl.TEXTURE_2D, null);
}








//////////////////////////////////////////







µ.Cameras2D = function(namespace, size_x, size_y)
{
	var orig_x = 'left';
	var orig_y = 'top';

	var aspect = size_x / size_y;
	var one_over_aspect = 1 / aspect;

	this.CAMERA_TYPE__STRETCH 	= 0;
	this.CAMERA_TYPE__PORTRAIT 	= 1;
	this.CAMERA_TYPE__LANDSCAPE = 2;

	this.ORIGIN__TOP			= 0;
	this.ORIGIN__LEFT			= 1;
	this.ORIGIN__RIGHT			= 2;
	this.ORIGIN__BOTTOM			= 3;
	this.ORIGIN__CENTER			= 4;

	this.c = [];
	this.c.push(new µ.Camera2D(this, this.CAMERA_TYPE__STRETCH, true, this.ORIGIN__LEFT, this.ORIGIN__BOTTOM));

	this.c[0].x_origin = orig_x;
	this.c[0].y_origin = orig_y;
	this.c[0].set_size(1.0, 1.0);
	this.c[0].set_pos(0.5, 0.5);
	this.c[0].set_zoom(1.0);
	this.c[0].aspect = aspect;
	this.c[0].one_over_aspect = one_over_aspect;
	this.c[0].auto_handle = true;


	this.c.push(new µ.Camera2D(this, this.CAMERA_TYPE__PORTRAIT, true, this.ORIGIN__LEFT, this.ORIGIN__BOTTOM));
	this.c[1].x_origin = orig_x;
	this.c[1].y_origin = orig_y;
	this.c[1].set_size(aspect, 1.0);
	this.c[1].set_pos(aspect / 2, 0.5);
	this.c[1].set_zoom(1.0);
	this.c[1].aspect = aspect;
	this.c[1].one_over_aspect = one_over_aspect;
	this.c[1].auto_handle = true;


	this.c.push(new µ.Camera2D(this, this.CAMERA_TYPE__LANDSCAPE, true, this.ORIGIN__LEFT, this.ORIGIN__BOTTOM));
	this.c[2].x_origin = orig_x;
	this.c[2].y_origin = orig_y;
	this.c[2].set_size(1.0, 1.0 / aspect);
	this.c[2].set_pos(0.5, 0.5 / aspect);
	this.c[2].set_zoom(1.0);
	this.c[2].aspect = aspect;
	this.c[2].one_over_aspect = one_over_aspect;
	this.c[2].auto_handle = true;

	// default cameras

	namespace.CAM_STRETCH = 0;
	namespace.CAM_PORTRAIT = 1;
	namespace.CAM_LANDSCAPE = 2;
}

µ.Cameras2D.prototype.add_camera = function(type, autohandle, orig_x, orig_y, size_x, size_y, pos_x, pos_y, zoom, restrict_to_bounding_box)
{
	this.c.push(new µ.Camera2D(this, type, autohandle, orig_x, orig_y));
	var cam_id = this.c.length - 1;
	this.c[cam_id].x_origin = orig_x;
	this.c[cam_id].y_origin = orig_y;
	this.c[cam_id].set_size(size_x, size_y);
	this.c[cam_id].set_pos(pos_x, pos_y);
	this.c[cam_id].set_zoom(zoom);
	this.c[cam_id].auto_handle = autohandle;
	this.c[cam_id].restrict_to_bounding_box = restrict_to_bounding_box != undefined ? restrict_to_bounding_box : true;
	return cam_id;
}

// called when the window size changes to resize
µ.Cameras2D.prototype.resize = function (size_x, size_y)
{
	var aspect = size_x / size_y;
	var one_over_aspect = 1 / aspect;
	for (var i = 0; i < this.c.length; i++)
	{
		var cam = this.c[i];
		cam.aspect = aspect;
		cam.one_over_aspect = one_over_aspect;

		if (cam.type == this.CAMERA_TYPE__PORTRAIT && cam.auto_handle)
		{
			cam.set_pos(aspect / 2, 0.5);
			cam.set_size(aspect, 1.0);
			cam.recalc_zoom();
			cam.set_zoom(1.0); // ??
		}
		else if (cam.type == this.CAMERA_TYPE__LANDSCAPE && cam.auto_handle)
		{
			cam.set_pos(0.5, 0.5 / aspect);
			cam.set_size(1.0, 1.0 / aspect);
			cam.recalc_zoom();
			cam.set_zoom(1.0); // ??
		}
		else
		{
			cam.recalc_zoom();
		}
	}
}

µ.Cameras2D.prototype.handle_mousemove = function (mouse_x, mouse_y)
{
	for (var i = 0; i < this.c.length; i++)
	{
		var cam = this.c[i];
		cam.mouse_screen_x = mouse_x;
		cam.mouse_screen_y = mouse_y;
		cam.calc_mouse(mouse_x, mouse_y);
	}
}

µ.Camera2D = function (cameras, type, auto_handle, orig_x, orig_y)
{
	this.cameras = cameras;
	this.auto_handle = auto_handle || false;
	this.x_origin = orig_x || cameras.ORIGIN__CENTER;
	this.y_origin = orig_y || cameras.ORIGIN__CENTER;
	this.type = type;
	this.pos = new Float32Array([0, 0]);
	this.zoom = new Float32Array([1, 1]);
};

µ.Camera2D.prototype.restrict_to_bounding_box = true;
µ.Camera2D.prototype.aspect = 1.0;
µ.Camera2D.prototype.one_over_aspect = 1.0;
µ.Camera2D.prototype.mouse_pos_x = 0;
µ.Camera2D.prototype.mouse_pos_y = 0;
µ.Camera2D.prototype.mouse_screen_x = 0;
µ.Camera2D.prototype.mouse_screen_y = 0;
µ.Camera2D.prototype.old_mouse_pos_x = 0;
µ.Camera2D.prototype.old_mouse_pos_y = 0;
µ.Camera2D.prototype.pos_x = 0;
µ.Camera2D.prototype.pos_y = 0;
µ.Camera2D.prototype.zoom_x = 1;
µ.Camera2D.prototype.zoom_y = 1;
µ.Camera2D.prototype.zoom_ = 1;
µ.Camera2D.prototype.size_x = 1;
µ.Camera2D.prototype.size_y = 1;

µ.Camera2D.prototype.top_edge_y = 0;
µ.Camera2D.prototype.left_edge_x = 0;
µ.Camera2D.prototype.right_edge_x = 0;
µ.Camera2D.prototype.bottom_edge_y = 0;

µ.Camera2D.prototype.set_pos = function (target_x, target_y)
{
	this.pos_x = target_x;
	this.pos_y = target_y;
	this.pos[0] = target_x + 0;
	this.pos[1] = target_y + 0;

	if (this.restrict_to_bounding_box)
	{
		if (this.zoom_x <= this.size_x)
		{
			if (this.pos_x < this.zoom_x / 2)
			{
				this.pos_x = this.zoom_x / 2;
			}
			if (this.pos_x > this.size_x - this.zoom_x / 2)
			{
				this.pos_x = this.size_x - this.zoom_x / 2;
			}
		}
		else
		{
			this.pos_x = this.size_x/2;
		}
		if (this.zoom_y <= this.size_y)
		{
			if (this.pos_y < this.zoom_y / 2)
			{
				this.pos_y = this.zoom_y / 2;
			}
			if (this.pos_y > this.size_y - this.zoom_y / 2)
			{
				this.pos_y = this.size_y - this.zoom_y / 2;
			}
		}
		else
		{
			this.pos_y = this.size_y/2;
		}
	}

	this.pos[0] = this.pos_x + 0;
	this.pos[1] = this.pos_y + 0;

	this.top_edge_y = this.pos_y + this.zoom_y;
	this.left_edge_x = this.pos_x - this.zoom_x;
	this.right_edge_x = this.pos_x + this.zoom_x;
	this.bottom_edge_y = this.pos_y - this.zoom_y;

};

µ.Camera2D.prototype.recalc_zoom = function ()
{
	if (this.type === this.cameras.CAMERA_TYPE__LANDSCAPE)
	{
		this.zoom_x = this.zoom_;
		this.zoom_y = this.zoom_ / this.aspect;
	}
	else if (this.type === this.cameras.CAMERA_TYPE__PORTRAIT)
	{
		this.zoom_x = this.zoom_ * this.aspect;
		this.zoom_y = this.zoom_;
	}
	else
	{
		this.zoom_x = this.zoom_;
		this.zoom_y = this.zoom_;
	}
	this.zoom[0] = this.zoom_x + 0;
	this.zoom[1] = this.zoom_y + 0;
};

µ.Camera2D.prototype.set_zoom = function (zoom)
{
	if (zoom < 0)
		this.zoom_ /= 1.1; // ???????? heh, make this actually do something useful or get rid of it you big silly
	else
		this.zoom_ = zoom;
	this.recalc_zoom();
};

µ.Camera2D.prototype.set_size = function (size_x, size_y)
{
	this.size_x = size_x;
	this.size_y = size_y;
};
/*
	expects mouse coordinates ranging from 0,0 (top left) to 1,1 (bottom right) and translates those to camera coordinates
*/
µ.Camera2D.prototype.calc_mouse = function (target_pos_x, target_pos_y)
{
	var
		this_x = this.pos_x,
		this_y = this.pos_y,
		this_zoom_x = this.zoom_x,
		this_zoom_y = this.zoom_y,
		this_size_x = this.size_x,
		this_size_y = this.size_y,
		x,
		y;
	if (this.x_origin == this.cameras.ORIGIN__RIGHT)
	{
		target_pos_x = 1 - target_pos_x;
	}
	else if (this.x_origin == this.cameras.ORIGIN__CENTER)
	{
		target_pos_x = 0.5 - target_pos_x;
	}
	if (this.y_origin == this.cameras.ORIGIN__BOTTOM)
	{
		target_pos_y = 1 - target_pos_y;
	}
	else if (this.x_origin == this.cameras.ORIGIN__CENTER)
	{
		target_pos_y = 0.5 - target_pos_y;
	}
	target_pos_y *= this_zoom_y * this_zoom_y;
	target_pos_x *= this_zoom_x * this_zoom_x;
	x = (this_x - this_zoom_x / 2) + (target_pos_x / this_zoom_x);
	y = (this_y - this_zoom_y / 2) + (target_pos_y / this_zoom_y);
	this.old_mouse_pos_x = this.mouse_pos_x;
	this.old_mouse_pos_y = this.mouse_pos_y;
	this.mouse_pos_x = x;
	this.mouse_pos_y = y;
};

µ.Camera2D.prototype.recalc_mouse = function ()
{
	this.calc_mouse(this.mouse_screen_x, this.mouse_screen_y);
}

/////////////////////////////////////////////////////////////////////////////////


"use strict";

var bxx_shader_includes = {};


bxx_shader_includes.angles = (function () {/*
#define PI 3.1415926535897932384626433832795

vec2 angle_to_vec2(float angle)
{
	return vec2(cos(angle * PI / 180.0), sin(angle * PI / 180.0));
}

float xy_to_angle(float x, float y)
{
	return mod((180.0 / PI) * atan(y, x), 360.0);
}
*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];

/*
µ.vector2D_to_angle = function (x, y)
{
	var angle = (180 / Math.PI) * Math.atan2(y, x);
	return µ.mod(angle, 360);
};


µ.angle_to_x = function (angle)
{
	return Math.cos(angle * Math.PI / 180);
};

µ.angle_to_y = function (angle)
{
	return Math.sin(angle * Math.PI / 180);
};
*/

bxx_shader_includes.noise3D = (function () {/*

//////////////////////////////////////////////////////////////////77
// https://github.com/ashima/webgl-noise/blob/master/src/noise3D.glsl
//
// Description : Array and textureless GLSL 2D/3D/4D simplex
//               noise functions.
//      Author : Ian McEwan, Ashima Arts.
//  Maintainer : ijm
//     Lastmod : 20110822 (ijm)
//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
//               Distributed under the MIT License. See LICENSE file.
//               https://github.com/ashima/webgl-noise
//

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
     return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v)
  {
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

// First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

// Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //   x0 = x0 - 0.0 + 0.0 * C.xxx;
  //   x1 = x0 - i1  + 1.0 * C.xxx;
  //   x2 = x0 - i2  + 2.0 * C.xxx;
  //   x3 = x0 - 1.0 + 3.0 * C.xxx;
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
  vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

// Permutations
  i = mod289(i);
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

// Gradients: 7x7 points over a square, mapped onto an octahedron.
// The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
  float n_ = 0.142857142857; // 1.0/7.0
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
  //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

//Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

// Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                dot(p2,x2), dot(p3,x3) ) );
  }

float snoise_clamp(vec3 v)
{
	return (1.0 + snoise(v)) * 0.5;
}

*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];



bxx_shader_includes.colors = ["",

""].join('\n');



bxx_shader_includes.colors = (function () {/*

vec4 RGBA_to_HSLA(float r, float g, float b, float a)
{
	float cmin = min(r, min(g, b));
	float cmax = max(r, max(g, b));
	float delta = cmax - cmin;
	float l = (cmin + cmax) / 2.0;
	float s = 0.0;
	if (l > 0.0 && l < 1.0)
	{
		s = delta / (l < 0.5 ? (2.0 * l) : (2.0 - 2.0 * l));
	}
	float h = 0.0;
	if (delta > 0.0)
	{
		if (cmax == r && cmax != g) h += (g - b) / delta;
		if (cmax == g && cmax != b) h += (2.0 + (b - r) / delta);
		if (cmax == b && cmax != r) h += (4.0 + (r - g) / delta);
		h /= 6.0;
	}
	return vec4(h*360.0, s, l, a);
}
vec4 HSLA_to_RGBA(float h, float s, float l, float a)
{
	h = mod(h, 360.0) / 360.0;
	float r=0.0,g=0.0,b=0.0;
	float temp1,temp2;
 	 if(l==0.0)
	 {
		r=g=b=0.0;
	 }
	 else
	 {
		if(a==0.0)
		{
		   r=g=b=l;
		}
		else
		{
		   temp2 = ((l<=0.5) ? l*(1.0+s) : l+s-(l*s));
		   temp1 = 2.0*l-temp2;
		   vec3 t3 = vec3(h+1.0/3.0,h,h-1.0/3.0);
		   vec3 clr = vec3(0,0,0);
		   for(int i=0;i<3;i++)
		   {
			  if(t3[i]<0.0)
				 t3[i]+=1.0;
			  if(t3[i]>1.0)
				 t3[i]-=1.0;
			  if(6.0*t3[i] < 1.0)
				 clr[i]=temp1+(temp2-temp1)*t3[i]*6.0;
			  else if(2.0*t3[i] < 1.0)
				 clr[i]=temp2;
			  else if(3.0*t3[i] < 2.0)
				 clr[i]=(temp1+(temp2-temp1)*((2.0/3.0)-t3[i])*6.0);
			  else
				 clr[i]=temp1;
		   }
		   r=clr[0];
		   g=clr[1];
		   b=clr[2];
		}
	 }
	 return vec4(r, g, b, a);
}


// from
// http://lolengine.net/blog/2013/07/27/rgb-to-hsv-in-glsl


vec3 rgb2hsv(vec3 c)
{
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
   vec4 p = c.g < c.b ? vec4(c.bg, K.wz) : vec4(c.gb, K.xy);
    vec4 q = c.r < p.x ? vec4(p.xyw, c.r) : vec4(c.r, p.yzx);
    
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// from http://www.chilliant.com/rgb2hsv.html


  vec3 HUEtoRGB(in float H)
  {
    float R = abs(H * 6.0 - 3.0) - 1.0;
    float G = 2.0 - abs(H * 6.0 - 2.0);
    float B = 2.0 - abs(H * 6.0 - 4.0);
    return clamp(vec3(R,G,B), 0.0, 1.0);
  }

 vec3 HSLtoRGB(in vec3 HSL)
  {
    vec3 RGB = HUEtoRGB(mod(HSL.x, 360.0) / 360.0);
    float C = (1.0 - abs(2.0 * HSL.z - 1.0)) * HSL.y;
    return (RGB - 0.5) * C + HSL.z;
  }

 vec4 HSLAtoRGBA(in float h, in float s, in float l, in float a)
  {
    vec3 RGB = HUEtoRGB(mod(h, 360.0) / 360.0);
    float C = (1.0 - abs(2.0 * l - 1.0)) * s;
    return vec4((RGB - 0.5) * C + l, a);
  }


*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];



bxx_shader_includes.color_scheme = (function () {/*


	uniform		float		uHueStart;
	uniform		float		uHueShift;
	uniform		float		uHueShiftExponent;
	uniform		float		uHue2Start;
	uniform		float		uHue2Shift;
	uniform		float		uHue2ShiftExponent;
	uniform		float		uLumPart1;
	uniform		float		uLumPart1Exponent;
	uniform		float		uLumPart2;
	uniform		float		uLumPart2Exponent;
	uniform		float		uSaturation;
	uniform		float		uSaturation2;


vec4 apply_color_scheme_parameters(		vec4 input_color,
										float hue_start,
										float hue_shift,
										float hue_shift_exponent,
										float lum_part1,
										float lum_part1_exponent,
										float lum_part2,
										float lum_part2_exponent,
										float saturation)
{
		float frac = clamp(input_color[0], 0.0, 1.0);
		float lum = (lum_part1 * pow(frac, lum_part1_exponent) + lum_part2 * pow(frac, lum_part2_exponent)) * input_color[2] * input_color[2];
		
		// makes little difference when running, but a LOT for compiling
		//return HSLA_to_RGBA(hue_start + pow(frac, hue_shift_exponent) * hue_shift, input_color[1] * saturation, lum, input_color[3]);
		return HSLAtoRGBA(hue_start + pow(frac, hue_shift_exponent) * hue_shift, input_color[1] * saturation, lum, input_color[3]);
}

vec4 apply_color_scheme(vec4 input_color)
{
	return apply_color_scheme_parameters(		input_color,
												uHueStart,
												uHueShift,
												uHueShiftExponent,
												uLumPart1,
												uLumPart1Exponent,
												uLumPart2,
												uLumPart2Exponent,
												uSaturation);
}

vec4 apply_color_scheme2(vec4 input_color)
{
	return apply_color_scheme_parameters(		input_color,
												uHue2Start,
												uHue2Shift,
												uHue2ShiftExponent,
												uLumPart1,
												uLumPart1Exponent,
												uLumPart2,
												uLumPart2Exponent,
												uSaturation2);
}


*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];


bxx_shader_includes.read_data_texture = (function () {/*

float get_data_pixel(sampler2D sampler, float texture_size, float frac)
{
	float total_pixels = texture_size * texture_size;

	float pixel = frac * total_pixels;

	float pixel_x = mod(pixel, texture_size);
	float pixel_y = floor(pixel / texture_size);
	vec4 texColor = texture2D(sampler, vec2(pixel_x / texture_size, pixel_y / texture_size));
	float subpixel = mod(pixel * 4.0, 4.0);
	if (subpixel < 1.0)
	{
		return texColor[0];
	}
	else if (subpixel < 2.0)
	{
		return texColor[1];
	}
	else if (subpixel < 3.0)
	{
		return texColor[2];
	}
	else if (subpixel < 4.0)
	{
		return texColor[3];
	}
}
*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];

