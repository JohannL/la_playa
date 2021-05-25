"use strict";

// vamos a la playa, calienta el sol

La_Playa.prototype.vamos = function(container_el, playlist, config)
{

	this.default_config = {
		minimal_mode: 						false,

		show_stereo_slider:					false,
		no_webgl:							false,

		// if false, it gets initialized when toggled on
		init_stereosc:						false,

		// kind of pointless since the webgl stuff isn't translucent anymore, only matters for playlist background in fullscreen really
		css_cnt_bg_hue:		210,
		css_cnt_bg_sat:		0,
		css_cnt_bg_lum:		10,
		css_cnt_bg_alpha:		1,			// just so you know, this doesn't actually do anything

		css_seekbar_hue1:					220,
		css_seekbar_sat1:					0,
		css_seekbar_hue2:					56,
		css_seekbar_sat2:					90,
		css_seekbar_hue3:					60,
		css_seekbar_sat3:					100,
		css_seekbar_hue4:					210,
		css_seekbar_sat4:					80,

		css_main_hue:						215,
		css_main_sat:						0,
		css_btn_hue:						110,
		css_btn_sat:						0,
		css_btn_act_hue:					52,
		css_btn_act_sat:					100,

		css_parentlist_sat:					0,

	};

	if (config == undefined)
	{
		this.config = this.default_config;
	}
	else
	{
		this.config = {};
		for (var i in this.default_config)
		{
			this.config[i] = config[i] == undefined ? this.default_config[i] : config[i];
		}
	}

	var cfg = this.config;

	if (cfg.minimal_mode)
	{
		this.webgl_enabled = false;
	}


	console.log("---> Vamos a la playa! <---");
	
	this.update_func = this.make_update_func();
	this.update_about_func = this.make_update_about_func();
	this.update_always_func = this.make_update_always_func();

	this.css_colors = document.createElement('style');
	this.css_colors.type = 'text/css';

	var css_string = `

.la_playa
{
	background:				hsla(${cfg.css_cnt_bg_hue},${cfg.css_cnt_bg_sat}%,${cfg.css_cnt_bg_lum}%, ${cfg.css_cnt_bg_alpha});

	}

	.lp_song_title
	{
		background:				hsla(${cfg.css_main_hue}, ${cfg.css_main_sat}%,5%,1);
		background:				linear-gradient(to bottom,
									hsla(${cfg.css_main_hue}, ${cfg.css_main_sat}%, 30%,1) 0%,
									hsla(${cfg.css_main_hue}, ${cfg.css_main_sat}%, 15%,1) 25%,
									hsla(${cfg.css_main_hue}, ${cfg.css_main_sat}%, 8%,1) 85%,
									hsla(${cfg.css_main_hue}, ${cfg.css_main_sat}%, 2%,1) 100%);
		color:					hsla(${cfg.css_main_hue}, ${cfg.css_main_sat}%, 99%,1);
		text-shadow:			0 0 5px hsla(${cfg.css_main_hue}, ${cfg.css_main_sat}%,90%,1), 0 0 18px hsla(${cfg.css_main_hue}, ${cfg.css_main_sat}%,90%,1), 0 0 22px hsla(${cfg.css_main_hue}, ${cfg.css_main_sat}%,90%,1);
	}

	.lp_controls
	{
		background:				hsla(${cfg.css_main_hue}, ${cfg.css_main_sat}%,50%,1);
		background:				linear-gradient(to bottom,
									hsla(${cfg.css_main_hue}, ${cfg.css_main_sat}%,60%,1) 0%,
									hsla(${cfg.css_main_hue}, ${cfg.css_main_sat}%,50%,1) 5%,
									hsla(${cfg.css_main_hue}, ${cfg.css_main_sat}%,40%,1) 100%);
		color:					hsla(${cfg.css_main_hue}, ${cfg.css_main_sat}%,10%,1)
	}

/*
	.lp_controls .lp_vumeter
	{
		box-shadow:				0 1px 1px hsla(${cfg.css_main_hue}, ${cfg.css_main_sat}%,60%,1), 0 -1px 1px hsla(${cfg.css_main_hue}, ${cfg.css_main_sat}%,40%,1);
	}
/*/

	.lp_button
	{
		background:				linear-gradient(to bottom,
									hsla(${cfg.css_btn_hue}, ${cfg.css_btn_sat}%,85%,1) 0%,
									hsla(${cfg.css_btn_hue}, ${cfg.css_btn_sat}%,75%,1) 5%,
									hsla(${cfg.css_btn_hue}, ${cfg.css_btn_sat}%,65%,1) 100%);
		border-top:				1px solid hsla(${cfg.css_btn_hue}, ${cfg.css_btn_sat}%,40%,0.2);
		border-left:			1px solid hsla(${cfg.css_btn_hue}, ${cfg.css_btn_sat}%,40%,0.2);
		border-right:			1px solid hsla(${cfg.css_btn_hue}, ${cfg.css_btn_sat}%,10%,0.2);
		border-bottom:			1px solid hsla(${cfg.css_btn_hue}, ${cfg.css_btn_sat}%,10%,0.2);
		box-shadow:				inset 0px 1px 1px hsla(${cfg.css_btn_hue}, ${cfg.css_btn_sat}%,100%,0.25),
								inset 1px 1px 1px hsla(${cfg.css_btn_hue}, ${cfg.css_btn_sat}%,100%,0.125),
								-1px -1px 0px hsla(${cfg.css_btn_hue}, ${cfg.css_btn_sat}%,25%,0.5),
								0px 1px 1px hsla(${cfg.css_btn_hue}, ${cfg.css_btn_sat}%,20%,0.5),
								1px 1px 2px hsla(${cfg.css_btn_hue}, ${cfg.css_btn_sat}%,20%,0.25);
	}

	.lp_button:hover
	{
		background:				linear-gradient(to bottom,
									hsla(${cfg.css_btn_hue}, ${cfg.css_btn_sat}%,95%,1) 0%,
									hsla(${cfg.css_btn_hue}, ${cfg.css_btn_sat}%,85%,1) 5%,
									hsla(${cfg.css_btn_hue}, ${cfg.css_btn_sat}%,75%,1) 100%);
		border:					1px solid hsla(${cfg.css_btn_hue}, ${cfg.css_btn_sat}%,20%,1);
		box-shadow:				inset 0px 1px 1px hsla(${cfg.css_btn_hue}, ${cfg.css_btn_sat}%,95%,0.995),
								inset 1px 1px 1px hsla(${cfg.css_btn_hue}, ${cfg.css_btn_sat}%,95%,0.5),
								-1px -1px 0px hsla(${cfg.css_btn_hue}, ${cfg.css_btn_sat}%,35%,0.25),
								0px 1px 1px hsla(${cfg.css_btn_hue}, ${cfg.css_btn_sat}%,20%,0.5),
								1px 1px 2px hsla(${cfg.css_btn_hue}, ${cfg.css_btn_sat}%,20%,0.25);
	}

	.lp_button:active
	{
		background:				linear-gradient(to bottom,
									hsla(${cfg.css_btn_act_hue}, ${cfg.css_btn_act_sat}%,55%,1) 0%, hsla(${cfg.css_btn_act_hue}, ${cfg.css_btn_act_sat}%,50%,1) 5%, hsla(${cfg.css_btn_act_hue}, ${cfg.css_btn_act_sat}%,45%,1) 100%);
		border:					1px solid hsla(${cfg.css_btn_act_hue}, ${cfg.css_btn_act_sat}%,90%,1);
		box-shadow:				inset 1px 1px 1px hsla(${cfg.css_btn_act_hue}, ${cfg.css_btn_act_sat}%,10%,0.5),
								0px 1px 1px hsla(0,0%,20%,0.5),
								1px 1px 2px hsla(0,0%,20%,0.25);
	}

	.lp_button.lp_active
	{
		background:				linear-gradient(to bottom, hsla(${cfg.css_btn_act_hue}, ${cfg.css_btn_act_sat}%,80%,1) 0%, hsla(${cfg.css_btn_act_hue}, ${cfg.css_btn_act_sat}%,70%,1) 5%, hsla(${cfg.css_btn_act_hue}, ${cfg.css_btn_act_sat}%,60%,1) 100%);
		color:					hsla(${cfg.css_btn_act_hue}, ${cfg.css_btn_act_sat}%,20%,1);
		border:					1px solid hsla(${cfg.css_btn_act_hue}, ${cfg.css_btn_act_sat}%,45%,1);
		box-shadow:				0px 0px 2px hsla(${cfg.css_btn_act_hue}, ${cfg.css_btn_act_sat}%,50%,0.95),
								0px 0px 4px hsla(${cfg.css_btn_act_hue}, ${cfg.css_btn_act_sat}%,50%,0.95),
								0px 0px 6px hsla(${cfg.css_btn_act_hue}, ${cfg.css_btn_act_sat}%,50%,0.95);
	}

	.lp_button.lp_active:hover
	{
		background:				linear-gradient(to bottom, hsla(${cfg.css_btn_act_hue}, ${cfg.css_btn_act_sat}%,90%,1) 0%, hsla(${cfg.css_btn_act_hue}, ${cfg.css_btn_act_sat}%,80%,1) 5%, hsla(${cfg.css_btn_act_hue}, ${cfg.css_btn_act_sat}%,70%,1) 100%);
		color:					hsla(${cfg.css_btn_act_hue}, ${cfg.css_btn_act_sat}%,20%,1);
		border:					1px solid hsla(${cfg.css_btn_act_hue}, ${cfg.css_btn_act_sat}%,55%,1);
		box-shadow:				0px 0px 2px hsla(${cfg.css_btn_act_hue}, ${cfg.css_btn_act_sat}%,60%,0.95),
								0px 0px 4px hsla(${cfg.css_btn_act_hue}, ${cfg.css_btn_act_sat}%,60%,0.95),
								0px 0px 6px hsla(${cfg.css_btn_act_hue}, ${cfg.css_btn_act_sat}%,60%,0.95);
	}

	.lp_duration
	{
		background:				hsla(${cfg.css_main_hue}, ${cfg.css_main_sat}%,40%,0.75);
		background:				linear-gradient(to bottom, hsla(${cfg.css_main_hue}, ${cfg.css_main_sat}%,50%,.75) 0%, hsla(${cfg.css_main_hue}, ${cfg.css_main_sat}%,40%,.75) 5%, hsla(${cfg.css_main_hue}, ${cfg.css_main_sat}%,30%,.75) 100%);
		color:					hsla(${cfg.css_main_hue}, ${cfg.css_main_sat}%,95%,0.8);
		text-shadow:			1px 1px 2px hsla(${cfg.css_main_hue}, ${cfg.css_main_sat}%,5%,0.75);
		box-shadow:				inset 1px 1px 3px hsla(${cfg.css_main_hue}, ${cfg.css_main_sat}%,0%,0.5);
	}

	.lp_playlist
	{
		background:				hsla(${cfg.css_main_hue}, ${cfg.css_main_sat}%,15%,1);
		background:				linear-gradient(to bottom, hsla(${cfg.css_main_hue}, ${cfg.css_main_sat}%,25%,1) 0%, hsla(${cfg.css_main_hue}, ${cfg.css_main_sat}%,15%,1) 5%, hsla(${cfg.css_main_hue}, ${cfg.css_main_sat}%,5%,1) 100%);
	}

	.lp_playlist_item
	{
		background:				hsla(${cfg.css_btn_hue}, ${cfg.css_btn_sat}%,70%,1);
		background:				linear-gradient(to bottom, hsla(${cfg.css_btn_hue}, ${cfg.css_btn_sat}%,75%,1) 0%, hsla(${cfg.css_btn_hue}, ${cfg.css_btn_sat}%,70%,1) 5%, hsla(${cfg.css_btn_hue}, ${cfg.css_btn_sat}%,60%,1) 100%);
		border-left:			1px solid hsla(${cfg.css_btn_hue}, ${cfg.css_btn_sat}%,95%,0.75);
		border-right:			1px solid hsla(${cfg.css_btn_hue}, ${cfg.css_btn_sat}%,30%,0.75);
		border-bottom:			1px solid hsla(${cfg.css_btn_hue}, ${cfg.css_btn_sat}%,30%,0.75);
		border-top:				1px solid hsla(${cfg.css_btn_hue}, ${cfg.css_btn_sat}%,95%,0.75);
		color:					#333;
		text-shadow:			0 1px 1px hsla(${cfg.css_btn_hue}, ${cfg.css_btn_sat}%,0%,0.25);
	}

	.lp_playlist_item:hover
	{
		background:				hsla(${cfg.css_btn_hue}, ${cfg.css_btn_sat}%,90%,1);
		background:				linear-gradient(to bottom, hsla(${cfg.css_btn_hue}, ${cfg.css_btn_sat}%,95%,1) 0%, hsla(${cfg.css_btn_hue}, ${cfg.css_btn_sat}%,90%,1) 5%, hsla(${cfg.css_btn_hue}, ${cfg.css_btn_sat}%,85%,1) 100%);
		color:					hsla(${cfg.css_btn_hue}, ${cfg.css_btn_sat}%,5%,1);
		box-shadow:				0 0 12px hsla(${cfg.css_btn_hue}, ${cfg.css_btn_sat}%,100%,0.75);
	}

	.lp_playlist_item.selected
	{
		background:				hsla(${cfg.css_btn_act_hue}, ${cfg.css_btn_act_sat}%,55%,1);
		background:				linear-gradient(to bottom, hsla(${cfg.css_btn_act_hue}, ${cfg.css_btn_act_sat}%,60%,1) 0%, hsla(${cfg.css_btn_act_hue}, ${cfg.css_btn_act_sat}%,55%,1) 5%, hsla(${cfg.css_btn_act_hue}, ${cfg.css_btn_act_sat}%,50%,1) 100%);
		box-shadow:				0 0 12px hsla(${cfg.css_btn_act_hue},${cfg.css_btn_act_sat}%,60%,0.75);
		border-left:			1px solid hsla(${cfg.css_btn_act_hue},${cfg.css_btn_act_sat}%,75%,0.75);
		border-right:			1px solid hsla(${cfg.css_btn_act_hue},${cfg.css_btn_act_sat}%,30%,0.75);
		border-bottom:			1px solid hsla(${cfg.css_btn_act_hue},${cfg.css_btn_act_sat}%,30%,0.75);
		border-top:				1px solid hsla(${cfg.css_btn_act_hue},${cfg.css_btn_act_sat}%,75%,0.75);
		color:					hsla(${cfg.css_btn_act_hue},${cfg.css_btn_act_sat}%,5%,1);
	}

	.lp_playlist_item.selected:hover
	{
		background:				hsla(${cfg.css_btn_act_hue}, ${cfg.css_btn_act_sat}%,65%,1);
		background:				linear-gradient(to bottom, hsla(${cfg.css_btn_act_hue}, ${cfg.css_btn_act_sat}%,70%,1) 0%, hsla(${cfg.css_btn_act_hue}, ${cfg.css_btn_act_sat}%,65%,1) 5%, hsla(${cfg.css_btn_act_hue}, ${cfg.css_btn_act_sat}%,60%,1) 100%);
		box-shadow:				0 0 12px hsla(${cfg.css_btn_act_hue},${cfg.css_btn_act_sat}%,70%,0.75);
		border-left:			1px solid hsla(${cfg.css_btn_act_hue},${cfg.css_btn_act_sat}%,85%,0.75);
		border-right:			1px solid hsla(${cfg.css_btn_act_hue},${cfg.css_btn_act_sat}%,30%,0.75);
		border-bottom:			1px solid hsla(${cfg.css_btn_act_hue},${cfg.css_btn_act_sat}%,30%,0.75);
		border-top:				1px solid hsla(${cfg.css_btn_act_hue},${cfg.css_btn_act_sat}%,85%,0.75);
	}

	.lp_parent_playlist
	{
		background:				hsla(${cfg.css_btn_act_hue}, ${cfg.css_parentlist_sat}%,40%,1);
		background:				linear-gradient(to bottom, hsla(${cfg.css_btn_act_hue}, ${cfg.css_parentlist_sat}%,30%,1) 0%, hsla(${cfg.css_btn_act_hue}, ${cfg.css_parentlist_sat}%,40%,1) 5%, hsla(${cfg.css_btn_act_hue}, ${cfg.css_parentlist_sat}%,30%,1) 100%);
		border-left:			1px solid hsla(${cfg.css_btn_act_hue}, ${cfg.css_parentlist_sat}%,15%,0.25);
		border-right:			1px solid hsla(${cfg.css_btn_act_hue}, ${cfg.css_parentlist_sat}%,5%,0.2);
		border-bottom:			1px solid hsla(${cfg.css_btn_act_hue}, ${cfg.css_parentlist_sat}%,5%,0.95);
		border-top:				1px solid hsla(${cfg.css_btn_act_hue}, ${cfg.css_parentlist_sat}%,15%,0.2);
		color:					hsla(${cfg.css_btn_act_hue}, ${cfg.css_parentlist_sat}%,85%,1);
		text-shadow:			1px 1px 3px hsla(${cfg.css_btn_act_hue}, ${cfg.css_parentlist_sat}%,25%,1);
		box-shadow:				0 0 12px hsla(${cfg.css_btn_act_hue}, ${cfg.css_parentlist_sat}%,0%,0.75);
	}

	.lp_parent_playlist:hover
	{
		background:				hsla(${cfg.css_btn_act_hue}, ${cfg.css_parentlist_sat}%,50%,1);
		background:				linear-gradient(to bottom, hsla(${cfg.css_btn_act_hue}, ${cfg.css_parentlist_sat}%,40%,1) 0%, hsla(${cfg.css_btn_act_hue}, ${cfg.css_parentlist_sat}%,60%,1) 5%, hsla(${cfg.css_btn_act_hue}, ${cfg.css_parentlist_sat}%,50%,1) 100%);
		box-shadow:				0 0 12px hsla(${cfg.css_btn_act_hue}, ${cfg.css_parentlist_sat}%,0%,0.75);
	}

	.lp_playlist_item.sublist
	{
		border-left:			1px solid hsla(${cfg.css_btn_hue}, ${cfg.css_btn_sat}%,15%,0.75);
		border-right:			1px solid hsla(${cfg.css_btn_hue}, ${cfg.css_btn_sat}%,20%,0.75);
		border-bottom:			1px solid hsla(${cfg.css_btn_hue}, ${cfg.css_btn_sat}%,20%,0.75);
		border-top:				1px solid hsla(${cfg.css_btn_hue}, ${cfg.css_btn_sat}%,15%,0.75);
		background:				hsla(${cfg.css_btn_hue}, ${cfg.css_btn_sat}%,30%,1);
		background:				linear-gradient(to bottom, hsla(${cfg.css_btn_hue}, ${cfg.css_btn_sat}%,35%,1) 0%, hsla(${cfg.css_btn_hue}, ${cfg.css_btn_sat}%,30%,1) 5%, hsla(${cfg.css_btn_hue}, ${cfg.css_btn_sat}%,25%,1) 100%);
		box-shadow:				0 0 4px hsla(${cfg.css_btn_hue}, ${cfg.css_btn_sat}%,10%,0.98);
		color:					hsla(${cfg.css_btn_hue}, ${cfg.css_btn_sat}%,85%,1);
	}

	.lp_playlist_item.sublist:hover
	{
		background:				hsla(${cfg.css_btn_hue}, ${cfg.css_btn_sat}%,15%,1);
		background:				linear-gradient(to bottom,	hsla(${cfg.css_btn_hue}, ${cfg.css_btn_sat}%,20%,1) 0%, hsla(${cfg.css_btn_hue}, ${cfg.css_btn_sat}%,15%,1) 5%, hsla(${cfg.css_btn_hue}, ${cfg.css_btn_sat}%,10%,1) 100%);
		color:					hsla(${cfg.css_btn_hue}, ${cfg.css_btn_sat}%,90%,1);
	}

	.lp_settings
	{
		background:				hsla(${cfg.css_main_hue}, ${cfg.css_main_sat}%,45%,1);
		background:				linear-gradient(to bottom, hsla(${cfg.css_main_hue}, ${cfg.css_main_sat}%,45%,1) 0%, hsla(${cfg.css_main_hue}, ${cfg.css_main_sat}%,35%,1) 5%, hsla(${cfg.css_main_hue}, ${cfg.css_main_sat}%,25%,1) 100%);
		box-shadow:				inset 0 5px 10px -5px  hsla(${cfg.css_main_hue}, ${cfg.css_main_sat}%,0%,0.75);
		color:					hsla(${cfg.css_main_hue}, ${cfg.css_main_sat}%,15%,1);
	}
`;

	this.css_colors.innerHTML = css_string;

	document.getElementsByTagName('head')[0].appendChild(this.css_colors);

	this.container_el = container_el;
	this.playlist = playlist;
	this.playlist_root = playlist;

	// create favicon canvas
	this.favicon_el = document.createElement('link');
	this.favicon_el.setAttribute('rel', 'shortcut icon');
	this.favicon_el.setAttribute('type', 'image/png');
	document.getElementsByTagName('head')[0].appendChild(this.favicon_el);

/*
	// create favicon canvas
	this.favicon_canvas_el = document.createElement('canvas');
	this.favicon_canvas_el.width = 128;
	this.favicon_canvas_el.height = 128;
	this.favicon_canvas_ctx = this.favicon_canvas_el.getContext('2d');
	this.update_favicon();
*/

	// create controls element
	this.controls_el = document.createElement('div');
	this.controls_el.setAttribute('class', 'lp_controls');
	this.container_el.appendChild(this.controls_el);


	// TODO:  make this a dedicated config option
	if (cfg.minimal_mode)
	{
		this.canvas_vumeter_enabled = true;
	}
	// create vumeter canvas
	this.vumeter_el = document.createElement('canvas');
	this.vumeter_el.setAttribute('class', 'lp_vumeter');
	this.vumeter_el.width = this.vumeter_size_x;
	this.vumeter_el.height = this.vumeter_size_y;
	this.vumeter_ctx = this.vumeter_el.getContext('2d');
	if (this.canvas_vumeter_enabled)
	{
		this.vumeter_el.style.display = 'inline-block';
	}
	else
	{
		this.vumeter_el.style.display = 'none';
	}
	this.controls_el.appendChild(this.vumeter_el);

	// create seek bar canvas
	this.seekbar_el = document.createElement('canvas');
	this.seekbar_el.style.width = '100%';
	this.seekbar_el.style.height = this.seekbar_size_y + 'px';
	this.seekbar_el.style.cursor = 'pointer';

	this.seekbar_el.width = this.seekbar_size_x;
	this.seekbar_el.height = this.seekbar_size_y;
	this.seekbar_ctx = this.seekbar_el.getContext('2d');
	this.seekbar_el.onclick = this.make_seekbar_click_handler_func();
	this.seekbar_el.onmouseover = this.make_seekbar_mouseover_handler_func();
	this.seekbar_el.onmousemove = this.make_seekbar_mouseover_handler_func();
	this.seekbar_el.onmouseout = this.make_seekbar_mouseout_handler_func();
	this.container_el.appendChild(this.seekbar_el);

	// create button_group 1
	var el_buttongroup1 = document.createElement('div');
	el_buttongroup1.setAttribute('class', 'lp_buttongroup');
	this.controls_el.appendChild(el_buttongroup1);

	// create volume slider
	this.volume_label_el = document.createElement('label');
	var temp_span = document.createElement('span');
	temp_span .innerHTML = 'Volume';
	this.volume_label_el.appendChild(temp_span);
	el_buttongroup1.appendChild(this.volume_label_el);
	this.volume_el = document.createElement('input');
	this.volume_el.setAttribute('title', this.volume);
	this.volume_el.setAttribute('type', 'range');
	this.volume_el.setAttribute('min', '0');
	this.volume_el.setAttribute('max', '1');
	this.volume_el.setAttribute('step', '0.05');
	this.volume_el.setAttribute('value', this.volume);
	this.volume_el.onchange = this.make_volume_change_func();
	this.volume_label_el.appendChild(this.volume_el);

	if (cfg.show_stereo_slider)
	{
		// create stereo slider
		this.stereo_label_el = document.createElement('label');
		var temp_span = document.createElement('span');
		temp_span .innerHTML = 'Stereo';
		this.stereo_label_el.appendChild(temp_span );
		el_buttongroup1.appendChild(this.stereo_label_el);
		this.stereo_el = document.createElement('input');
		this.stereo_el.setAttribute('title', this.stereo_separation);
		this.stereo_el.setAttribute('type', 'range');
		this.stereo_el.setAttribute('min', '-1');
		this.stereo_el.setAttribute('max', '1');
		this.stereo_el.setAttribute('step', '0.5');
		this.stereo_el.setAttribute('value', this.stereo_separation);
		this.stereo_el.onchange = this.make_stereo_change_func();
		this.stereo_label_el.appendChild(this.stereo_el);
	}

	// create button_group 2
	var el_buttongroup2 = document.createElement('div');
	el_buttongroup2.setAttribute('class', 'lp_buttongroup');
	this.controls_el.appendChild(el_buttongroup2);

	// create duration element
	this.duration_el = document.createElement('div');
	this.duration_el.setAttribute('class', 'lp_duration');
	el_buttongroup2.appendChild(this.duration_el);
	this.duration_el.innerHTML = this.print_duration(0) + ' / ' + this.print_duration(0);

	// create transport group
	this.transport_el = document.createElement('div');
	this.transport_el.setAttribute('class', 'lp_transport');
	this.controls_el.appendChild(this.transport_el);

	// create prev song button
	this.prev_song_el = document.createElement('div');
	this.prev_song_el.setAttribute('class', 'lp_button');
	this.prev_song_el.innerHTML = '<div class=lp_prev_song></div>';
	this.prev_song_el.onclick = this.make_play_previous_func();
	this.prev_song_el.title = 'Play previous item';
	this.transport_el.appendChild(this.prev_song_el);

	// create play/pause button
	this.play_pause_el = document.createElement('div');
	this.play_pause_el.setAttribute('class', 'lp_button');
	this.play_pause_el.setAttribute('id', 'lp_play_pause');
	this.play_pause_el.innerHTML = '<div class=lp_play></div>';
	this.play_pause_el.onclick = this.make_play_current_func();
	this.play_pause_el.title = 'Play';
	this.transport_el.appendChild(this.play_pause_el);

	// create next song button
	this.next_song_el = document.createElement('div');
	this.next_song_el.setAttribute('class', 'lp_button');
	this.next_song_el.innerHTML = '<div class=lp_next_song></div>';
	this.next_song_el.onclick = this.make_play_next_func();
	this.next_song_el.title = 'Play next item';
	this.transport_el.appendChild(this.next_song_el);

	// create loop toggle button
	this.loop_toggle_el = document.createElement('div');
	this.loop_toggle_el.setAttribute('class', 'lp_button');
	this.loop_toggle_el.innerHTML = '<div class=lp_loop_toggle></div>';
	this.loop_toggle_el.onclick = this.make_loop_toggle_func();
	this.loop_toggle_el.title = 'Repeat current song forever';
	this.transport_el.appendChild(this.loop_toggle_el);

	// create options group
	this.options_group_el = document.createElement('div');
	this.options_group_el.setAttribute('class', 'lp_options_group');
	this.controls_el.appendChild(this.options_group_el);

	if (!cfg.minimal_mode)
	{
		// create fullscreen toggle button
		this.fullscreen_toggle_el = document.createElement('div');
		this.fullscreen_toggle_el.setAttribute('class', 'lp_button');
		this.fullscreen_toggle_el.innerHTML = '<div class=lp_fullscreen_toggle></div>';
		this.fullscreen_toggle_el.title = 'Fullscreen';
		this.fullscreen_toggle_el.onclick = this.make_fullscreen_toggle_func();
		this.options_group_el.appendChild(this.fullscreen_toggle_el);
	}

	if (cfg.minimal_mode)
	{
		this.show_playlist = false;
	}

	// create playlist toggle button
	this.playlist_toggle_el = document.createElement('div');
	if (this.show_playlist)
	{
		this.playlist_toggle_el.setAttribute('class', 'lp_button lp_active');
	}
	else
	{
		this.playlist_toggle_el.setAttribute('class', 'lp_button');
	}
	this.playlist_toggle_el.innerHTML = '<div class=lp_playlist_toggle></div>';
	this.playlist_toggle_el.title = 'Toggle Playlist';
	this.playlist_toggle_el.onclick = this.make_playlist_toggle_func();
	this.options_group_el.appendChild(this.playlist_toggle_el);

	// create vumeter toggle button
	if (!cfg.minimal_mode)
	{
		this.vumeter_toggle_el = document.createElement('div');
		if (this.canvas_vumeter_enabled)
		{
			this.vumeter_toggle_el.setAttribute('class', 'lp_button lp_active');
		}
		else
		{
			this.vumeter_toggle_el.setAttribute('class', 'lp_button');
		}
		this.vumeter_toggle_el.innerHTML = '<div class=lp_vumeter_toggle></div>';
		this.vumeter_toggle_el.title = 'Toggle VU meter';
		this.vumeter_toggle_el.onclick = this.make_canvas_oscilloscope_toggle_func();
		this.options_group_el.appendChild(this.vumeter_toggle_el);
	}

	this.fluid_canvases = [
		this.seekbar_el,
		//this.vumeter_el,			// would require redoing the gradient when resizing, so fuck that >:[
		//this.canvas_el,			// looks super bad for some reason (probably my fault)
		//this.spectrogram_el		// so fuck that as well ^_^
	];

	// create "currently playing"
	this.song_title_el = document.createElement('div');
	this.song_title_el.setAttribute('class', 'lp_song_title');
	this.song_title_el.innerHTML = ' &nbsp; ';
	this.container_el.appendChild(this.song_title_el);

	// create song info
	this.song_info_el = document.createElement('div');
	this.song_info_el.setAttribute('class', 'lp_song_info');
	this.song_info_el.innerHTML = '&nbsp;';
	this.container_el.appendChild(this.song_info_el);

	// create playlist element
	this.playlist_el = document.createElement('div');
	this.playlist_el.setAttribute('class', 'lp_playlist');

	// hide playlist in minimal mode (kinda lazy)
	if (!this.show_playlist)
	{
		this.playlist_el.style.display = 'none';
	}

	this.container_el.addEventListener('dragover', function (e) { e.stopPropagation(); e.preventDefault(); } , false);
	this.container_el.addEventListener('drop', this.make_drop_handler_func(), false);

	this.container_el.appendChild(this.playlist_el);

	this.generate_playlist_html(0, null);

	if (this.use_status_bar)
	{
		// create status bar
		this.status_bar_el = document.createElement('div');
		this.status_bar_el.setAttribute('class', 'lp_status_bar');
		this.status_bar_fps_el = document.createElement('div');
		this.status_bar_fps_el.setAttribute('class', 'lp_status_bar_fps');
		this.status_bar_fps_el.innerHTML = '&nbsp;';
		this.status_bar_status_el = document.createElement('div');
		this.status_bar_status_el.setAttribute('class', 'lp_status_bar_status');
		this.status_bar_status_el.innerHTML = 'hang on a sec';
		this.status_bar_el.appendChild(this.status_bar_fps_el);
		this.status_bar_el.appendChild(this.status_bar_status_el);
		//this.status_bar_el.style.display = 'none';
		this.container_el.appendChild(this.status_bar_el);
	}

/*
	// create about button
	this.about_el = document.createElement('div');
	this.about_el.setAttribute('class', 'lp_button');
	this.about_el.innerHTML = '<div class=lp_about></div>';
	this.about_el.title = 'About';
	this.about_el.onclick = this.make_about_popup_open_func();
	this.controls_el.appendChild(this.about_el);

	// create about popup
	this.about_popup_el = document.createElement('div');
	this.about_popup_el.setAttribute('class', 'lp_about_popup');
	this.about_popup_el.innerHTML = '';
	this.about_popup_el.style.display = 'none';
	this.about_popup_el.onclick = this.make_about_popup_close_func();
	this.container_el.appendChild(this.about_popup_el);
//*/

	if (!cfg.no_webgl && !cfg.minimal_mode)
	{
		// create WebGL group
		this.webgl_group_el = document.createElement('div');
		this.webgl_group_el.setAttribute('class', 'lp_webgl_group');
		this.controls_el.appendChild(this.webgl_group_el);

		// create webgl toggle button
		this.webgl_toggle_el = document.createElement('div');
		if (this.webgl_enabled)
		{
			this.webgl_toggle_el.setAttribute('class', 'lp_button lp_active');
		}
		else
		{
			this.webgl_toggle_el.setAttribute('class', 'lp_button');
		}
		this.webgl_toggle_el.innerHTML = '<div class=lp_webgl_toggle></div>';
		this.webgl_toggle_el.title = 'Toggle WebGL';
		this.webgl_toggle_el.onclick = this.make_webgl_toggle_func();
		this.webgl_group_el.appendChild(this.webgl_toggle_el);
	}

	// create settings_pane
	this.settings_el = document.createElement('div');
	this.settings_el.style.display = this.settings_shown == true ? 'block' : 'none';
	this.settings_el.setAttribute('class', 'lp_settings');
	this.controls_el.appendChild(this.settings_el);

	this.vumeter_gradient = MakeLinGradient(this.vumeter_ctx, 0, 0, this.vumeter_size_x, 0, [
		[0,		"hsl(220,	100%,50%)"],
		[.25,	"hsl(180,	100%,50%)"],
		[.35,	"hsl(120,	100%,50%)"],
		[.5,	"hsl(120,	100%,80%)"],
		[.65,	"hsl(120,	100%,50%)"],
		[.75,	"hsl(52,	100%,50%)"],
		[1,		"hsl(0,		100%,50%)"],
	]);

	this.vumeter_gradient2 = MakeLinGradient(this.vumeter_ctx, 0, 0, this.vumeter_size_x, 0, [
		[0,		"hsl(340,	99%,50%)"],
		[.1,	"hsl(5,		99%,50%)"],
		[.15,	"hsl(52,	99%,50%)"],
		[.25,	"hsl(80,	99%,50%)"],
		[.35,	"hsl(100,	99%,50%)"],
		[.45,	"hsl(180,	99%,50%)"],
		[.5,	"hsl(210,	99%,50%)"],
		[.55,	"hsl(180,	99%,50%)"],
		[.65,	"hsl(100,	99%,50%)"],
		[.75,	"hsl(80,	99%,50%)"],
		[.85,	"hsl(52,	99%,50%)"],
		[.9,	"hsl(5,		99%,50%)"],
		[1,		"hsl(340,	99%,50%)"],
	]);

	this.vumeter_middle_gradient = MakeLinGradient(this.vumeter_ctx, 0, 0, this.vumeter_size_x, 0, [
		[0,		"hsla(0,	100%,100%,0.4)"],
		[0.45,	"hsla(0,	100%,100%,0.6)"],
		[0.5,	"hsla(0,	100%,100%,0.8)"],
		[0.55,	"hsla(0,	100%,100%,0.6)"],
		[1,		"hsla(0,	100%,100%,0.4)"],
	]);

	this.vumeter_clip_gradient = MakeLinGradient(this.vumeter_ctx, 0, 0, 0, this.vumeter_size_y, [
		[0,		"hsla(0,100%,50%, .995)"],
		[1,		"hsla(0,100%,50%, .995)"],
	]);

	this.vumeter_clip_max_gradient = MakeLinGradient(this.vumeter_ctx, 0, 0, 0, this.vumeter_size_y, [
		[0,		"hsla(30,100%,50%, .995)"],
		[1,		"hsla(30,100%,50%, .995)"],
	]);

	this.vumeter_mask_gradient = MakeLinGradient(this.vumeter_ctx, 0, 0, 0, this.vumeter_size_y, [
		[0,		"hsla(0,0%,0%,.95)"],
		[.125,	"hsla(0,0%,0%,.0125)"],
		[.25,	"hsla(0,0%,0%,.025)"],
		[.375,	"hsla(0,0%,0%,.5)"],
		[.425,	"hsla(0,0%,0%,.65)"],
		[.5,	"hsla(0,0%,0%,.95)"],
		[.575,	"hsla(0,0%,0%,.65)"],
		[.625,	"hsla(0,0%,0%,.5)"],
		[.75,	"hsla(0,0%,0%,.025)"],
		[.875,	"hsla(0,0%,0%,.0125)"],
		[1,		"hsla(0,0%,0%,.95)"],
	]);

	this.vumeter_clear_gradient = MakeLinGradient(this.vumeter_ctx, 0, 0, 0, this.vumeter_size_y, [
		[0,		"hsla(0,0%,0%,.995)"],
		[.125,	"hsla(0,0%,0%,.75)"],
		[.25,	"hsla(0,0%,0%,.05)"],
		[.375,	"hsla(0,0%,0%,.25)"],
		[.425,	"hsla(0,0%,0%,.95)"],
		[.5,	"hsla(0,0%,0%,.995)"],
		[.575,	"hsla(0,0%,0%,.95)"],
		[.625,	"hsla(0,0%,0%,.25)"],
		[.75,	"hsla(0,0%,0%,.05)"],
		[.875,	"hsla(0,0%,0%,.75)"],
		[1,		"hsla(0,0%,0%,.995)"],
	]);

	this.seekbar_bg_gradient = MakeLinGradient(this.seekbar_ctx, 0, 0, 0, this.seekbar_size_y, [
		[0,		"hsla(" + cfg.css_main_hue + ", " + cfg.css_main_sat + "%,30%,.15)"],
		[.2,	"hsla(" + cfg.css_main_hue + ", " + cfg.css_main_sat + "%,35%,.175)"],
		[.25,	"hsla(" + cfg.css_main_hue + ", " + cfg.css_main_sat + "%,45%,.275)"],
		[.45,	"hsla(" + cfg.css_main_hue + ", " + cfg.css_main_sat + "%,35%,.225)"],
		[.6,	"hsla(" + cfg.css_main_hue + ", " + cfg.css_main_sat + "%,20%,.175)"],
		[1,		"hsla(" + cfg.css_main_hue + ", " + cfg.css_main_sat + "%,5%,.15)"],
	]);

	// buffered
	this.seekbar_gradient = MakeLinGradient(this.seekbar_ctx, 0, 0, 0, this.seekbar_size_y, [
		[0,		"hsla(" + cfg.css_seekbar_hue1 + "," + cfg.css_seekbar_sat1 + "%,35%,.03125)"],
		[.2,	"hsla(" + cfg.css_seekbar_hue1 + "," + cfg.css_seekbar_sat1 + "%,40%,.125)"],
		[.25,	"hsla(" + cfg.css_seekbar_hue1 + "," + cfg.css_seekbar_sat1 + "%,45%,.25)"],
		[.45,	"hsla(" + cfg.css_seekbar_hue1 + "," + cfg.css_seekbar_sat1 + "%,40%,.125)"],
		[.6,	"hsla(" + cfg.css_seekbar_hue1 + "," + cfg.css_seekbar_sat1 + "%,35%,.0625)"],
		[1,		"hsla(" + cfg.css_seekbar_hue1 + "," + cfg.css_seekbar_sat1 + "%,30%,.03125)"],
	]);

	this.seekbar_position_before_gradient = MakeLinGradient(this.seekbar_ctx, 0, 0, 0, this.seekbar_size_y, [
		[0,		"hsla(" + cfg.css_seekbar_hue2 + "," + cfg.css_seekbar_sat2 + "%,40%,.5)"],
		[.2,	"hsla(" + cfg.css_seekbar_hue2 + "," + cfg.css_seekbar_sat2 + "%,45%,.75)"],
		[.25,	"hsla(" + cfg.css_seekbar_hue2 + "," + cfg.css_seekbar_sat2 + "%,50%,.85)"],
		[.45,	"hsla(" + cfg.css_seekbar_hue2 + "," + cfg.css_seekbar_sat2 + "%,45%,.75)"],
		[.6,	"hsla(" + cfg.css_seekbar_hue2 + "," + cfg.css_seekbar_sat2 + "%,40%,.5)"],
		[1,		"hsla(" + cfg.css_seekbar_hue2 + "," + cfg.css_seekbar_sat2 + "%,35%,.35)"],
	]);

	this.seekbar_position_gradient = MakeLinGradient(this.seekbar_ctx, 0, 0, 0, this.seekbar_size_y, [
		[0,		"hsla(" + cfg.css_seekbar_hue3 + "," + cfg.css_seekbar_sat3 + "%,80%,.0)"],
		[.125,	"hsla(" + cfg.css_seekbar_hue3 + "," + cfg.css_seekbar_sat3 + "%,80%,.25)"],
		[.40,	"hsla(" + cfg.css_seekbar_hue3 + "," + cfg.css_seekbar_sat3 + "%,80%,.5)"],
		[.5,	"hsla(" + cfg.css_seekbar_hue3 + "," + cfg.css_seekbar_sat3 + "%,80%,.95)"],
		[.60,	"hsla(" + cfg.css_seekbar_hue3 + "," + cfg.css_seekbar_sat3 + "%,80%,.5)"],
		[.875,	"hsla(" + cfg.css_seekbar_hue3 + "," + cfg.css_seekbar_sat3 + "%,80%,.25)"],
		[1,		"hsla(" + cfg.css_seekbar_hue3 + "," + cfg.css_seekbar_sat3 + "%,80%,.0)"],
	]);

	this.seekbar_played_gradient = MakeLinGradient(this.seekbar_ctx, 0, 0, 0, this.seekbar_size_y, [
		[0,		"hsla(" + cfg.css_seekbar_hue4 + "," + cfg.css_seekbar_sat4 + "%,35%,0)"],
		[.7,	"hsla(" + cfg.css_seekbar_hue4 + "," + cfg.css_seekbar_sat4 + "%,45%,0)"],
		[.8,	"hsla(" + cfg.css_seekbar_hue4 + "," + cfg.css_seekbar_sat4 + "%,50%,.5)"],
		[.9,	"hsla(" + cfg.css_seekbar_hue4 + "," + cfg.css_seekbar_sat4 + "%,40%,0)"],
		[1,		"hsla(" + cfg.css_seekbar_hue4 + "," + cfg.css_seekbar_sat4 + "%,30%,0)"],
	]);

	this.seekbar_notch_gradient_10 = MakeLinGradient(this.seekbar_ctx, 0, 0, 0, this.seekbar_size_y, [
		[0,		"hsla(" + cfg.css_seekbar_hue3 + "," + cfg.css_seekbar_sat3 + "%,0%,.025)"],
		[.3,	"hsla(" + cfg.css_seekbar_hue3 + "," + cfg.css_seekbar_sat3 + "%,0%,.1)"],
		[.45,	"hsla(" + cfg.css_seekbar_hue3 + "," + cfg.css_seekbar_sat3 + "%,0%,.15)"],
		[.5,	"hsla(" + cfg.css_seekbar_hue3 + "," + cfg.css_seekbar_sat3 + "%,0%,.35)"],
		[.55,	"hsla(" + cfg.css_seekbar_hue3 + "," + cfg.css_seekbar_sat3 + "%,0%,.15)"],
		[.7,	"hsla(" + cfg.css_seekbar_hue3 + "," + cfg.css_seekbar_sat3 + "%,0%,.1)"],
		[1,		"hsla(" + cfg.css_seekbar_hue3 + "," + cfg.css_seekbar_sat3 + "%,0%,.025)"],
	]);

	this.seekbar_notch_gradient_60 = MakeLinGradient(this.seekbar_ctx, 0, 0, 0, this.seekbar_size_y, [
		[0,		"hsla(" + cfg.css_seekbar_hue3 + "," + cfg.css_seekbar_sat3 + "%,0%,.35)"],
		[.1,	"hsla(" + cfg.css_seekbar_hue3 + "," + cfg.css_seekbar_sat3 + "%,0%,.2)"],
		[.4,	"hsla(" + cfg.css_seekbar_hue3 + "," + cfg.css_seekbar_sat3 + "%,0%,.1)"],
		[.5,	"hsla(" + cfg.css_seekbar_hue3 + "," + cfg.css_seekbar_sat3 + "%,0%,.05)"],
		[.6,	"hsla(" + cfg.css_seekbar_hue3 + "," + cfg.css_seekbar_sat3 + "%,0%,.1)"],
		[.9,	"hsla(" + cfg.css_seekbar_hue3 + "," + cfg.css_seekbar_sat3 + "%,0%,.2)"],
		[1,		"hsla(" + cfg.css_seekbar_hue3 + "," + cfg.css_seekbar_sat3 + "%,0%,.35)"],
	]);

	this.clear_seekbar();

	setTimeout(this.update_func, 20);
	setTimeout(this.update_always_func, 20);

	var that = this;
	setTimeout(function() {
		that.update_fluid_canvases();
	}, 20);

	// fixme: obviously (?) you can't just overwrite it
	window.onresize = this.make_window_resize_handler_func();

	if (this.webgl_enabled !== false)
	{
		this.init_webgl();
	}
	if (this.use_status_bar)
	{
		this.set_status_info('Welcome to La Playa!');
	}
};

