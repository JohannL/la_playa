"use strict";

µ.WebGL_Framebuffer_Pingpong_Osc = function(c, gl, cameras, textures, texture_size)
{
	this.grab_buffer_plz = null;
	this.c = c;
	this.framebuffer = gl.createFramebuffer();
	this.texture_size = texture_size;
	this.texture_step = 1 / texture_size;
	this.current_texture = c.empty_float_texture(texture_size);
	this.other_texture = c.empty_float_texture(texture_size);
	this.vertices_per_object = 6;
	this.attributes_per_object = 4;
	this.magic_number = this.vertices_per_object * this.attributes_per_object;
	this.vbuffer = new Float32Array(this.magic_number);
	this.program = gl.createProgram();
	this.buffer = gl.createBuffer();

	this.minDecibels = -120;

	this.vertex_shader = ["",
(function () {/*
	attribute		vec2		aVertexPosition;
	attribute		vec2		aTexPosition;
	attribute		vec2		aPosition;
	varying			vec2		vTexPosition;
	const 			vec2 		madd = vec2(0.5,0.5);
	void main()
	{
		gl_Position = vec4(	(aVertexPosition[0]),
							(aVertexPosition[1]),
							0.0, 1.0);
		vTexPosition = aTexPosition;
		vTexPosition = (aVertexPosition * madd) + madd;
		vTexPosition[1] = 1.0 - vTexPosition[1];
	}
*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1],
	""].join('\n');

	this.fragment_shader = `

//	precision highp	float;
	precision mediump	float;

	uniform			float		uBaseSpeed;
	uniform			float		uPosSpeed;
	uniform			float		uMeltSpeed;
	uniform			float		uMeltSpeedExponent;

	uniform			float		uPosFactorFactor;
	uniform			float		uPosFactorExponent;

	uniform			float		uTextureStep;
	uniform			float		uTextureSize;

	uniform 		sampler2D 	uSampler;
	uniform 		sampler2D 	uSampler_L;
	uniform 		sampler2D 	uSampler_R;

	uniform 		float 		uDataTextureSize;
	uniform			float		uMinDecibels;

	uniform			float		uMinL;
	uniform			float		uMaxL;
	uniform			float		uAvgL;
	uniform			float		uSumL;

	uniform			float		uMinR;
	uniform			float		uMaxR;
	uniform			float		uAvgR;
	uniform			float		uSumR;

	varying		vec2		vTexPosition;

${bxx_shader_includes.colors}
${bxx_shader_includes.color_scheme}
${bxx_shader_includes.read_data_texture}

void main()
{
	float uTextureStep2 = uTextureStep / 2.0;
	float pixel_x = gl_FragCoord[0] - 0.5;
	float pixel_y = gl_FragCoord[1] - 0.5;

	float texture_step = 1.0 / (uDataTextureSize * uDataTextureSize * 4.0);

	float value_here  = 0.0;
	float value_L  = 0.0;
	float value_R  = 0.0;
	float old_value_here  = 0.0;

	float frac_x = pixel_x * uTextureStep;
	float tex_pos_x = 0.0;

	float fade_edges = (1.0 - pow((tex_pos_x - 0.5) * 2.0, 2.0));
	float fade_edges2 = (1.0 - pow((tex_pos_x - 0.5) * 2.0, 3.0));
	float fade_edges3 = (1.0 - pow((tex_pos_x - 0.5) * 2.0, 4.0));

	float scale_y = 14.0 * 0.3 / pow((fade_edges + fade_edges2) * 1.0, 1.8);

	float pos_y = - (vTexPosition[1] * 2.0 - 1.0) * scale_y;
	float tex_pos_y = (0.5 - vTexPosition[1]) * 2.0;

	if (vTexPosition[0] < 0.5)
	{
		tex_pos_x = (0.5 - vTexPosition[0]) * 2.0;
		value_here = get_data_pixel(uSampler_L, uDataTextureSize, tex_pos_x);
		value_L = get_data_pixel(uSampler_L, uDataTextureSize, tex_pos_x - texture_step);
		value_R = get_data_pixel(uSampler_L, uDataTextureSize, tex_pos_x + texture_step);
	}
	else
	{
		tex_pos_x = (vTexPosition[0] - 0.5) * 2.0;
		value_here = get_data_pixel(uSampler_R, uDataTextureSize, tex_pos_x);
		value_L = get_data_pixel(uSampler_R, uDataTextureSize, tex_pos_x - texture_step);
		value_R = get_data_pixel(uSampler_R, uDataTextureSize, tex_pos_x + texture_step);
	}

	float dist_from_edges = 1.0 - abs(tex_pos_x - 0.5) * 1.0;
	float dist_from_edges1 = 1.0 - dist_from_edges;
	float dist = abs(value_here - pos_y) / scale_y;

	vec2 tex_pos = vec2(uTextureStep2 + pixel_x * uTextureStep, uTextureStep2 + pixel_y * uTextureStep);
	vec4 texColor = texture2D(uSampler, vec2(tex_pos[0], tex_pos[1]));

	float dist2 = 0.5 * min(1.0, 1.0 - dist);

	gl_FragColor[0] = dist2;
	gl_FragColor[1] = dist2;
	gl_FragColor[2] = dist2;
	gl_FragColor[3] = 1.0;

	gl_FragColor[0] = max(gl_FragColor[0], texColor[0] * 0.9999999995);
	gl_FragColor[1] = max(gl_FragColor[1], texColor[1] * 0.999999975);
	gl_FragColor[2] = max(gl_FragColor[2], texColor[2] * 0.999975);
	gl_FragColor[3] = max(gl_FragColor[3], texColor[3] * 0.99995);

	gl_FragColor[0] = clamp(gl_FragColor[0], 0.0, 1.0);
	gl_FragColor[1] = clamp(gl_FragColor[1], 0.0, 1.0);
	gl_FragColor[2] = clamp(gl_FragColor[2], 0.0, 1.0);
	gl_FragColor[3] = clamp(gl_FragColor[3], 0.0, 1.0);

	gl_FragColor = texColor;

	gl_FragColor[0] = 1.0;
	gl_FragColor[1] = 1.0;
	gl_FragColor[2] = 0.0;
	gl_FragColor[3] = 1.0;
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
/*
	gl.ValidateProgram(this.program);
	if (!gl.GetProgramParameter(this.program, gl.VALIDATE_STATUS))
		console.log(gl.getProgramInfoLog(this.program));
*/
	gl.useProgram(this.program);

	this.program.aVertexPosition		= gl.getAttribLocation(this.program, "aVertexPosition");
	this.program.aTexPosition			= gl.getAttribLocation(this.program, "aTexPosition");

	this.program.uSampler				= gl.getUniformLocation(this.program, "uSampler");
	this.program.uSampler_L				= gl.getUniformLocation(this.program, "uSampler_L");
	this.program.uSampler_R				= gl.getUniformLocation(this.program, "uSampler_R");

	this.program.uPosFactorFactor		= gl.getUniformLocation(this.program, "uPosFactorFactor");
	this.program.uPosFactorExponent		= gl.getUniformLocation(this.program, "uPosFactorExponent");

	this.program.uBaseSpeed				= gl.getUniformLocation(this.program, "uBaseSpeed");
	this.program.uPosSpeed				= gl.getUniformLocation(this.program, "uPosSpeed");
	this.program.uMeltSpeed				= gl.getUniformLocation(this.program, "uMeltSpeed");
	this.program.uMeltSpeedExponent		= gl.getUniformLocation(this.program, "uMeltSpeedExponent");

	this.program.uTextureStep			= gl.getUniformLocation(this.program, "uTextureStep");
	this.program.uTextureSize			= gl.getUniformLocation(this.program, "uTextureSize");

	this.program.uCamPosition			= gl.getUniformLocation(this.program, "uCamPosition");
	this.program.uCamZoom				= gl.getUniformLocation(this.program, "uCamZoom");

	this.program.uDataTextureSize		= gl.getUniformLocation(this.program, "uDataTextureSize");
	this.program.uMinDecibels			= gl.getUniformLocation(this.program, "uMinDecibels");

	this.program.uMinL					= gl.getUniformLocation(this.program, "uMinL");
	this.program.uMaxL					= gl.getUniformLocation(this.program, "uMaxL");
	this.program.uAvgL					= gl.getUniformLocation(this.program, "uAvgL");
	this.program.uSumL					= gl.getUniformLocation(this.program, "uSumL");

	this.program.uMinR					= gl.getUniformLocation(this.program, "uMinR");
	this.program.uMaxR					= gl.getUniformLocation(this.program, "uMaxR");
	this.program.uAvgR					= gl.getUniformLocation(this.program, "uAvgR");
	this.program.uSumR					= gl.getUniformLocation(this.program, "uSumR");

	// set the vars that never change
	gl.uniform1i(this.program.uSampler, 			0);
	gl.uniform1i(this.program.uSampler_L, 			1);
	gl.uniform1i(this.program.uSampler_R, 			2);

	gl.uniform1f(this.program.uDataTextureSize, 	16);

	gl.errorCheck('setup framebuffer  pingpong');

	this.setup_vbuffer = function()
	{

		var
			pos_x = 0.5,
			pos_y = 0.5,
			width = 1.0,
			height = 1.0,
			inc = 0;

		// - + top left
		this.vbuffer[inc] = -width;		inc++;
		this.vbuffer[inc] = +height;	inc++;
		this.vbuffer[inc] = 1;			inc++;
		this.vbuffer[inc] = 1;			inc++;

		// + + top right
		this.vbuffer[inc] = +width;		inc++;
		this.vbuffer[inc] = +height;	inc++;
		this.vbuffer[inc] = 0;			inc++;
		this.vbuffer[inc] = 1;			inc++;

		// + - bottom right
		this.vbuffer[inc] = +width;		inc++;
		this.vbuffer[inc] = -height;	inc++;
		this.vbuffer[inc] = 0;			inc++;
		this.vbuffer[inc] = 0;			inc++;

		// - + top left
		this.vbuffer[inc] = -width;		inc++;
		this.vbuffer[inc] = +height;	inc++;
		this.vbuffer[inc] = 1;			inc++;
		this.vbuffer[inc] = 1;			inc++;

		// + - bottom right
		this.vbuffer[inc] = +width;		inc++;
		this.vbuffer[inc] = -height;	inc++;
		this.vbuffer[inc] = 0;			inc++;
		this.vbuffer[inc] = 0;			inc++;

		// - - bottom left
		this.vbuffer[inc] = -width;		inc++;
		this.vbuffer[inc] = -height;	inc++;
		this.vbuffer[inc] = 1;			inc++;
		this.vbuffer[inc] = 0;			inc++;

	};

	this.set_melt_speed = function(value)
	{
		gl.useProgram(this.program);
		gl.uniform1f(this.program.uMeltSpeed, 	value);
	}
	this.set_melt_speed_exponent = function(value)
	{
		gl.useProgram(this.program);
		gl.uniform1f(this.program.uMeltSpeedExponent, 	value);
	}
	this.set_base_speed = function(value)
	{
		gl.useProgram(this.program);
		gl.uniform1f(this.program.uBaseSpeed, 	value);
	}
	this.set_position_speed = function(value)
	{
		gl.useProgram(this.program);
		gl.uniform1f(this.program.uPosSpeed, 	value);
	}
	this.set_position_exponent = function(value)
	{
		gl.useProgram(this.program);
		gl.uniform1f(this.program.uPosFactorExponent, 	value);
	}
	this.set_position_factor = function(value)
	{
		gl.useProgram(this.program);
		gl.uniform1f(this.program.uPosFactorFactor, 	value);
	}

	this.resize_textures = function(new_texture_size)
	{
		this.texture_size = new_texture_size;
		this.texture_step = 1 / new_texture_size;
		gl.deleteTexture(textures[this.current_texture]);
		gl.deleteTexture(textures[this.other_texture]);
		this.current_texture = c.empty_float_texture(new_texture_size);
		this.other_texture = c.empty_float_texture(new_texture_size);
	}

	this.process_steps = function(step_count, texture_L_id, texture_R_id, minL, maxL, avgL, sumL, minR, maxR, avgR, sumR)
	{

		gl.useProgram(this.program);
		gl.enableVertexAttribArray(this.program.aVertexPosition);
		gl.enableVertexAttribArray(this.program.aTexPosition);
		gl.enableVertexAttribArray(this.program.aPosition);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
		gl.bufferData(gl.ARRAY_BUFFER, this.vbuffer, gl.STATIC_DRAW);

		gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
		gl.viewport(0, 0, this.texture_size, this.texture_size);

		gl.vertexAttribPointer(this.program.aVertexPosition,	2, gl.FLOAT,	false,	16, 0);
		gl.vertexAttribPointer(this.program.aTexPosition,		2, gl.FLOAT,	false,	16, 8);

		gl.uniform1f(this.program.uTextureStep, 	this.texture_step);
		gl.uniform1f(this.program.uTextureSize, 	this.texture_size);

		//console.log(sumL, sumR);

		gl.uniform1f(this.program.uMinDecibels, 	this.minDecibels);

		gl.uniform1f(this.program.uSumL, 	sumL);
		gl.uniform1f(this.program.uMinL, 	Math.abs(0.5 - minL) * 2);
		gl.uniform1f(this.program.uMaxL, 	Math.abs(0.5 - maxL) * 2);
		gl.uniform1f(this.program.uAvgL, 	Math.abs(0.5 - avgL) * 2);

		gl.uniform1f(this.program.uSumR, 	sumR);
		gl.uniform1f(this.program.uMinR, 	Math.abs(0.5 - minR) * 2);
		gl.uniform1f(this.program.uMaxR, 	Math.abs(0.5 - maxR) * 2);
		gl.uniform1f(this.program.uAvgR, 	Math.abs(0.5 - avgR) * 2);


		//gl.uniform1i(this.program.uSamplerSpectrogram, 1);

		for (var i = 0; i < step_count; i++)
		{

			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textures[this.other_texture], 0);
			gl.clear(gl.COLOR_BUFFER_BIT);

			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, textures[this.current_texture]);
			//gl.uniform1i(this.program.uSampler, 0);

			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D, textures[texture_L_id]);

			gl.activeTexture(gl.TEXTURE2);
			gl.bindTexture(gl.TEXTURE_2D, textures[texture_R_id]);

			gl.drawArrays(gl.TRIANGLES,	0, this.vertices_per_object);

			var temp = this.other_texture;
			this.other_texture = this.current_texture;
			this.current_texture = temp;
		}

		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.viewport(0, 0, this.c.canvas.width, this.c.canvas.height);

		gl.disableVertexAttribArray(this.program.aVertexPosition);
		gl.disableVertexAttribArray(this.program.aTexPosition);
		gl.disableVertexAttribArray(this.program.aPosition);

	};

	this.setup_vbuffer();

}
