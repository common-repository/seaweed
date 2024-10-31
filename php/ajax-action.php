<?php 

header('Content-Type: text/html; charset=UTF-8');
header('Content-Encoding: UTF-8');
header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
header("Cache-Control: no-store, no-cache, must-revalidate");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

// Let wordpress know we are proccessing an ajax transaction
define('DOING_AJAX', true);

// Let the statistics module know that the user is performing seaweed actions, not wordpress actions
define('SW_DOING_AJAX_ACTION', true);

$wp_root_url = dirname(dirname(dirname(dirname(dirname(__FILE__)))));

// Load wordpress
if (file_exists($wp_root_url.'/wp-load.php')) {
    // WP 2.6
    require_once($wp_root_url.'/wp-load.php');
} else {
    // Before 2.6
    require_once($wp_root_url.'/wp-config.php');
}

// Check that the request has an action and that the seaweed plugin is loaded
if (isset($_POST['action']) && isset($WPSeaweed)) {

  // nonce security check for ajax post
  check_ajax_referer('seaweed');

  // Create wp ajax responce object
  $response = new WP_Ajax_Response();

  $actionID = $_POST['action'];
  
  // Determine action to take
  switch($actionID) {
  
  case "savecomment": // Updates an existing comment
   
    $commentID = isset($_POST['comment_id']) ? (int) $_POST['comment_id'] : 0;
    $postID = isset($_POST['post_id']) ? (int) $_POST['post_id'] : 0;

    // Get the comment as an array
    $commentEntry = get_comment($commentID, ARRAY_A);

    // Set comment's content markup
    if (isset($_POST['comment_content']))
        $commentEntry['comment_content'] = $WPSeaweed->normalizeCSS(trim(urldecode($_POST['comment_content'])));
    
    // Set author    
    if (isset($_POST['comment_author']) && $WPSeaweed->canEditCommentAuthor($commentID, $postID)) 
        $commentEntry['comment_author'] = trim(strip_tags(urldecode($_POST['comment_author'])));

    // set author url
    if (isset($_POST['comment_author_url']) && $WPSeaweed->canEditCommentURL($commentID, $postID))
        $commentEntry['comment_author_url'] = trim(strip_tags(urldecode($_POST['comment_author_url'])));

    // Set author email
    if (isset($_POST['comment_author_email']) && $WPSeaweed->canEditCommentEmail($commentID, $postID))
        $commentEntry['comment_author_email'] = trim(strip_tags(urldecode($_POST['comment_author_email'])));
    
    // Check for js undefineds
    if ($commentEntry['comment_author_email'] == "undefined") 
      $commentEntry['comment_author_email']='';
    if ($commentEntry['comment_author_url'] == "undefined") 
      $commentEntry['comment_author_url']='http://';
    if ($commentEntry['comment_author'] == "undefined") 
      $commentEntry['comment_author']='';

    // Save the comment
    @$WPSeaweed->saveComment($commentID, $postID, $commentEntry, $response);
    break;
  	
  		
  case "savepost": // Updates and creates posts/pages
	
    $postID = isset($_POST['post_id']) ? (int) $_POST['post_id'] : -1;
    $isNewPost = $postID == -1; // If no post-id is set, then we are creating a new post
          
    // Get the post/page data if we are updating
    $postEntry;
    if (!$isNewPost){
        $postEntry = get_post($postID, ARRAY_A);
        if (!$postEntry)
            $isNewPost = true; // If doesn't actually exist then create a new one
    }
    
    // Create a new post array for new posts...
    if ($isNewPost)
        $postEntry = array();
    
    $parseError = NULL;

    foreach($_POST as $key => $value) {
    
        if ($parseError)
            break;
        
        if (stripos($key, 'post_') === 0 && strlen($key) > 5) {
        
            $postField = substr($key, 5);
            $assignValue = NULL;
            $assignKey = $key;
            
            switch($postField) {
            
            case "id":
                // DONE THIS
                break;

            case "content":      
                $assignValue = trim(urldecode($value));
      
                // Transform HTML prsentable code back into special markup
                $assignValue = $WPSeaweed->decodeContent($assignValue);

                if ($assignValue === NULL)  // Decode succeed?
                    $parseError = 'malformed_content';

                // KSES Strips color CSS not in hex format... some browsers like firefox
                // format the color css as rgb(r,g,b)
                $assignValue = $WPSeaweed->normalizeCSS($assignValue);
                
                break;

            case "excerpt":
            case "title":
                $assignValue = trim(strip_tags(urldecode($value)));
            break;

            case "new_categories":
            
                $assignKey = "post_category";
                $assignValue = isset($postEntry['category']) ? $postEntry['category'] : array();
                
                  
                require_once($wp_root_url.'/wp-admin/includes/taxonomy.php'); // For catagroy creation

                // Catagories can be separated by either commas or new lines
                //$catagories = explode(",", trim(urldecode($value))); // DEPRECIATED
                $catagories = preg_split('/[,\n\r]/', trim(urldecode($value)),  -1, PREG_SPLIT_NO_EMPTY);

                foreach($catagories as $catagory) {
                    
                    $catagory = trim($catagory);

                    if (!$catagory)
                        continue;

                    // Get ID of the given catagory
                    $catID = get_cat_ID($catagory);

                    if (!$catID) { // Doesn't Exist?
                        // Create new catagory - but only if has permission
                        if ($WPSeaweed->canCreateCatagory()) {

                            $catID = wp_create_category($catagory);
	      
                            if (!$catID) {
                                $parseError = 'category_creation_failed';
                                break;
                            } 
                              
                        } else {
                            $parseError = 'category_creation_denied';
                            break;
                        }	
                    
                    }

                    // Add catagory ID
                    $assignValue[] = $catID;
	    
               } // End loop: retrieving catagory IDs

                // Any catagories to assign?
                if (count($assignValue) == 0)
                $assignValue = NULL;
	  
                break;
            
            case "existing_categories":
            
                $assignKey = "post_category";
                $assignValue = isset($postEntry["category"]) ? $postEntry["category"] : array();
                
                $catIDs = explode(",", trim(urldecode($value)));
                
                foreach ($catIDs as $catID) {
                    if ($catID) {
                        $assignValue[] = (int)$catID;
                    }
                }
                
                // Any catagories to assign?
                if (count($assignValue) == 0)
                $assignValue = NULL;
                
                break;
                
            default:
                $assignValue = trim(urldecode($value));

            } // End switch

            // Create / Override post entry value
            if ($assignValue !== NULL) {
                if ($assignValue == "undefined") // Watch out for JS undefineds
                    $assignValue = "";
                $postEntry[$assignKey] = $assignValue;
            }
    
        }
        
        if ($key == "tags_input") {
        
            $tags = trim(urldecode($value));
            
            // Replace new lines with commas
            $tags = str_replace("\n", ',', $tags);
            $tags = str_replace("\r", ',', $tags);
            $tags = preg_replace('/,+/', ',', $tags); // consolidate commas into one
            
            $postEntry["tags_input"] = $tags;
            
        }

    } // End for-loop: parsing post entry fields

    if ($parseError) {
        $response->add( array(
            'what' => 'error',
            'id' => $postID,
            'data' => $WPSeaweed->getErrorMSG($parseError)
            ));
    } else {
    
        // Save/update/create the post
        @$WPSeaweed->savePost($postID, $postEntry, $response);
    }
    
    break;

  case 'deletepost':
  
     $postID = isset($_POST['post_id']) ? (int) $_POST['post_id'] : 0;
    
      if (!$postID) {
	     $response->add( array(
			      'what' => 'error',
			      'id' => '0',
			      'data' => $WPSeaweed->getErrorMSG('post_id_missing')
			      ));		      
      } else {
	      @$WPSeaweed->deletePost($postID, $response);
      }

    break;
    
    
  case 'spellcheck':
  case 'spellsuggest':
  
    // Pull in spell checker module
  	require_once('./spellchecker/includes/spell-checker.php');
  	
  	// Get the local language
  	$spellLang = "en"; // TODO: SUPPORT ALL LANGUAGES .. select clientside and post it..
  
    // Is there a spellcheck engine set in the configuation?
	if (isset($config['general.engine'])) {
	
		$spellchecker = new $config['general.engine']($config);
		
		if ($actionID == 'spellcheck') {
		
			$res = $spellchecker->checkWords($spellLang, explode(' ', $_POST['words']));
			
			//die('contents:'.$POST['words']);
			
			if (count($res) == 0){
				$response->add( array(
			      'what' => 'nomistakes',
			      'id' => '0',
			      'data' => '0'
			      ));
		    } else {
				$response->add( array(
			      'what' => 'mistakes',
			      'id' => '0',
			      'data' => implode(' ', $res)
			      ));
			}
			
		} else { // get suggestions
			
			$res = $spellchecker->getSuggestions($spellLang, $_POST['word']);
			
			if (count($res) == 0){
				$response->add( array(
			      'what' => 'nosuggestions',
			      'id' => '0',
			      'data' => '0'
			      ));
		    } else {
				$response->add( array(
			      'what' => 'suggestions',
			      'id' => '0',
			      'data' => implode(' ', $res)
			      ));
			}	
				
		}
		
	} else
		$response->add( array(
	      'what' => 'error',
	      'id' => '0',
	      'data' => $WPSeaweed->getErrorMSG('spell_no_engine')
	      ));	
		      
   break;
   
    
  default: // Bad action

    $response->add( array(
			  'what' => 'error',
			  'id' => '0',
			  'data' => 'Unknown action'
			  ));

  } // End Switch: actionID

 // Send the result
  $response->send();

 }

die('');

?>