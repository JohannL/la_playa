"use strict";

La_Playa.prototype.make_about_popup_open_func = function(index)
{
	var that = this;
	return function(e)
	{
		that.about = {
			last_frame: Date.now(),
			total_time: 0,
			shown:		true,
		};

		that.about_popup_el.innerHTML = '';

		var container = document.createElement('div');

		var blurb = '<h1>La Playa</h1>';
		blurb += '<p>Made 2014 - $CURRENT_YEAR by Johann Lau, under the MIT license (except the parts copyrighted by third parties, those bits are indicated by comments and have their own licenses)</p>';
		blurb += '<p>(click to close)</p>';

		container.innerHTML = blurb;

		that.about_canvas_el = document.createElement('canvas');
		that.about_canvas_el.style.width = '100%';
		that.about_canvas_el.style.height = that.about_canvas_size_y + 'px';
		that.about_canvas_el.width = that.about_canvas_size_x;
		that.about_canvas_el.height = that.about_canvas_size_y;
		that.about_canvas_ctx = that.about_canvas_el.getContext('2d');

		that.about_popup_el.appendChild(that.about_canvas_el);
		that.about_popup_el.appendChild(container);
		that.about_popup_el.style.display = 'block';

		requestAnimationFrame(that.update_about_func);
	};
};

La_Playa.prototype.make_about_popup_close_func = function(index)
{
	var that = this;
	return function(e)
	{
		that.about.shown = false;
		that.about_popup_el.style.display = 'none';
	};
};

La_Playa.prototype.make_pause_func = function()
{
	var that = this;
	return function(e)
	{
		that.paused = true;
		that.set_status_info('Paused.');
		that.pause();
		that.play_pause_el.setAttribute('class', 'lp_button');
		that.play_pause_el.title = 'Play';
		that.play_pause_el.onclick = that.make_play_current_func();
		that.play_pause_el.innerHTML = '<div class=lp_play></div>';
	};
};

La_Playa.prototype.make_play_current_func = function()
{
	var that = this;
	return function(e)
	{
		if (that.init_attempted == false)
		{
			that.init();
		}
		if (that.init_success == true)
		{
			that.set_status_info('Playing..');
			that.paused = false;
			if (that.audio_el.paused && that.audio_el.src)
			{
				that.audio_el.play();
			}
			else
			{
				that.play_item(that.playlist_index);
			}
			that.play_pause_el.setAttribute('class', 'lp_button lp_active');
			that.play_pause_el.title = 'Pause';
			that.play_pause_el.onclick = that.make_pause_func();
			that.play_pause_el.innerHTML = '<div class=lp_pause></div>';
		}
	};
};

La_Playa.prototype.make_parent_playlist_func = function()
{
	var that = this;
	return function(e)
	{
		that.playlist_level--;
		that.playlist = that.parent_playlist;
		that.playlist_index = that.parent_playlist_index;
		that.clear_playlist_html();
		that.generate_playlist_html(that.playlist_level);
	};
};

La_Playa.prototype.make_settings_toggle_func = function()
{
	var that = this;
	return function(e)
	{
		that.settings_shown = !that.settings_shown;
		that.settings_el.style.display = that.settings_shown ? 'block' : 'none';
		that.settings_toggle_el.setAttribute('class', 'lp_button' + (that.settings_shown ? ' lp_active' : ''));
	};
};

La_Playa.prototype.make_webgl_toggle_func = function()
{
	var that = this;
	return function(e)
	{
		if (that.webGL == false)
		{
			that.init_webgl();
		}
		if (that.webGL !== false && that.webGL.gl !== null)
		{
			that.webgl_enabled = !that.webgl_enabled;
			localStorage.setItem('lp__webgl_enabled', that.webgl_enabled);
			if (that.webgl_enabled)
			{
				that.webGL.canvas.style.display = 'block';
			}
			else
			{
				that.webGL.canvas.style.display = 'none';
			}
		}
		that.webgl_toggle_el.setAttribute('class', 'lp_button' + (that.webgl_enabled ? ' lp_active' : ''));
	};
};

La_Playa.prototype.make_playlist_toggle_func = function()
{
	var that = this;
	return function(e)
	{
		that.show_playlist = !that.show_playlist;
		if (that.show_playlist)
		{
			that.playlist_el.style.display = 'block';
			that.playlist_el.style.display = 'flex';
		}
		else
		{
			that.playlist_el.style.display = 'none';
		}
		that.playlist_toggle_el.setAttribute('class', 'lp_button' + (that.show_playlist ? ' lp_active' : ''));
	};
};

