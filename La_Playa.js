"use strict";

/*

	do:
		clean up a LOT
		"factory reset"
		make the spectogram handle resizing and zooming more robustly
*/

var La_Playa = function()
{
	this.debug1										= false;

	this.init_attempted								= false;
	this.init_failure								= false;
	this.init_success								= false;

	//localStorage.clear();

	this.volume										= localStorage.getItem('lp__volume') !== null ? parseFloat(localStorage.getItem('lp__volume')) : 1.0;
	this.stereo_separation							= localStorage.getItem('lp__stereo_separation') !== null ? parseFloat(localStorage.getItem('lp__stereo_separation')) : 1.0;

	this.playlist									= null;
	this.playlist_title								= '';
	this.playlist_index								= 0;
	this.playlist_level								= 0;
	this.parent_playlist							= null;
	this.parent_playlist_index						= 0;

	this.scale										= 1;

	this.is_fullscreen								= false;
	this.is_looping									= false;

	this.last_displayed_timestamp					= -0;

	this.use_status_bar								= true;

	this.clipped_L_positive							= 0;
	this.clipped_R_positive							= 0;
	this.clipped_L_negative							= 0;
	this.clipped_R_negative							= 0;

	this.string__color_black 						= 'rgb(0,0,0)';
	this.string__color_white 						= 'rgb(255,255,255)';
	this.string__color_blue 						= 'rgb(0,0,255)';
	this.string__color_red 							= 'rgb(255,0,0)';
	this.string__color_orange 						= 'rgb(255,128,0)';
	this.string__color_green						= 'rgb(0,255,0)';
	this.string__color_yellow						= 'rgb(255,255,0)';
	this.string__color_red_25						= 'rgba(255,0,0,0.25)';
	this.string__color_blue_25						= 'rgba(0,0,255,0.125)';

	this.string__color_black_25 					= "rgba(0,0,0,0.25)";
	this.string__color_black_75 					= "rgba(0,0,0,0.75)";
	this.string__round 								= "round";
	this.string__spacedash							= ' / ';

	this.paused 									= true;
	this.show_playlist 								= true;
	this.settings_shown								= false;
	this.about_shown								= false;

	this.webGL										= false;

	this.webgl_enabled 								= localStorage.getItem('lp__webgl_enabled') 				== 'true' ? true : false;
	this.webgl_spectrogram_enabled 					= localStorage.getItem('lp__webgl_spectrogram_enabled') 	== 'true' ? true : false;

	this.webgl_osc_pingpong_enabled					= false; // this doesn't work (anymore)

	this.webgl_stereoscope_enabled					= localStorage.getItem('lp__webgl_stereoscope_enabled') 	== 'true' ? true : false;;

	this.webgl_oscilloscope_enabled					= localStorage.getItem('lp__webgl_oscilloscope_enabled') 	== 'true' ? true : false;
	this.webgl_init_once							= false;
	this.webgl_init_stereoscope_once				= false;

	this.temp_imageData								= null;
	this.default_fft_size							= 2048;
	this.fft_size									= this.default_fft_size;
	this.default_texture_size						= 1024;
	this.texture_size								= this.default_texture_size;


	this.data_texture_size 							= 16;							// for FFT data (up to 1024 values)
	this.data_texture_size2 						= 8;							// for value distribution data (256 values)

	this.webgl_canvas_size_x						= 512;			// gets resized anyway
	this.webgl_canvas_size_y						= localStorage.getItem('lp__webgl_canvas_size_y') 		!== null ? parseFloat(localStorage.getItem('lp__webgl_canvas_size_y')) : 128;
	this.webgl_divider_fraction 					= localStorage.getItem('lp__webgl_divider_fraction')	!== null ? parseFloat(localStorage.getItem('lp__webgl_divider_fraction')) : 0.2;
	this.webgl_divider 								= this.webgl_divider_fraction * (this.webgl_canvas_size_x / this.webgl_canvas_size_y);

	//this.webgl_divider_fraction						= 0.5 / (this.webgl_canvas_size_x / this.webgl_canvas_size_y);

	this.canvas_vumeter_enabled 					= localStorage.getItem('lp__canvas_vumeter_enabled') 	== 'false' ? false : true;
	this.vumeter_size_x								= 512;
	this.vumeter_size_y								= 16;

	this.about_canvas_size_x						= 128;
	this.about_canvas_size_y						= 64;

	// good variable names as always
	this.min 										= 999999999999999999999;
	this.max 										= -999999999999999999999;

	//this.fft_sens									= -500;
	this.fft_sens									= -150;
	this.fft_smoothing								= 0.0;
	this.fft_scaling								= localStorage.getItem('lp__fft_scaling') !== null ? parseFloat(localStorage.getItem('lp__fft_scaling')) : 1.5

	this.seekbar_size_x								= 1000;
	this.seekbar_size_y								= 20;
	this.seekbar_width  							= 1000;
	this.seekbar_height 							= 16;
	this.framerates									= Array.apply(null, new Array(120)).map(Number.prototype.valueOf,0);
	this.framerates_index							= 0;
	this.updaterates								= Array.apply(null, new Array(120)).map(Number.prototype.valueOf,0);
	this.updaterates_index							= 0;

	this.last_mousewheel_webgl_up 					= 0;
	this.last_mousewheel_webgl_down 				= 0;

	this.updates_count								= 0;
	this.last_update								= window.performance.now();
	this.last_fps_update							= window.performance.now();
	this.last_favicon_update						= window.performance.now();

	this.color_scheme_fade_duration					= 10;
	this.color_scheme_fade							= -1;
	this.color_scheme_target_id						= -1;

	this.spectrogram_preset_fade_duration			= 1000;
	this.spectrogram_preset_fade					= -1;
	this.spectrogram_preset_target_id				= -1;

	this.distributionL								= Array.apply(null, new Array(256)).map(Number.prototype.valueOf,0);
	this.distributionR								= Array.apply(null, new Array(256)).map(Number.prototype.valueOf,0);
	this.distributionL_float						= new Float32Array(256);
	this.distributionR_float						= new Float32Array(256);

	this.fftR_data 									= [];
	this.fftL_data 									= [];
	this.waveR_data 								= [];
	this.waveL_data 								= [];
	this.waveR_data_f32 							= [];
	this.waveL_data_f32 							= [];

	this.maxR 										= -99999;
	this.minR 										= 99999;
	this.avgR 										= 0;
	this.avgR_inertia								= 0.5;
	this.avgR_inertia1								= 0.5;
	this.avgR_inertia2								= 0.5;
	this.avgR_inertia3								= 0.5;
	this.sumR 										= 0;
	this.clippedR 									= 0;
	this.clippedR_max 								= 0;

	this.maxL 										= -99999;
	this.minL 										= 99999;
	this.avgL 										= 0;
	this.avgL_inertia								= 0.5;
	this.avgL_inertia1								= 0.5;
	this.avgL_inertia2								= 0.5;
	this.avgL_inertia3								= 0.5;
	this.sumL 										= 0;
	this.clippedL 									= 0;
	this.clippedL_max 								= 0;

	this.about = {
		shown:		false,
	};
};

