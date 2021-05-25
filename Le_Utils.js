"use strict";

function MakeLinGradient(ctx, x, y, x2, y2, stops)
{
	var grd = ctx.createLinearGradient(x, y, x2, y2);
	for (var i = 0; i < stops.length; i++)
	{
		grd.addColorStop(stops[i][0], stops[i][1]);
	}
	return grd;
}

var Averaging_Buckets = function(bucket_count, bucket_size, bucket_sizes, avg_mode, carry_over_mode)
{
	this.bucket_count = bucket_count;
	this.bucket_size = bucket_size;
	this.avg_mode = avg_mode;
	this.carry_over_mode = carry_over_mode;

	this.bucket_sizes = bucket_sizes;

	this.buckets = new Array(bucket_count);
	this.bucket_indices = new Array(bucket_count);
	for (var i = 0; i < bucket_count; i++)
	{
		if (this.bucket_sizes[i] == undefined)
		{
			this.bucket_sizes[i] = bucket_size;
		}
		this.buckets[i] = new Array(this.bucket_sizes[i]);
		for (var j = 0; j < this.bucket_sizes[i]; j++)
		{
			this.buckets[i][j] = Math.random() * 0.0;
		}
		this.bucket_indices[i] = 0;
	}
};

Averaging_Buckets.prototype.accum_bucket = function(bucket_id)
{
	var accum = 0;
	for (var j = 0; j < this.bucket_sizes[bucket_id]; j++)
	{
		accum += this.buckets[bucket_id][j];
	}
	return accum / this.bucket_sizes[bucket_id];
};


Averaging_Buckets.prototype.median_bucket = function(bucket_id)
{
	var values = this.buckets[bucket_id].concat();
    values.sort( function(a,b) {return a - b;} );
    var half = Math.floor(values.length/2);
    if(values.length % 2)
        return values[half];
    else
        return (values[half-1] + values[half]) / 2.0;
};

Averaging_Buckets.prototype.put = function(value)
{
	this.put_bucket(0, value);
};

Averaging_Buckets.prototype.put_bucket = function(bucket_id, value)
{
	var bucket_index = this.bucket_indices[bucket_id];

	if (
			(this.avg_mode == 0 && this.bucket_indices[bucket_id] == 0)
		||
			(this.avg_mode > 0 && !(bucket_index % this.avg_mode))
		)
	{ 
		if (bucket_id < this.bucket_count - 1)
		{
			// 0 average
			if (this.carry_over_mode == 0)
			{
				var overflow = this.accum_bucket(bucket_id);
				this.put_bucket(bucket_id + 1, overflow);
			}
			// 1 just carry over the current one (usefulness doubtful)
			else if (this.carry_over_mode == 1)
			{
				this.put_bucket(bucket_id + 1, this.buckets[bucket_id][bucket_index]);
			}
			// 2 median
			else
			{
				var overflow = this.median_bucket(bucket_id);
				this.put_bucket(bucket_id + 1, overflow);
			}
		}
	}

	this.buckets[bucket_id][bucket_index] = value;
	bucket_index++;
	if (bucket_index == this.bucket_sizes[bucket_id])
	{
		bucket_index = 0;
	}
	this.bucket_indices[bucket_id] = bucket_index;
};


window.requestAnimationFrame = (function(callback)
{
	return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
	function(callback)
	{
		window.setTimeout(callback, 1000 / 60);
	};
})();

if (!Date.now)
{
  Date.now = function now()
  {
    return new Date().getTime();
  };
}





// http://stackoverflow.com/questions/4554252/typed-arrays-in-gecko-2-float32array-concatenation-and-expansion
function Float32Concat(first, second)
{
	var firstLength = first.length,
		result = new Float32Array(firstLength + second.length);

	result.set(first);
	result.set(second, firstLength);
	return result;
}

var Stopwatch = function()
{
	this.stopwatches = {};
}

Stopwatch.prototype.start = function(name)
{
	//console.time(name);
	this.stopwatches[name] = performance.now();
}

Stopwatch.prototype.stop = function(name)
{
	//console.timeEnd(name);
	if (this.stopwatches[name] !== undefined)
	{
		console.log(Math.round(performance.now() - this.stopwatches[name]) + " ms\t" + name);
	}
	else
	{
		console.log('unknown stopwatch "' + name + '"');
	}
}