La_Playa.prototype.make_stereoscope_toggle_func = function()
{
	var that = this;
	return function(e)
	{

		that.webgl_stereoscope_enabled = !that.webgl_stereoscope_enabled;
		if (that.webgl_stereoscope_enabled && !that.webgl_init_stereoscope_once)
		{
			that.init_webgl_stereoscope();
		}
		localStorage.setItem('lp__webgl_stereoscope_enabled', that.webgl_stereoscope_enabled);
		that.stereoscope_toggle_el.setAttribute('class', 'lp_button' + (that.webgl_stereoscope_enabled ? ' lp_active' : ''));
	};
};

La_Playa.prototype.make_webgl_spectrogram_toggle_func = function()
{
	var that = this;
	return function(e)
	{
		that.webgl_spectrogram_enabled = !that.webgl_spectrogram_enabled;
		localStorage.setItem('lp__webgl_spectrogram_enabled', that.webgl_spectrogram_enabled);
		that.webgl_spectrogram_toggle_el.setAttribute('class', 'lp_button' + (that.webgl_spectrogram_enabled ? ' lp_active' : ''));
	};
};

La_Playa.prototype.make_webgl_oscilloscope_toggle_func = function()
{
	var that = this;
	return function(e)
	{
		that.webgl_oscilloscope_enabled = !that.webgl_oscilloscope_enabled;
		localStorage.setItem('lp__webgl_oscilloscope_enabled', that.webgl_oscilloscope_enabled);
		that.oscilloscope_toggle_el.setAttribute('class', 'lp_button' + (that.webgl_oscilloscope_enabled ? ' lp_active' : ''));
	};
};

La_Playa.prototype.make_webgl_pingpong_oscilloscope_toggle_func = function()
{
	var that = this;
	return function(e)
	{
		that.webgl_osc_pingpong_enabled = !that.webgl_osc_pingpong_enabled;
		localStorage.setItem('lp__webgl_osc_pingpong_enabled', that.webgl_osc_pingpong_enabled);
		that.oscilloscope_pingpong_toggle_el.setAttribute('class', 'lp_button' + (that.webgl_osc_pingpong_enabled ? ' lp_active' : ''));
	};
};

La_Playa.prototype.make_canvas_oscilloscope_toggle_func = function()
{
	var that = this;
	return function(e)
	{
		that.canvas_vumeter_enabled = !that.canvas_vumeter_enabled;
		localStorage.setItem('lp__canvas_vumeter_enabled', that.canvas_vumeter_enabled);
		if (that.canvas_vumeter_enabled)
		{
			that.vumeter_el.style.display = 'inline-block';
			//that.update_fluid_canvases();
		}
		else
		{
			that.vumeter_el.style.display = 'none';
		}
		that.vumeter_toggle_el.setAttribute('class', 'lp_button' + (that.canvas_vumeter_enabled ? ' lp_active' : ''));
	};
};

La_Playa.prototype.make_fullscreen_toggle_func = function()
{
	var that = this;
	return function(e)
	{
		that.is_fullscreen = !that.is_fullscreen;

		if (that.is_fullscreen)
		{
			// yeah, I know
			that.pre_fullscreen_width = that.container_el.clientWidth;
			that.pre_fullscreen_height= that.container_el.clientHeight;
			that.container_el.style.height = '';
			that.container_el.style.width = '';
			that.container_el.style.position = 'fixed';
			that.container_el.style.zIndex = '1000';
			that.container_el.style.top = '0px';
			that.container_el.style.left = '0px';
			that.container_el.style.right = '0px';
			that.container_el.style.bottom = '0px';
			that.container_el.style.overflow = 'auto';
			that.container_el.style.width = '100%';
		}
		else
		{
			that.container_el.style.height = that.pre_fullscreen_height + 'px';
			that.container_el.style.width = that.pre_fullscreen_width + 'px';
			that.container_el.style.position = '';
			that.container_el.style.zIndex = '';
			that.container_el.style.top = '';
			that.container_el.style.left = '';
			that.container_el.style.right = '';
			that.container_el.style.bottom = '';
			that.container_el.style.width = '';
		}
		if (that.webGL !== false)
		{
			that.webGL.on_resize();
		}
		that.fullscreen_toggle_el.setAttribute('class', 'lp_button' + (that.is_fullscreen ? ' lp_active' : ''));
	};
};