// this actually helps quite a bit
var Color_Scheme = function(formula)
{
	this.formula = formula;
	this.buffer = [];
}

Color_Scheme.prototype.get = function(i, a)
{
	var _i = Math.round(clamp(i, 0, 1)*100);
	var _a = Math.round(clamp(a, 0, 1)*100);
	if (this.buffer[_i] == undefined)
	{
		this.buffer[_i] = [];
	}
	if (this.buffer[_i][_a] == undefined)
	{
		this.buffer[_i][_a] = this.formula(i, a);
	}
	return this.buffer[_i][_a];
}

La_Playa.prototype.init = function()
{
	this.init_attempted = true;
	var a = document.createElement('audio');
	if (!a.canPlayType)
	{
		this.init_failure = true;
		console.log('La Playa: Browser does not support canPlayType', a);
		return;
	}
	else
	{
		this.can_play_ogg = a.canPlayType('audio/ogg; codecs="vorbis"') == 'probably'	|| a.canPlayType('audio/ogg; codecs="vorbis"')	== 'maybe';
		this.can_play_wav = a.canPlayType('audio/wav; codecs="1"')		== 'probably'	|| a.canPlayType('audio/wav; codecs="1"')		== 'maybe';
		this.can_play_mp3 = a.canPlayType('audio/mpeg;')				== 'probably'	|| a.canPlayType('audio/mpeg;')					== 'maybe';
		this.can_play_m4a = a.canPlayType('audio/x-m4a;')				== 'probably'	|| a.canPlayType('audio/x-m4a;')				== 'maybe';
		this.can_play_aac = a.canPlayType('audio/aac;')					== 'probably'	|| a.canPlayType('audio/aac;')					== 'maybe';
	}
	try
	{
		window.AudioContext = window.AudioContext || window.webkitAudioContext;
		this.context = new AudioContext();
		console.log('La Playa: Init successful');
	}
	catch(e)
	{
		this.init_failure = true;
		console.log('La Playa: Browser does not support Web Audio API', a);
		return;
	}

	this.audio_el = new Audio();
	// this needs to be done whenever  changing the src, too
	this.audio_el.crossOrigin = "anonymous";
	this.audio_el.preload = 'auto';

	// create nodes
	this.source 			= this.context.createMediaElementSource(this.audio_el);
	this.splitter_node 		= this.context.createChannelSplitter();
	this.merger_node 		= this.context.createChannelMerger(2);
	this.analyserR_node 	= this.context.createAnalyser();
	this.analyserL_node 	= this.context.createAnalyser();
	this.panR_node 			= this.context.createStereoPanner();
	this.panL_node 			= this.context.createStereoPanner();
	this.gain_node 			= this.context.createGain();

	// configure nodes
	this.analyserR_node.smoothingTimeConstant	= this.fft_smoothing;
	this.analyserR_node.minDecibels				= this.fft_sens;
	this.analyserR_node.maxDecibels				= 0;
	this.analyserL_node.smoothingTimeConstant	= this.fft_smoothing;
	this.analyserL_node.minDecibels				= this.fft_sens;
	this.analyserL_node.maxDecibels				= 0;
	this.panL_node.pan.setValueAtTime(-1 * this.stereo_separation, this.context.currentTime);
	this.panR_node.pan.setValueAtTime(1 * this.stereo_separation, this.context.currentTime);
	this.gain_node.gain.value 					= this.volume;

	// connect nodes
	this.source.connect(this.splitter_node);
	this.splitter_node.connect(this.analyserL_node, 0);
	this.splitter_node.connect(this.analyserR_node, 1);
	this.analyserL_node.connect(this.panL_node, 0, 0);
	this.analyserR_node.connect(this.panR_node, 0, 0);
	this.panL_node.connect(this.gain_node, 0, 0);
	this.panR_node.connect(this.gain_node, 0, 0);
	this.merger_node.connect(this.gain_node);
	this.gain_node.connect(this.context.destination);

	// needs to happen after webGL has been set up
	this.set_fft_size(this.default_fft_size);

	this.init_success = true; // let's just claim this
};