La_Playa.prototype.init_webgl_stereoscope = function()
{
	//stopwatch.start('Rectangle_Textured_StereOsc');

	var stopwatch_start = performance.now();

	this.WebGL_Rectangle_Textured_StereOsc 				= new µ.WebGL_Rectangle_Textured_StereOsc(this.webGL, this.webGL.gl, this.cameras.c, this.webGL.textures, this.default_texture_size);
	this.WebGL_Rectangle_Textured_StereOsc.update_color_scheme();
	console.log('Rectangle_Textured_StereOsc: ' + Math.round(performance.now() - stopwatch_start) + ' ms');

	this.webgl_init_stereoscope_once = true;
	this.set_status_info('initialized WebGL stereoscope');
}

// make sure this doesn't leak memory when called more than once
// (haha, "make sure", I like it)
La_Playa.prototype.init_webgl = function()
{
	var stopwatch = new Stopwatch();
	this.set_status_info('initializing WebGL');
	stopwatch.start('webGL total');
	var cfg = this.config;
	if (!cfg.no_webgl)
	{
		//stopwatch.start('cameras');
		this.cameras = new µ.Cameras2D(this, window.innerWidth, window.innerHeight);
		this.camera_stretch = this.cameras.c[this.CAM_STRETCH];
		//stopwatch.stop('cameras');

		stopwatch.start('webGL canvas');
		// wtf is this? explain yourself plz kthx.
		if (this.webGL !== false)
		{
			var old_canvas = this.webGL.canvas;
		}
		else
		{
			var old_canvas = null;
		}
		this.webGL = new µ.canvas_webgl(this, this.container_el, old_canvas, this.scale, this.webgl_canvas_size_x, this.webgl_canvas_size_y, this.cameras, {
					enable_alpha: true,
					enable_antialias: true,
					autoresize: true,
					require_float_textures: true,
				});
		stopwatch.stop('webGL canvas');
	}
	if (this.webGL !== false && this.webGL.gl !== null)
	{

		//stopwatch.start('input');
		this.input = new µ.input(this.webGL.canvas, this.scale, this.cameras, null);
		//stopwatch.stop('input');

		//stopwatch.start('empty textures');
		this.data_texture_distribution_L = this.webGL.empty_float_texture(this.data_texture_size2);
		this.data_texture_distribution_R = this.webGL.empty_float_texture(this.data_texture_size2);
		this.data_texture_FFT_L = this.webGL.empty_float_texture(this.data_texture_size);
		this.data_texture_FFT_R = this.webGL.empty_float_texture(this.data_texture_size);
		this.data_texture_OSC_L = this.webGL.empty_float_texture(this.data_texture_size);
		this.data_texture_OSC_R = this.webGL.empty_float_texture(this.data_texture_size);
		//stopwatch.stop('empty textures');

		this.current_data_texture_OSC_L = this.data_texture_OSC_L;
		this.current_data_texture_OSC_R = this.data_texture_OSC_R;

		
		// this doesn't even get used, so..
		/*
		stopwatch.start('Rectangle_Textured');
		this.WebGL_Rectangle_Textured 					= new µ.WebGL_Rectangle_Textured(this.webGL.gl, this.cameras.c, this.webGL.textures);
		stopwatch.stop('Rectangle_Textured');
		*/

		stopwatch.start('Rectangle_Textured_Vis');
		this.WebGL_Rectangle_Textured_Vis 				= new µ.WebGL_Rectangle_Textured_Vis(this.webGL.gl, this.cameras.c, this.webGL.textures);
		this.WebGL_Rectangle_Textured_Vis.update_color_scheme();
		stopwatch.stop('Rectangle_Textured_Vis');

		stopwatch.start('Rectangle_Textured_FFT');
		this.WebGL_Rectangle_Textured_FFT 				= new µ.WebGL_Rectangle_Textured_FFT(this.webGL, this.webGL.gl, this.cameras.c, this.webGL.textures);
		this.WebGL_Rectangle_Textured_FFT.minDecibels 	= this.fft_sens;
		this.WebGL_Rectangle_Textured_FFT.scaling = this.fft_scaling;
		this.WebGL_Rectangle_Textured_FFT.update_color_scheme();
		stopwatch.stop('Rectangle_Textured_FFT');

		stopwatch.start('Rectangle_Textured_Osc');
		this.WebGL_Rectangle_Textured_Osc 				= new µ.WebGL_Rectangle_Textured_Osc(this.webGL, this.webGL.gl, this.cameras.c, this.webGL.textures, this.default_texture_size);
		this.WebGL_Rectangle_Textured_Osc.update_color_scheme();
		stopwatch.stop('Rectangle_Textured_Osc');

		if (cfg.init_stereosc || this.webgl_stereoscope_enabled)
		{
			console.log('stereosc INIT');
			this.init_webgl_stereoscope();
		}

		stopwatch.start('Rectangle_Textured_Phase');
		this.WebGL_Rectangle_Textured_Phase				= new µ.WebGL_Rectangle_Textured_Phase(this.webGL, this.webGL.gl, this.cameras.c, this.webGL.textures, this.default_texture_size);
		this.WebGL_Rectangle_Textured_Phase.update_color_scheme();
		stopwatch.stop('Rectangle_Textured_Phase');

		stopwatch.start('Rectangle_Textured_Phase_Dist');
		this.WebGL_Rectangle_Textured_Phase_Dist				= new µ.WebGL_Rectangle_Textured_Phase_Dist(this.webGL, this.webGL.gl, this.cameras.c, this.webGL.textures, this.default_texture_size);
		this.WebGL_Rectangle_Textured_Phase_Dist.update_color_scheme();
		stopwatch.stop('Rectangle_Textured_Phase_Dist');

		stopwatch.start('Rectangle_Textured_Distribution');
		this.WebGL_Rectangle_Textured_Distribution		= new µ.WebGL_Rectangle_Textured_Distribution(this.webGL, this.webGL.gl, this.cameras.c, this.webGL.textures, this.default_texture_size);
		this.WebGL_Rectangle_Textured_Distribution.update_color_scheme();
		stopwatch.stop('Rectangle_Textured_Distribution');

		stopwatch.start('PingPong');
		this.WebGL_PingPong 							= new µ.WebGL_Framebuffer_Pingpong(this.webGL, this.webGL.gl, this.cameras.c, this.webGL.textures, this.default_texture_size);
		this.WebGL_PingPong.minDecibels 				= this.fft_sens;
		this.WebGL_PingPong.scaling = this.fft_scaling;
		stopwatch.stop('PingPong');

		stopwatch.start('PingPong_Osc');
		this.WebGL_PingPong_Osc 						= new µ.WebGL_Framebuffer_Pingpong_Osc(this.webGL, this.webGL.gl, this.cameras.c, this.webGL.textures, this.default_texture_size);
		stopwatch.stop('PingPong_Osc');

		//this.test_texture			= this.webGL.load_texture('test.png');

		stopwatch.start('test_texture');
		this.test_texture			= this.webGL.texture_from_canvas(µ.generate_canvas_texture(this.default_texture_size, this.default_texture_size, function(ctx, size_x, size_y, data)
			{
				ctx.beginPath();
				ctx.arc(size_x / 2, size_y / 2, size_x * 4.5, 0, 2 * Math.PI, false);
				ctx.fillStyle = '#f00';
				ctx.fill();
			}), -1, true, true);
		stopwatch.stop('test_texture');

		if (!this.webgl_init_once)
		{
			this.webGL.canvas.addEventListener('mousewheel', this.make_webgl_canvas_mousewheel_handler_func(), true);
			this.webGL.canvas.addEventListener('DOMMouseScroll', this.make_webgl_canvas_mousewheel_handler_func(), true);
			this.webGL.canvas.title 	= 'use the mousewheel to resize';
			this.webGL.canvas.height 	= this.webgl_canvas_size_y;
		}
	}
	else
	{
		this.webGL = false; // set to false in case float textures aren't supported
	}

	stopwatch.stop('webGL total');

	if (this.webGL !== false && !this.webgl_init_once)
	{
		// create oscilloscope toggle button
		this.oscilloscope_toggle_el = document.createElement('div');
		if (this.webgl_oscilloscope_enabled)
		{
			this.oscilloscope_toggle_el.setAttribute('class', 'lp_button lp_active');
		}
		else
		{
			this.oscilloscope_toggle_el.setAttribute('class', 'lp_button');
		}
		this.oscilloscope_toggle_el.innerHTML = '<div class=lp_oscilloscope_toggle></div>';
		this.oscilloscope_toggle_el.title = 'Toggle WebGL oscilloscope';
		this.oscilloscope_toggle_el.onclick = this.make_webgl_oscilloscope_toggle_func();
		this.webgl_group_el.appendChild(this.oscilloscope_toggle_el);

/*
		// create oscilloscope pingpong toggle button
		this.oscilloscope_pingpong_toggle_el = document.createElement('div');
		if (this.webgl_osc_pingpong_enabled)
		{
			this.oscilloscope_pingpong_toggle_el.setAttribute('class', 'lp_button lp_active');
		}
		else
		{
			this.oscilloscope_pingpong_toggle_el.setAttribute('class', 'lp_button');
		}
		this.oscilloscope_pingpong_toggle_el.innerHTML = '<div class=lp_oscilloscope_pingpong_toggle></div>';
		this.oscilloscope_pingpong_toggle_el.title = 'Toggle WebGL oscilloscope ping pong';
		this.oscilloscope_pingpong_toggle_el.onclick = this.make_webgl_pingpong_oscilloscope_toggle_func();
		this.webgl_group_el.appendChild(this.oscilloscope_pingpong_toggle_el);
*/

		// create webgl spectrogram toggle button
		this.webgl_spectrogram_toggle_el = document.createElement('div');
		if (this.webgl_spectrogram_enabled)
		{
			this.webgl_spectrogram_toggle_el.setAttribute('class', 'lp_button lp_active');
		}
		else
		{
			this.webgl_spectrogram_toggle_el.setAttribute('class', 'lp_button');
		}
		this.webgl_spectrogram_toggle_el.innerHTML = '<div class=lp_webgl_spectrogram_toggle></div>';
		this.webgl_spectrogram_toggle_el.title = 'Toggle WebGL Spectrogram';
		this.webgl_spectrogram_toggle_el.onclick = this.make_webgl_spectrogram_toggle_func();
		this.webgl_group_el.appendChild(this.webgl_spectrogram_toggle_el);

		// create stereoscope toggle button
		//if (cfg.init_stereosc)
		{
			this.stereoscope_toggle_el = document.createElement('div');
			if (this.webgl_stereoscope_enabled)
			{
				this.stereoscope_toggle_el.setAttribute('class', 'lp_button lp_active');
			}
			else
			{
				this.stereoscope_toggle_el.setAttribute('class', 'lp_button');
			}
			this.stereoscope_toggle_el.innerHTML = '<div class=lp_stereoscope_toggle></div>';
			this.stereoscope_toggle_el.title = 'Toggle stereoscope';
			this.stereoscope_toggle_el.onclick = this.make_stereoscope_toggle_func();
			this.webgl_group_el.appendChild(this.stereoscope_toggle_el);
		}

		// create settings toggle button
		this.settings_toggle_el = document.createElement('div');
		this.settings_toggle_el.setAttribute('class', 'lp_button');
		this.settings_toggle_el.innerHTML = '<div class=lp_settings_toggle></div>';
		this.settings_toggle_el.title = 'Settings';
		this.settings_toggle_el.onclick = this.make_settings_toggle_func();
		this.webgl_group_el.appendChild(this.settings_toggle_el);

		// create colorscheme selector
		this.colorselect_label_el = document.createElement('label');
		this.settings_el.appendChild(this.colorselect_label_el);
		var temp_label_span = document.createElement('span');
		temp_label_span.innerHTML = 'Colorscheme';
		this.colorselect_label_el.appendChild(temp_label_span);
		this.colorselect_el = document.createElement('select');
		for (var i in this.color_schemes)
		{
			var option = document.createElement('option');
			option.setAttribute('value', i);
			option.innerHTML = this.color_schemes[i].name;
			if (i == this.color_scheme_index)
			{
				option.setAttribute('selected', 'selected');
			}
			this.colorselect_el.appendChild(option);
		}
		this.colorselect_el.onchange = this.make_color_select_func();
		this.colorselect_label_el.appendChild(this.colorselect_el);

		// create texture scale selector
		this.webgl_scale_select_label_el = document.createElement('label');
		this.settings_el.appendChild(this.webgl_scale_select_label_el);
		var temp_label_span = document.createElement('span');
		temp_label_span.innerHTML = 'Scale factor';
		this.webgl_scale_select_label_el.appendChild(temp_label_span);
		this.webgl_scale_select_el = document.createElement('select');
		for (var i = 1; i < 9; i += 1)
		{
			var option = document.createElement('option');
			option.setAttribute('value', i);
			if (i == this.scale)
			{
				option.setAttribute('selected', 'selected');
			}
			option.innerHTML = i;
			this.webgl_scale_select_el.appendChild(option);
		}
		this.webgl_scale_select_el.onchange = this.make_webgl_scale_select_func();
		this.webgl_scale_select_label_el.appendChild(this.webgl_scale_select_el);

		// create texture size selector
		this.texturesizeselect_label_el = document.createElement('label');
		this.settings_el.appendChild(this.texturesizeselect_label_el);
		var temp_label_span = document.createElement('span');
		temp_label_span.innerHTML = 'Texture Size';
		this.texturesizeselect_label_el.appendChild(temp_label_span);
		this.texturesizeselect_el = document.createElement('select');
		for (var i = 2; i < 4096; i *= 2)
		{
			var option = document.createElement('option');
			option.setAttribute('value', i);
			if (i == this.default_texture_size)
			{
				option.setAttribute('selected', 'selected');
			}
			option.innerHTML = i;
			this.texturesizeselect_el.appendChild(option);
		}
		this.texturesizeselect_el.onchange = this.make_texture_size_select_func();
		this.texturesizeselect_label_el.appendChild(this.texturesizeselect_el);

		/* divider */ var temp_el = document.createElement('hr'); this.settings_el.appendChild(temp_el);

		this.attach_slider_to = function(target_el, name, title, min, max, step, value, on_change_func)
		{
			var label_el = document.createElement('label');
			target_el.appendChild(label_el);

			this['parameter_slider_' + name] = document.createElement('input');

			var slider_el = this['parameter_slider_' + name];
			slider_el.setAttribute('class', 'lp_settings_slider');
			slider_el.setAttribute('type', 'range');
			slider_el.setAttribute('min', min);
			slider_el.setAttribute('max', max);
			slider_el.setAttribute('step', step);
			slider_el.setAttribute('value', value);
			slider_el.setAttribute('title', value);

			var temp_label_span = document.createElement('span');
			temp_label_span.innerHTML = title;
			label_el.appendChild(temp_label_span);

			var value_display = document.createElement('input');
			value_display.value = value;
			slider_el.value_display = value_display; 	// store a reference to the div on the slider input element; best practices all the way, baby!
			value_display.slider_el = slider_el; 		// oh god

			var that = this;

			slider_el.onchange = on_change_func;
			value_display.onchange = on_change_func;

			label_el.appendChild(slider_el);
			label_el.appendChild(value_display);
		};
		this.attach_slider_to(	this.settings_el,
								'fft_sens',
								'FFT min dB',
								-1000,
								-0.001,
								2.5,
								this.fft_sens,
								this.make_fft_sens_change_func());
		this.attach_slider_to(	this.settings_el,
								'fft_smoothing',
								'FFT Smoothing',
								0,
								1,
								0.001,
								this.fft_smoothing,
								this.make_fft_smoothing_change_func());
		this.attach_slider_to(	this.settings_el,
								'fft_scaling',
								'FFT Scaling',
								1,
								2,
								0.02,
								this.fft_scaling,
								this.make_fft_scaling_change_func());

		// create spectrogram preset selector
		this.spectrogram_preset_label_el = document.createElement('label');
		this.settings_el.appendChild(this.spectrogram_preset_label_el);
		var temp_label_span = document.createElement('span');
		temp_label_span.innerHTML = 'Spectrogram preset';
		this.spectrogram_preset_label_el.appendChild(temp_label_span);
		this.spectrogram_preset_el = document.createElement('select');
		for (var i in this.spectrogram_presets)
		{
			var option = document.createElement('option');
			option.setAttribute('value', i);
			option.innerHTML = this.spectrogram_presets[i].name;
			if (i == this.spectrogram_preset_index)
			{
				option.setAttribute('selected', 'selected');
			}
			this.spectrogram_preset_el.appendChild(option);
		}
		this.spectrogram_preset_el.onchange = this.make_spectrogram_preset_select_func();
		this.spectrogram_preset_el.onblur = this.make_spectrogram_preset_select_func();			// simply so the currently selected preset can be selected again, resetting any values that were manually changed
		this.spectrogram_preset_label_el.appendChild(this.spectrogram_preset_el);

		this.attach_spectrogram_slider_to = function(target_el, name, title, min, max, step, value)
		{
			var label_el = document.createElement('label');
			target_el.appendChild(label_el);

			this['spectogram_parameter_slider_' + name] = document.createElement('input');

			var slider_el = this['spectogram_parameter_slider_' + name];
			slider_el.setAttribute('class', 'lp_settings_slider');
			slider_el.setAttribute('type', 'range');
			slider_el.setAttribute('min', min);
			slider_el.setAttribute('max', max);
			slider_el.setAttribute('step', step);
			slider_el.setAttribute('value', value);
			slider_el.setAttribute('title', value);

			var temp_label_span = document.createElement('span');
			temp_label_span.innerHTML = title;
			label_el.appendChild(temp_label_span);

			var value_display = document.createElement('input');
			value_display.value = value;
			slider_el.value_display = value_display; // store a reference to the div on the slider input element; best practices all the way, baby!

			var that = this;

			that.WebGL_PingPong['set_' + name](value);
			that.WebGL_PingPong_Osc['set_' + name](value);
			slider_el.onchange = function(e)
			{
				var value = parseFloat(e.target.value);
				e.target.title = Math.round(value * 10000) / 10000;
				e.target.value_display.value = e.target.title;
				that.WebGL_PingPong['set_' + name](value);
				that.WebGL_PingPong_Osc['set_' + name](value);
			};
			slider_el.value_display.onchange = function(e)
			{
				var value = parseFloat(e.target.value);
				e.target.title = Math.round(value * 10000) / 10000;
				slider_el.value = e.target.title;
				that.WebGL_PingPong['set_' + name](value);
				that.WebGL_PingPong_Osc['set_' + name](value);
			};
			label_el.appendChild(slider_el);
			label_el.appendChild(value_display);
		};

		var temp_el = document.createElement('hr'); this.settings_el.appendChild(temp_el);

		for (var spectrogram_preset_parameter_name in this.spectrogram_preset_parameters)
		{
			var spectrogram_preset_parameter = this.spectrogram_preset_parameters[spectrogram_preset_parameter_name];
			this.spectrogram_preset_parameters
			this.attach_spectrogram_slider_to(	this.settings_el,
									spectrogram_preset_parameter_name,
									spectrogram_preset_parameter.title,
									spectrogram_preset_parameter.min,
									spectrogram_preset_parameter.max,
									spectrogram_preset_parameter.step,
									this.spectrogram_settings[spectrogram_preset_parameter_name]);
		}
	}

	// there was an attempt
	this.webgl_init_once = true;
	this.set_status_info('initialized WebGL');
}