La_Playa.prototype.make_fft_sens_change_func = function()
{
	var that = this;
	return function(e)
	{
		var target_val = parseFloat(e.target.value);
		that.fft_sens = target_val;
		e.target.title = Math.round(target_val * 10) / 10;

		if (e.target.value_display)
		{
			e.target.value_display.value = e.target.title;
		}
		else
		{
			e.target.slider_el.value = target_val;
		}

		if (that.analyserL_node)
		{
			that.analyserL_node.minDecibels 			= that.fft_sens;
			that.analyserR_node.minDecibels 			= that.fft_sens;
		}
		that.WebGL_Rectangle_Textured_FFT.minDecibels	= that.fft_sens;
		that.WebGL_PingPong.minDecibels 				= that.fft_sens;
		that.min = 999999999999999999999;
		that.max = -999999999999999999999;
	};
}


La_Playa.prototype.make_posfactorfactor_change_func = function()
{
	var that = this;
	return function(e)
	{
		e.target.title = Math.round(parseFloat(e.target.value) * 100) / 100;
		that.WebGL_PingPong.set_uPosFactorFactor(parseFloat(e.target.value));
		that.WebGL_PingPong_Osc.set_uPosFactorFactor(parseFloat(e.target.value));
	};
}

La_Playa.prototype.make_posfactorexponent_change_func = function()
{
	var that = this;
	return function(e)
	{
		e.target.title = Math.round(parseFloat(e.target.value) * 100) / 100;
		that.WebGL_PingPong.set_uPosFactorExponent(parseFloat(e.target.value));
		that.WebGL_PingPong_Osc.set_uPosFactorExponent(parseFloat(e.target.value));
	};
}


La_Playa.prototype.make_fft_smoothing_change_func = function()
{
	var that = this;
	return function(e)
	{
		var target_val = parseFloat(e.target.value);
		that.fft_smoothing = target_val;
		e.target.title = Math.round(parseFloat(e.target.value) * 100) / 100;
		if (e.target.value_display)
		{
			e.target.value_display.value = e.target.title;
		}
		else
		{
			e.target.slider_el.value = target_val;
		}
		if (that.analyserL_node)
		{
			that.analyserR_node.smoothingTimeConstant = that.fft_smoothing;
			that.analyserL_node.smoothingTimeConstant = that.fft_smoothing;
		}
	};
}

La_Playa.prototype.make_fft_scaling_change_func = function()
{
	var that = this;
	return function(e)
	{
		var target_val = parseFloat(e.target.value);
		that.fft_scaling = target_val;
		e.target.title = Math.round(parseFloat(e.target.value) * 100) / 100;
		if (e.target.value_display)
		{
			e.target.value_display.value = e.target.title;
		}
		else
		{
			e.target.slider_el.value = target_val;
		}
		if (that.WebGL_Rectangle_Textured_FFT)
		{
			that.WebGL_Rectangle_Textured_FFT.scaling 	= that.fft_scaling;
			that.WebGL_PingPong.scaling 				= that.fft_scaling;
		}
		localStorage.setItem('lp__fft_scaling', that.fft_scaling);
	};
}


