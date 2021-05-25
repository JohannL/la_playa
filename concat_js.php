<?php

function rfc_date($timestamp)
{
	return substr(date('r', $timestamp), 0, -5) . 'GMT';
}

header('Content-Type: application/javascript; charset=UTF-8');
header('Cache-Control: public, cache, max-age=' . (3600 * 12));
header('Expires: ' . rfc_date(round(microtime(true)) + (3600 * 12)));

$query = preg_replace('{ [^ \w _ \- , ] }x', '', $_SERVER['QUERY_STRING'] );
$files = explode(',', $query);
foreach ($files as $file)
{
	$filename = $file . '.js';
	if (is_file($filename))
	{
		readfile($filename);
		echo '

';
	}
}

