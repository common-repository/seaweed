<?php
/**
 * @package Seaweed
 * @author Brook Novak
 */
/*
Plugin Name: Seaweed
Plugin URI: http://www.seaweed-editor.com
Description: Seamlessly edit your Blog with ease with Seaweed: the seamless web editor. No more administrator.
Author: Brook Novak
Version: 0.3.OpenBeta
Author URI: http://www.seaweed-editor.com
*/

/*  
    Copyright 2010 Brook Novak  (email : brooknovak@seaweed-editor.com) 

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program; if not, write to the Free Software
    Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

// Needed for initial test if user has permission to use plugin
require_once(ABSPATH . 'wp-includes/pluggable.php');

class WPSeaweed {

    var $localizationName = "Seaweed";
    
    var $adminOptionsName = "SeaweedPlugAdminOptions";
    var $userOptionsName = "SeaweedPlugUserOptions";
    var $adminOptions = NULL;
    var $userOptions = NULL;
    
    // Cached compution of current NONCE security key for seaweed
    var $nonce = NULL;

    // counter used for generating unique ID's in HTML and shortcodes
    var $GUIDGen = 1;
    
    // The 3 digit wordpress version in the form of an int. e.g. 2.8.0 = 280, 2.7.3 = 273, 2.8.5.1 trims to 285
    // 1.0 expands to 100
    var $wpVersionInt = 0;
    
    // Evaluates true if this is wordpress MU
    var $isWPMU = 0;
    
    /**
    * PHP 4 Compatible Constructor
    */
    function WPSeaweed(){$this->__construct();}
    
    /**
    * PHP 5 Constructor
    */		
    function __construct() {
    
        // Get numeric version # of wordpress
        global $wp_version;
        
        $this->wpVersionInt = str_replace('.', '', $wp_version);
        
        // Trim version to 3 digits
        if (strlen($this->wpVersionInt) > 3)
            $this->wpVersionInt = substr($this->wpVersionInt, 0, 3);
            
        while (strlen($this->wpVersionInt) < 3) {
            $this->wpVersionInt .= '0';
        }
        
        $this->wpVersionInt = 0 + $this->wpVersionInt;
        
        $this->isWPMU = function_exists('wpmu_create_user');
        
        // Setup paths
        if (!defined('WP_CONTENT_URL'))
          define('WP_CONTENT_URL', get_option('siteurl') . '/wp-content');
        
        if (!defined('WP_CONTENT_DIR'))
          define('WP_CONTENT_DIR', ABSPATH . 'wp-content');
        
        define('SW_PLUGIN_DIR_EXTERNAL', WP_CONTENT_URL . '/plugins/seaweed');
        
        define("SW_PLUGIN_DIR_INTERNAL", dirname(__FILE__));
        
        
        // Check if this user can use seaweed
        if ($this->canUsePlugin()) {
        
           // Load the options
           $this->adminOptions = $this->getAdminOptions();
           $this->userOptions = $this->getUserOptions();
        
            // Load the plugin
            if (!is_admin() && $this->hasUserEnabledPlugin()) { // Only seamless edit site, not administrator pages
        
                // Setup hooks in WP visiting mode
                
                // Initialization
                add_action('init', array(&$this,'init'));
                
                // Admin options
                add_action('admin_menu', array(&$this,'addAdminPages'));
                
               // Add js initialization script + styles
                add_action('wp_head', array(&$this,'printHeadscript'));
                
                if ($this->wpVersionInt >= 270) {
                    add_action('wp_print_styles', array(&$this,'addStylesheets'));
                }

                // Page content manipulation
                add_filter('get_comment_text', array(&$this,'getCommentTextFilter'));
                add_filter('get_comment_author_link', array(&$this,'getCommentAuthorLinkFilter'));
                add_filter( 'the_title', array(&$this,'postTitleFilter'), 1);
                add_filter( 'the_content', array(&$this,'theContentFilter'), 1); // Must be BEFORE shortcode filter and WPAUTOP and WPTEXTURIZE..
                add_filter( 'the_content', array(&$this,'injectShortcodeFilter'), 1001); // Must be AFTER shortcode filter and WPAUTOP and WPTEXTURIZE..
                
                // TODO: Smileys filtering? explore... must preserve original text smiley content                
                
                // TODO...
                // add_filter( 'the_excerpt', array(&$this,'the_excerpt_filter'));
                
                // configure KSES
                add_filter('edit_allowedtags', array(&$this,'editAllowedTagsFilter'));
                
                // Add the seaweed editor javascript to the head
                wp_enqueue_script("DEdit", "/wp-content/plugins/seaweed/js/dedit/DEdit.js"); // Prototype of Seaweed API
                
                // Add the wordpress seaweed GUI
                wp_enqueue_script("WPSeaweed", "/wp-content/plugins/seaweed/js/swwp/SWWP.js", array("DEdit", "jquery", $this->wpVersionInt < 280 ? "SWJQueryUIFix" : "SWJQueryUI")); // Compressed
 
 				// Wordpress versions 2.7 and below have outdated jquery libs... so pull in custom jquery script
 				// in these cases (this script renames jquery global to avoid clashes)
                if ($this->wpVersionInt < 280) {
                  
                    wp_enqueue_script("SWJQueryUIFix", "/wp-content/plugins/seaweed/js/sw-jqui-1.7.2.js", array("SWJQueryFix", "SWJQSelector")); 
                    
                    wp_enqueue_script("SWJQueryFix", "/wp-content/plugins/seaweed/js/sw-jq-1.3.2.js"); 
                         
                    wp_enqueue_script("SWJQSelector", "/wp-content/plugins/seaweed/js/jq-selector.js", array("SWJQueryFix"));
                     
                } else {
                
                    // Add jquerry UI
                    wp_enqueue_script("SWJQueryUI", "/wp-content/plugins/seaweed/js/jquery-ui-1.7.2.js", array("jquery")); // Could have conflicts with other libraries
                    
                    // Used by wp-ajax-response and WPSeaweed companion
                    //wp_enqueue_script("JQuerySW", "/wp-content/plugins/seaweed/js/jquery-1.3.2.js");
                    wp_enqueue_script("jquery");
                         
                    
                }             
                
                // Add WP Ajax Responce library
                wp_enqueue_script("wp-ajax-response");
              
            } else { // In admin view
             
                add_action('admin_menu', array(&$this,'addAdminPages'));
               
            }         
        
        }


    }
    
    /**
     * Invoked on wp init action
     */
    function init() {
      
      // Initialize localization
      $locale = get_locale();
      $mofile = SW_PLUGIN_DIR_INTERNAL . "/languages/" . $this->localizationName . "-{$locale}.mo";
      
      load_textdomain($this->localizationName, $mofile);
    
      // Compute nonce
      $this->nonce = wp_create_nonce('seaweed');
      
    }
    
    /**
     * Prints raw scripts in the page header 
     */
    function printHeadscript() {
      // Print the initialization script to kick-start the client-side GUI
      // and also store state information about the current page being viewed
    ?>
      <script type='text/javascript'>
      // <![CDATA[
      
        var $j= typeof swjQuery != "undefined" ?  swjQuery : jQuery;

        swwpInfo = {
            <?php
            
            $jsvars = $this->getJSVars();
            $addComma=0;
            
            foreach ($jsvars as $ident => $val) {
            
                if ($addComma) 
                	echo ",\n";
                	
                echo $ident .':'.$val;
                
                $addComma = 1;
            }
            
            ?>
        
        };
        
        $j(document).ready(swwp.init);  
        
    	// ]]>
       </script>
       <style type="text/css">
            .sw-cursor {
       			z-index:<?php echo $this->adminOptions['cursor_zindex'];?>;
       		}
       		<?php
       		
       			if ($this->userOptions['es_line_spacing'] != "OFF") {
       				echo ".editable-postContent, .editable-newContent, .editable-commentContent, .editable-postContent p, .editable-newContent p, .editable-commentContent p, .editable-postContent pre, .editable-newContent pre, .editable-commentContent pre { ";
       				echo "line-height: ".$this->userOptions['es_line_spacing']."%;";
       				echo "}";
       			}
       		
       		?>
       </style>
    <?php
    
        if ($this->wpVersionInt < 270) {
            $this->insertStylesheets(1);
        }
    }

    /**
     * Invoked via wp action.
     * Adds seaweed style sheets
     */
    function insertStylesheets($immediately) {

      // JQuerry UI Theme
      $styleUrl =  SW_PLUGIN_DIR_EXTERNAL . '/css/ui-'.$this->userOptions['gui_theme'].'/jquery-ui-1.7.2.custom.css';
      $styleFile = SW_PLUGIN_DIR_INTERNAL . '/css/ui-'.$this->userOptions['gui_theme'].'/jquery-ui-1.7.2.custom.css';
      
      if ( file_exists($styleFile) ) {
      
        if ($immediately) {
            echo '<link href="'.$styleUrl.'" rel="stylesheet" type="text/css"/>';
        } else {
            wp_register_style('swJQUIStyleSheet', $styleUrl);
            wp_enqueue_style( 'swJQUIStyleSheet');
        }
      }
    
      // Seaweed base style
      $styleUrl = SW_PLUGIN_DIR_EXTERNAL . '/css/seaweed.css';
      $styleFile = SW_PLUGIN_DIR_INTERNAL . '/css/seaweed.css';
      if ( file_exists($styleFile) ) {
    
        if ($immediately) {
            echo '<link href="'.$styleUrl.'" rel="stylesheet" type="text/css"/>';
        } else {
            wp_register_style('seaweedStyleSheet', $styleUrl, array('swJQUIStyleSheet'));
            wp_enqueue_style( 'seaweedStyleSheet');
        }
      }
      
    }
    
    /**
     * Invoked via wp action.
     * Adds seaweed style sheets
     */
    function addStylesheets() {
      $this->insertStylesheets(0);
    }

    /**
     * Returns javascript variables for clientside
     */
    function getJSVars() {
    
        $jsvars = array(
        
            'siteURL' => '"'.get_option('siteurl').'"',
            'plugURL' => '"'.SW_PLUGIN_DIR_EXTERNAL.'"',
            'nonce' => '"'.$this->nonce.'"',
            'view' => '"'.$this->getView().'"',
            
            /* The control panel */        
            'cp_se' => $this->userOptions['cpanel_start_expanded'] == "true" ? 'true' : 'false',
            'cp_op' => round((0+$this->userOptions['cpanel_opacity'])/100.0, 2),
             
            /* The toolbox */    
            'tb_sol' => $this->userOptions['toolbox_show_onload'] == "true" ? 'true' : 'false',
            'tb_sp' => '"'.$this->userOptions['toolbox_start_position'].'"',
            'tb_op' => round((0+$this->userOptions['toolbox_opacity'])/100.0, 2),
             
            'use_notifiers' => $this->userOptions['es_notifier_on'] == "true" ? 'true' : 'false',
            
            
            'undo_history' => $this->userOptions['undo_history']
            
        );
    	
    	// Create new-post/page ID... WP's convention is to user negative time
        if ($this->isSkeleton()) {
            $jsvars['tempID'] = -1 * time();
        }
        
        return $jsvars;
    
    }
    
    /**
     * Returns the current page view. e.g. new/single post/page, or unknown
     */
    function getView() {
      if ($this->isSkeleton()) {
        return 'new-'.$this->getSkeletonType();
      }
      if (is_single() || is_page()) {
        return is_single() ? 'single-post' : 'single-page';
      } else {
        return 'unknown';
      }
    }
    
    /** 
     * Returns an array of options for the seaweed plugin
     */
    function getAdminOptions() {
    
        $adminOptions = $this->adminOptions;
        
        if (empty($adminOptions)) {
              
            // Set defaults
            $adminOptions = array(
                'cursor_zindex' => '200',
                'spell_engine' => 'default'
            );
            
            // Get saved options from wp option db
            $options = get_option($this->adminOptionsName);
               
            if (!empty($options)) {
                foreach ($options as $key => $option)
                    $adminOptions[$key] = $option;
            }

            $this->adminOptions = $adminOptions;
            
            $this->saveAdminOptions();
        }
        
        return $this->adminOptions;
    }
    
    /** 
     * Returns an array of options for the seaweed plugin
     */
    function getUserOptions() {
    
    	global $user_email;
		if (empty($user_email)) {
			get_currentuserinfo();
		}
    
        $userOptions = $this->userOptions;
        
        if (empty($userOptions)) {
              
            // Set defaults
            $userOptions = array(
            
                // Appearance
                'gui_theme' => 'deep-lagoon',
                'cpanel_start_expanded' => 'true',
                'toolbox_show_onload' => 'false',
                'toolbox_start_position' => 'right-top',
                'es_notifier_on' => 'true',
                'cpanel_opacity' => '100',
                'toolbox_opacity' => '80',
                
                // Misc
                'es_line_spacing' => "OFF",
                'undo_history' => '100',
                'enabled' => 'true'
            );
            
            // Get saved options from wp option db
            $packedOptions = get_option($this->userOptionsName);
            $unpackedOptions = array();
               
            if (!empty($packedOptions) && !empty($user_email) && isset($packedOptions[$user_email])) {
            	
            	// User options are packed into one string. Each option is separated with commas.
            	// Each option is a name-value pair in the form "name:value"
            	$tuples = explode(",", $packedOptions[$user_email]);
            
            	foreach($tuples as $tuple) {
            		
            		// Extract name -> value from tuple
            		$sepIndex = strpos($tuple, ':');
            		if ($sepIndex !== FALSE && $sepIndex > 0) {
            			$unpackedOptions[substr($tuple, 0, $sepIndex)] = substr($tuple, $sepIndex+1);
            		}
            	}
            	
            	// Override defaults with this users saved options
                foreach ($unpackedOptions as $key => $val) {
                    $userOptions[$key] = $val;
                }
            }

            $this->userOptions = $userOptions;
            
            $this->saveUserOptions();
            
        }
     
        return $this->userOptions;
    }
    
    /**
     * Saves seaweed plugin options for users
     */
    function saveUserOptions(){
       
       	global $user_email;
		if (empty($user_email)) {
			get_currentuserinfo();
		}
		
        if (!empty($this->userOptions) && !empty($user_email)) {
        
        	$userOptions = get_option($this->userOptionsName);
        	
        	// Pack this user's options into a single string
        	$packedOptions = "";
        	foreach ($this->userOptions as $key => $val) {
        	    if ($packedOptions)
        	        $packedOptions .= ",";
        		$packedOptions .= "$key:$val";
        	}
        	
        	$userOptions[$user_email] = $packedOptions;
        	
        	update_option($this->userOptionsName, $userOptions);
        }
    }
    
    /**
     * Saves seaweed plugin admin options
     */
    function saveAdminOptions(){
        if (!empty($this->adminOptions)) {
        	update_option($this->adminOptionsName, $this->adminOptions);
        }
    }    
    
    /**
     * Prints the administration page for setting seaweed admin options
     */
    function printAdminOptionsPage() {
      include SW_PLUGIN_DIR_INTERNAL . '/php/admin-options-panel.php';
    }
    
    function printUserOptionsPage() {
    	include SW_PLUGIN_DIR_INTERNAL . '/php/user-options-panel.php';
    }
    
    /**
     * Adds admin options pages for shared(admin) and user settings
     */
    function addAdminPages(){
    	if (function_exists('add_options_page')) {
    		add_options_page('Seaweed', 'Seaweed', 9, basename(__FILE__), array(&$this,'printAdminOptionsPage'));
    	}

        if (function_exists('add_submenu_page')) {
        	add_submenu_page('profile.php', "Seaweed Plugin Options","Seaweed Plugin Options", 0, basename(__FILE__), array(&$this, 'printUserOptionsPage'));
        }
    }

    /**
     * WP Filter hook: makes comment contents editable
     */
    function getCommentTextFilter($content) {
      global $comment;
      if ($this->canEditComment($comment->comment_ID, $comment->comment_post_ID))
        return '<div class="editable-commentContent" id="editable-commentContent-'.$comment->comment_post_ID.'-'.$comment->comment_ID.'">'.$content.'</div>';
      return $content;
    }
    
    /**
     * WP Filter hook: makes comment authors editable
     */
    function getCommentAuthorLinkFilter($content) {
      global $comment;
      if ($this->canEditCommentAuthor($comment->comment_ID, $comment->comment_post_ID))
        return '<span class="editable-commentAuthor" id="editable-commentAuthor-'.$comment->comment_post_ID.'-'.$comment->comment_ID.'">'.$content.'</span>';
      return $content;
    }
    
    /**
     * WP Filter hook: makes post/page titles editable
     */
    function postTitleFilter($title) {
      global $post;
      if (in_the_loop()) {
      
      	$this->GUIDGen ++; 
      	if ($this->canEditPost($post->ID) && ($post->post_type == "post" || $post->post_type == "page")) {
      	    
      	    // Does this post title even belong to this post?
      	    if (strtolower($title) == strtolower($post->post_title)) {
    
    			// Titles are encoded since they can oftenly appear in HTML attributes
      	    	return '[editable-postTitle-'.$post->ID.'-'.$this->GUIDGen.']'.$title.'[/editable-postTitle]';
      	    
      	    }
        }
      }
      return $title;
    }
    
    /**
     * WP Filter hook: makes post/page contents editable
     */
    function theContentFilter($content) {
      
        global $post, $more, $page, $pages, $multipage;
      
        // Exclude content with multiple pages from being editable .. or non page/post entries (e.g. attachments)
        if ($multipage || ($post->post_type != "post" && $post->post_type != "page")) {
          return $content;
        }
      
        // Exclude posts which is just teaser content
        if (!$more) {
            $fullContent = $pages[$page-1];
            if ( preg_match('/<!--more(.*?)?-->/', $fullContent, $matches) ) {
            	return '<div class="swwp-post-preview">'.$content.'</div>';
            } 
        }
    
        if ($this->canEditPost($post->ID))  {
      		return '<div class="editable-postContent" id="editable-postContent-'.$post->ID.'">'
      		    .$this->encodeEditableContent($content)
      		    .'</div>';
        }
       
        return $content;
    }
    
    /**
     * Adds html tags so wp kses filter wont strip out formatting tags.
     * @return Added tags used by seaweed
     */
    function editAllowedTagsFilter() {
        global $allowedposttags;
        
        if (!isset($allowedposttags['span']))
            $allowedposttags['span'] = array();
            
        $span = $allowedposttags['span'];
        
        if (!isset($span['style']))
            $span['style'] = array(); 
    }


    /* ------------------------------------------------------------------------------------
                                              ERRORS
     ------------------------------------------------------------------------------------ */
    
    // Sets up error codes
    function initErrors() {         
            
            $this->errorCodes = new WP_Error();
            $this->errorCodes->add('invalid_email', __('Please enter a valid email address.',$this->localizationName));
            $this->errorCodes->add('required_fields', __('Please fill in the required fields',$this->localizationName));
            $this->errorCodes->add('content_empty',__('You cannot have an empty comment.',$this->localizationName) );
            $this->errorCodes->add('post_edit_denied', __('You do not have permission to edit this post.',$this->localizationName));
            $this->errorCodes->add('post_publish_denied', __('You do not have permission to publish this post/page.',$this->localizationName));
            $this->errorCodes->add('post_insert_failed', __('Failed to insert a new post/page.',$this->localizationName));
            $this->errorCodes->add('post_update_failed', __('Failed to update an existing post/page.',$this->localizationName));
            $this->errorCodes->add('post_delete_failed', __('Failed to delete an existing post/page.',$this->localizationName));
            $this->errorCodes->add('post_delete_denied', __('You do not have permission to delete this post/page.',$this->localizationName));
            $this->errorCodes->add('post_id_missing', __('Post id not found',$this->localizationName));
            $this->errorCodes->add('newpost_explicit_id', __('unexpected error - attempt to create new post with explicit id.',$this->localizationName));
            $this->errorCodes->add('new_comment_posted', __('You cannot edit a comment after other comments have been posted.', $this->localizationName));
            $this->errorCodes->add('comment_edit_denied', __('You do not have permission to edit this comment.',$this->localizationName));
            $this->errorCodes->add('comment_marked_spam', __('Comment marked as spam.',$this->localizationName));
            $this->errorCodes->add('comment_spam',__('This comment cannot be edited because it is marked as spam.',$this->localizationName));
            $this->errorCodes->add('get_comment_failed',__('Comment loading failed.',$this->localizationName));
            $this->errorCodes->add('malformed_content', __('Bad content markup',$this->localizationName));
            $this->errorCodes->add('category_creation_failed', __('Failed to create new category',$this->localizationName));
            $this->errorCodes->add('category_creation_denied', __('You do not have permission to create new categories',$this->localizationName));
			$this->errorCodes->add('spell_no_engine', __('Spellcheck config does not specify spellchecker engine',$this->localizationName));
			
			
			
    }
        
    /** 
     * Retrieves an error message for a given error code.
     * Parameters - $code The error code to retrieve. Can be empty/null for unkown errors.
     * Returns a readable error message 
     */
    function getErrorMSG($code = '') {
      $errorMessage = $this->errorCodes->get_error_message($code);
      if ($errorMessage == null) 
        $errorMessage = "Unknown error.";
      return __($errorMessage, $this->localizationName);
    }
    
    
    
    /* ------------------------------------------------------------------------------------
                                            PERMISSIONS
     ------------------------------------------------------------------------------------ */

    /**
     * Returns a logged-in user's ID. -1 if unable to get id
     */
    function getUserID() {
      global $user_ID;
      if (!function_exists("get_currentuserinfo")) 
        return -1;
      if (empty($user_ID)) 
        get_currentuserinfo(); //try to get user info
      if (empty($user_ID))
        return -1;
      return $user_ID;
    }
    
    /**
     * Returns True if the current user has enabled the seaweed plugin.
     * NOTE: This is not the same as activated... every blog user can choose to
     * enable or disable seaweed.
     */
    function hasUserEnabledPlugin() {
    	return $this->userOptions['enabled'] == 'true';
    }
    
    /**
     * Anyone with author roles+ can use seaweed
     * Authors = level 2...
     * Returns true if the user is allowed to use the seaweed plugin.
     */
    function canUsePlugin() {
        return current_user_can('edit_posts');
    }
    
    /**
     * Returns true if the user is logged in as admin
     */
    function isUserAdmin() {
      return current_user_can('edit_users');
    }
    
    /**
     * Returns true if user owns given post
     */
    function isPostOwner($postID = 0) {
      return $this->isUserAdmin() || current_user_can('edit_page', $postID) || current_user_can('edit_post', $postID);
    }
    
    /**
     * Checks to see if a user can edit a comment
     * Returns true if one can, false if not 
     */
    function canEditComment($commentID, $postID) {
      return $this->isPostOwner($postID); // Only allow post owners / admins
    }
    
    /** 
     * Checks to see if a user can edit a comment author
     * Returns true if one can, false if not 
     */
    function canEditCommentAuthor($commentID, $postID) {
      return $this->isPostOwner($postID); // Only allow post owners / admins
    }
    
    /** 
     * Checks to see if a user can edit an e-mail address on a comment
     * Returns true if one can, false if not 
     */
    function canEditCommentEmail($commentID, $postID) {
      
      $comment = get_comment($commentID, ARRAY_A);
      
      // return false if comment is pingback or trackback
      if ($comment['comment_type'] == "pingback" || $comment['comment_type'] == 'trackback') 
        return false; 
      
      return $this->isPostOwner($postID); // Only allow post owners / admins
    }
    
    /** 
     * Checks to see if a user can edit a url on a comment
     * Returns true if one can, false if not 
     */
    function canEditCommentURL($commentID, $postID) {
      return $this->isPostOwner($postID); // Only allow post owners / admins
    }
    
    /**
     * Determines if a user can edit a particular post or page
     */
    function canEditPost($postID = 0) {
      return $this->isPostOwner($postID); // Only allow post owners / admins
    }
    
    /**
     * Determines if a user can delete a particular post or page
     */
    function canDeletePost($postID = 0) {
    	return $this->isPostOwner($postID);
    }
    
    /**
     * Determines if a user can write/save a draft page or post
     */
    function canWriteDraft() {
      return current_user_can('edit_page') || current_user_can('edit_post');
    }
    
    /**
     * Determines if a user can publish a post
     */
    function canPublishPost() {
      return current_user_can('publish_posts');
    }
    
    /**
     * Determines if a user can publish a page
     */
    function canPublishPage() {
      return current_user_can('publish_pages');
    }
    
    /**
     * Determines if a user can create/delete catagories
     */
    function canCreateCatagory() {
      return current_user_can('manage_categories');
    }
    
    
    /* ------------------------------------------------------------------------------------
                                            Skeleton
     ------------------------------------------------------------------------------------ */
    
    /**
     * Returns "page" or "post". Assumes that the current request is for a skeleton document
     */
    function getSkeletonType() {
      return $_GET['newtype'] == "page" ? "page" : "post";
    }
    
    /**
     * Returns True if the current request is for a skeleton document 
     * AND they have permissions to create new posts
     * AND the nonce check passes
     * I.E. The user want to create a new post / page via seaweed
     */
    function isSkeleton() {
      return isset($_GET['newtype']) && isset($_GET['nonce']) && wp_verify_nonce($_GET['nonce'], 'seaweed') && $this->canUsePlugin();
    }
    
    
    
    
    
    /* ------------------------------------------------------------------------------------
                                            Posts
     ------------------------------------------------------------------------------------ */
    
    /**
     * Saves a post. If the post ID is negative then a new post is created.
     * Parameters - postID, postarr, response
     * Returns - True if was successful, otherwise false
     */
    function savePost($postID, $postarr, &$response) {
    
      // make sure the post content has something in it
      if (count($postarr) == 0 || 
          '' == $postarr['post_content'] || 
          '' == $postarr['post_title']) {
          
        $response->add( array(
    			  'what' => 'error',
    			  'id' => $postID,
    			  'data' => $this->getErrorMSG('content_empty')
    			  ));
        return false;
      }
    
      // Is the post new?
      $newPost = $postID < 0;
      if ($newPost && (isset($postarr['ID']) || isset($postarr['post_id']))) { // Sanity check
        $response->add( array(
    			  'what' => 'error',
    			  'id' => $postID,
    			  'data' => $this->getErrorMSG('newpost_explicit_id')
    			  ));
        return false;
      }
      
    
      $post_status = isset($postarr['post_status']) ? $postarr['post_status'] : 'draft';
      $post_type = isset($postarr['post_type']) ? $postarr['post_type'] : 'post';
      
      // Check is the user can publish the post - if they are wanting to publish
      if ($post_status == "publish") {
        if (($post_type == 'post' && !$this->canPublishPost()) || 
    	($post_type == 'page' && !$this->canPublishPage())) {
          $response->add( array(
    			    'what' => 'error',
    			    'id' => $postID,
    			    'data' => $this->getErrorMSG('post_publish_denied')
    			    ));
          return false;
        }
      }
    
      // Check if the user can create or edit posts
      if (($newPost && !$this->canWriteDraft()) || 
          (!$newPost && !$this->canEditPost($postID))) {
        $response->add( array(
    			  'what' => 'error',
    			  'id' => $postID,
    			  'data' => $this->getErrorMSG('post_edit_denied')
    			  ));
        return false;
      }
    
      if ($newPost) {
      
        // Insert the new post and get the new ID
        $postID = wp_insert_post($postarr);
        
        if (!$postID) {
          $response->add( array(
    			    'what' => 'error',
    			    'id' => '0',
    			    'data' => $this->getErrorMSG('post_insert_failed')
    			    ));
          return false;
        }
        
      } else {
      
        if (!wp_update_post($postarr)) {
        
          $response->add( array(
    			    'what' => 'error',
    			    'id' => $postID,
    			    'data' => $this->getErrorMSG('post_update_failed')
    			    ));
          return false;
          
        }
      }
    
      // Respond success info
      $response->add( array(
    			'what' => 'save_result',
    			'id' => $postID,
    			'data' => 'success'
    			));
    			
      return true;
    
    } // End savePost
    
    
    
    /**
     * Deletes a page/post
     * Parameters - postID, responce
     * Returns - True if was successful, otherwise false
     */
    function deletePost($postID, &$response) {
    	
    	if (!$this->canDeletePost($postID)) {
    	 
            $response->add( array(
    			    'what' => 'error',
    			    'id' => $postID,
    			    'data' => $this->getErrorMSG('post_delete_denied')
    			    ));
    		return false;
    	}
    	 
    	if (wp_delete_post($postID) === false) {
            $response->add( array(
    			    'what' => 'error',
    			    'id' => $postID,
    			    'data' => $this->getErrorMSG('post_delete_failed')
    			    ));
    		return false;
    	}
    	
      // Respond success info
      $response->add( array(
    			'what' => 'delete_result',
    			'id' => $postID,
    			'data' => 'success'
    			));
    			
      return true;
    } // End deletePost
  
  
