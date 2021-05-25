"use strict";

µ.WebGL_Framebuffer_Pingpong = function(c, gl, cameras, textures, texture_size)
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

	this.scaling = 1.0;

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

	this.fragment_shader = ["",

(function () {/*
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

	uniform			float		uScaling;

	uniform 		sampler2D 	uSampler;
	uniform 		sampler2D 	uSampler_L;
	uniform 		sampler2D 	uSampler_R;

	uniform 		float 		uDataTextureSize;
	uniform			float		uMinDecibels;

	varying		vec2		vTexPosition;


*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1],

bxx_shader_includes.colors + "\n",
bxx_shader_includes.color_scheme + "\n",
bxx_shader_includes.read_data_texture + "\n",

(function () {/*

void main()
{
	float uTextureStep2 = uTextureStep / 2.0;
	float pixel_x = gl_FragCoord[0] - 0.5;
	float pixel_y = gl_FragCoord[1] - 0.5;
	vec2 tex_pos = vec2(uTextureStep2 + pixel_x * uTextureStep, uTextureStep2 + pixel_y * uTextureStep);

	float frac_x = pixel_x * uTextureStep;

	float tex_pos_x = 0.0;

	float value_here = 0.0;
	float value_to_left = 0.0;
	float value_to_right = 0.0;

	if (vTexPosition[0] < 0.5)
	{
		tex_pos_x = (0.5 - vTexPosition[0]) * 2.0;
		tex_pos_x = pow(tex_pos_x, uScaling);
		value_here = 1.0 - clamp(get_data_pixel(uSampler_L, uDataTextureSize, tex_pos_x) / uMinDecibels, 0.0, 1.0);
	}
	else
	{
		tex_pos_x = (vTexPosition[0] - 0.5) * 2.0;
		tex_pos_x = pow(tex_pos_x, uScaling);
		value_here = 1.0 - clamp(get_data_pixel(uSampler_R, uDataTextureSize, tex_pos_x) / uMinDecibels, 0.0, 1.0);
	}

	float pos_factor = pow(1.0 - (tex_pos[1] * uPosFactorFactor), uPosFactorExponent);

	float speed = 			uTextureSize * uBaseSpeed
						+ 	uTextureSize * uPosSpeed * pos_factor
						+	uTextureSize * pow(value_here, uMeltSpeedExponent) * uMeltSpeed;

	vec4 texColor = texture2D(uSampler, vec2(tex_pos[0], tex_pos[1] - uTextureStep * speed));
	vec4 texColor2 = texture2D(uSampler, vec2(tex_pos[0], tex_pos[1] - uTextureStep * speed * 0.5));
	//vec4 texColor3 = texture2D(uSampler, vec2(tex_pos[0] + uTextureStep, tex_pos[1] - uTextureStep * speed * 0.5));

	//float smoothing_frac = pow(1.0 - texColor[0], 0.5);
	//texColor = texColor * (1.0 - smoothing_frac) + (texColor + texColor2) * 0.5 * smoothing_frac;

	//texColor = (texColor * 160000.0 + texColor2 * 0.05 + texColor3 * 0.05) / 160000.1;

	float uLumFadeHi = -0.0005;
	float uLumFadeLo = -0.00125;
	float uLumFadeExponent = 1.0;

	float uSatFadeHi = +0.00;
	float uSatFadeLo = -0.0125 * 0.5;
	float uSatFadeExponent = 2.0;

	float uSmoothExponent = 1.0;

	if (pixel_y < uTextureStep)
	{
		gl_FragColor[0] = value_here;
		gl_FragColor[1] = 1.0;
		gl_FragColor[2] = 1.0;
		gl_FragColor[3] = 1.0;
	}
	else
	{
		gl_FragColor = texColor;

		float sat_fade_frac = pow(1.0 - texColor[0], uSatFadeExponent);
		gl_FragColor[1] = gl_FragColor[1] + uSatFadeHi * (1.0 - sat_fade_frac) + uSatFadeLo * sat_fade_frac;

		float lum_fade_frac = pow(1.0 - texColor[0], uLumFadeExponent);
		gl_FragColor[2] = gl_FragColor[2] + uLumFadeHi * (1.0 - lum_fade_frac) + uLumFadeLo * lum_fade_frac;

		gl_FragColor[0] *= 0.9995;
		gl_FragColor[2] *= 0.999999999;
		gl_FragColor[3] *= 0.99999999;

	}

	gl_FragColor[3] = min(gl_FragColor[2] * 50.0, gl_FragColor[3]);

	gl_FragColor[0] = clamp(gl_FragColor[0], 0.0, 1.0);
	gl_FragColor[1] = clamp(gl_FragColor[1], 0.0, 1.0);
	gl_FragColor[2] = clamp(gl_FragColor[2], 0.0, 1.0);
	gl_FragColor[3] = clamp(gl_FragColor[3], 0.0, 1.0);

}
*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1],
(function () {/*
*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1],
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
	this.program.uScaling				= gl.getUniformLocation(this.program, "uScaling");
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

	this.process_steps = function(step_count, texture_L_id, texture_R_id)
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
		gl.uniform1f(this.program.uMinDecibels, 	this.minDecibels);
		gl.uniform1f(this.program.uScaling, 		this.scaling);

		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, textures[texture_L_id]);
		gl.activeTexture(gl.TEXTURE2);
		gl.bindTexture(gl.TEXTURE_2D, textures[texture_R_id]);

		//gl.uniform1i(this.program.uSamplerSpectrogram, 1);

		for (var i = 0; i < step_count; i++)
		{
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textures[this.other_texture], 0);
			gl.clear(gl.COLOR_BUFFER_BIT);
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, textures[this.current_texture]);
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