La_Playa.prototype.make_webgl_canvas_mousewheel_handler_func = function()
{
	var that = this;
	return function(e)
	{
		var now = window.performance.now();
		var val = e.wheelDelta || e.detail;
		var relevant_axis = that.camera_stretch.mouse_pos_y;
		if (that.webgl_spectrogram_enabled && relevant_axis < that.webgl_divider)
		{
			if (val < 0)
			{
				var time_delta = 1.0 - 0.25 * (Math.min(now - that.last_mousewheel_webgl_up, 20) / 20);
				that.webgl_divider_fraction *= 1.0 + 0.05 * time_delta;
				that.last_mousewheel_webgl_up = now;
			}
			else
			{
				var time_delta = 1.0 - 0.25 * (Math.min(now - that.last_mousewheel_webgl_down, 20) / 20);
				that.webgl_divider_fraction *= 1.0 - 0.05 * time_delta;
				that.last_mousewheel_webgl_down = now;
			}
			localStorage.setItem('lp__webgl_divider_fraction', that.webgl_divider_fraction);
		}
		else
		{
			if (val < 0)
			{
				var time_delta = 1.0 - 0.25 * (Math.min(now - that.last_mousewheel_webgl_up, 20) / 20);
				that.webgl_canvas_size_y *= 1.0 + 0.05 * time_delta;
				//that.webgl_divider_fraction *= 1.0 + 0.05 * time_delta;
				that.last_mousewheel_webgl_up = now;
			}
			else
			{
				var time_delta = 1.0 - 0.25 * (Math.min(now - that.last_mousewheel_webgl_down, 20) / 20);
				that.webgl_canvas_size_y *= 1.0 - 0.05 * time_delta;
				//that.webgl_divider_fraction *= 1.0 - 0.05 * time_delta;
				if (that.webgl_canvas_size_y < 64 / that.scale)
				{
					that.webgl_canvas_size_y = 64 / that.scale;
				}
				that.last_mousewheel_webgl_down = now;
			}
			localStorage.setItem('lp__webgl_canvas_size_y', that.webgl_canvas_size_y);
		}
		that.webgl_divider_fraction = Math.max(0.1 / (that.webgl_canvas_size_x / that.webgl_canvas_size_y), Math.min(0.9 / (that.webgl_canvas_size_x / that.webgl_canvas_size_y), that.webgl_divider_fraction));
//		that.webGL.canvas.style.height = that.webgl_canvas_size_y + 'px';
		that.webGL.canvas.height = that.webgl_canvas_size_y;
		that.webgl_divider 			= that.webgl_divider_fraction * (that.webgl_canvas_size_x / that.webgl_canvas_size_y);
		//localStorage.setItem('lp__webgl_divider', that.webgl_divider);
		e.stopPropagation();
		e.preventDefault();
	};
}

La_Playa.prototype.make_seekbar_click_handler_func = function()
{
	var that = this;
	return function(e)
	{
		if (that.init_success)
		{
			if (that.audio_el.duration > 0)
			{
				var pointer_x = (e.clientX - e.target.getBoundingClientRect().left) / that.seekbar_el.clientWidth;
				var pointer_x = (e.clientX - e.target.getBoundingClientRect().left) / that.seekbar_width;
				that.audio_el.currentTime = pointer_x * that.audio_el.duration;
			}
		}
	};
}

La_Playa.prototype.make_seekbar_mouseover_handler_func = function()
{
	var that = this;
	return function(e)
	{
		if (that.init_success)
		{
			if (that.audio_el.duration > 0)
			{
				var pointer_x = (e.clientX - e.target.getBoundingClientRect().left) / that.seekbar_el.clientWidth;
				var pointer_x = (e.clientX - e.target.getBoundingClientRect().left) / that.seekbar_width;

				e.target.title = that.print_duration(pointer_x * that.audio_el.duration);
			}
		}
	};
}

La_Playa.prototype.make_drop_handler_func = function()
{
	var that = this;

	function do_that_thing(file)
	{
		var file_name = file.name;
		var file_type = file.type;
		// cuz "Failed to execute 'readAsDataURL' on 'FileReader': The object is already busy reading Blobs."
		var freader = new FileReader();
		freader.onload = function(e2)
		{
			var data = e2.target.result;
			that.add_playlist_item(file_name, file_type, data);
		}
		freader.readAsDataURL(file);
	};

	return function(e)
	{
		e.stopPropagation();
		e.preventDefault();
		if (e.dataTransfer.items)
		{
	    	for (var i = 0; i < e.dataTransfer.items.length; i++)
	    	{
				if (e.dataTransfer.items[i].kind === 'file')
				{
					do_that_thing(e.dataTransfer.items[i].getAsFile());
	      		}
	    	}
		}
		else
		{
			// Use DataTransfer interface to access the file(s)
			{
				do_that_thing(e.dataTransfer.files[i]);
			}
		}
	};
}



La_Playa.prototype.make_volume_change_func = function()
{
	var that = this;
	return function(e)
	{
		if (that.init_attempted == false)
		{
			that.init();
		}
		that.volume = parseFloat(e.target.value);
		that.volume_el.setAttribute('title', that.volume);

		localStorage.setItem('lp__volume', that.volume);

		that.gain_node.gain.setValueAtTime(that.volume, that.context.currentTime);
	};
}

