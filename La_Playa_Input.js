"use strict";

µ.input = function(el, scale, cameras, event_handler__click)
{
	this.old_mouse_x = 0,
	this.old_mouse_y = 0,
	this.mouse_x = 0,
	this.mouse_y = 0;

	var self = this;

	var	Key = function (id, name)
	{
		this.id = id;
		this.name = name;
		this.pressed = false;
		this.callback_press = null;
		this.callback_release = null;
	};
	var KEYCODES = {
		1234: 'KEY_LMB',
		1235: 'KEY_RMB',
		1236: 'KEY_MMB',

		8: 'KEY_BACKSPACE',
		9: 'KEY_TAB',

		16: 'KEY_SHIFT',

		20: 'KEY_CAPS_LOCK',
		
		32: 'KEY_SPACE',
		48: 'KEY_0',
		49: 'KEY_1',
		50: 'KEY_2',
		51: 'KEY_3',
		52: 'KEY_4',
		53: 'KEY_5',
		54: 'KEY_6',
		55: 'KEY_7',
		56: 'KEY_8',
		57: 'KEY_9',

		65: 'KEY_A',
		66: 'KEY_B',
		67: 'KEY_C',
		68: 'KEY_D',
		69: 'KEY_E',
		70: 'KEY_F',
		71: 'KEY_G',
		72: 'KEY_H',
		73: 'KEY_I',
		74: 'KEY_J',
		75: 'KEY_K',
		76: 'KEY_L',
		77: 'KEY_M',
		78: 'KEY_N',
		79: 'KEY_O',
		80: 'KEY_P',
		81: 'KEY_Q',
		82: 'KEY_R',
		83: 'KEY_S',
		84: 'KEY_T',
		85: 'KEY_U',
		86: 'KEY_V',
		87: 'KEY_W',
		88: 'KEY_X',
		89: 'KEY_Y',
		90: 'KEY_Z',
		112: 'KEY_F1',
		113: 'KEY_F2',
		114: 'KEY_F3',
		115: 'KEY_F4',
		116: 'KEY_F5',
		117: 'KEY_F6',
		118: 'KEY_F7',
		119: 'KEY_F8',
		120: 'KEY_F9',
		121: 'KEY_F10',
		122: 'KEY_F11',
		123: 'KEY_F12',
		13: 'KEY_ENTER',
		17: 'KEY_ALT_RIGHT',
		18: 'KEY_ALT_LEFT',
		
		19: 'KEY_PAUSE',
		27: 'KEY_ESC',
		38: 'KEY_CURSOR_UP',
		40: 'KEY_CURSOR_DOWN',
		37: 'KEY_CURSOR_LEFT',
		39: 'KEY_CURSOR_RIGHT',
		
		45: 'KEY_INSERT',
		//45: 'KEY_DELETE',
		
		36: 'KEY_HOME',
		35: 'KEY_END',
		33: 'KEY_PGUP',
		34: 'KEY_PGDOWN',
		
		91: 'KEY_WINDOWS',
		93: 'KEY_CONTEXT',

		96: 'KEY_KP0',
		97: 'KEY_KP1',
		98: 'KEY_KP2',
		99: 'KEY_KP3',
		100: 'KEY_KP4',
		101: 'KEY_KP5',
		102: 'KEY_KP6',
		103: 'KEY_KP7',
		104: 'KEY_KP8',
		105: 'KEY_KP9',

		107: 'KEY_KP_PLUS',
		109: 'KEY_KP_MINUS',
		
	};
	var keys = [];
	var KEYNAMES = {};


	for (var i in KEYCODES)
	{
		this[KEYCODES[i]] = new Key(i, KEYCODES[i]);
		keys[i] = this[KEYCODES[i]];
	}
	var event__keydown = function(e)
	{
		var key = e.keyCode || e.charCode;
		if (keys[key] === undefined)
		{
			keys[key] = new Key();
			console.log('unknown key down: ' + key);
		}
		keys[key].pressed = true;
		if (keys[key].callback_press)
		{
			keys[key].callback_press();
		}
		// don't override F5, F11 or Backspace
		if (!(key == 116 || key == 122 || key == 8 ))
		{
			e.preventDefault();
			return false;
		}
	};
	var event__keyup = function(e)
	{
		var key = e.keyCode || e.charCode;
		if (keys[key] === undefined)
		{
			keys[key] = new Key();
		}
		keys[key].pressed = false;
		if (keys[key].callback_release)
		{
			keys[key].callback_release();
		}
		e.preventDefault();
		return false;
	};
	var event__mousewheel = function(e)
	{
		//console.log(e);
	}
	var event__mouse_down = function(e)
	{
		if (e.button == 0) keys[1234].pressed = true;
		if (e.button == 2) keys[1235].pressed = true;
		if (e.button == 1) keys[1236].pressed = true;
		if (event_handler__click)
		{
			event_handler__click(e);
		}
		e.preventDefault();
		return false;
	};
	var event__mouse_up = function(e)
	{
		if (e.button == 0) keys[1234].pressed = false;
		if (e.button == 2) keys[1235].pressed = false;
		if (e.button == 1) keys[1236].pressed = false;
		e.preventDefault();
		return false;
	};
	var event__mouse_move = function(e)
	{
		if (e.pageX	|| e.pageY)
		{
			self.mouse_x =	e.pageX;
			self.mouse_y =	e.pageY;
		}
		else
		{
			self.mouse_x =	e.clientX +	document.body.scrollLeft + document.documentElement.scrollLeft;
			self.mouse_y =	e.clientY +	document.body.scrollTop	+ document.documentElement.scrollTop;
		}
		self.mouse_x	-= this.offsetLeft;
		self.mouse_y	-= this.offsetTop;
		self.mouse_x	/= this.width * scale;
		self.mouse_y	/= this.height * scale;
		cameras.handle_mousemove(self.mouse_x, self.mouse_y);
	};

	function addEventListener(element, eventType, eventHandler, useCapture)
	{
		if (element.addEventListener) element.addEventListener(eventType, eventHandler, useCapture);
		else if (element.attachEvent) element.attachEvent('on' + eventType, eventHandler);
		else element['on' + eventType] = eventHandler;
	}
	
	function removeEventListener(element, eventType, eventHandler)
	{
		if (element.removeEventListener) element.removeEventListener(eventType, eventHandler);
		else if (element.detachEvent) element.detachEvent('on' + eventType, eventHandler);
		else element['on' + eventType] = null;
	}

	addEventListener(el, 'mousemove', event__mouse_move, true);

	//addEventListener(el, 'mousedown', event__mouse_down, true);
	//addEventListener(el, 'mouseup', event__mouse_up, true);
	//addEventListener(el, 'mousewheel', event__mousewheel, true);

	//document.onkeydown = event__keydown;
	//document.onkeyup = event__keyup;
	//document.onmousewheel = event__mousewheel;

};


