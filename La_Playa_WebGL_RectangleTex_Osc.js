"use strict";

µ.WebGL_Rectangle_Textured_Osc = function(webgl, gl, cameras, textures, framebuffer_texture_size)
{
	this.something_to_draw = false;

	this.allocation_chunk_size = 1;
	this.vertices_per_object = 6;
	this.attributes_per_object = 6;
	this.magic_number = this.vertices_per_object * this.attributes_per_object;

	this.vbuffer = {};
	this.buffer_counter = {};
	this.buffer_max = {};

	this.cameras = cameras;

	for (var i = 0; i < cameras.length; i++)
	{
		this.vbuffer[i] = new Float32Array(this.magic_number * this.allocation_chunk_size);
		this.buffer_counter[i] = 0;
		this.buffer_max[i] = this.allocation_chunk_size;
	}

	this.framebuffer = gl.createFramebuffer();
	this.framebuffer_texture_size = framebuffer_texture_size;
	this.framebuffer_texture = webgl.empty_texture(this.framebuffer_texture_size, true, false);

	this.program = gl.createProgram();
	this.buffer = gl.createBuffer();

	this.vertex_shader = ["",

`

	attribute	vec2	aVertexPosition;
	attribute	vec2	aTexPosition;
	attribute	vec2	aPosition;

	uniform	vec2	uCamPosition;
	uniform	vec2	uCamZoom;
	varying	vec2	vPosition;

	varying	highp vec2	vTexPosition;

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
	}

`,

	""].join('\n');

	this.fragment_shader = ["",

`

//	precision highp	float;
	precision mediump	float;

	uniform 		sampler2D 	uSampler;
	uniform 		sampler2D 	uSampler_L;
	uniform 		sampler2D 	uSampler_R;

	uniform 		float 		uDataTextureSize;
	uniform			float		uScaleY;

	uniform			float		uVolumeL;
	uniform			float		uVolumeR;

	varying			vec2		vPosition;
	varying	highp	vec2		vTexPosition;

`,

	bxx_shader_includes.colors + "\n",
	bxx_shader_includes.color_scheme + "\n",
	bxx_shader_includes.read_data_texture + "\n",

`
// g-d help us


float amplify(float value, float factor)
{
	if (value > 0.0)
	{
		return (1.0 - pow(1.0 - value, factor));
	}
	else
	{
		value *= -1.0;
		value = (1.0 - pow(1.0 - value, factor));
		return (value * -1.0);
	}
}


void main()
{
	float tex_pos_x = 0.0;
	float value_here  = 0.0;
	float value_L  = 0.0;
	float value_R  = 0.0;
	float texture_step = 1.0 / (uDataTextureSize * uDataTextureSize * 4.0);
	float volume_here = 0.0;
	if (vTexPosition[0] < 0.5)
	{
		tex_pos_x = (0.5 - vTexPosition[0]) * 2.0;
		value_here = (get_data_pixel(uSampler_L, uDataTextureSize, tex_pos_x));
		value_L = (get_data_pixel(uSampler_L, uDataTextureSize, tex_pos_x - texture_step));
		value_R = (get_data_pixel(uSampler_L, uDataTextureSize, tex_pos_x + texture_step));
		volume_here = uVolumeL;
	}
	else
	{
		tex_pos_x = (vTexPosition[0] - 0.5) * 2.0;
		value_here = (get_data_pixel(uSampler_R, uDataTextureSize, tex_pos_x));
		value_L = (get_data_pixel(uSampler_R, uDataTextureSize, tex_pos_x - texture_step));
		value_R = (get_data_pixel(uSampler_R, uDataTextureSize, tex_pos_x + texture_step));
		volume_here = uVolumeR;
	}


	float temp_hue = value_here;
	float dist_from_edges = 1.0 - abs(tex_pos_x - 0.5) * 2.0;
	float dist_from_edges1 = 1.0 - dist_from_edges;
	float fade_edges = (1.0 - pow((tex_pos_x - 0.5) * 2.0, 2.0));
	float fade_edges2 = (1.0 - pow((tex_pos_x - 0.5) * 2.0, 4.0));
	float fade_edges3 = (1.0 - pow((tex_pos_x - 0.5) * 2.0, 6.0));
	float scale_y = uScaleY;
	scale_y = (scale_y * 0.5 / pow((fade_edges + fade_edges2) * 1.0, 2.95)) * 1.5;
	float pos_y = (vTexPosition[1] * 2.0 - 1.0) * scale_y;

	value_here = amplify(value_here, 2.0 / dist_from_edges);
	value_L = amplify(value_L, 2.0 / dist_from_edges);
	value_R = amplify(value_R, 2.0 / dist_from_edges);


	float dist = abs(value_here - pos_y) / scale_y;

	float dist_R = abs(value_R - pos_y) / scale_y;
	float dist_L = abs(value_L - pos_y) / scale_y;
	float dist_from_middle = abs(pos_y);
	float dist2 = min(dist, min(dist_L, dist_R));
	float dist_from_neighbours = (abs(dist - dist_L) + abs(dist - dist_R)) * 0.5;
	float thickness = scale_y * ((100.0 * volume_here + 0.95) - fade_edges2 * (100.0 * volume_here)) +
			(
				+ 1.125
				+ 2.5 * pow(0.5 + dist * .5, 2.0)
				+ 2.5 * pow(1.25 * fade_edges * fade_edges, 2.0) * fade_edges2
				+ 1.125 * pow(dist2 * 0.5 + dist_from_middle * 0.5, 2.0) * fade_edges
				+ 1.125 * dist * fade_edges2
			)
		*
			(
					((1.0 - dist + dist_from_middle) * 0.125)
				/
					(0.005 + (pow((1.0 - 0.5 * value_here), 2.0)) * 1.85)
			)
		;
	float value_here_abs = abs(value_here);
	thickness *= 2.0 - 1.25 * (1.0 - dist);
	thickness = max(0.025 + value_here_abs * 0.5, thickness) + 0.05;
	//if (dist2 > thickness)
	{
		float fade = pow(1.0 - dist2 / thickness, 1.0 - 0.25 * dist2);
		fade = pow(fade, 2.5 - volume_here * 1.75) * (1.0 - 0.75 * (dist_from_edges1 * dist_from_edges1 * dist_from_edges1 * dist_from_edges1));
		float fade1 = fade * (1.0 - dist_from_edges * dist_from_edges * 0.0125);
		float fade2 = fade * (1.0 - dist_from_middle * dist_from_middle * 0.05);
		gl_FragColor[0] = fade1 * dist_from_edges + (1.0 - dist_from_edges) * fade2;
		gl_FragColor[1] = 1.0;
		gl_FragColor[2] += pow(fade * 1.5, 0.25);
		gl_FragColor[3] = 1.0;
	}
	gl_FragColor[0] *= 1.0 + 0.025 * dist_from_neighbours;
	gl_FragColor[2] *= 1.0 + 0.05 * dist_from_neighbours;

	if (pos_y > value_L && pos_y < value_R)
	{
		//gl_FragColor[0] *= 1.125 / (min(abs(pos_y - value_L), abs(pos_y - value_R)));
		gl_FragColor[0] += 0.25 * dist_from_edges * dist_from_edges;
		gl_FragColor[2] += 0.5 * dist_from_edges * dist_from_edges;
	}

	if (pos_y < value_L && pos_y > value_R)
	{
		gl_FragColor[0] += 0.25 * dist_from_edges * dist_from_edges;
		gl_FragColor[2] += 0.5 * dist_from_edges * dist_from_edges;
	}

	gl_FragColor[0] = clamp(gl_FragColor[0], 0.0, 1.0);
	gl_FragColor[2] = clamp(gl_FragColor[2], 0.0, 1.0);


	vec4 color1 = apply_color_scheme_parameters(gl_FragColor,
					(uHueStart - pow(1.0 - 0.5 * value_here_abs, 2.0) * 2.0) / ((pow(value_here_abs, 1.5) + 1.75) / 2.75) + (1.0 - fade_edges) * 3.0 * (1.0 - 2.0 * value_here_abs),
					uHueShift * (0.1 + value_here * pow(fade_edges, fade_edges2) * 0.9),
					1.15 - (1.05 + 1.5 * value_here_abs) * pow(1.0 - fade_edges * 0.25, 0.05),
					uLumPart1,
					uLumPart1Exponent,
					uLumPart2,
					uLumPart2Exponent,
					uSaturation * 1.0 / (4.0 + 0.194 * value_here_abs * dist2) / (0.25 + 0.25 * fade_edges3 + 0.25 * fade_edges + 0.25 * fade_edges2));

	vec4 color2 = apply_color_scheme(color1);
	gl_FragColor = color2;
	gl_FragColor[3] = pow(gl_FragColor[0], 1.0 - 0.5 * dist);
	gl_FragColor[0] = clamp(gl_FragColor[0], 0.0, 1.0);
	gl_FragColor[1] = clamp(gl_FragColor[1], 0.0, 1.0);
	gl_FragColor[2] = clamp(gl_FragColor[2], 0.0, 1.0);
	gl_FragColor[3] = clamp(gl_FragColor[3], 0.0, 1.0);
}
`,

	""].join('\n');

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
	this.program.aPosition			= gl.getAttribLocation(this.program, "aPosition");

	this.program.uScaleY			= gl.getUniformLocation(this.program, "uScaleY");

	this.program.uVolumeL			= gl.getUniformLocation(this.program, "uVolumeL");
	this.program.uVolumeR			= gl.getUniformLocation(this.program, "uVolumeR");

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
	gl.uniform1i(this.program.uSampler_L, 			0);
	gl.uniform1i(this.program.uSampler_R, 			1);
	
	// fix this being hardcoded...
	gl.uniform1f(this.program.uDataTextureSize, 	16);

	gl.uniform1f(this.program.uScaleY, 				14.0);

	gl.errorCheck('setup rectangles_tex');

	this.draw = function(cam_id, pos_x, pos_y, width, height)
	{
		var
			width2 = width,
			height2 = height;

		this.something_to_draw = true;

		 // angle == 90
		var a_cos = -1;
		var a_sin = 0;

		if (this.buffer_counter[cam_id] == this.buffer_max[cam_id])
		{
			this.vbuffer[cam_id] = Float32Concat(this.vbuffer[cam_id], new Float32Array(this.magic_number * this.allocation_chunk_size));
			this.buffer_max[cam_id] += this.allocation_chunk_size;
		}

		var offset = this.buffer_counter[cam_id] * this.magic_number;

		var index = 0;

		// - + top left
		this.vbuffer[cam_id][offset + index] = a_cos * (-width2) - a_sin * (+height2);		index++;
		this.vbuffer[cam_id][offset + index] = a_sin * (-width2) + a_cos * (+height2);		index++;
		this.vbuffer[cam_id][offset + index] = pos_x;										index++;
		this.vbuffer[cam_id][offset + index] = pos_y;										index++;
		this.vbuffer[cam_id][offset + index] = 1;											index++;
		this.vbuffer[cam_id][offset + index] = 1;											index++;

		// + + top right

		this.vbuffer[cam_id][offset + index] = a_cos * (+width2) - a_sin * (+height2);		index++;
		this.vbuffer[cam_id][offset + index] = a_sin * (+width2) + a_cos * (+height2);		index++;
		this.vbuffer[cam_id][offset + index] = pos_x;										index++;
		this.vbuffer[cam_id][offset + index] = pos_y;										index++;
		this.vbuffer[cam_id][offset + index] = 0;											index++;
		this.vbuffer[cam_id][offset + index] = 1;											index++;

		// + - bottom right

		this.vbuffer[cam_id][offset + index] = a_cos * (+width2) - a_sin * (-height2);		index++;
		this.vbuffer[cam_id][offset + index] = a_sin * (+width2) + a_cos * (-height2);		index++;
		this.vbuffer[cam_id][offset + index] = pos_x;										index++;
		this.vbuffer[cam_id][offset + index] = pos_y;										index++;
		this.vbuffer[cam_id][offset + index] = 0;											index++;
		this.vbuffer[cam_id][offset + index] = 0;											index++;

		// - + top left

		this.vbuffer[cam_id][offset + index] = a_cos * (-width2) - a_sin * (+height2);		index++;
		this.vbuffer[cam_id][offset + index] = a_sin * (-width2) + a_cos * (+height2);		index++;
		this.vbuffer[cam_id][offset + index] = pos_x;										index++;
		this.vbuffer[cam_id][offset + index] = pos_y;										index++;
		this.vbuffer[cam_id][offset + index] = 1;											index++;
		this.vbuffer[cam_id][offset + index] = 1;											index++;

		// + - bottom right

		this.vbuffer[cam_id][offset + index] = a_cos * (+width2) - a_sin * (-height2);		index++;
		this.vbuffer[cam_id][offset + index] = a_sin * (+width2) + a_cos * (-height2);		index++;
		this.vbuffer[cam_id][offset + index] = pos_x;										index++;
		this.vbuffer[cam_id][offset + index] = pos_y;										index++;
		this.vbuffer[cam_id][offset + index] = 0;											index++;
		this.vbuffer[cam_id][offset + index] = 0;											index++;

		// - - bottom left

		this.vbuffer[cam_id][offset + index] = a_cos * (-width2) - a_sin * (-height2);		index++;
		this.vbuffer[cam_id][offset + index] = a_sin * (-width2) + a_cos * (-height2);		index++;
		this.vbuffer[cam_id][offset + index] = pos_x;										index++;
		this.vbuffer[cam_id][offset + index] = pos_y;										index++;
		this.vbuffer[cam_id][offset + index] = 1;											index++;
		this.vbuffer[cam_id][offset + index] = 0;											index++;

		this.buffer_counter[cam_id]++;

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


	this.flush_all = function(texture_L_id, texture_R_id, volume_L, volume_R)
	{
		if (!this.something_to_draw)
		{
			return;
		}
		gl.useProgram(this.program);
		gl.enableVertexAttribArray(this.program.aVertexPosition);
		gl.enableVertexAttribArray(this.program.aTexPosition);
		gl.enableVertexAttribArray(this.program.aPosition);

		for (var camera_id = 0, len1 = this.cameras.length; camera_id < len1; camera_id++)
		//for (var camera_id in cameras)
		{
			this.flush(camera_id, texture_L_id, texture_R_id, volume_L, volume_R);
		}
		gl.disableVertexAttribArray(this.program.aVertexPosition);
		gl.disableVertexAttribArray(this.program.aTexPosition);
		gl.disableVertexAttribArray(this.program.aPosition);
		this.something_to_draw = false;
	}


	this.flush = function(camera_id, texture_L_id, texture_R_id, volume_L, volume_R)
	{
		if (!this.buffer_counter[camera_id])
		{
			return;
		}
		var camera = cameras[camera_id];

		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
		gl.bufferData(gl.ARRAY_BUFFER,
			this.vbuffer[camera_id].subarray(0, this.buffer_counter[camera_id] * this.magic_number),
			gl.STATIC_DRAW);

		gl.vertexAttribPointer(this.program.aVertexPosition,	2, gl.FLOAT,	false,	24, 0);
		gl.vertexAttribPointer(this.program.aPosition,			2, gl.FLOAT,	false,	24, 8);
		gl.vertexAttribPointer(this.program.aTexPosition,		2, gl.FLOAT,	false,	24, 16);

		gl.uniform2fv(this.program.uCamPosition,camera.pos);
		gl.uniform2fv(this.program.uCamZoom, 	camera.zoom);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, textures[texture_L_id]);
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, textures[texture_R_id]);

		gl.uniform1f(this.program.uVolumeL, 				volume_L);
		gl.uniform1f(this.program.uVolumeR, 				volume_R);

		var	numItems = this.buffer_counter[camera_id] * this.vertices_per_object;

		gl.drawArrays(gl.TRIANGLES,	0, numItems);

		this.buffer_counter[camera_id] = 0;
	};
}