La_Playa.prototype.make_stereo_change_func = function()
{
	var that = this;
	return function(e)
	{
		if (that.init_attempted == false)
		{
			that.init();
		}

		that.stereo_separation = parseFloat(e.target.value);
		that.stereo_el.setAttribute('title', that.stereo_separation);

		localStorage.setItem('lp__stereo_separation', that.stereo_separation);

		that.panL_node.pan.setValueAtTime(-1 * that.stereo_separation, that.context.currentTime);
		that.panR_node.pan.setValueAtTime(1 * that.stereo_separation, that.context.currentTime);
	};
}

La_Playa.prototype.make_window_resize_handler_func = function()
{
	var that = this; return function(e) { that.update_fluid_canvases(); };
}

La_Playa.prototype.make_play_func = function(index)
{
	var that = this; return function(e) { that.play_item(index); };
};

La_Playa.prototype.make_play_next_func = function(index)
{
	var that = this; return function(e) { that.play_next(index); };
};

La_Playa.prototype.make_loop_toggle_func = function()
{
	var that = this; return function(e) { that.loop_toggle(); };
};

La_Playa.prototype.make_play_previous_func = function()
{
	var that = this; return function(e) { that.play_previous(); };
};

La_Playa.prototype.make_seekbar_mouseout_handler_func = function()
{
	var that = this; return function(e) { e.target.title = ''; };
}

La_Playa.prototype.make_color_select_func = function()
{
	var that = this; return function(e) {
		//that.color_scheme_index = parseInt(e.target.value);
		that.color_scheme_target_id = parseInt(e.target.value);
		//that.color_scheme = that.color_schemes[that.color_scheme_index];
		that.color_scheme_fade = that.color_scheme_fade_duration;
		localStorage.setItem('lp__color_scheme', that.color_scheme_target_id);
	};
}

La_Playa.prototype.make_spectrogram_preset_select_func = function()
{
	var that = this; return function(e) {
		that.spectrogram_preset_target_id = parseInt(e.target.value);
		that.spectrogram_preset_index = that.spectrogram_preset_target_id
		that.spectrogram_preset_fade = that.spectrogram_preset_fade_duration;

		var selected_spectrogram_preset = that.spectrogram_presets[that.spectrogram_preset_index];

		that.spectrogram_settings['melt_speed']				= selected_spectrogram_preset.melt_speed;
		that.spectrogram_settings['melt_speed_exponent']	= selected_spectrogram_preset.melt_speed_exponent;
		that.spectrogram_settings['base_speed']				= selected_spectrogram_preset.base_speed;
		that.spectrogram_settings['position_speed']			= selected_spectrogram_preset.position_speed;
		that.spectrogram_settings['position_exponent']		= selected_spectrogram_preset.position_exponent;
		that.spectrogram_settings['position_factor']		= selected_spectrogram_preset.position_factor;

		for (var parameter_name in that.spectrogram_preset_parameters)
		{
			var spectrogram_preset_parameter = that.spectrogram_preset_parameters[parameter_name];
			that.WebGL_PingPong['set_' + parameter_name](that.spectrogram_settings[parameter_name]);
			that.WebGL_PingPong_Osc['set_' + parameter_name](that.spectrogram_settings[parameter_name]);
			that['spectogram_parameter_slider_' + parameter_name].value 				= that.spectrogram_settings[parameter_name];
			that['spectogram_parameter_slider_' + parameter_name].value_display.value	= Math.round(that.spectrogram_settings[parameter_name] * 10000) / 10000;
		}

		// store the values, not the preset
		localStorage.setItem('lp__spectrogram_preset', that.spectrogram_preset_index);
	};
}

La_Playa.prototype.make_fft_size_select_func = function()
{
	var that = this; return function(e) { that.set_fft_size(e.target.value); };
}

La_Playa.prototype.make_texture_size_select_func = function()
{
	var that = this; return function(e) { that.set_texture_size(e.target.value); };
}

La_Playa.prototype.make_webgl_scale_select_func = function()
{
	var that = this; return function(e) {

			var factor = e.target.value / that.scale;

			//that.webgl_canvas_size_y *= factor;

			that.scale = e.target.value;
			that.init_webgl();
		};
}

La_Playa.prototype.make_update_func = function()
{
	var that = this; return function(e) { that.update(); };
}

La_Playa.prototype.make_update_always_func = function()
{
	var that = this; return function(e) { that.update_always(); };
}

La_Playa.prototype.make_update_about_func = function()
{
	var that = this; return function(e) { that.update_about(); };
}
