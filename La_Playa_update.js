"use strict";

La_Playa.prototype.update_about = function()
{
	var now = Date.now();
	var time_delta = now - this.about.last_frame;
	this.about.last_frame = now;
	this.about.total_time += time_delta;

	//this.about_canvas_ctx.clearRect(0, 0, this.about_canvas_el.width, this.about_canvas_el.height);
	this.about_canvas_ctx.fillStyle = "hsla(0,0%,16.5%,0.25)";
	this.about_canvas_ctx.fillRect(0, 0, this.about_canvas_el.width, this.about_canvas_el.height);

	var fade2 = this.about.total_time > 1000 ? 1 : this.about.total_time / 1000;
	var bar_width = this.about_canvas_el.width / 300;
	this.about_canvas_ctx.fillStyle = "hsla(0, 0%, 0%, 0.025)";
	for (var i = 0; i < 300; i++)
	{
		var a = 0;
		a += Math.sin((now/(45*2.5) + i*30.4)/14.4)*0.50;
		a += Math.sin((now/(22*2.5) + i*30.2)/14.4)*1.00;
		a += Math.sin((now/(11*2.5) + i*30.1)/14.4)*1.50;
		a += Math.sin((now/(55*2.5) + i*30.4)/14.4)*2.00;
		a += Math.sin((now/(37*2.5) + i*30.2)/14.4)*2.50;
		a += Math.sin((now/(24*2.5) + i*30.1)/14.4)*3.00;
		a /= 10.5;
		var frac = i / 300;
		var fade = (frac < 0.25) ? (frac * 4) : (frac > 0.75 ? 1 - (frac - 0.75)*4 : 1);
		this.about_canvas_ctx.fillStyle = "hsla("+(180 + Math.sin((now / 185 + now / 12252) / 23 + (a + frac)*(1.5 + a * 0.5))*180)+", "+(80 + 20 * a)+"%, 50%, "+(0.99 * fade * fade * fade2)+")";
		this.about_canvas_ctx.fillRect(
			i * bar_width,
			this.about_canvas_el.height / 2 + a * this.about_canvas_el.height / 2,
			bar_width * 4,
			4);
	}
	if (this.about.shown)
	{
		requestAnimationFrame(this.update_about_func);

	}
}

