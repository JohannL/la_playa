"use strict";

La_Playa.prototype.update_webgl = function()
{
	this.analyserR_node.getFloatTimeDomainData(this.waveR_data_f32);
	this.analyserL_node.getFloatTimeDomainData(this.waveL_data_f32);

	this.webGL.update_texture_from_array(this.fftL_data, this.data_texture_size, this.data_texture_FFT_L);
	this.webGL.update_texture_from_array(this.fftR_data, this.data_texture_size, this.data_texture_FFT_R);

	this.webGL.update_texture_from_array(this.waveL_data_f32, this.data_texture_size, this.data_texture_OSC_L);
	this.webGL.update_texture_from_array(this.waveR_data_f32, this.data_texture_size, this.data_texture_OSC_R);

	this.webGL.update_texture_from_array(this.distributionL_float, this.data_texture_size2, this.data_texture_distribution_L);
	this.webGL.update_texture_from_array(this.distributionR_float, this.data_texture_size2, this.data_texture_distribution_R);

	var minL = this.minL; //this.minL_buckets.buckets[i][index];
	var maxL = this.maxL; //this.maxL_buckets.buckets[i][index];
	var avgL = this.avgL; //this.avgL_buckets.buckets[i][index];
	var sumL = this.sumL;

	var minR = this.minR; //this.minR_buckets.buckets[i][index];
	var maxR = this.maxR; //this.maxR_buckets.buckets[i][index];
	var avgR = this.avgR; //this.avgR_buckets.buckets[i][index];
	var sumR = this.sumR;

	var valL = Math.max(Math.abs(minL - 0.5), Math.abs(maxL - 0.5)) * 2.0;
	var valR = Math.max(Math.abs(minR - 0.5), Math.abs(maxR - 0.5)) * 2.0;

	var volume = Math.max(valL, valR);

	//console.log(minL, maxL, avgL, minR, maxR, avgR);

	if (this.webgl_spectrogram_enabled)
	{
		this.WebGL_PingPong.process_steps(1, this.data_texture_FFT_L, this.data_texture_FFT_R);
		var used_divider = this.webgl_divider;
	}
	else
	{
		var used_divider = 1.0;
	}

	if (this.webgl_osc_pingpong_enabled)
	{
		this.WebGL_PingPong_Osc.process_steps(1, this.data_texture_OSC_L, this.data_texture_OSC_R, minL, maxL, avgL, sumL, minR, maxR, avgR, sumR);
	}

	var pos1_y = 0.5 - (used_divider * 0.5);

	if (this.webgl_oscilloscope_enabled)
	{
		var pos2_y = 1.0 - (used_divider * 0.9);
		var width2 = used_divider * 0.2;
	}
	else
	{
		var pos2_y = 1.0 - used_divider * 0.5;
		var width2 = used_divider;
	}

	var pos3_y = 1.0 - (used_divider * 0.375);

	if (this.webgl_spectrogram_enabled)
	{
		this.WebGL_Rectangle_Textured_Vis.draw(
			this.CAM_STRETCH,
			this.WebGL_PingPong.current_texture,
			0.5, pos1_y, 1.0, 1.0 - used_divider,
			1.0, 1.0, 90,
			0.0, 1.0, 1.0, 1.0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1);
		this.WebGL_Rectangle_Textured_Vis.flush_all(this.texture_size, volume);
	}

//*
	this.WebGL_Rectangle_Textured_FFT.draw(
		this.CAM_STRETCH,
		this.test_texture, // unused (but needed heh)
		0.5, pos2_y,
		1.0, width2,
		1.0, 1.0, 90,
		0, 1.0, 0.5, 1.0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1);
	this.WebGL_Rectangle_Textured_FFT.flush_all(this.data_texture_FFT_L, this.data_texture_FFT_R);
//*/

	if (this.webgl_oscilloscope_enabled)
	{
		if (this.webgl_osc_pingpong_enabled)
		{
			//this.webGL.set_blending(this.webGL.gl.SRC_ALPHA, this.webGL.gl.ONE, this.webGL.gl.FUNC_ADD);
			this.WebGL_Rectangle_Textured_Vis.draw(
				this.CAM_STRETCH,
				this.WebGL_PingPong_Osc.current_texture,
				0.5, pos3_y,
				1.0, used_divider * 0.8,
				1.0, 1.0, 90,
				0.0, 1.0, 1.0, 0.4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1);
			this.WebGL_Rectangle_Textured_Vis.flush_all(this.texture_size, volume);
			//this.webGL.set_blending(this.webGL.gl.SRC_ALPHA, this.webGL.gl.ONE_MINUS_SRC_ALPHA, this.webGL.gl.FUNC_ADD);
		}

//*
		// oscilloscope
		//this.webGL.set_blending(this.webGL.gl.SRC_ALPHA, this.webGL.gl.ONE, this.webGL.gl.FUNC_ADD);
		this.WebGL_Rectangle_Textured_Osc.draw(
			this.CAM_STRETCH,
			0.5, pos3_y,
			1.0, used_divider * 0.9);

		this.WebGL_Rectangle_Textured_Osc.flush_all(this.data_texture_OSC_L, this.data_texture_OSC_R, valL, valR);

		//this.webGL.set_blending(this.webGL.gl.SRC_ALPHA, this.webGL.gl.ONE_MINUS_SRC_ALPHA, this.webGL.gl.FUNC_ADD);

		// circle
		this.WebGL_Rectangle_Textured_Phase.draw(
			this.CAM_STRETCH,
			this.test_texture,
			0.5, pos3_y,
			0.15, used_divider * 0.7,
			1.0, 1.0, 90,
			0, 1.0, 1.0, 1.0,
			0, 1.0, 1.0, 1.0,
			0, 1.0, 1.0, 1.0,
			0, 1.0, 1.0, 1.0);
		this.WebGL_Rectangle_Textured_Phase.flush_all(this.data_texture_OSC_L, this.data_texture_OSC_R, 16);

//*/

		this.webGL.set_blending(this.webGL.gl.SRC_ALPHA, this.webGL.gl.ONE, this.webGL.gl.FUNC_ADD);

		// cross
//*
		this.WebGL_Rectangle_Textured_Phase_Dist.draw(
			this.CAM_STRETCH,
			this.test_texture,
			0.5, pos3_y,
			0.15, used_divider * 0.7,
			1.0, 1.0, 90,
			0, 1.0, 1.0, 1.0,
			0, 1.0, 1.0, 1.0,
			0, 1.0, 1.0, 1.0,
			0, 1.0, 1.0, 1.0);
		this.WebGL_Rectangle_Textured_Phase_Dist.flush_all(this.data_texture_distribution_L, this.data_texture_distribution_R, 8);
//*/

//*
		this.WebGL_Rectangle_Textured_Distribution.draw(
			this.CAM_STRETCH,
			this.test_texture,
			0.5, pos3_y,
			1.0, used_divider * 0.7,
			1.0, 1.0, 90,
			0, 1.0, 1.0, 1.0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1);
		this.WebGL_Rectangle_Textured_Distribution.flush_all(this.data_texture_distribution_L, this.data_texture_distribution_R);
//*/

//*
		if (this.webgl_stereoscope_enabled)
		{
			this.WebGL_Rectangle_Textured_StereOsc.draw(
				this.CAM_STRETCH,
				this.test_texture,
				0.5, pos3_y,
				0.15, used_divider * 0.7,
				1.0, 1.0, 90,
				0, 1.0, 1.0, 0.25, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1);
			this.WebGL_Rectangle_Textured_StereOsc.flush_all(this.data_texture_OSC_L, this.data_texture_OSC_R, valL, valR);
		}
//*/

		this.webGL.set_blending(this.webGL.gl.SRC_ALPHA, this.webGL.gl.ONE_MINUS_SRC_ALPHA, this.webGL.gl.FUNC_ADD);

	}

	//this.webGL.set_blending(this.webGL.gl.SRC_ALPHA, this.webGL.gl.ONE, this.webGL.gl.FUNC_ADD);
	//this.webGL.set_blending(this.webGL.gl.SRC_ALPHA, this.webGL.gl.ONE_MINUS_SRC_ALPHA, this.webGL.gl.FUNC_ADD);

/*
	this.WebGL_Rectangle_Textured_Phase.draw(
		this.CAM_STRETCH,
		this.test_texture,
		0.85, 0.15,
		0.3, 0.3,
		1.0, 1.0, 90,
		0, 1.0, 0.5, 1.0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1);
	this.WebGL_Rectangle_Textured_Phase.flush_all(this.data_texture_distribution_L, this.data_texture_distribution_R, 8);
//*/


//this.WebGL_Rectangle_Textured.flush_all();

}