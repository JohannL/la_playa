"use strict";

La_Playa.prototype.update_vumeter = function()
{
	var vumeter_width = this.vumeter_el.width;
	var vumeter_height = this.vumeter_el.height;
	var vumeter_height_2 = vumeter_height / 2;
	var wave_data_length = this.waveR_data.length;

	this.vumeter_ctx.fillStyle = this.vumeter_clear_gradient; // "rgba(0,0,0,.001)";
	this.vumeter_ctx.fillRect(0, 0, vumeter_width, vumeter_height);

	this.vumeter_ctx.fillStyle = this.vumeter_gradient2;
	this.vumeter_ctx.fillRect(vumeter_width * this.minL, 0, 					vumeter_width * (this.maxL - this.minL), vumeter_height_2);
	this.vumeter_ctx.fillRect(vumeter_width * this.minR, vumeter_height_2, 	vumeter_width * (this.maxR - this.minR), vumeter_height_2);

	this.vumeter_ctx.fillStyle = this.vumeter_mask_gradient;
	this.vumeter_ctx.fillRect(0, 0, vumeter_width, vumeter_height);

	this.vumeter_ctx.fillStyle = this.string__color_yellow;
	this.vumeter_ctx.fillRect(	vumeter_width * 0.5 - 1.0, 0, 2.0, vumeter_height);

	this.vumeter_ctx.fillStyle = this.string__color_white;

	this.vumeter_ctx.fillRect(	vumeter_width * this.avgL_inertia - 1.0, 0, 2.0, vumeter_height_2 * 0.75);
	this.vumeter_ctx.fillRect(	vumeter_width * this.avgR_inertia - 1.0, vumeter_height, 2.0, - vumeter_height_2 * 0.75);


	if (this.clippedR_max || this.clippedL_max)
	{
		this.vumeter_ctx.fillStyle = this.vumeter_clip_max_gradient;
	}
	if (this.clippedL_max)
	{
		var frac_clipped_L = this.clippedL_max / wave_data_length;
		this.vumeter_ctx.fillRect(	vumeter_width * (0.5 - 0.5 * frac_clipped_L),
									vumeter_height_2 - vumeter_height_2 * 0.75,
									vumeter_width * frac_clipped_L,
									- vumeter_height_2 * 0.25);
	}
	if (this.clippedR_max)
	{
		var frac_clipped_R = this.clippedR_max / wave_data_length;
		this.vumeter_ctx.fillRect(	vumeter_width * (0.5 - 0.5 * frac_clipped_R),
									vumeter_height_2 + vumeter_height_2 * 0.75,
									vumeter_width * frac_clipped_R,
									+ vumeter_height_2 * 0.25);
	}


	if (this.clippedR || this.clippedL)
	{
		this.vumeter_ctx.fillStyle = this.vumeter_clip_gradient;
	}

	if (this.clippedL)
	{
		var frac_clipped_L = this.clippedL / wave_data_length;
		this.vumeter_ctx.fillRect(	vumeter_width * (0.5 - 0.5 * frac_clipped_L),
									vumeter_height_2 - vumeter_height_2 * 0.125,
									vumeter_width * frac_clipped_L,
									- vumeter_height_2 * 0.25);
	}
	if (this.clippedR)
	{
		var frac_clipped_R = this.clippedR / wave_data_length;
		this.vumeter_ctx.fillRect(	vumeter_width * (0.5 - 0.5 * frac_clipped_R),
									vumeter_height_2 + vumeter_height_2 * 0.125,
									vumeter_width * frac_clipped_R,
									+ vumeter_height_2 * 0.25);
	}
}

