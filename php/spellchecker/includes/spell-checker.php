<?php

@error_reporting(E_ALL ^ E_NOTICE);

$config = array();

// Look for WP TINYMCE config - they may not use default coniguration
if (file_exists("${wp_root_url}/wp-includes/js/tinymce/plugins/spellchecker/config.php"))
    require_once("${wp_root_url}/wp-includes/js/tinymce/plugins/spellchecker/config.php");

// Use default config for seaweed
if (!isset($config['general.engine']))
    require_once(dirname(__FILE__) . "/../config.php");

require_once(dirname(__FILE__) . "/../classes/SpellChecker.php");

// Check if explicit engine defined in seaweed plugin settings
if (isset($WPSeaweed) && isset($WPSeaweed->options['spell_engine']) && $WPSeaweed->options['spell_engine'] != "default")
    $config['general.engine'] = $WPSeaweed->options['spell_engine'];

if (isset($config['general.engine']))
	require_once(dirname(__FILE__) . "/../classes/" . $config["general.engine"] . ".php");

?>
