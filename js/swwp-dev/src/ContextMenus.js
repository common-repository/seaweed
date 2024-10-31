/*
 * file: ContextMenus.js
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

function ContextMenu(onClicked, fixedWidth) {
    this.dropDown = new DropDownPane(onClicked);
    $j(this.dropDown.container).addClass('sw-context-menu').removeClass('ui-widget-content');
    this.fixedWidth = fixedWidth;
}

ContextMenu.prototype = {
 
    /**
     * Displays the context menu at a specific position.
     * @param {Number} wndX The x coord of the context menu relative to the window
     * @param {Number} wndY The y coord of the context menu relative to the window
     */
    show : function(wndX, wndY) {

        var scrollPos = de.getDocumentScrollPos();
        
        $j(this.dropDown.container)
            .css('top', (wndY + scrollPos.top) + "px")
            .css('left', (wndX + scrollPos.left) + "px");
            
        this.dropDown.show();
        
        // IE Needs explicit width style to adjust the inner buttons widths to
        // fill 100% of their parents inner width...
        if (de.browser == de.Platform.IE) 
            $j(this.dropDown.container).css('width', this.dropDown.container.offsetWidth + "px");
           
        //this.updatePosition();
         
    },
    /*
    updatePosition : function() {
        
        // Update size to view all items
        var largest = 1,
            item = this.dropDown.container.firstChild;
            
        while(item) {
            largest = Math.max(largest, item.offsetWidth);
            item = item.nextSibling;
        }
        
         $j(this.dropDown.container).children().css('width', largest + "px");
         $j(this.dropDown.container).css('width', largest + "px");
         
    },*/
    
    isShown : function() {
        return this.dropDown.isShown();
    },
    
    addButton: function(callbackArg, name, beforeItemNode) {
        
        return this.dropDown.addItem(callbackArg, '<div class="sw-button ui-state-default"' 
            + (this.fixedWidth ? ' style="width:' + this.fixedWidth + 'px;padding-left:0;padding-right:0;"' : "") 
            + '>' 
            + name 
            + '</div>', 
            beforeItemNode);
           
    },
    
    addSeparator : function() {
        return this.dropDown.addItem(0, '<div class="ui-widget-content" style="height:4px;' 
            + (this.fixedWidth ? "width:" + this.fixedWidth + "px;" : "") 
            + '"></div>');
    }
};

// Init all context menus
swwpModules.push({
    init: function(){
    
        $j.extend(linkMenu, new ContextMenu(linkMenu.onClicked));
        linkMenu.build();
        
        $j.extend(mediaMenu, new ContextMenu(mediaMenu.onClicked));
        mediaMenu.build();
        
        $j.extend(spellMenu, new ContextMenu(spellMenu.onClicked, 200));
        spellMenu.build();
        
        $j.extend(imageMenu, new ContextMenu(imageMenu.onClicked));
        imageMenu.build();
        
        // Hijack link clicks... displaying a menu if the users click editable links.
        // And also listen for clicks on spelling error wrappers ...
        de.events.addHandler(de.engine == de.Platform.GECKO ? window : document, "mousedown", function(e){
        
            var target = de.events.getEventTarget(e), mousePos;
            
            // Special case: clicking on the actual cursor div
            if (de.cursor.isCursorEle(target)) {
                mousePos = de.events.getXYInWindowFromEvent(e);
                target = de.cursor.getNonCursorNodeAtXY(mousePos.x, mousePos.y);
            }
            
            // Give spelling menus precendence
            
            var spellNode = de.spell.getMarkedAncestor(target);
            
            if (spellNode) {
            
                spellMenu.lastClicked = spellNode;
                spellMenu.setState(1); // retrieving suggestions
                if (!mousePos) mousePos = de.events.getXYInWindowFromEvent(e);
                
                // Show the menu with no suggestions...                
                spellMenu.show(mousePos.x + 4, mousePos.y + 4);
                
                // Retrieve the suggestions (AJAX Callback)
                SpellChecker.getSuggestions($j(spellNode).text(), function(words){
                
                    if (spellMenu.isShown()) {
                    
                        if (!words) 
                            spellMenu.setState(4); // Error

                        else if (words.length == 0) 
                            spellMenu.setState(3); // No suggestions

                        else {
                            spellMenu.setState(2); // Suggestions
                            for (var i in words) {
                                spellMenu.addSuggestion(words[i]);
                            }
                        }
                    }
                    
                });
                
            } else if (de.doc.isNodeEditable(target) || de.doc.isEditSection(target)) {
            
                // If clicking on an image not in a gallery
                if (target.nodeName.toLowerCase() == "img" && !$j(target).parents().is('.gallery')) {
                    
                    if (!mousePos) mousePos = de.events.getXYInWindowFromEvent(e);
                    imageMenu.onImageClicked(target, mousePos.x, mousePos.y);
                
                } else {
                
                    var linkNode = target;
                    while (linkNode && linkNode != document.body) {
                        if (linkNode.nodeName.toLowerCase() == "a") break;
                        linkNode = linkNode.parentNode;
                    }
                    
                    
                    
                    // Avoid invoking link menu on galleries
                    if (linkNode && linkNode != document.body && !$j(linkNode).parents().is('.gallery')) {
                    
                        if (de.doc.isNodeEditable(linkNode)) { // user can edit link
                            $j(linkMenu.editLinkButton).css('display', '');
                            $j(linkMenu.unlinkButton).css('display', '');
                        } else {
                            $j(linkMenu.editLinkButton).css('display', 'none');
                            $j(linkMenu.unlinkButton).css('display', 'none');
                        }
                        
                        if (!mousePos) mousePos = de.events.getXYInWindowFromEvent(e);
                        
                        linkMenu.lastClick = {
                            link: linkNode,
                            pos: mousePos
                        };
                        
                        de.selection.clear();
                        
                        linkMenu.show(mousePos.x + 4, mousePos.y + 4);
                        
                    }
                    
                }
            }
        });
        
       // Prevent following links
       de.events.addHandler(de.engine == de.Platform.GECKO ? window : document, "click", function(e){
        
            var target = de.events.getEventTarget(e), mousePos;
            
            if (de.doc.isNodeEditable(target) || de.doc.isEditSection(target)) {
            
                var linkNode = target;
                while (linkNode && linkNode != document.body && !$j(linkNode).parents().is('.gallery')) {
                    if (linkNode.nodeName.toLowerCase() == "a") break;
                    linkNode = linkNode.parentNode;
                }
                if (linkNode && linkNode != document.body)
                    return false;
                
            }
        });
        
    }
});

