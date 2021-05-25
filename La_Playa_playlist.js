"use strict";

La_Playa.prototype.clear_playlist_html = function()
{
	this.playlist_el.innerHTML = '';
}

La_Playa.prototype.generate_playlist_html = function(level)
{
	var selected_one = false;
	if (level)
	{
		var parent_list_button = document.createElement('div');
		parent_list_button.setAttribute('class', 'lp_parent_playlist');
		parent_list_button.onclick = this.make_parent_playlist_func();
		parent_list_button.innerHTML = this.playlist_title;
		parent_list_button.title = 'Click to go back to previous list';
		this.playlist_el.appendChild(parent_list_button);
	}
	var total_time_seconds = 0;
	for (var i = 0; i < this.playlist.length; i++)
	{
		var playlist_item = this.playlist[i];
		playlist_item.el = document.createElement('div');
		if (!selected_one && !playlist_item.sublist)
		{
			this.playlist_index = i;
			selected_one = true;
		}
		if (playlist_item.playtime_seconds)
		{
			total_time_seconds += playlist_item.playtime_seconds;
			playlist_item.el.innerHTML = playlist_item.title + '<div class=playtime>(' + this.print_duration(playlist_item.playtime_seconds) + ')</div>'
		}
		else
		{
			playlist_item.el.innerHTML = playlist_item.title;
		}

		playlist_item.el.setAttribute('class', 'lp_playlist_item' + (playlist_item.sublist ? (' sublist') : '' ) + (playlist_item.unpublished ? (' unpublished') : '' ));
		playlist_item.el.onclick = this.make_play_func(i);
/*
		now done on the fly whenever an item is played
		if (!playlist_item.sublist)
		{
			playlist_item.url = this.decide_playlist_item_url(playlist_item);
		}
*/
		this.playlist_el.appendChild(playlist_item.el);
	}
	if (total_time_seconds > 0)
	{
		var summary = document.createElement('div');

		var total_time_h = Math.floor(total_time_seconds / 3600);
		var total_time_m = Math.floor((total_time_seconds % 3600) / 60);
		var total_time_s = Math.floor(total_time_seconds % 60);

		summary.setAttribute('class', 'lp_playlist_footer');
		summary.innerHTML = 'Total playing time: &nbsp; &nbsp; '
			+ (total_time_h > 0 ? (total_time_h + 'h ') : '')
			+ (total_time_m > 0 ? (total_time_m + 'm ') : '')
			+ (total_time_s + 's');
		this.playlist_el.appendChild(summary);
	}

}


// for drag and drop
La_Playa.prototype.add_playlist_item = function(title, type, url)
{
	var playlist_item = {};
	if (type = 'audio/mp3')
	{
		playlist_item.mp3 = url;
		console.log('dropped file as mp3');
	}
	else if (type = 'audio/ogg')
	{
		playlist_item.ogg = url;
		console.log('dropped file as ogg');
	}
	else if (type = 'audio/wav')
	{
		playlist_item.wav = url;
		console.log('dropped file as wav');
	}
	else
	{
		console.log('dropped file as ?');
		return;
	}
	playlist_item.el = document.createElement('div');
	playlist_item.el.setAttribute('class', 'lp_playlist_item');
	playlist_item.el.onclick = this.make_play_func(this.playlist.length);

	playlist_item.title = title;
	if (playlist_item.playtime_seconds && playlist_item.playtime_seconds > 0)
	{
		playlist_item.el.innerHTML = playlist_item.title + '<div class=playtime>' + this.print_duration(playlist_item.playtime_seconds) + '</div>'
	}
	else
	{
		playlist_item.el.innerHTML = playlist_item.title;
	}
	this.playlist_el.appendChild(playlist_item.el);
	this.playlist.push(playlist_item);
}

