"use strict";

µ.WebGL_Rectangle_Textured_StereOsc = function(webgl, gl, cameras, textures, framebuffer_texture_size)
{
	this.something_to_draw = false;

	this.allocation_chunk_size = 1;
	this.vertices_per_object = 6;
	this.attributes_per_object = 12;
	this.magic_number = this.vertices_per_object * this.attributes_per_object;

	this.vbuffer = {};
	this.buffer_counter = {};
	this.buffer_max = {};

	this.cameras = cameras;

	this.scale_y = 1.0;

	for (var i = 0; i < cameras.length; i++)
	{
		this.vbuffer[i] = [];
		this.buffer_counter[i] = [];
		this.buffer_max[i] = [];
	}

	this.framebuffer = gl.createFramebuffer();
	this.framebuffer_texture_size = framebuffer_texture_size;
	this.framebuffer_texture = webgl.empty_texture(this.framebuffer_texture_size, true, false);

	this.program = gl.createProgram();
	this.buffer = gl.createBuffer();

	this.vertex_shader = ["",

(function () {/*

// Rectangle_Textured_StereOsc

	attribute	vec2	aVertexPosition;
	attribute	vec2	aTexPosition;
	attribute	vec2	aTexScale;
	attribute	vec2	aPosition;
	attribute	vec4	aColor;
	uniform	vec2	uCamPosition;
	uniform	vec2	uCamZoom;
	varying	vec4	vColor;
	varying	vec2	vPosition;
	varying	highp vec2	vTexPosition;
	varying	vec2	vTexScale;
	void main()
	{
		vec2 pos = vec2(
			(aPosition[0] * 2.0 - 1.0 - (uCamPosition[0] * 2.0 - 1.0)) / uCamZoom[0],
			(aPosition[1] * 2.0 - 1.0 - (uCamPosition[1] * 2.0 - 1.0)) / uCamZoom[1]
		);
		gl_Position = vec4(	(pos[0] + aVertexPosition[0] / uCamZoom[0]),
							(pos[1] + aVertexPosition[1] / uCamZoom[1]),
							0.0, 1.0);
		vPosition = vec2(aVertexPosition[0], - aVertexPosition[1]);
		vTexPosition = aTexPosition;
		vTexScale = aTexScale;
		vColor = aColor;
	}

*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1],

	""].join('\n');

	this.fragment_shader = 

`
// Rectangle_Textured_StereOsc

//	precision highp	float;
	precision mediump	float;

	uniform 		sampler2D 	uSampler;
	uniform 		sampler2D 	uSampler_L;
	uniform 		sampler2D 	uSampler_R;

	uniform 		float 		uDataTextureSize;
	uniform			float		uScaleY;

	uniform			float		uVolumeL;
	uniform			float		uVolumeR;

	varying			vec4		vColor;
	varying			vec2		vPosition;
	varying	highp	vec2		vTexPosition;
	varying			vec2		vTexScale;

` +

	bxx_shader_includes.colors + "\n" +
	bxx_shader_includes.color_scheme + "\n" +
	bxx_shader_includes.read_data_texture + "\n" +

`
void main()
{

	float value_L  = 0.0;
	float value_R  = 0.0;
	float prev_value_L  = 0.0;
	float prev_value_R  = 0.0;
	float old_value_here  = 0.0;
	float texture_step = 1.0 / (uDataTextureSize * uDataTextureSize * 4.0);
	float volume_here = 0.0;
	float frac1 = 0.0;
	float frac = 0.0;
	float dist = 0.0;
	float value1 = 1.0;
	float value2 = 1.0;
	float this_x = 0.0;
	float this_y = 0.0;

	//for (int i = 0; i < 1024; i++)
	for (int i = 0; i < 256; i++)
	{
		value_L = get_data_pixel(uSampler_L, uDataTextureSize, float(i * 4) * texture_step);
		value_R = get_data_pixel(uSampler_R, uDataTextureSize, float(i * 4) * texture_step);
		prev_value_L = get_data_pixel(uSampler_L, uDataTextureSize, float(i - 1) * texture_step);
		prev_value_R = get_data_pixel(uSampler_R, uDataTextureSize, float(i - 1) * texture_step);
		//for (int j = 0; j <= 3; j++)
		{
			//frac1 = (float(j)+0.0) / 4.0;
			//float valL = value_L * frac1 + (1.0 - frac1) * prev_value_L;
			//float valR = value_R * frac1 + (1.0 - frac1) * prev_value_R;
			float valL = value_L;
			float valR = value_R;
			this_x = 0.5 + 0.4 * valL;
			this_y = 0.5 + 0.4 * valR;
			dist = distance(vec2(this_x, this_y), vTexPosition);
			if (dist < 0.025)
			{
				frac = 1.0 - pow((0.025 - dist) / 0.025, 1.0);

				value1 *= 1.0 - 0.95 * (1.0 - frac);
				value2 *= 1.0 - 0.5 * (1.0 - frac);
			}
		}
	}
	value2 = clamp(value2, 0.0, 1.0);
	gl_FragColor[0] = (1.0 - value1) * 0.25 + 0.75 * (1.0 - value2);
	gl_FragColor[0] = clamp(1.0 - pow(1.0 - gl_FragColor[0], 2.0), 0.0, 1.0);
	gl_FragColor[1] = 1.0;
	gl_FragColor[2] = 1.0;
	gl_FragColor[3] = 1.0;
	gl_FragColor = apply_color_scheme2(gl_FragColor);
	gl_FragColor[3] = clamp(2.0 * (1.0 - value1) * 0.25 + 0.75 * (1.0 - value2), 0.0, 1.0);
	gl_FragColor[0] = clamp(gl_FragColor[0], 0.0, 1.0);
	gl_FragColor[1] = clamp(gl_FragColor[1], 0.0, 1.0);
	gl_FragColor[2] = clamp(gl_FragColor[2], 0.0, 1.0);
	gl_FragColor[3] = clamp(gl_FragColor[3], 0.0, 1.0);
}
`;
		
	var	tmp_vertex_shader =	gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(tmp_vertex_shader, this.vertex_shader);
	gl.compileShader(tmp_vertex_shader);
	if (!gl.getShaderParameter(tmp_vertex_shader, gl.COMPILE_STATUS))
		console.log(gl.getShaderInfoLog(tmp_vertex_shader));

	var	tmp_fragment_shader	= gl.createShader(gl.FRAGMENT_SHADER);

	gl.shaderSource(tmp_fragment_shader, this.fragment_shader);
	gl.compileShader(tmp_fragment_shader);
	if (!gl.getShaderParameter(tmp_fragment_shader, gl.COMPILE_STATUS))
		console.log(gl.getShaderInfoLog(tmp_fragment_shader));

	gl.attachShader(this.program, tmp_vertex_shader);
	gl.attachShader(this.program, tmp_fragment_shader);
	gl.linkProgram(this.program);
	if (!gl.getProgramParameter(this.program, gl.LINK_STATUS))
		console.log(gl.getProgramInfoLog(this.program));

	gl.useProgram(this.program);

	this.program.aVertexPosition	= gl.getAttribLocation(this.program, "aVertexPosition");
	this.program.aTexPosition		= gl.getAttribLocation(this.program, "aTexPosition");
	this.program.aTexScale			= gl.getAttribLocation(this.program, "aTexScale");
	this.program.aPosition			= gl.getAttribLocation(this.program, "aPosition");
	this.program.aColor				= gl.getAttribLocation(this.program, "aColor");

	this.program.uScaleY			= gl.getUniformLocation(this.program, "uScaleY");

	this.program.uVolumeL			= gl.getUniformLocation(this.program, "uVolumeL");
	this.program.uVolumeR			= gl.getUniformLocation(this.program, "uVolumeR");

	this.program.uSampler			= gl.getUniformLocation(this.program, "uSampler");
	this.program.uSampler_L			= gl.getUniformLocation(this.program, "uSampler_L");
	this.program.uSampler_R			= gl.getUniformLocation(this.program, "uSampler_R");

	this.program.uDataTextureSize	= gl.getUniformLocation(this.program, "uDataTextureSize");

	this.program.uCamPosition		= gl.getUniformLocation(this.program, "uCamPosition");
	this.program.uCamZoom			= gl.getUniformLocation(this.program, "uCamZoom");

	this.program.uHueStart			= gl.getUniformLocation(this.program, "uHueStart");
	this.program.uHueShift			= gl.getUniformLocation(this.program, "uHueShift");
	this.program.uHueShiftExponent	= gl.getUniformLocation(this.program, "uHueShiftExponent");
	this.program.uHue2Start			= gl.getUniformLocation(this.program, "uHue2Start");
	this.program.uHue2Shift			= gl.getUniformLocation(this.program, "uHue2Shift");
	this.program.uHue2ShiftExponent	= gl.getUniformLocation(this.program, "uHue2ShiftExponent");
	this.program.uLumPart1			= gl.getUniformLocation(this.program, "uLumPart1");
	this.program.uLumPart1Exponent	= gl.getUniformLocation(this.program, "uLumPart1Exponent");
	this.program.uLumPart2			= gl.getUniformLocation(this.program, "uLumPart2");
	this.program.uLumPart2Exponent	= gl.getUniformLocation(this.program, "uLumPart2Exponent");
	this.program.uSaturation		= gl.getUniformLocation(this.program, "uSaturation");
	this.program.uSaturation2		= gl.getUniformLocation(this.program, "uSaturation2");

	// set the vars that never change
	gl.uniform1i(this.program.uSampler, 			0);
	gl.uniform1i(this.program.uSampler_L, 			1);
	gl.uniform1i(this.program.uSampler_R, 			2);
	gl.uniform1f(this.program.uDataTextureSize, 	16);

	gl.uniform1f(this.program.uScaleY, 				14.0);

	gl.errorCheck('setup rectangles_tex');
	

	this.draw = function(cam_id, texture_id, pos_x, pos_y, width, height, scale_x, scale_y, angle,
		tint_h_1, tint_s_1, tint_l_1, tint_a_1,
		tint_h_2, tint_s_2, tint_l_2, tint_a_2,
		tint_h_3, tint_s_3, tint_l_3, tint_a_3,
		tint_h_4, tint_s_4, tint_l_4, tint_a_4
		)
	{

/*
		var camera = cameras[cam_id];
		if (
					(pos_x + width * 2 < camera.left_edge_x)
				||	(pos_x - width * 2 > camera.right_edge_x)
				||	(pos_y + height * 2 < camera.bottom_edge_y)
				||	(pos_y - height * 2 > camera.top_edge_y)
			)
		{
			return;
		}
//*/

		if (scale_x === undefined) scale_x = 1;
		if (scale_y === undefined) scale_y = 1;

		var
			width2 = width,
			height2 = height;

		if (!this.vbuffer[cam_id])
		{
			console.log('draw_rectangle_tex: unknown cam: ' + cam_id);
			return;
		}
		this.something_to_draw = true;

		if (tint_h_2 < 0)	tint_h_2 = tint_h_1;
		if (tint_s_2 < 0)	tint_s_2 = tint_s_1;
		if (tint_l_2 < 0)	tint_l_2 = tint_l_1;
		if (tint_a_2 < 0)	tint_a_2 = tint_a_1;

		if (tint_h_3 < 0)	tint_h_3 = tint_h_1;
		if (tint_s_3 < 0)	tint_s_3 = tint_s_1;
		if (tint_l_3 < 0)	tint_l_3 = tint_l_1;
		if (tint_a_3 < 0)	tint_a_3 = tint_a_1;

		if (tint_h_4 < 0)	tint_h_4 = tint_h_1;
		if (tint_s_4 < 0)	tint_s_4 = tint_s_1;
		if (tint_l_4 < 0)	tint_l_4 = tint_l_1;
		if (tint_a_4 < 0)	tint_a_4 = tint_a_1;

		if (angle == 90)
		{
			var a_cos = -1;
			var a_sin = 0;
		}
		else
		{
			var a_cos = Math.cos((angle + 90) * 3.14159265358979323846264338327950288419716939937510 / 180.0);
			var a_sin = Math.sin((angle + 90) * 3.14159265358979323846264338327950288419716939937510 / 180.0);
		}

		if (this.vbuffer[cam_id][texture_id] == undefined)
		{
			this.vbuffer[cam_id][texture_id] = new Float32Array(this.magic_number * this.allocation_chunk_size);
			this.buffer_counter[cam_id][texture_id] = 0;
			this.buffer_max[cam_id][texture_id] = this.allocation_chunk_size;
		}

		if (this.buffer_counter[cam_id][texture_id] == this.buffer_max[cam_id][texture_id])
		{
			this.vbuffer[cam_id][texture_id] = Float32Concat(this.vbuffer[cam_id][texture_id], new Float32Array(this.magic_number * this.allocation_chunk_size));
			this.buffer_max[cam_id][texture_id] += this.allocation_chunk_size;
		}

		var offset = this.buffer_counter[cam_id][texture_id] * this.magic_number;

		var index = 0;

		// - + top left
		this.vbuffer[cam_id][texture_id][offset + index] = a_cos * (-width2) - a_sin * (+height2);		index++;
		this.vbuffer[cam_id][texture_id][offset + index] = a_sin * (-width2) + a_cos * (+height2);		index++;
		this.vbuffer[cam_id][texture_id][offset + index] = pos_x;										index++;
		this.vbuffer[cam_id][texture_id][offset + index] = pos_y;										index++;
		this.vbuffer[cam_id][texture_id][offset + index] = 1;											index++;
		this.vbuffer[cam_id][texture_id][offset + index] = 1;											index++;
		this.vbuffer[cam_id][texture_id][offset + index] = scale_x;										index++;
		this.vbuffer[cam_id][texture_id][offset + index] = scale_y;										index++;
		this.vbuffer[cam_id][texture_id][offset + index] = tint_h_1;									index++;
		this.vbuffer[cam_id][texture_id][offset + index] = tint_s_1;									index++;
		this.vbuffer[cam_id][texture_id][offset + index] = tint_l_1;									index++;
		this.vbuffer[cam_id][texture_id][offset + index] = tint_a_1;									index++;

		// + + top right

		this.vbuffer[cam_id][texture_id][offset + index] = a_cos * (+width2) - a_sin * (+height2);		index++;
		this.vbuffer[cam_id][texture_id][offset + index] = a_sin * (+width2) + a_cos * (+height2);		index++;
		this.vbuffer[cam_id][texture_id][offset + index] = pos_x;										index++;
		this.vbuffer[cam_id][texture_id][offset + index] = pos_y;										index++;
		this.vbuffer[cam_id][texture_id][offset + index] = 0;											index++;
		this.vbuffer[cam_id][texture_id][offset + index] = 1;											index++;
		this.vbuffer[cam_id][texture_id][offset + index] = scale_x;										index++;
		this.vbuffer[cam_id][texture_id][offset + index] = scale_y;										index++;
		this.vbuffer[cam_id][texture_id][offset + index] = tint_h_2;									index++;
		this.vbuffer[cam_id][texture_id][offset + index] = tint_s_2;									index++;
		this.vbuffer[cam_id][texture_id][offset + index] = tint_l_2;									index++;
		this.vbuffer[cam_id][texture_id][offset + index] = tint_a_2;									index++;

		// + - bottom right

		this.vbuffer[cam_id][texture_id][offset + index] = a_cos * (+width2) - a_sin * (-height2);		index++;
		this.vbuffer[cam_id][texture_id][offset + index] = a_sin * (+width2) + a_cos * (-height2);		index++;
		this.vbuffer[cam_id][texture_id][offset + index] = pos_x;										index++;
		this.vbuffer[cam_id][texture_id][offset + index] = pos_y;										index++;
		this.vbuffer[cam_id][texture_id][offset + index] = 0;											index++;
		this.vbuffer[cam_id][texture_id][offset + index] = 0;											index++;
		this.vbuffer[cam_id][texture_id][offset + index] = scale_x;										index++;
		this.vbuffer[cam_id][texture_id][offset + index] = scale_y;										index++;
		this.vbuffer[cam_id][texture_id][offset + index] = tint_h_3;									index++;
		this.vbuffer[cam_id][texture_id][offset + index] = tint_s_3;									index++;
		this.vbuffer[cam_id][texture_id][offset + index] = tint_l_3;									index++;
		this.vbuffer[cam_id][texture_id][offset + index] = tint_a_3;									index++;

		// - + top left

		this.vbuffer[cam_id][texture_id][offset + index] = a_cos * (-width2) - a_sin * (+height2);		index++;
		this.vbuffer[cam_id][texture_id][offset + index] = a_sin * (-width2) + a_cos * (+height2);		index++;
		this.vbuffer[cam_id][texture_id][offset + index] = pos_x;										index++;
		this.vbuffer[cam_id][texture_id][offset + index] = pos_y;										index++;
		this.vbuffer[cam_id][texture_id][offset + index] = 1;											index++;
		this.vbuffer[cam_id][texture_id][offset + index] = 1;											index++;
		this.vbuffer[cam_id][texture_id][offset + index] = scale_x;										index++;
		this.vbuffer[cam_id][texture_id][offset + index] = scale_y;										index++;
		this.vbuffer[cam_id][texture_id][offset + index] = tint_h_1;									index++;
		this.vbuffer[cam_id][texture_id][offset + index] = tint_s_1;									index++;
		this.vbuffer[cam_id][texture_id][offset + index] = tint_l_1;									index++;
		this.vbuffer[cam_id][texture_id][offset + index] = tint_a_1;									index++;

		// + - bottom right

		this.vbuffer[cam_id][texture_id][offset + index] = a_cos * (+width2) - a_sin * (-height2);		index++;
		this.vbuffer[cam_id][texture_id][offset + index] = a_sin * (+width2) + a_cos * (-height2);		index++;
		this.vbuffer[cam_id][texture_id][offset + index] = pos_x;										index++;
		this.vbuffer[cam_id][texture_id][offset + index] = pos_y;										index++;
		this.vbuffer[cam_id][texture_id][offset + index] = 0;											index++;
		this.vbuffer[cam_id][texture_id][offset + index] = 0;											index++;
		this.vbuffer[cam_id][texture_id][offset + index] = scale_x;										index++;
		this.vbuffer[cam_id][texture_id][offset + index] = scale_y;										index++;
		this.vbuffer[cam_id][texture_id][offset + index] = tint_h_3;									index++;
		this.vbuffer[cam_id][texture_id][offset + index] = tint_s_3;									index++;
		this.vbuffer[cam_id][texture_id][offset + index] = tint_l_3;									index++;
		this.vbuffer[cam_id][texture_id][offset + index] = tint_a_3;									index++;

		// - - bottom left

		this.vbuffer[cam_id][texture_id][offset + index] = a_cos * (-width2) - a_sin * (-height2);		index++;
		this.vbuffer[cam_id][texture_id][offset + index] = a_sin * (-width2) + a_cos * (-height2);		index++;
		this.vbuffer[cam_id][texture_id][offset + index] = pos_x;										index++;
		this.vbuffer[cam_id][texture_id][offset + index] = pos_y;										index++;
		this.vbuffer[cam_id][texture_id][offset + index] = 1;											index++;
		this.vbuffer[cam_id][texture_id][offset + index] = 0;											index++;
		this.vbuffer[cam_id][texture_id][offset + index] = scale_x;										index++;
		this.vbuffer[cam_id][texture_id][offset + index] = scale_y;										index++;
		this.vbuffer[cam_id][texture_id][offset + index] = tint_h_4;									index++;
		this.vbuffer[cam_id][texture_id][offset + index] = tint_s_4;									index++;
		this.vbuffer[cam_id][texture_id][offset + index] = tint_l_4;									index++;
		this.vbuffer[cam_id][texture_id][offset + index] = tint_a_4;									index++;

		this.buffer_counter[cam_id][texture_id]++;

	};

	this.update_color_scheme = function(value)
	{
		gl.useProgram(this.program);
		gl.uniform1f(this.program.uHueStart, 			lp.color_scheme.hue_start);
		gl.uniform1f(this.program.uHueShift, 			lp.color_scheme.hue_shift);
		gl.uniform1f(this.program.uHueShiftExponent, 	lp.color_scheme.hue_shift_exponent);
		gl.uniform1f(this.program.uHue2Start, 			lp.color_scheme.hue2_start);
		gl.uniform1f(this.program.uHue2Shift, 			lp.color_scheme.hue2_shift);
		gl.uniform1f(this.program.uHue2ShiftExponent, 	lp.color_scheme.hue2_shift_exponent);
		gl.uniform1f(this.program.uLumPart1, 			lp.color_scheme.lum_part1);
		gl.uniform1f(this.program.uLumPart1Exponent, 	lp.color_scheme.lum_part1_exponent);
		gl.uniform1f(this.program.uLumPart2, 			lp.color_scheme.lum_part2);
		gl.uniform1f(this.program.uLumPart2Exponent, 	lp.color_scheme.lum_part2_exponent);
		gl.uniform1f(this.program.uSaturation, 			lp.color_scheme.saturation);
		gl.uniform1f(this.program.uSaturation2, 		lp.color_scheme.saturation2);
	}


	this.flush_all = function(texture_L_id, texture_R_id, texture_L2_id, texture_R2_id, volume_L, volume_R)
	{
		if (!this.something_to_draw)
		{
			return;
		}
		gl.useProgram(this.program);
		gl.enableVertexAttribArray(this.program.aVertexPosition);
		gl.enableVertexAttribArray(this.program.aTexPosition);
		gl.enableVertexAttribArray(this.program.aTexScale);
		gl.enableVertexAttribArray(this.program.aPosition);
		gl.enableVertexAttribArray(this.program.aColor);

		for (var camera_id = 0, len1 = this.cameras.length; camera_id < len1; camera_id++)
		//for (var camera_id in cameras)
		{
			for (var texture_id = 0, len2 = this.vbuffer[camera_id].length; texture_id < len2; texture_id++)
			//for (var texture_id in this.vbuffer[camera_id])
			{
				this.flush(camera_id, texture_id, texture_L_id, texture_R_id, texture_L2_id, texture_R2_id, volume_L, volume_R);
			}
		}
		gl.disableVertexAttribArray(this.program.aVertexPosition);
		gl.disableVertexAttribArray(this.program.aTexPosition);
		gl.disableVertexAttribArray(this.program.aTexScale);
		gl.disableVertexAttribArray(this.program.aPosition);
		gl.disableVertexAttribArray(this.program.aColor);
		this.something_to_draw = false;
	}


	this.flush = function(camera_id, texture_id, texture_L_id, texture_R_id, volume_L, volume_R)
	{
		if (!this.buffer_counter[camera_id][texture_id])
		{
			return;
		}

		var camera = cameras[camera_id];

		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
		gl.bufferData(gl.ARRAY_BUFFER,
			this.vbuffer[camera_id][texture_id].subarray(0, this.buffer_counter[camera_id][texture_id] * this.magic_number),
			gl.STATIC_DRAW);

		gl.vertexAttribPointer(this.program.aVertexPosition,	2, gl.FLOAT,	false,	48, 0);
		gl.vertexAttribPointer(this.program.aPosition,			2, gl.FLOAT,	false,	48, 8);
		gl.vertexAttribPointer(this.program.aTexPosition,		2, gl.FLOAT,	false,	48, 16);
		gl.vertexAttribPointer(this.program.aTexScale,			2, gl.FLOAT,	false,	48, 24);
		gl.vertexAttribPointer(this.program.aColor, 			4, gl.FLOAT,	false,	48, 32);

		gl.uniform2fv(this.program.uCamPosition,camera.pos);
		gl.uniform2fv(this.program.uCamZoom, 	camera.zoom);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, textures[texture_id]);

		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, textures[texture_L_id]);

		gl.activeTexture(gl.TEXTURE2);
		gl.bindTexture(gl.TEXTURE_2D, textures[texture_R_id]);

		gl.uniform1f(this.program.uVolumeL, 				volume_L);
		gl.uniform1f(this.program.uVolumeR, 				volume_R);

		var	numItems = this.buffer_counter[camera_id][texture_id] * this.vertices_per_object;

		//gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
		//gl.viewport(0, 0, this.framebuffer_texture_size, this.framebuffer_texture_size);
		//gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textures[this.framebuffer_texture], 0);

		gl.drawArrays(gl.TRIANGLES,	0, numItems);

		//gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		//gl.viewport(0, 0, webgl.canvas.width, webgl.canvas.height);

		this.buffer_counter[camera_id][texture_id] = 0;
	};
}