var linkMenu = {
    
    /**
     * Preps the link context menu
     */
    build : function() {
        
        var t = this;
        
        t.followButton = t.addButton("follow", 'Follow');
        t.editContentButton = t.addButton("edit-content", 'Edit&nbsp;Content');
        t.editLinkButton = t.addButton("edit-link", 'Edit&nbsp;Link');
        t.unlinkButton = t.addButton("unlink", 'Remove&nbsp;Link');
        
    },

    /**
     * Callback - invoked from dropdown
     */    
    onClicked : function(id) {
        
        if (id != "follow") {
            var cDesc = de.cursor.getCursorDescAtXY(linkMenu.lastClick.pos.x, linkMenu.lastClick.pos.y);
            if (cDesc)
                de.cursor.setCursor(cDesc);
        }
        
        switch (id) {
            
            case "follow":
                window.location = linkMenu.lastClick.link.href;
                break;
                
            case "edit-link":
                linkEditDialog.show();
                break;
                
            case "unlink":
                if (de.selection.isRangeEditable()) 
                    de.UndoMan.execute("Format", "link", null);
                break;
        }
    }
};


var mediaMenu = {
    
    build : function() {
        
        var t = this;

        // If the gallery is linked then also provide a follow option
        t.followButton = t.addButton("follow", 'Follow&nbsp;Link');
        t.editGalleryButton = t.addButton("edit", 'Edit&nbsp;Gallery');
        t.deleteGalleryButton = t.addButton("remove", 'Remove&nbsp;Gallery');

        $j('.gallery').add('.gallery a').click(t.onGalleryClick);
        
    },
    
    onGalleryClick : function(e) {

        
       var target = de.events.getEventTarget(e),
           mousePos = de.events.getXYInWindowFromEvent(e);

        // JQuery sometimes gets it wrong in some themes!
        if (!$j(target).parents().is('.gallery'))
            return;
        
       $j(mediaMenu.followButton).css('display', ($j(target).parents().andSelf().is('a')) ? '' : 'none');
           
       mediaMenu.lastClick = target;
       
       mediaMenu.show(mousePos.x + 4, mousePos.y + 4);
       
       return de.events.consume(e);
    },

    /**
     * Callback - invoked from dropdown
     */    
    onClicked : function(id) {
        
        if (mediaMenu.lastClick) {
            
            switch (id) {
            
                case "follow":
                    var href = $j(mediaMenu.lastClick).parents().andSelf().filter('a').attr('href');
                    if (href)
                        window.location = href;
                    break;
                    
                case "edit":
                    // Get edit section at last clicked target
                    var es = de.doc.getEditSectionContainer(mediaMenu.lastClick);
                    if (es) {
                        de.selection.selectES(es, false);
                        mediaDialog.show('gallery');
                    }
                    break;
                    
                case "remove":
                    
                    var jq = $j(mediaMenu.lastClick).parents().andSelf().filter('.sw-packaged');
                    var galleryNode = jq.length > 0 ? jq.get(0) : 0;
                    if (galleryNode && $j(galleryNode).find('.gallery, .swwp-gallery') == 0)
                        galleryNode = 0;
                    
                    if (galleryNode && de.doc.isNodeEditable(galleryNode)) {
                        
                        var es = de.doc.getEditSectionContainer(mediaMenu.lastClick);
                        de.UndoMan.execute("RemoveNode", galleryNode);
                        if (es) de.selection.selectES(es, true);
                        
                    }
                        
                    break;
            }
        }
    }
};