La_Playa.prototype.play_item = function(item_index)
{
	if (this.init_failure == true)
	{
		// no point
		return;
	}
	if (this.init_attempted == false)
	{
		this.init();
	}
	var playlist_item = this.playlist[item_index];
	if (playlist_item.sublist)
	{
		this.parent_playlist_index = this.playlist_index;
		this.parent_playlist = this.playlist;
		this.playlist_level++;
		this.playlist = playlist_item.sublist;
		this.playlist_title = playlist_item.title;
		this.clear_playlist_html();
		this.generate_playlist_html(this.playlist_level);
		return;
	}

	this.paused = false;

	this.clippedR_max = 0;
	this.clippedL_max = 0;

	this.clear_seekbar();

	var current_playlist_item = this.playlist[this.playlist_index];
	if (current_playlist_item !== undefined)
	{
		current_playlist_item.el.setAttribute('class', 'lp_playlist_item' + (current_playlist_item.sublist ? ' sublist': '') + (current_playlist_item.unpublished ? (' unpublished') : '' ));
	}

	playlist_item.el.setAttribute('class', 'lp_playlist_item selected' + (playlist_item.sublist ? ' sublist': '') + (playlist_item.unpublished ? (' unpublished') : '' ));
	this.playlist_index = item_index;

	/*
		can't know it before audio is initialized so can't be decided during setup anymore
		just do it on the fly, doesn't really matter
		//this.audio_el.src = playlist_item.url;
	*/

	this.audio_el.src 			= this.decide_playlist_item_url(playlist_item);
	this.audio_el.crossOrigin 	= "anonymous";
	this.audio_el.preload 		= 'auto';

	var info_text = playlist_item.title;
	this.song_title_el.innerHTML = info_text;
	this.song_info_el.innerHTML = playlist_item.info || ' &nbsp;';

	this.audio_el.play();

	this.play_pause_el.onclick = this.make_pause_func();
	this.play_pause_el.innerHTML = '<div class=lp_pause></div>';

	this.play_pause_el.setAttribute('class', 'lp_button lp_active');

	this.set_status_info('Playing..');

}

La_Playa.prototype.play_next = function()
{

	var item_index = this.playlist_index + 1;
	if (item_index >= this.playlist.length)
	{
		item_index = 0;
	}

	// might be in an empty playlist
	if (this.playlist[item_index] === undefined)
	{
		return;
	}

	// skip past sublists
	var bail = 0;
	if (this.playlist[item_index].sublist != undefined)
	{
		while (this.playlist[item_index].sublist != undefined && bail < this.playlist.length)
		{
			bail++;
			item_index++;
			if (item_index >= this.playlist.length)
			{
				item_index = 0;
			}
		}
	}
	this.play_item(item_index);
}


La_Playa.prototype.play_previous = function()
{
	var item_index = this.playlist_index - 1;
	if (item_index < 0)
	{
		item_index = this.playlist.length - 1;
	}
	this.play_item(item_index);
}

La_Playa.prototype.pause = function()
{
	this.audio_el.pause();
}

La_Playa.prototype.decide_playlist_item_url = function(playlist_item)
{
	var url = '';
	if (this.can_play_ogg && (playlist_item.ogg || playlist_item['audio/ogg']))
	{
		url = playlist_item.ogg || playlist_item['audio/ogg'];
	}
	else if (this.can_play_mp3 && (playlist_item.mp3 || playlist_item['audio/mpeg']))
	{
		url = playlist_item.mp3 || playlist_item['audio/mpeg'];
	}
	else if (this.can_play_wav && playlist_item.wav)
	{
		url = playlist_item.wav;
	}
	// you never know
	if (url === '')
	{
		if (playlist_item.ogg || playlist_item['audio/ogg'])
		{
			url = playlist_item.ogg || playlist_item['audio/ogg'];
		}
		else if (playlist_item.mp3 || playlist_item['audio/mpeg'])
		{
			url = playlist_item.mp3 || playlist_item['audio/mpeg'];
		}
		else if (playlist_item.wav)
		{
			url = playlist_item.wav;
		}

	}
	return url;
}