function normalizeCSS($html) {

    // eg <span style=\"color: rgb(153, 204, 0);\">   =>  <span style=\"#ABE900;\">
    while(preg_match('/<.+?style\s*=\s*\\\\?(\'|").*?(?:color|background-color)\s*:\s*((?:rgb|RGB)(?:a|A)?\s*\(\s*([^,\s]+)\s*,\s*([^,\s]+)\s*,\s*([^,\s]+)\s*(?:,\s*([^\)\s]+)\s*)?\)).*?\\\\?\1.*?>/', $html, $matches, PREG_OFFSET_CAPTURE)) {

        // 1 = style quote
        // 2 = RGBA(...)
        // 3-6 = RGBA
        $rgbval = 0;
        
        for ($i = 3; $i <= 5; $i++) { // Ignore alpha
          // Convert RGBA to hex so KSES won't strip it out
          $val = 0;
        
          if (strpos($matches[$i][0], '%') !== FALSE) {
            $val = $matches[$i][0];
            $val = 0+str_replace('%', '', $val);
            $val /= 100.0;
            $val *= 255;		
          } else if (strpos($matches[$i][0], '.') !== FALSE && $matches[$i][0] >= 0 && $matches[$i][0] < 100) {
            $val = 0 + $matches[$i][0];
            $val *= 255;
          } else {
            $val = 0 + $matches[$i][0];
          }
        
          // Clamp val to 0-255
          $val = floor($val);
          if ($val < 0) { 
              $val = 0;
          }
          if ($val > 255) {
              $val = 255;
          }
          // Pack rgb value
          if ($i > 3) {
              $rgbval = $rgbval << 8;
          }
          $rgbval |= $val;
          
        } // end packing rgbval
        
        
        // Convert rgb val to hex notation - 6 charactor exactly
        $rgbHex = dechex($rgbval);
        
        
        while (strlen($rgbHex) < 6) {
          $rgbHex = '0'.$rgbHex;
        }
        
        if (strlen($rgbHex) > 6) {
          $rgbHex = substr($rgbHex, strlen($rgbHex) - 6);
        }
        // Replace rgba css with hex equivalent
        $newhtml = substr($html, 0, $matches[2][1]);
        $newhtml .= '#' . strtolower($rgbHex);
        $newhtml .= substr($html, $matches[2][1] + strlen($matches[2][0]));
        $html = $newhtml;
        
   } // end while: normalizing html

  return $html;
}
    
    
    
    /* ------------------------------------------------------------------------------------
                                            Comments
     ------------------------------------------------------------------------------------ */
    
    /**
     * Saves a comment
     * Parameters - $commentID, $postID, $commentarr (comment array), $responce
     * Returns True on success, false on failure
     */
    function saveComment($commentID, $postID, $commentarr, &$response) {
        global $wpdb;
      
        // make sure the comment has something in it
        if ('' === $commentarr['comment_content'] || $commentarr['comment_content'] == "undefined") {
            $response->add( array(
                'what' => 'error',
                'id' => $commentID,
                'data' => $this->getErrorMSG('content_empty')
            ));
        
            return false;
        }
      
        if (!$this->canEditComment($commentID, $postID)) {
            $response->add( array(
                'what' => 'error',
                'id' => $commentID,
                'data' => $this->getErrorMSG('comment_edit_denied')
            ));
            return false;
        }
      
        // Make sure the e-mail is valid - Skip if pingback or trackback
        if (!($this->isUserAdmin() && empty($commentarr['comment_author_email']))) {
            if (!is_email($commentarr['comment_author_email']) && $commentarr['comment_type'] != "pingback" && $commentarr['comment_type'] != "trackback") {
                if ($this->canEditCommentEmail($commentID, $postID)) {
                    $response->add( array(
                        'what' => 'error',
                        'id' => $commentID,
                        'data' => $this->getErrorMSG('invalid_email')
                    ));
                    return false;
                }
            }
        }
      
        // NB: comment out if getting char errors  
        if (strtolower(get_option('blog_charset')) != 'utf-8')
            @$wpdb->query("SET names 'utf8'");
      
        // Save the comment
        $commentarr['comment_ID'] = (int)$commentID;
        $commentapproved = $commentarr['comment_approved'];
      
        // Update the comment
        @wp_update_comment($commentarr);
      
        // If spammed, return error
        if ($commentarr['comment_approved'] === 'spam') {
            $response->add( array(
                'what' => 'error',
                'id' => $commentID,
                'data' => $this->getErrorMSG('comment_marked_spam')
            ));
            return false;
        }
      
        // If moderated, return error
        if ($commentarr['comment_approved'] == 0 && $commentapproved != 0) {
            $response->add( array(
                'what' => 'error',
                'id' => $commentID,
                'data' => $this->getErrorMSG('comment_marked_moderated')
            ));
            return false;
        }
      
        // Add success responce
        $response->add( array(
            'what' => 'save_result',
            'id' => $commentID,
            'data' => 'success'
        ));
      
        return true;
      
    } // End saveComment
    
    
    
    
    
    
    /* ------------------------------------------------------------------------------------
                                         Shortcode management
     ------------------------------------------------------------------------------------ */
    
    // Used when filterting content with shortcodes
    var $shortcodeCaptures = array();
    
    /** 
     * Invoked in post content filter before the shortcode filter -> only if the content will be editable.
     * Wraps shortcodes with encoded HTML comments (except for the caption shortcode).
     */
    function encodeEditableContent($content) {
    	// Encapsulate shortcodes
        return preg_replace_callback('/(.?)\[(\w+?)\b(.*?)(?:(\/))?\](?:(.+?)\[\/\2\])?(.?)/s', array(&$this,'encapShortcodeTag'), $content);
    }
    
    /**
     * Encodes a shortcode
     * @param m The regexp match of a shortcode pattern
     * @return The replacement
     */
    function encapShortcodeTag($m) {
    
    	$tag = $m[2];
    	
        // Ignore escapes [[foo]] and captions (handled specially)
        if (($m[1] == '[' && $m[6] == ']') || strtolower($tag) == "caption" || strtolower($tag) == "wp-caption") {
        	return $m[0];
        }
    
        $shortcode = $m[0];
        
        // Remove extra surrounded symbols not actual part of short code
        if (isset($m[1]) && $m[1]) {
        	$shortcode = substr($shortcode, strlen($m[1])); 
        }
    
        if (isset($m[6]) && $m[6]) {
        	$shortcode = substr($shortcode, 0, strlen($shortcode) - strlen($m[6]));
        }    
       
        $this->GUIDGen++;
        
        // Capture raw shortcode. Note inserting into comments now to avoid filters like WPAUTOP and WPTECTURIZE
        // from manipulating the "raw" shortcode. This is really bad in situations like the sourcecode highlighter.
        $this->shortcodeCaptures['sc'.$this->GUIDGen] = $shortcode;
        
        // Need to use span because:
        // 1. Shortcodes can occur in elements which do not allow block-level content, such as paragraphs.
        // 2. Shortcodes may contain inline content-only. Block level wrapper would add unwanted linebreaks.
        
        // Return encapsulated shortcode
        return $m[1]
        	.'<span id="swwp-sc-start-'.$this->GUIDGen.'" class="swwp-sc-start" style="display:none">'
        	.$this->GUIDGen.'_'.$tag
        	.'(_SW_SC_PLACEHOLDER:'.$this->GUIDGen.')</span>'
        	.$shortcode
        	.'<span id="swwp-sc-end-'.$this->GUIDGen.'" class="swwp-sc-end" style="display:none">'
        	.$this->GUIDGen
        	.'</span>'
        	.$m[6];
        
    }
    
    /**
     * Replaces the shortcode placeholders with raw shortcodes
     */
    function injectShortcodeFilter($content) {
    
        $newContent = "";
    
        // Inject raw shortcodes captures in post filter
        while(preg_match('/\(_SW_SC_PLACEHOLDER:(\d+)\)/s', $content, $match, PREG_OFFSET_CAPTURE)) {
        
            // Lookup captured shortcode for this GUID
            $replaceWith = "";
            if (isset($this->shortcodeCaptures['sc'.$match[1][0]])) {
                $replaceWith = '<!--' . $this->shortcodeCaptures['sc'.$match[1][0]] . '-->';
            }
            
            $newContent .= substr($content, 0, $match[0][1]) . $replaceWith;
            $content = substr($content, $match[0][1] + strlen($match[0][0]));
      
        }
        
        return $newContent . $content;
        
    }
    
    /**
     * Decodes post content so that transformed shortcodes are replaced with their original shortcodes
     * @return The decoded version
     */
    function decodeContent($content) {
        return preg_replace('/<!--\s*_SWWP_SC:\s*\[\[?(.+?)\]\]?\s*-->/s', '[$1]', $content);
    }

    

} // End Class definition WPSeaweed



if (get_bloginfo('version') >= "2.5") {

    // Create the global seaweed singleton
    $WPSeaweed = new WPSeaweed();
   
}


?>