var imageMenu = {
    
    build : function() {
        
        var t = this;

        // If the gallery is linked then also provide a follow option
        t.followButton = t.addButton("follow", 'Follow&nbsp;Link');
        t.editImageButton = t.addButton("edit", 'Edit&nbsp;Image');
        t.deleteImageButton = t.addButton("remove", 'Remove&nbsp;Image');

    },
    
    onImageClicked : function(imageNode, x, y) {

        // JQuery sometimes gets it wrong in some themes!
      //  if (!$j(target).parents().is('.gallery'))
     //       return;
        
       $j(imageMenu.followButton).css('display', ($j(imageNode).parents().andSelf().is('a')) ? '' : 'none');
           
       imageMenu.lastClick = imageNode;
       
       imageMenu.show(x + 4, y + 4);
       
    },

    /**
     * Callback - invoked from dropdown
     */    
    onClicked : function(id) {
        
        if (imageMenu.lastClick) {
            
            switch (id) {
            
                case "follow":
                    var href = $j(imageMenu.lastClick).parents().andSelf().filter('a').attr('href');
                    if (href)
                        window.location = href;
                    break;
                    
                case "edit":
                    imageEditDialog.show(imageMenu.lastClick);
                    break;
                    
                case "remove":
                    
                    // Get caption wrapper if exists        
                    var capQry = $j(imageMenu.lastClick).parents().filter(".caption,.wp-caption"),
                        removeEle = imageMenu.lastClick;
                        
                    if (capQry.length > 0) 
                        removeEle = capQry.get(0);
                    
                    // Delete image / caption
                    if (removeEle) 
                        de.UndoMan.execute("RemoveNode", removeEle);

                    break;
            }
        }
    }
};

var spellMenu = {
    
    build: function() {
        
        var t = this;
        
        // Add "retrieving suggestings" item
        t.pendingMessage = t.dropDown.addItem(0, 
            '<div class="ui-widget-header" style="text-align:center">Retrieving...<br/><img src="' 
            + swwpInfo.plugURL 
            + '/css/images/ajax.gif" width="' + t.fixedWidth + '"/></div>');
            
        t.suggestMessage = t.dropDown.addItem(0, 
            '<div class="ui-widget-header" style="text-align:center">.</div>'); // "Suggestions:" / "No Suggestions"
            
        t.separator = t.addSeparator();
        
        t.addButton('ignore', "Ignore Spelling");
        t.addButton('ignorealways', "Always Ignore Spelling");
           
    },
    
    addSuggestion : function(word) {
        applyButtonHover($j(this.addButton("fix:" + word, word, this.separator)));
    },
    
    /**
     * 
     * @param {Number} state 1 To set as "retrieving suggestions"
     *                       2 To set as "Suggestions:",
     *                       3 To set as "No Suggestions"
     *                       4 TO set as "Failed to get suggestions"
     */
    setState : function(state) {
        
        var t = this;
        
        t.pendingMessage.style.display = "none";
        t.suggestMessage.style.display = "none";
        
        if (state == 1) 
            t.pendingMessage.style.display = "";
        else 
            $j(t.suggestMessage)
                .css('display','')
                .text(state == 2 ? "Suggestions:" : (state == 3 ? "No Suggestions" : "Failed to get suggestions"));
                
        
        // Clear all suggestions       
        var button = t.suggestMessage.nextSibling;
        while(button != t.separator) {
            var suggestion = button;
            button = button.nextSibling;
            // TODO: any memory leaks with events?
            suggestion.parentNode.removeChild(suggestion);
        }
        
       // t.updatePosition();
        
    },
    
   
    onClicked : function(id) {
        
        // Did the user click a spelling suggestion?
        if (id && /^fix:.+$/.test(id)) 
            de.spell.correctError(spellMenu.lastClicked, id.substr(4));
            
        else if (id == "ignore")
            de.spell.ignoreError(spellMenu.lastClicked);

        // Hack: just add to ignore list for this session..
        else if (id == "ignorealways") {
            
            var word = $j(spellMenu.lastClicked).text(),
                seenWord = 0;
            
            // Ignore all occurances of the word
            $j(".sw-spell-error:contains('" + word + "')").each(function() {
                
                de.spell.ignoreError(this, seenWord ? de.UndoMan.ExecFlag.GROUP : 0);
                seenWord=1;
            });
            
            SpellChecker.ignoreWords[word] = 1;
            
        }
    }
    
    
    
};



    