La_Playa.prototype.update_oscilloscope_distribution = function()
{
/*
	right now clipping in either direction is considered as the same, which is just silly
*/
	var wave_data_length = this.waveR_data.length;

	this.maxR = -99999;
	this.maxL = -99999;

	this.minR = 99999;
	this.minL = 99999;

	this.avgR = 0;
	this.avgL = 0;

	this.sumR = 0;
	this.sumL = 0;


	this.clippedR = 0;			// this counts both negative and positive
	this.clippedL = 0;

	var clippedLastR_positive = false;
	var clippedLastL_positive = false;

	var clippedLastR_negative = false;
	var clippedLastL_negative = false;


	//this.clipped_L_positive


	for (var i = 0; i < 256; i++)
	{
		this.distributionL[i] = 0;
		this.distributionR[i] = 0;
	}
	for (var i = 0; i < wave_data_length; i++)
	{
		var val_int = this.waveR_data[i];
		var val = val_int / 255;
		this.distributionR[val_int] += 1;
		if (val_int == 0)
		{
			if (clippedLastR_negative)
			{
				this.clippedR++;
			}
			clippedLastR_negative = true;
		}
		else if (val_int == 255)
		{
			if (clippedLastR_positive)
			{
				this.clippedR++;
			}
			clippedLastR_positive = true;
		}
		else
		{
			clippedLastR_negative = false;
			clippedLastR_positive = false;
		}
		this.maxR = Math.max(this.maxR, val);
		this.minR = Math.min(this.minR, val);
		this.avgR += val;
		this.sumR += Math.abs(0.5 - val) * 2;

		var val_int = this.waveL_data[i];
		var val = val_int / 255;
		this.distributionL[val_int] += 1;
		if (val_int == 0)
		{
			if (clippedLastL_negative)
			{
				this.clippedL++;
			}
			clippedLastL_negative = true;
		}
		else if (val_int == 255)
		{
			if (clippedLastL_positive)
			{
				this.clippedL++;
			}
			clippedLastL_positive = true;
		}
		else
		{
			clippedLastR_negative = false;
			clippedLastR_positive = false;
		}
		this.maxL = Math.max(this.maxL, val);
		this.minL = Math.min(this.minL, val);
		this.avgL += val;
		this.sumL += Math.abs(0.5 - val) * 2;
	}
	this.avgR /= wave_data_length;
	this.avgL /= wave_data_length;

	this.clippedR_max = Math.max(this.clippedR, this.clippedR_max);
	this.clippedL_max = Math.max(this.clippedL, this.clippedL_max);

	this.avgR_inertia1 = this.avgR_inertia1 * 0.9 + 0.1 * this.avgR;
	this.avgL_inertia1 = this.avgL_inertia1 * 0.9 + 0.1 * this.avgL;

	this.avgR_inertia2 = this.avgR_inertia2 * 0.8 + 0.2 * this.avgR;
	this.avgL_inertia2 = this.avgL_inertia2 * 0.8 + 0.2 * this.avgL;

	this.avgR_inertia3 = this.avgR_inertia3 * 0.7 + 0.3 * this.avgR;
	this.avgL_inertia3 = this.avgL_inertia3 * 0.7 + 0.3 * this.avgL;

	this.avgR_inertia = (this.avgR_inertia1 + this.avgR_inertia2 + this.avgR_inertia3) / 3;
	this.avgL_inertia = (this.avgL_inertia1 + this.avgL_inertia2 + this.avgL_inertia3) / 3;

	this.sumR /= wave_data_length;
	this.sumL /= wave_data_length;
	for (var i = 0; i < 256; i++)
	{
		this.distributionL_float[i] = this.distributionL[i] / wave_data_length;
		this.distributionR_float[i] = this.distributionR[i] / wave_data_length;
	}
}