La_Playa.prototype.set_fft_size = function(fft_size)
{
	this.analyserR_node.fftSize = fft_size;
	this.analyserL_node.fftSize = fft_size;

	this.fftR_data 		= new Float32Array(this.analyserR_node.frequencyBinCount);
	this.fftL_data 		= new Float32Array(this.analyserL_node.frequencyBinCount);
	this.waveR_data 	= new Uint8Array(this.analyserR_node.fftSize / 2);
	this.waveL_data 	= new Uint8Array(this.analyserL_node.fftSize / 2);
	this.waveR_data_f32 = new Float32Array(this.analyserR_node.fftSize / 2);
	this.waveL_data_f32 = new Float32Array(this.analyserL_node.fftSize / 2);

	this.fft_size = fft_size;
}

La_Playa.prototype.set_texture_size = function(texture_size)
{
	this.texture_size = texture_size;
	this.WebGL_PingPong.resize_textures(texture_size);
	this.WebGL_PingPong_Osc.resize_textures(texture_size);
	this.WebGL_Rectangle_Textured_FFT 				= new µ.WebGL_Rectangle_Textured_FFT(this.webGL, this.webGL.gl, this.cameras.c, this.webGL.textures, texture_size);
	this.WebGL_Rectangle_Textured_FFT.minDecibels 	= this.fft_sens;
	this.WebGL_Rectangle_Textured_FFT.update_color_scheme();
	this.WebGL_Rectangle_Textured_Osc 				= new µ.WebGL_Rectangle_Textured_Osc(this.webGL, this.webGL.gl, this.cameras.c, this.webGL.textures, texture_size);
	this.WebGL_Rectangle_Textured_Osc.minDecibels 	= this.fft_sens;
	this.WebGL_Rectangle_Textured_Osc.update_color_scheme();
}

La_Playa.prototype.print_duration = function(duration)
{
	var minutes = 0;
	var remainder = 0;
	if (duration >= 60)
	{
		remainder = duration % 60;
		minutes = (duration - remainder) / 60;
		duration = remainder;
	}
	var seconds = Math.floor(duration);
	if (seconds < 10)
	{
		seconds = "0" + seconds;
	}
	return minutes + ':' + seconds;
}

La_Playa.prototype.clear_seekbar = function()
{
	this.seekbar_ctx.fillStyle = "rgba(30,30,30,1)";
	this.seekbar_ctx.fillRect(0, 0, this.seekbar_el.width, this.seekbar_size_y);
}

La_Playa.prototype.loop_toggle = function()
{
	this.is_looping = !this.is_looping;
	this.loop_toggle_el.setAttribute('class', 'lp_button' + (this.is_looping ? ' lp_active' : ''));
}

La_Playa.prototype.set_status_info = function(blah)
{
	if (this.use_status_bar)
	{
		this.status_bar_status_el.innerHTML = blah;
	}
}

function clamp(x, min, max)
{
	return Math.min(Math.max(x, min), max);
}

/*
	- playlist end: stop, repeat, shuffle & repeat
	- what are good ways to get a rough estimate of CPU and canvas drawing speed?

Web Audio Weekly
http://blog.chrislowis.co.uk/waw.html

http://chimera.labs.oreilly.com/books/1234000001552/index.html

http://stackoverflow.com/questions/14464693/play-an-oscillation-in-a-single-channel
http://stackoverflow.com/a/4787423

http://lists.w3.org/Archives/Public/public-audio/

https://www.scenemusic.net

	details about the section below:
	http://www.youtube.com/watch?v=4wR6_htIbZo
*/

