/*
 * file: Core.js
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

/*
 * This is copyrighted by Brook Novak 2009 and closed source. You may not distribute this code.
 */ 

var swwpModules = [],
    moreElementMarkup,
    supportsFixedPos,
    suppressChangesConfirmation = 0;

(function() {
    
    var actionOccured = false;
    
    swwp = {

    /**
     * Invoked once document is loaded
     */
        init: function(){
			
			// Sometimes jquery executes this twice!
			if (moreElementMarkup)
				return; // prevent double exec of init
        
            // Some themes set image style which override the seaweed css... so for more images the css is set at element level.
            moreElementMarkup = '<img class="swwp-more" src="' 
                + swwpInfo.plugURL 
                + "/css/images/trans.gif" 
                + '" style="background: url('
                + swwpInfo.plugURL 
                + '/css/images/more.gif) no-repeat right top;padding:0;margin: 15px 2px 2px 2px;border: 0px;border-top: 1px dotted #cccccc;display: block;width: 100%;height: 12px;"/>';
    
            
            // PREPROCESS HTML: LOOK FOR SPECIAL TAGS AND PREPARE THEM FOR SEAMLESS EDITING
            preprocessPage();
            
            // Prepare direct edit API
            de.init();
            
            de.UndoMan.maxHistoryCount = swwpInfo.undo_history ? swwpInfo.undo_history : 100;
            
            // Set custom wordpress cursor placement for noon-text elements
            de.cursor.usrGetPlacementFlags = function(node) {
                
                // Allow cursor placement before and after caption divs
                if ($j(node).is('.caption,.wp-caption')) 
                    return de.cursor.PlacementFlag.BEFORE | de.cursor.PlacementFlag.AFTER;
                    
                // Don't allow cursor placement on images within caption divs
                if (node.nodeName.toLowerCase() == "img" && $j(node).parents().is('.caption,.wp-caption')) 
                    return 0;
                    
            }
            
            // Evaluate whether this browser supports fixed positioning
            supportsFixedPos = !(de.browser == de.Platform.IE && de.browserVersion && de.browserVersion < 7);
            
            // Some plugins change inner content after the load event .. for example the syntax highlighter.
            // To avoid dirtying the sections and pesting the users every time they leave asking if they
            // want to save changes (when there aren't any), clear changes on the first action
            de.UndoMan.addObserver({
                onBeforeExec: function(){
                    de.UndoMan.removeObserver(this);
                    de.Changes.clear(); // Before any manipulation of DOM via user
                    actionOccured = true;
                }
            });
            
            window.onbeforeunload = confirmLeave;
            
            /*
         // TODO
         $j(window).onload(function() {
         // Some plugins also pre-process the page to avoid beginning with dirty editable sections -
         // otherwise users would be bothered with confirmatoin dialogs whenever they leave a page
         de.Changes.clear();
         });*/
            // Declare editable section property sets
            de.doc.declarePropertySets({
                commentContent: {
                    phMarkup: '[Enter comment]',
                    name: "Comment Content",
                    actionFilter: "!ChangeContainer,Itemize"
                },
                commentAuthor: {
                    phMarkup: '[Enter name]',
                    singleLine: 1,
                    name: "Comment Author",
                    actionFilter: "Format(Link)"
                },
                postTitle: {
                    phMarkup: '[Enter post title]',
                    singleLine: 1,
                    name: "Post Title",
                    actionFilter: "SpellCorrect,SpellUnmark,SpellMark" // Text edits and spelling only
                },
                postContent: {
                    name: "Post Content",
                    phMarkup: '[Enter content]'
                },
                newTitle: {
                    phMarkup: '[Enter new title]',
                    singleLine: 1,
                    name: "New Post/Page Title",
                    actionFilter: "SpellCorrect,SpellUnmark,SpellMark" // Text edits only
                },
                newContent: {
                    name: "New Post/Page Content",
                    phMarkup: '[Enter new content]'
                }
            });
            
            // Append "classic" in front of edit links containing the text "edit"
            de.visitAllNodes(document.body, document.body, true, function(domNode){
                if (de.findClassName(domNode, /^.+-edit-link$/)) {
                    var txt = domNode.firstChild;
                    while (txt && txt.nodeType != 3) {
                        txt = txt.firstChild;
                    }
                    if (txt) {
                        var idx = txt.nodeValue.toLowerCase().indexOf("edit");
                        if (idx >= 0) txt.nodeValue = txt.nodeValue.substr(0, idx) +
                        "Classic" +
                        de.parseHTMLString("&nbsp;") +
                        txt.nodeValue.substr(idx);
                    }
                    return 1; // Skip subtree
                }
            });
            
            
            // Prepare Modules
            for (var pass = 1; pass <= 2; pass++) {
                for (var m in swwpModules) {
                
                    if (pass == 1) {
                        if (swwpModules[m]['init']) swwpModules[m]['init']();
                    } else {
                        // The hackey bootstrap: since their is no dependancy mechanism for this hacky-gui library,
                        // modules with dependant initializatoin code can run safely on the second pass.
                        if (swwpModules[m]['afterInit']) swwpModules[m]['afterInit']();
                    }
                    
                }
            }
            swwpModules = null;
            
            
            // Hover logic for combo items
            $j(".sw-combo-item").hover(function(){
                $j(this).addClass("ui-state-hover");
            }, function(){
                $j(this).removeClass("ui-state-hover");
            });
            
            // Setup notifiers for editable sections
            setupNotifiers();
            
            // All hover and click logic for buttons
            applyButtonHover($j(".sw-button, .ww-button, .sw-combo, .sw-minmax, .sw-list-item"));
            
            // Hook keystroke handler
            de.Typing.addObserver({
                onTyping: onTyping
            });
            
            if (isNewEntry()) {
                // Ensure changes are dirtied if user edits non-seaweed fields for new posts
                // ... for leaving page confirmation
                $j(".swNewPostMeta input, .swNewPostMeta textarea").change(function(){
                    de.Changes.dirty();
                });
            }
            

        } // End global swwpInit function
    
    };
    
    /**
     * Prepares notifiers which hover around editable sections on mouse overs
     */
    function setupNotifiers() {
        
        if (swwpInfo.use_notifiers) {
    
            var editNotifier = document.createElement("div");
            editNotifier.className = "sw-protect sw-edit-notifier ui-widget-header";
            editNotifier.style.display = "none";
            document.body.appendChild(editNotifier);
            
            
            // Hover logic for editable sections
            var editSections = de.doc.getAllEditSections();
            var editableClassNames = {};
            for (var i in editSections) {
                editableClassNames[de.findClassName(editSections[i], /^editable.*$/)] = true;
            }
            
            // Post content notifier is handled differently
            if (editableClassNames['editable-postContent'])
                delete editableClassNames['editable-postContent'];
            
            for (var clsName in editableClassNames) {
                $j("." + clsName).hover(
                    function() {
                        
                        var cDesc = de.cursor.getCurrentCursorDesc();
                        if (!cDesc || de.doc.getEditSectionContainer(cDesc.domNode) != this) {
                            
                            $j(this).addClass("es-hover");
                        
                            var eProps = de.doc.getEditProperties(this),
                                wndPos = de.getPositionInWindow(this),
                                docScroll = de.getDocumentScrollPos();
                            
                            
                            $j(editNotifier)
                                .css('display', '')
                                .html("Edit" + (eProps.name ? " " + eProps.name : ""))
                                .css('left', (wndPos.x + docScroll.left) + "px")
                                .css('top', (wndPos.y + docScroll.top - editNotifier.offsetHeight) + "px");
                                
                        }
                    },
                    function() {
                        $j(this).removeClass("es-hover");
                        $j(editNotifier).css('display', "none");
                    }
                    
                );
                
            } // End loop: applying hover logic to editable sections
         
         
            // Always clear notifier whenever cursor changes
            de.cursor.addObserver({
               onCursorChanged : function() {
                   if (editNotifier.style.display != "none") {
                       $j('.es-hover').removeClass("es-hover");
                       $j(editNotifier).css('display', "none");
                   }         
               } 
            });
            
            var toID = null;
            
            // POST: Show notifier after mouse is stationary over a small period of time on a post's content
            $j('.editable-postContent, .swwp-post-preview').mousemove(function(e) {
                
                var eSection = this;
                
                killNotifierTimer();
                
                toID = setTimeout(function() {
                    
                  var cDesc = de.cursor.getCurrentCursorDesc();
                  if ((!cDesc || de.doc.getEditSectionContainer(cDesc.domNode) != eSection) && $j(".gallery.es-hover").length == 0) {
                      
                      // Set the label of the tool tip... if it is for a post preview then notify the user that they cannot edit the post content,
                      // otherwise tell them they can edit the post content.
                    var label = $j(eSection).hasClass('swwp-post-preview') ? "(Post Teaser: Navigate to full post content to edit)" : ("(Click to begin editing " + (de.doc.getEditProperties(eSection).name || "") + ")"),
                        mousePos = de.events.getXYInWindowFromEvent(e),
                        scrollPos = de.getDocumentScrollPos();
                        
                      $j(editNotifier).css('display', '').html(label).css('left', (mousePos.x + scrollPos.left + 5) + "px").css('top', (mousePos.y + scrollPos.top - editNotifier.offsetHeight - 10) + "px");
                  
                  }
                }, 1000);
                
            }).hover(
                function(){}, function() {
                    killNotifierTimer();
                    $j(editNotifier).css('display','none');
                }
            );
            
         // Hover logic for shortcodes
         $j(".swwp-shortcode").hover(
             function(){
                 
                 var htmlObj = $j(this).find("object");
                 
                 // Don't highlight objects
                 if (htmlObj.length == 0) {
                     $j(this).addClass("es-hover");
                     htmlObj = null;
                 } else htmlObj = htmlObj.get(0);
                 
                 var docScroll = de.getDocumentScrollPos(),
                     wndPos = de.getPositionInWindow(htmlObj || this);
                 
                $j(editNotifier)
                    .css('display', '')
                    .html($j(this).find('.gallery').length > 0 ? "Edit Gallery" : "[" + $j(this).attr('title') + "]...")
                    .css('left', (wndPos.x + docScroll.left) + "px")
                    .css('top', (wndPos.y + docScroll.top - editNotifier.offsetHeight) + "px");
                    
             },
            function() {
                $j(this).removeClass("es-hover");
                $j(editNotifier).css('display', "none");
            }
         );
         
        }
        
        function killNotifierTimer() {
            if (toID !== null) {
                clearTimeout(toID);
                toID = null;
            }
        }
    }
    
    /**
     * Typing handler
     * @param {Object} typingEvent      The cancellable typing event
     * @param {Event} e                 The event object
     * @param {String} normalizedKey    The normalized key string
     */
    function onTyping(typingEvent, e, normalizedKey) {
        
        // If a model dialog is showing consume the typing event
        if ($j(document.body).children('.ui-widget-overlay:not([display=none])').length > 0) {
            typingEvent.cancel = true;
            return;
        }
        
        if (de.events.Keyboard.isAcceleratorDown(e)) {
            switch (normalizedKey.toLowerCase()) {
                case "s": // Save
                    controlPanel.onSave.call(controlPanel);
                    typingEvent.cancel = true;
                    de.events.consume(e); // Stop browser from handling CTRL+S.. e.g. might try to save page to local file
                    return;
                    
                case "n": // New Post
                    controlPanel.onNewPost.call(controlPanel);
                    typingEvent.cancel = true;
                    de.events.consume(e); // Stop browser from handling CTRL+N.. e.g. might open a new tab/window
                    return;
            }
        }
    }
    
    /**
     * Pre-processes the DOM: cpackages shortcodes, and replaces more tags
     */
    function preprocessPage() {
        
        var editableTitleRE = /\[editable-postTitle-(\d+)-(\d+)\](.*?)\[\/editable-postTitle\]/;
        
        
        // Convert [editable-postTitle... text nodes into span tags
       de.visitAllNodes(document.body, document.body, true, function(node) {
            
            var match;
            
            // Convert empty "more" span tags into actual tangable more objects which the users can edit
            if (node.nodeType == 1 
                && node.id.indexOf('more-') === 0 
                && node.nodeName.toLowerCase() == "span"
                && de.doc.isNodeEditable(node)) 
            	$j(node).replaceWith(moreElementMarkup);
                
            else if (node.nodeType == 3 && (match = editableTitleRE.exec(node.nodeValue))) {
                
                // Replace #text with editable span tags: #pretext<span...>#title</span>#posttext
                var preText = node.nodeValue.substr(0, match.index),
                    postText = node.nodeValue.substr(match.index + match[0].length);
                
                var editableTitle = document.createElement('span');
                $j(editableTitle)
                    .addClass('editable-postTitle')
                    .attr('id', 'editable-postTitle-' + match[1] + "-" + match[2])
                    .text(match[3]);
                 
                 $j(node).replaceWith(editableTitle);
                 $j(editableTitle).before(preText);
                 $j(editableTitle).after(postText);
                 
                    
            }
             
        });
            
        
        var shortCodes = []; // shortcode tuples: start,end,name
        
        // For all shortcodes
        $j(".swwp-sc-start").each(function() {
            // Get shortcode GUID and name
            var match = /^\s*(\d+)_(.+)$/.exec($j(this).text());
            if (match) {
                // Search for end node
                var endTag = $j("#swwp-sc-end-" + match[1]);
                // Add tuple
                if (endTag.length == 1) {
                    
                    // Validate if the shortcode was actually transformed
                    if (this.nextSibling && this.nextSibling.nodeType == 3) { // The next node is a text node...
                        
                        // Get shortcode open tag's comment node containing the actual shortcode statement
                        var cmtNode = this.firstChild;
                        while(cmtNode && cmtNode.nodeType != 8) {
                            cmtNode = cmtNode.nextSibling;
                        }
                        
                        if (cmtNode) {
                            var otLen = cmtNode.nodeValue.indexOf("]");
                            if (otLen > 0 && this.nextSibling.nodeValue.substr(0, otLen) == cmtNode.nodeValue.substr(0, otLen)) {
                                //
                                // It appears that the shortcode did not actual transform.
                                // This might be because:
                                //    A)    The user deactivated a plugin which transformed the shortcode
                                //    B)    The user is typing something that resembles a shortcode - but is not actually a shortcode
                                //
                                // In both cases we want to allow the user to edit the "shortcode" content rather than
                                // encapsulating them
                                //
                                $j(this).remove(); // get rid of hidden encoded start span
                                $j(endTag.get(0)).remove(); // get rid of hidden encoded end span
                                endTag = null;
                            
                            }
                        }
                    }
                    if (endTag)
                        shortCodes.push([this, endTag.get(0), match[2]]);
                }
            }
        });
        
        // Ideally shortcode end/start nodes would share the same parent. but this is hardly the case:
        // standard content filters will add extra pagaraphs (wpautop and wptexturize), and non-standard filters may tweak the shortcode
        // markup aswell...
        for (var i in shortCodes) {
            
            var startSC = shortCodes[i][0],
                endSC = shortCodes[i][1];
            
            de.recordOperations(false);
            
            // Create fragment
            var frag = de.buildFragment(null, startSC, 0, endSC, 1);
            
            frag.disconnect();
            
            de.recordOperations(true);
            
            // Clone shared nodes and connect the nonshared node to them
            frag.visit(function(f) {
                if (f.isShared && f != frag) {
                    f.node = f.node.cloneNode(false);
                }
            });
            
            frag.visit(function(f) {
                if (f.isShared && f != frag) {
                    for (var c in f.children) {
                    	f.node.appendChild(f.children[c].node);
                    }
                }
            });
            
            // Check if the fragment contains block nodes
            var containsBlock = false;
            for (var k in frag.children) {
                // Assumption: if pnode is not a block, then it cannot contain
                // block descendants unless the markup is invalid.. in that case
                // then it doesn't matter if we incorrectly assume the content is all inline
                // since it is invalid anyway
                if (de.isBlock(frag.children[k].node)) {
                    containsBlock = true;
                    break;
                }
            }

            // Create a wrapper which packages the transformed shortcode markup and the surrounding comment nodes
            // which contain the original shortcode in one so that users can't tear them up.
            var packageWrapper = document.createElement(containsBlock ? "div" : "span");
            $j(packageWrapper)
                .addClass('sw-packaged')
                .addClass('swwp-shortcode')
                .attr('title', shortCodes[i][2]);
                
            // Insert the package wrapper
            de.insertAt(frag.node, packageWrapper, frag.children[0].pos + (frag.children[0].isShared ? 1 : 0));
                
            // Move disconnected shortcode nodes into the package wrapper
            for (var k in frag.children) {
                packageWrapper.appendChild(frag.children[k].node);
            }
            
            // NOTE: Even if the encapsulate nothing still package the shortcodes since
            // the shortcode might randomly decide not to display content 
            if (startSC.nextSibling == endSC) 
                $j(startSC).after("[" + shortCodes[i][2] + "...]"); // Insert shortcode tp show that some shortcode belongs there
                 
        } // End loop: packaging shortcodes
        
    }
    
    function confirmLeave() {
        if (!suppressChangesConfirmation && actionOccured && de.Changes.getChangedEditableSections().length > 0) 
            return "You have unsaved changes on this page.";
    }
    

})();

function applyButtonHover(jq) {
	jq
    	.hover(    
    		function(){ 
                if (!$j(this).hasClass('ui-state-disabled'))
    			    $j(this).addClass("ui-state-hover"); 
    		},
    		function(){ 
                if (!$j(this).hasClass('ui-state-disabled'))
    			    $j(this).removeClass("ui-state-hover"); 
    		}
    	)
    	.mousedown(function(){
            if (!$j(this).hasClass('ui-state-disabled')) {
                $j(this).parents('.sw-buttonset-single:first').find(".sw-button.ui-state-active").removeClass("ui-state-active");
                if ($j(this).is('.ui-state-active .sw-button-toggleable, .sw-buttonset-multi .ui-state-active')) {
                    $j(this).removeClass("ui-state-active");
                } else {
                    $j(this).addClass("ui-state-active");
                }
            }
    	})
    	.mouseup(function(){
            if (!$j(this).hasClass('ui-state-disabled')) {
                if (!$j(this).is('.sw-button-toggleable, .sw-buttonset-single .sw-button, .sw-buttonset-multi .sw-button')) {
                    $j(this).removeClass("ui-state-active");
                }
            }
    	});
}