La_Playa.prototype.update_seekbar = function()
{
	if (!this.init_success)
	{
		return;
	}
	if (this.audio_el.duration > 0)
	{
		this.seekbar_ctx.fillStyle = this.seekbar_bg_gradient;
		this.seekbar_ctx.fillRect(0, 0, this.seekbar_width, this.seekbar_height);
		var current_timestamp = Math.floor(this.audio_el.currentTime);
		if (this.last_displayed_timestamp != current_timestamp)
		{
			this.last_displayed_timestamp = current_timestamp;
			this.duration_el.innerHTML = this.print_duration(current_timestamp) + this.string__spacedash + this.print_duration(this.audio_el.duration);
		}
		var duration = this.audio_el.duration;
		var factor = 1 / duration * this.seekbar_width;
		this.seekbar_ctx.fillStyle = this.seekbar_gradient;
		for (var i = 0, len = this.audio_el.buffered.length; i < len; i++)
		{
			var start = this.audio_el.buffered.start(i);
			var end = this.audio_el.buffered.end(i);
			this.seekbar_ctx.fillRect(start * factor, 0, (end - start) * factor, this.seekbar_height);
		}

		this.seekbar_ctx.fillStyle = this.seekbar_position_before_gradient;
		this.seekbar_ctx.fillRect(0, 0, this.audio_el.currentTime * factor, this.seekbar_height);


//*
		//this is more buggy and/or confusing than helpful
		this.seekbar_ctx.fillStyle = this.seekbar_played_gradient;
		for (var i = 0, len = this.audio_el.played.length; i < len; i++)
		{
			var start = this.audio_el.played.start(i);
			var end = this.audio_el.played.end(i);
			this.seekbar_ctx.fillRect(start * factor, 0, (end - start) * factor, this.seekbar_height);
		}
//*/


		this.seekbar_ctx.fillStyle = this.seekbar_position_gradient;
		this.seekbar_ctx.fillRect(this.audio_el.currentTime * factor - 2, 0,  3, this.seekbar_height);

//*
		this.seekbar_ctx.fillStyle = this.seekbar_notch_gradient_10;
		for (var i = 1, len = Math.floor(duration / 10); i <= len; i++)
		{
			this.seekbar_ctx.fillRect(i * 10 * factor, 0, 2, this.seekbar_height * 0.6);
		}
//*/
		this.seekbar_ctx.fillStyle = this.seekbar_notch_gradient_60;
		for (var i = 1, len = Math.floor(duration / 60); i <= len; i++)
		{
			this.seekbar_ctx.fillRect(i * 60 * factor, 0, 3, this.seekbar_height * 0.8);
		}
/*
		this.seekbar_ctx.fillStyle = "rgba(255,255,255,0.15)";
		this.seekbar_ctx.beginPath();
		this.seekbar_ctx.arc(this.audio_el.currentTime * factor, this.seekbar_height/2, this.seekbar_height/2, 0, Math.PI*2, true);
		this.seekbar_ctx.closePath();
		this.seekbar_ctx.fill();
*/
	}
}


/*
function blit_image_data(source, destination, source_x, source_y, destination_x, destination_y, size_x, size_y, wrap_source, wrap_destination)
{
	//return;
	source_data = source.data;
	destination_data = destination.data;
	source_width = source.width;
	destination_width = destination.width;
	source_height = source.height;
	destination_height = destination.height;
	for (var x = 0; x < size_x; x++)
	{
		for (var y = 0; y < size_y; y++)
		{
			var src_x = source_x + x;
			var src_y = source_y + y;
			if (src_x >= source_width)
			{
				src_x = wrap_source ? src_x % source_width : source_width - 1;
			}
			if (src_y >= source_height)
			{
				src_y = wrap_source ? src_y % source_height : source_height - 1;
			}
			var r = source_data[((src_x * (source_width * 4)) + (src_y * 4)) + 0];
			var g = source_data[((src_x * (source_width * 4)) + (src_y * 4)) + 1];
			var b = source_data[((src_x * (source_width * 4)) + (src_y * 4)) + 2];
			var a = source_data[((src_x * (source_width * 4)) + (src_y * 4)) + 3];
			var dst_x = destination_x + x;
			var dst_y = destination_y + y;
			if (dst_x >= destination_width)
			{
				dst_x = wrap_destination ? dst_x % destination_width : destination_width - 1;
			}
			if (dst_y >= destination_height)
			{
				dst_y = wrap_destination ? dst_y % destination_height : destination_height - 1;
			}
			destination_data[((dst_x * (destination_width * 4)) + (dst_y * 4)) + 0] = r;
			destination_data[((dst_x * (destination_width * 4)) + (dst_y * 4)) + 1] = g;
			destination_data[((dst_x * (destination_width * 4)) + (dst_y * 4)) + 2] = b;
			destination_data[((dst_x * (destination_width * 4)) + (dst_y * 4)) + 3] = 255;
		}
	}
	source.data = source_data;
	destination.data = destination_data;
}
*/