/*
 * file: WPActions.js
 *
 * @BEGINLICENSE
 * Copyright 2010 Brook Novak  (email : brooknovak@seaweed-editor.com) 
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
 * @ENDLICENSE
 */
swwpBootstrap.scriptLoaded();

/**
 * @return {Boolean} True if this page is a new post/page.
 */
function isNewEntry() {
	return swwpInfo.view.indexOf("new-") == 0;
}

function isSingleView() {
    return swwpInfo.view.indexOf('single-') == 0;
}

/**
 * @param {Node} postES The post edit section to extract the id from
 * @return {Number} The post id, Null if not a post content/title editable section
 */
function extractPostID(postES) {
	var cname = de.findClassName(postES, /^editable-post.+/);
	if (cname) {
        var match = (new RegExp("^" + cname + "-(\\d+)$").exec(postES.id)) || (new RegExp("^" + cname + "-(\\d+)-(\\d+)$").exec(postES.id));
        if (match)
            return parseInt(match[1]);
    }
    return null;
}

var swwpAjax;

(function() {
    
    var ajaxFailMessage = "Failed to communicate changes to server";
    
    swwpAjax = {
        
        init : function() {
            de.model(this);
        },
        
        /**
         * List of editable section nodes waiting to be saved
         */
        itemsPending : [],
        
        /**
         * Saves all the given edit sections which are <i>existing</i> post/page/comment fields.
         * Clears the selection,
         * Wipes changes for each given edit sections.
         * Fires "OnSave" per edit section, then "onSaveSucceeded" or "onSaveFailed" depending on result per edit section.
         * 
         * @param {[Element]} editSections The list of edit sections to save
         */
        saveExisting : function (editSections) {
            
        	// Safety - so wont transmit highlighted CSS
        	de.selection.clear();
            
            var editedComments = [], 
                editedPosts = [];
            
            for (var i in editSections) {
                
                var es = editSections[i];
    
                this.itemsPending.push(es);
                        
                // Set new save point for the given edit section. This needs to be done now
                // since the current state of the editable section will be transmitted and yet could be
                // edited in the time it takes for the save to be acknowledged.
                de.Changes.clear(es);
                
                this.fireEvent("Save", es);
                        
            	// Determine if the editable section is for a comment
            	var cname = de.findClassName(es, /^editable-comment.+$/);
            	if (cname) {
            	
            		// Get commentID and postID
            		var match = new RegExp("^" + cname + "-(\\d+)-(\\d+)$").exec(es.id);
            		
            		if (match) {
            		
            			// Get / create comment metadata
            			var comment = getCommentEntry(parseInt(match[1]), parseInt(match[2]));
            			
            			if (de.findClassName(es, /^editable-commentContent$/)) { // Is for comment content?
            			
            				comment.data.comment_content = de.spell.stripSpellWrapperHTML(stripPlaceholders(es.cloneNode(true)).innerHTML);
                            
                            comment.eSections.push(es);
            			
                        } else if (de.findClassName(es, /^editable-commentAuthor$/)) { // Is for comment author name/url?
            				
                            // Get author name
            				comment.data.comment_author = $j(stripPlaceholders(es.cloneNode(true))).text();
            				
            				// Get author URL
                            comment.data.comment_author_url = $j(es).find('a').attr('href') || '';
                    
                            comment.eSections.push(es);
            			}
                        
                        
            		}
            	}
            	
            	var postID = extractPostID(es);
            		
            	if (postID !== null) { // Is this editable section a post title or content?
            		
            		// Get / create post entry
            		var post = getPostEntry(postID);
            		
            		if (de.findClassName(es, /^editable-postTitle$/)) { // Is for post title?

                        post.data.post_title = $j(stripPlaceholders(es.cloneNode(true))).text();
      
                        post.eSections.push(es);
                        
                    } else if (de.findClassName(es, /^editable-postContent$/)) { // Is for post content?
                    
                        post.data.post_content = de.spell.stripSpellWrapperHTML(encodeInnerHTMLToWP(es)); // Encode html to special wordpress shortcodes
                        
                        post.eSections.push(es);
                    }
                    
            	}
                
            }
                
        	function getCommentEntry(postID, commentID){
        		for (var i in editedComments) { // Update existing entry to pack ajax posts into one
        			if (editedComments[i].data.post_id == postID && editedComments[i].data.comment_id == commentID) 								
        				return editedComments[i];
        		}
        		editedComments.push({
        			data: {
                        post_id: postID,
                        comment_id: commentID
                    },
                    eSections: []
        		});
        		return editedComments[editedComments.length - 1];
        	}
        	
        	function getPostEntry(postID){
        		for (var i in editedPosts) { // Update existing entry to pack ajax posts into one
        			if (editedPosts[i].data.post_id == postID) 								
        				return editedPosts[i];
        		}
        		editedPosts.push({
                    data: {
        			    post_id: postID
                    },
                    eSections: []
        		});
        		return editedPosts[editedPosts.length - 1];
        	}
        	
        	// Save any edited comments
        	for (var i in editedComments) {
        		saveExistingEntry(editedComments[i].data, editedComments[i].eSections, true);
        	}
        	
        	// Save any edited posts/pages
        	for (var i in editedPosts) {
        		saveExistingEntry(editedPosts[i].data, editedPosts[i].eSections, false);
        	}
            
        }, // End save
            
        /**
         * Saves a new post. Only use when in a new post/page document.
         * Can be called more than once in a session.
         * 
         * @param {Boolean} publish  True to save the new post and publish it, on success the page will be redirected
         *                           to the published version.
         *                           False to create or update the new post as a draft.
         */
        saveNewPost : function(publish) {
        	
            // Check to see if need to save (CTRL+S can invoke this without checking)
          /*  if (!publish && swwpInfo.newPID && de.Changes.getChangedEditableSections().length == 0)
                return;*/
                
        	// Safety - so wont transmit highlighted CSS
        	de.selection.clear();
            
            de.Changes.clear();
        	
            this.itemsPending.push(publish);
            
        	var postData = {
        		'post_content' : de.spell.stripSpellWrapperHTML(encodeInnerHTMLToWP(document.getElementById('editableNewContent'))),
        		'post_title' : $j(stripPlaceholders(document.getElementById('editableNewTitle').cloneNode(true))).text(),
        		'post_status' : publish ? 'publish' : 'draft',
        		'post_type' : swwpInfo.view.indexOf('page') != -1 ? 'page' : 'post'
        	};
        	
            // If a draft of the entry is already saved then update the draft 
        	if (swwpInfo.newPID)
        		postData.post_id = swwpInfo.newPID;
        	
        	if (swwpInfo.view.indexOf('page') == -1) { // Is post?
        	
        		$j.extend(postData, {
        			'tags_input' : $j('#swNewTags').val().replace(/\n\r/, ","),
        			'post_excerpt' : $j('#swExcerpt').val(),
        			'post_new_categories' : $j('#swNewCatagories').val().replace(/\n\r/, ","),
                    'post_existing_categories' : ""
        		});
                
                // Add existing catagories
                var catRE = /^swcat(\d+)$/;
                $j(".swNewPostMeta input:checked").each(function() {
                    if (this.id) {
                        var match = catRE.exec(this.id);
                        if (match) 
                            postData.post_existing_categories += (postData.post_existing_categories ? "," : "") + match[1];
                    }
                });
        	}
            
            if (publish) {
                // Show the publing model dialog ... disable interaction of everything.
                progressMessage.show('Publishing ' + postData.post_type + "...", '(You will be redirected to the ' + postData.post_type + ' once published)');
            } else { // Working on draft
                this.fireEvent("Save", publish);
            }
            
        	ajaxAction("savepost", 
            
                postData, 
        	
        	    function (data) { // On Success
        	    
                    swwpAjax.itemsPending = [];
            
                    var res = wpAjax.parseAjaxResponse(data, data.response, data.element), 
                        errorMsg = null;
                     
                    if (res) {
                        for (var i in res.responses) {
                            var resp = res.responses[i];
                            if (resp.what == "error") {
                                errorMsg = resp.data;
                                break;
                            }
                        }
                        
                        if ((!res.responses || res.responses.length == 0) && (!errorMsg)) 
                        errorMsg = "Server communicated invalid responce";
                    } else 
                        errorMsg = "Server communicated invalid responce";
                    
                    if (errorMsg) {
       
                        de.Changes.dirty();
                        if (publish) 
                            progressMessage.error(errorMsg);
                        else 
                            swwpAjax.fireEvent("SaveFailed", null, errorMsg);
                           
                    } else {
                    
            			if (publish) {
                            
                            // Safety: Ensure that the navigation confirmation for unsaved changes doesnt turn up
                           // de.Changes.clear();
                           suppressChangesConfirmation = 1;
            				
            				var redirectURL = swwpInfo.siteURL + "/?p=" + res.responses[0].id;
            				
            				// Safety - in case redirect fails
                            $j('#swSkeletonContent').html(
            					'<em style="text-align:centre">You are being redirected. ' +
            					'<a href="' + redirectURL + '">Click here</a> if redirect fails</em>');
            					
            				window.location = redirectURL;
            				
            			} else {
                            
                            swwpInfo.newPID = res.responses[0].id;
                            
                            swwpAjax.fireEvent("SaveSucceeded", null);
                            
            			}
                        
                    }
            	},
                
                function() { // On error
                
                    de.Changes.dirty();
                    swwpAjax.itemsPending = [];
                    if (publish)
                        progressMessage.error(ajaxFailMessage);
                    else swwpAjax.fireEvent("SaveFailed", null, ajaxFailMessage);
                }
                
            );
        	
        }, // End saveNewPost
        
        /**
         * Asks user if they wish to delete, if so then the post will be deleted.
         * Upon deletion success the user is redirected to the home page, otherwise an error message is displayed.
         * During the deletion process the GUI is disabled via a widget overlay.
         * 
         * Returns if not in new post view or single post view.
         */
        deletePost : function() {

            // Only allow deletion in single view / new post view
            if (!isNewEntry() && !isSingleView())
                return;
            
            // Determine type of post to delete
            var delType = isNewEntry() ? "Draft" : (swwpInfo.view.indexOf("post") != -1 ? "Post" : "Page"),
                pid;
            
            // If new entry then the post ID is supplied in swwpInfo
            if (isNewEntry()) 
                pid = swwpInfo.newPID;
                
            else {
                
                // Otherwise search for the editable post content
                $j('.editable-postContent').each(function() {
                    pid = extractPostID(this);
                    return false;
                });
                
                // Must be a single view but for some reason does not contain editable area for
                // post
                if (!pid) {
                    // TODO: IMPROVE... LOT FOR TITLES TOO
                    alert('Unable to delete post: could not find editable sections');
                    return;
                }
            }

            // Ask user if they are extra sure they want to delete
            confirmDialog.show("Are you sure you want to delete this " + delType + "?", function() {
                
                // Show progress notifier... disabled interaction of everything.
                progressMessage.show('Deleting ' + delType + "...", '(You will be redirected to your blog home once deleted)');
                
                if (isNewEntry() && !swwpInfo.newPID) 
                    // Nothing to delete - a draft was never saved... instantly redirect to home
                    window.location = swwpInfo.siteURL + "/"; // The extra slash prevent losing the session
                    
                else {
                    
                    // Delete via ajax
                    ajaxAction("deletepost", 
                    
                        {post_id : pid},
                        
                        function(data) { // On Ajax Success
                        
                            // Check if wordpress action succeeded
                            var res = wpAjax.parseAjaxResponse(data, data.response, data.element), 
                                errorMsg = null;
                            
                            if (res) {
                                for (var i in res.responses) {
                                    var resp = res.responses[i];
                                    if (resp.what == "error") {
                                        errorMsg = resp.data;
                                        break;
                                    }
                                }
                                                  
                                if ((!res.responses || res.responses.length == 0) && (!errorMsg))
                                	errorMsg = "Server communicated invalid responce";
                                
                            } else errorMsg = "Server communicated invalid responce";

                            
                            // Display error 
                            if (errorMsg) 
                                progressMessage.error(errorMsg);
                            // Redirect to blog home
                            else {
                                // Avoid confirmation of saved changes dialog
                                //de.Changes.clear();
                                suppressChangesConfirmation = 1;
                                window.location = swwpInfo.siteURL + "/"; // The extra slash prevent losing the session
                            }
                                                
                        },
                        
                        function() { // On Error
                            
                            progressMessage.error("Failed to communicate with server");
                            
                        });
                    
                }
                
                
            });
            
        }
        
    };
    
    function stripPlaceholders(node) {
    	$j(node).find('.sw-mn-ph, .sw-es-ph').replaceWith("&nbsp;");
        return node;
    }
    
    
    function removePendingES(esNode) {
        for (var i in swwpAjax.itemsPending) {
            if (swwpAjax.itemsPending[i] == esNode) {
                swwpAjax.itemsPending.splice(parseInt(i), 1);
            }
        }
    }
    
    /**
     * When an ajax post fails, invoke to dirty the relevent edit sections,
     * remove pending ajax items and fire an event for the swwpAjax model.
     * 
     * @param {Object} eSections
     */
    function onAjaxFail(eSections) {
        
        for (var i in eSections) {
            
            // Remove pending items from ajax model
            removePendingES(eSections[i]);
            
            // Dirty the editable sections since they would have been cleared
            de.Changes.dirty(eSections[i]);
            
            // Notify fail result
            swwpAjax.fireEvent("SaveFailed", eSections[i], ajaxFailMessage);
            
        }
    }
        
    /**
     * Sends an ajax post action to seaweed plugin on the wordpress server
     * @param {String} action       The wordpress action
     * @param {Object} meta         The data to send
     * @param {Function} onSuccess  The success callback
     * @param {Function} onError    The ajax error callback
     */
    function ajaxAction(action, meta, onSuccess, onError) {
    	$j.ajax({
    		type: "POST",
    			url: swwpInfo.plugURL + "/php/ajax-action.php",
    		data : $j.extend({
    	        _ajax_nonce: swwpInfo.nonce,
    	        action: action
    		}, meta),
    		success : onSuccess, 
    		error : onError
    	});
    }
    
    /**
     * Saves an existing comment or post/page entry. (Although it does allow saving new comments, but not new posts/pages).
     * 
     * @param {Object} entryData     The ajax data to post
     * 
     * @param {[Element]} eSections  The list of editable sections that this comment/post was extracted from
     * 
     * @param {Boolean} isComment    True if saving a comment, false if updating an existing comment.
     */
    function saveExistingEntry(entryData, eSections, isComment) {

    	ajaxAction(isComment ? "savecomment" : "savepost", 
        
            entryData, 
            
            function(data) { // On Ajax Success
            
                // Remove pending items from ajax model
                for (var i in eSections) {
                    removePendingES(eSections[i]);
                }
    			
                var res = wpAjax.parseAjaxResponse(data, data.response, data.element), 
                    errorMsg = null;
                
                // Check for wordpress error
                if (res) {
                    for (var i in res.responses) {
                        var resp = res.responses[i];
                        if (resp.what == "error") {
                            errorMsg = resp.data;
                            break;
                        }
                    }
                    
                    if ((!res.responses || res.responses.length == 0) && (!errorMsg))
                        errorMsg = "Server communicated invalid responce";
                    
                } else  errorMsg = "Server communicated invalid responce";
                

                if (errorMsg) { // Wordpress error occurred
                    
                    for (var i in eSections) {
                        
                        // Dirty the editable sections since they would have been cleared
                        de.Changes.dirty(eSections[i]);
                        
                        // Notify fail result
                        swwpAjax.fireEvent("SaveFailed", eSections[i], errorMsg);
                        
                    }
                    
                } else {

                    for (var i in eSections) {
                        // Notify success result
                        swwpAjax.fireEvent("SaveSucceeded", eSections[i]);
                    }
    				
                }
                
            }, 
            
            function() { onAjaxFail(eSections); }
        );
    }
    
    function encodeInnerHTMLToWP(node) {
        
        function createSCNode(shortcode) {
            return document.createComment("_SWWP_SC:" + shortcode);
        }

    	// Dup the tree
    	node = node.cloneNode(true);
    
        // Replace more indicators with actual wordpress more comments
        $j(node).find('.swwp-more').replaceWith(document.createComment('more'));
        
        // Replace shortcodes
        $j(node).find('.swwp-shortcode').each(function() {
            
            // Look for shortcode tags
            var jq = $j(this).find('.swwp-sc-start');
            
            if (jq.length > 0) {
                // Get the shortcode - found inside a comment
                var scComment;
                jq.contents().each(function() {
                    if (this.nodeType == 8) {
                        scComment = this;
                        return false;
                    }
                });

                 // Replace the packaged nodes with the shortcode
                if (scComment) {
                    $j(this).replaceWith(createSCNode(scComment.nodeValue));
                    return;
                }
            }
            
            $j(this).remove();
            
        });

        // Encode captions
        $j(node).find('.wp-caption, .caption').each(function() {
            
            var id = this.id,
                alignment = de.findClassName(this, /^align.+$/) || 'alignnone',
                width,
                imageNode,
                imageLink,
                captionText = $j(this).text();
    
            // Find image - get width info - update image alt to new captoin text
            $j(this).find('img').each(function() {
                width = parseInt(this.width || this.style.width || ("" + this.offsetWidth));
                imageNode = this;
                $j(this).attr('alt', captionText);
                return false;
            });
            
            if (!imageNode) { // avoid miss-use of captions
                // replace captions with inner text
                $j(this).replace(document.createTextNode($j(this).text()));
                return;
            }
            
            // Get image link
            $j(imageNode).parents('a').each(function() {
                imageLink = this;
                return false;
            });

            // Construct caption contents
            var captionInnerNode = imageNode;
            if (imageLink) {
                captionInnerNode = imageLink.cloneNode(false);
                $j(imageNode).remove();
                captionInnerNode.appendChild(imageNode);
            }
                
            // Replace entire caption with encoded comment
            $j(this).replaceWith(createSCNode(
                '[caption '
                + (id ? 'id="' + id + '" ' : "") 
                + 'align="' + alignment
                + '" width="' + width
                + '" caption="' + captionText + '"]' 
                + de.getOuterHTML(captionInnerNode)
                + '[/caption]'));
            
        });
    
        // Purge gallery inline style sheets
        $j(node).find('style').each(function() {
            if (/#gallery/g.test($j(this).text())) {
                $j(this).remove();
            }
        });

       // Encode galleries created via seaweed
       $j(node).find('.swwp-gallery').each(function() {
           
           var args = this.title;
           
           if (args && /gallery\s.+/.test(args))
               args = args.substr(7); // Include whitespace
           else args = "";

           $j(this).replaceWith(createSCNode("[gallery" + args + "]"));
           
       });
       
       // Replace placeholders with non breaking back spaces
       stripPlaceholders(node);
      
        // Final pass: escape written shortcodes ... these may have been escaped or the user typed them in.
    	var wpHTML = "", 
            toParse = node.innerHTML,
            scOpenRE = new RegExp('\\[(\\~|\\+)?\\s*(\\w+?)\\b.*?\\/?\\]'),
            openMatch;
        
        while(openMatch = scOpenRE.exec(toParse)) {
            
            // Consume up to start of open-shortcode match
            wpHTML += toParse.substr(0, openMatch.index);
            toParse = toParse.substr(openMatch.index + openMatch[0].length);
            
            // openMatch[1]: +/~  .. may exist if user doesn't want escaping
            // openMatch[2]: tag name
            
            // Check if has a close tag
            var scCloseRE = new RegExp("\\[\\/" + openMatch[2] + "\\]"),
                closeMatch, // if matches will include open tag
                fullShortcode;
                
            if (closeMatch = scCloseRE.exec(toParse)) {
                fullShortcode = openMatch[0] + toParse.substr(0, closeMatch.index + closeMatch[0].length);
                toParse = toParse.substr(closeMatch.index + closeMatch[0].length);
            } else fullShortcode = openMatch[0];
    
            // If the user does not want the shortcode to be transformed then escape it
            if (openMatch[1])
                fullShortcode = "[" + fullShortcode.substr(2); // remove ~ or +
            else 
                fullShortcode = "[" + fullShortcode + "]"; // escape
                
            // Add the shortcode (possibly escaped)
            wpHTML += fullShortcode;
       
        }
        
        return wpHTML + toParse;
    }

})();

swwpModules.push(swwpAjax);