La_Playa.prototype.update = function()
{
	requestAnimationFrame(this.update_func);
	this.updates_count++;

	var now = window.performance.now();
	var time_delta = now - this.last_update;

	this.last_update = now;

	if (this.paused !== true)
	{
		if (
				this.canvas_vumeter_enabled
			||	(this.webGL !== false && this.webgl_enabled)
			)
		{
			this.analyserR_node.getByteTimeDomainData(this.waveR_data);
			this.analyserL_node.getByteTimeDomainData(this.waveL_data);

			if (this.canvas_vumeter_enabled)
			{
				this.update_oscilloscope_distribution();
				this.update_vumeter();
			}
			else if (this.webGL !== false && this.webgl_enabled)
			{
				this.update_oscilloscope_distribution();
			}
			if (this.webGL !== false && this.webgl_enabled)
			{

				if (this.color_scheme_fade > -1)
				{

					this.color_scheme_fade = Math.max(0, this.color_scheme_fade - time_delta);
					//console.log(this.color_scheme_fade);

					var fade			= this.color_scheme_fade / this.color_scheme_fade_duration;
					var fade1 			= 1.0 - fade;
					var current_scheme	= this.color_schemes[this.color_scheme_index];
					var next_scheme		= this.color_schemes[this.color_scheme_target_id];

					this.color_scheme['hue_start']				= fade * current_scheme.hue_start				+ fade1 * next_scheme.hue_start;
					this.color_scheme['hue_shift']				= fade * current_scheme.hue_shift				+ fade1 * next_scheme.hue_shift;
					this.color_scheme['hue_shift_exponent']		= fade * current_scheme.hue_shift_exponent		+ fade1 * next_scheme.hue_shift_exponent;
					this.color_scheme['hue2_start']				= fade * current_scheme.hue2_start				+ fade1 * next_scheme.hue2_start;
					this.color_scheme['hue2_shift']				= fade * current_scheme.hue2_shift				+ fade1 * next_scheme.hue2_shift;
					this.color_scheme['hue2_shift_exponent']	= fade * current_scheme.hue2_shift_exponent	+ fade1 * next_scheme.hue2_shift_exponent;
					this.color_scheme['lum_part1']				= fade * current_scheme.lum_part1				+ fade1 * next_scheme.lum_part1;
					this.color_scheme['lum_part1_exponent']		= fade * current_scheme.lum_part1_exponent		+ fade1 * next_scheme.lum_part1_exponent;
					this.color_scheme['lum_part2']				= fade * current_scheme.lum_part2				+ fade1 * next_scheme.lum_part2;
					this.color_scheme['lum_part2_exponent']		= fade * current_scheme.lum_part2_exponent		+ fade1 * next_scheme.lum_part2_exponent;
					this.color_scheme['saturation']				= fade * current_scheme.saturation				+ fade1 * next_scheme.saturation;
					this.color_scheme['saturation2']			= fade * current_scheme.saturation2			+ fade1 * next_scheme.saturation2;

					if (this.color_scheme_fade == 0)
					{
						this.color_scheme_fade = -1;
						this.color_scheme_index = this.color_scheme_target_id;
						this.color_scheme_target_id = -1;
					}

					this.WebGL_Rectangle_Textured_Vis.update_color_scheme();
					this.WebGL_Rectangle_Textured_Phase.update_color_scheme();
					this.WebGL_Rectangle_Textured_Phase_Dist.update_color_scheme();
					this.WebGL_Rectangle_Textured_Osc.update_color_scheme();
					if (this.config.init_stereosc)
					{
						this.WebGL_Rectangle_Textured_StereOsc.update_color_scheme();
					}
					this.WebGL_Rectangle_Textured_FFT.update_color_scheme();
					this.WebGL_Rectangle_Textured_Distribution.update_color_scheme();

					//console.log(this.color_scheme_fade);

				}

				this.analyserL_node.getFloatFrequencyData(this.fftL_data);
				this.analyserR_node.getFloatFrequencyData(this.fftR_data);
				this.update_webgl();
			}
		}

		this.update_seekbar();


		if (this.use_status_bar)
		{
			var time_taken = window.performance.now() - now;

			this.framerates[this.framerates_index] = time_delta;
			this.framerates_index++;
			if (this.framerates_index == this.framerates.length)
			{
				this.framerates_index = 0;
			}
			this.updaterates[this.updaterates_index] = time_taken;
			this.updaterates_index++;
			if (this.updaterates_index == this.updaterates.length)
			{
				this.updaterates_index = 0;
			}
			if (now - this.last_fps_update > 200)
			{
				// TODO: make this an option

				this.favicon_el.setAttribute('href', this.seekbar_el.toDataURL("image/x-icon"));

				//this.favicon_el.setAttribute('href', this.webGL.canvas.toDataURL("image/x-icon"));

				this.last_fps_update = now;
				var avg = 0;
				var len = this.framerates.length;
				for (var i = 0; i < len; i++)
				{
					avg += this.framerates[i];
				}
				avg /= len;

				var avgU = 0;
				var len = this.updaterates.length;
				for (var i = 0; i < len; i++)
				{
					avgU += this.updaterates[i];
				}
				avgU /= len;
				this.status_bar_fps_el.innerHTML = (Math.round(10000 / avg) / 10) + this.string__spacedash + (Math.round(10000 / avgU) / 10);
			}
		}

	}

}

// some things (like skipping to the next song)
// should be handled even when the tab is in the background
// so this gets called always
La_Playa.prototype.update_always = function()
{
	//fixme: MEH!!
	if (this.audio_el && this.audio_el.duration > 0 && Math.abs(this.audio_el.currentTime - this.audio_el.duration) < 0.01)
	{
		if (this.is_looping)
		{
			this.audio_el.currentTime = 0;
			this.audio_el.play();
		}
		else
		{
			this.play_next();
		}

	}
	setTimeout(this.update_always_func, 20);	// no need to be super fussy about it
}

La_Playa.prototype.update_fluid_canvases = function()
{
	for (var i = 0; i < this.fluid_canvases.length; i++)
	{
		// bleh
		var target_width = Math.max(2, parseFloat(this.fluid_canvases[i].clientWidth));
		if (parseFloat(this.fluid_canvases[i].width) != target_width)
		{
			this.fluid_canvases[i].width = target_width;
		}
	}
	this.seekbar_width  = this.seekbar_el.clientWidth;
	this.seekbar_height = this.seekbar_el.clientHeight;
}