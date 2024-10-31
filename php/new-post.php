<?php

$root = dirname(dirname(dirname(dirname(dirname(__FILE__)))));

// Load wordpress
if (file_exists($root.'/wp-load.php')) {
  // WP 2.6
  require_once($root.'/wp-load.php');
} else {
  // Before 2.6
  require_once($root.'/wp-config.php');
}

/**
 * Prints the editable post/page title of a skeleton document
 */
function sw_skeleton_title() {
  echo '<span id="editableNewTitle" class="editable-newTitle"><span class="sw-es-ph">[Enter new title]</span></p></span>';
}

/**
 * Prints the editable post/page content of a skeleton document
 */
function sw_skeleton_content() {
  echo '<div id="editableNewContent" class="editable-newContent"><p><span class="sw-es-ph">[Enter new content]</span></p></div>';
}

/**
 * Prints metadata form .. e.g. for posts forms fields like excerpt and categoies will be printed.
 */
function sw_print_metaform() {

    global $WPSeaweed;
    
    // Append extra fields according to the post type
    if($WPSeaweed->getSkeletonType() == "page") {
    
      // TODO ??
    
    } else { // POST
?>
<span style="display:block;clear:both;height:0;visibility:hidden">.</span>
<br/>
<hr/>
<h2>Additional Post Information</h2>

<table class="swNewPostMeta" cellspacing="0" cellpadding="0">
<tbody>

<tr>
<th scope="row"><label for="swNewTags"><?php _e('Tags', $WPSeaweed->localizationName); ?>:</label></th>
<td>
<textarea id="swNewTags" rows="3" cols="70"></textarea>
<br/><em>(<?php _e('Separate tags with commas or newlines'); ?>)</em>
</td>
</tr>

<tr>
<th scope="row"><label for="swExcerpt"><?php _e('Excerpt', $WPSeaweed->localizationName); ?>:</label></th>
<td>
<textarea id="swExcerpt" rows="5" cols="70"></textarea>
</td>
</tr>

<tr>
<th scope="row" valign="top"><label><?php _e('Assign Catagories', $WPSeaweed->localizationName); ?>:</label></th>
<td>
<?php 
	$categories = get_categories(array(
	    'type'                     => 'post',
	    'child_of'                 => 0,
	    'orderby'                  => 'name',
	    'order'                    => 'ASC',
	    'hide_empty'               => false,
	    'include_last_update_time' => false,
	    'hierarchical'             => 1,
	    'pad_counts'               => false ));
	    
	 foreach ($categories as $cat) {
		echo '<label for="swcat' . $cat->cat_ID 
			. '" ><input type="checkbox" id="swcat' . $cat->cat_ID 
			. '"/>&nbsp;'.$cat->cat_name.'</label><br/>';
	}
    
?>
</td>
</tr>

<tr>
<th scope="row"><label for="swNewCatagories"><?php _e('New Catagories', $WPSeaweed->localizationName); ?>:</label></th>
<td>
<textarea type="text" id="swNewCatagories" rows="3" cols="70"></textarea>
<br/><em>(<?php _e('Separate catagories with commas or newlines, case sensitive'); ?>)</em>
</td>
</tr>

</tbody>
</table>

	<?php
    
    }
}

// Print header
get_header();

  // Security check
  if (isset($WPSeaweed) && $WPSeaweed->isSkeleton()) {
	
	// Print new post template
	  echo '<div id="swSkeletonContent">';
	
	  // Pull in the skeleton file
	  $templateFile = SW_PLUGIN_DIR_INTERNAL . "/php/skeletons/custom-skeleton.php";
	  if (!$WPSeaweed->options['use_skeleton'] || !file_exists($templateFile)){
	  
	    $themeID = str_replace(" ", "_", strtolower(basename(get_current_theme())));
	    
	    // Special case: standard wordpress mu home theme is the default theme
	    if ($themeID == "wordpress_mu_homepage")
	        $themeID = "wordpress_default";
	    
	  	// Try use a predefined skeleton for the current theme
	  	$templateFile = SW_PLUGIN_DIR_INTERNAL . "/php/skeletons/$themeID.php";

		if (!file_exists($templateFile)) {		

		    // If the current theme provides no custom skeleton, then use the default
		    $templateFile = SW_PLUGIN_DIR_INTERNAL . "/php/generic-skeleton.php";
		    if (!file_exists($templateFile)) {
		      echo "Error: Missing ".$templateFile;
		      $templateFile = NULL;
		    }
	  
		}
	 }
	 
	 // Was there a skeletal document?
	 if ($templateFile) {
	    // Output raw HTML
	    include $templateFile;
	    
	 } else {
        ?>
        <p>Unable to display template for a new <?php echo $WPSeaweed->getSkeletonType() ?></p>
        <?php
    }
 
  }

// Print footer
get_footer();

?>
