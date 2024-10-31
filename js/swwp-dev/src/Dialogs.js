/*
 * file: Dialogs.js
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

var saveDialog = {
    
    init : function() {
        
		var target = document.createElement("div");
        this.dialogContent = target;
        document.body.appendChild(target);
                
 		// Create the dialog to house the toolbox
		$j(target).dialog({
			title: "~Seaweed~ Save ...",
			resizable : false,
			autoOpen: false,
			width: 500,
            minHeight:0,
            modal:true,
			buttons: {
                'Save Selected' : function() {
                    saveDialog.save(0);
                    $j(this).dialog('close');
                },
                'Save All' : function() {
                     saveDialog.save(1);
                    $j(this).dialog('close');
                },
                'Cancel' : function() {
                    $j(this).dialog('close');
                }
            }
		});
        
        // Protect dialog from seaweed selection
        $j(target.parentNode).addClass('sw-protect');
        
    },
    
    save : function(all) {
        
        var editSections = [];

        $j(this.dialogContent).find('.sw-list-item').each(function() {
            // Should this item be saved?
            if (all || $j(this).find('input').attr('checked')) 
                editSections.push(saveDialog.items[parseInt(this.id.substr(this.id.indexOf('-') + 1))].es);
        });
        
        if (editSections.length > 0)
            swwpAjax.saveExisting(editSections);
    },
    
    /**
     * Gets changes and displays changes as a list in a save (model) dialog.
     * @return {Boolean} False if nothing to save (in which case no dialog is displayed)
     */
    show : function() {
        
        var changes = de.Changes.getChangedEditableSections();
        
        if (changes.length == 0)
            return false;
        
        this.items = [];
        
        var saveMarkup = '<div style="border:solid 1px #CCCCCC">';
        
        for (var i in changes) {

		    var esNode = changes[i];
            var esProps = de.doc.getEditProperties(esNode);
            
            addSaveItem(esProps.name || "Unknown", esNode);
            
        }
        
        saveMarkup += "</div>";
        
        $j(this.dialogContent)
            .html(saveMarkup)
            .dialog('open')
            .find('.sw-list-item')
            .hover(    
        		function(){ 
        	        $j(this).addClass("ui-state-hover"); 
        		},
        		function(){ 
        			$j(this).removeClass("ui-state-hover"); 
        		}
        	)
        	.click(function(e){
                
                var target = de.events.getEventTarget(e),
                    toggledValue;
                
                if (target.nodeName.toLowerCase() == "input") {
                    toggledValue = target.checked ? true : false; // can be string or boolean
                } else {
                    toggledValue = !$(this).hasClass("ui-state-active");
                }
                
                if (toggledValue) {
                    $j(this).addClass("ui-state-active").find('input').attr('checked', 'checked');
                } else {
                    $j(this).removeClass("ui-state-active").find('input').removeAttr('checked');
                }
                
        	});
        
        function addSaveItem(name, esNode) {
            
            var itemText = '<strong>*' + name + '</strong> - <em style="font-weight:normal;color:#777777">' + $j(esNode).text().substr(0, 20) + "...</em>";
            
            saveMarkup += '<div id="swSaveLI-' + saveDialog.items.length + '" class="sw-list-item ui-state-default ui-state-active" style="padding:4px;'
                        + (saveDialog.items.length > 0 ? ';border-top:dashed 1px #CCCCCC' : '')
                        + '"><div style="float:right"><input type="checkbox" checked="checked" /></div>' + itemText + '</div>';
            
            saveDialog.items.push({name: name, es: esNode});
            
        }
    }
    
};


var linkEditDialog = {
    
    init : function() {
        
		var target = document.createElement("div");
		target.id = "swLinkDialogContent";
        document.body.appendChild(target);
        this.dialogContent = target;
        
        target.innerHTML = '<table class="sw-link-table"><tr><td>URL:</td><td><input class="sw-link-input" id="swLinkURLInput" type="text" autocomplete="off" /></td></tr><tr><td>Title:</td><td><input class="sw-link-input" id="swLinkTitleInput" type="text" /></td></tr></table>';
        
        this.urlInput = document.getElementById('swLinkURLInput');
        this.titleInput = document.getElementById('swLinkTitleInput');

 		// Create the dialog to house the toolbox
		$j('#swLinkDialogContent').dialog({
			title: "~Seaweed~ Edit Link",
			resizable : false,
			autoOpen: false,
            minHeight:0,
            width:390,
            modal:true,
			buttons: {
                'Ok' : function() {

                    var url = $j(linkEditDialog.urlInput).val();
                    
                    // Trim URL
                    url = url.replace(/^\s*/,"").replace(/\s*$/,"");
                    
                    // Check if URL has protocol
                    if (url && !/^.+:\/\/.+$/.test(url)) {
                        // Check if URL might be external
                        if (/^www\..+/.test(url) || /.+\.(com|net|org|info|uk|au|ca|nz|eu|us|jp|ie|cn)(\/.*)?$/.test(url)) {
                        // Ask user if want to add http://
                            if (confirm('The URL provided appers to be an external link, do you want to prepend "http://" ? (If not then the link will not be externally linked)'))
                                url = "http://" + url;
                        }
                        
                    }
                    
                    // Restore selection
                    var sBefore = linkEditDialog.selBefore;
                    de.selection.setSelection(
                        sBefore.startNode,
                        sBefore.startIndex,
                        sBefore.endNode,
                        sBefore.endIndex);
                        
                    if (de.selection.isRangeEditable()) 
                        de.UndoMan.execute("Format", "link", {
                            url: url,
                            title: $j(linkEditDialog.titleInput).val()
                        });

                    $j(this).dialog('close');
                },
                'Cancel' : function() {
                    $j(this).dialog('close');
                }
            }
		});
        
        // Protect dialog from seaweed selection
        $j(target.parentNode).addClass('sw-protect');
        
    },
    
    show : function() {
        
        var selection = de.selection.getRange(true),
            selectedAnchor = null; // 0 = stop - selection not in a single anchor,
        
        if (!selection)
            return false;
        
        if (selection.endNode) { // Check selection for anchors
            var ca = de.getCommonAncestor(selection.startNode, selection.endNode, false);
            de.visitAllNodes(ca, selection.startNode, true, function(domNode) {
                checkForAnchor(domNode);
                return domNode != selection.endNode && selectedAnchor !== 0;
            });
        } else checkForAnchor(selection.startNode);

        $j(this.urlInput).val(selectedAnchor ? selectedAnchor.href : "");
        $j(this.titleInput).val(selectedAnchor ? selectedAnchor.title : "");
        
        this.selBefore = de.selection.getRange(false);
        de.selection.clear();
        
        $j(this.dialogContent)
            .dialog('option', 'title', "~Seaweed~ " + (selectedAnchor ? "Edit" : "Insert") + " link")
            .dialog('open');
    
        function checkForAnchor(current) {

            // Check above selected node for an anchor node        
            while (current && current != document.body && de.doc.isNodeEditable(current)) {
                
                if (current.nodeType == 1 && current.nodeName.toLowerCase() == "a") {
                    if (selectedAnchor === null)
                        selectedAnchor = current;
                    else if (selectedAnchor != current)
                        selectedAnchor = 0;
                    return;
                }
                
                current = current.parentNode;
            }
        
            selectedAnchor = 0;

        }
    }

};



var imageEditDialog = {
    
    init : function() {
        
		var target = document.createElement("div");
		target.id = "swImageDialogContent";
        document.body.appendChild(target);
        this.dialogContent = target;
        
        target.innerHTML = '<table><tr><td>URL<span style="color:red">*</span>:</td><td><input id="swwpImageURLInput" type="text" class="sw-image-input" autocomplete="off" /></td></tr>'
        
            + '<tr><td>Title<span style="color:red">*</span>:</td><td><input id="swwpImageTitleInput" type="text" class="sw-image-input" autocomplete="off" /></td></tr>'
            
            + '<tr><td>Caption:</td><td><input id="swwpImageCaptionInput" type="text" class="sw-image-input" autocomplete="off" /></td></tr>'
            
            + '<tr><td>Alignment:</td><td><input type="radio" name="swwpImgAlign" id="swwpImgAlignnone" value="none"/><label for="swwpImgAlignnone">None</label>'
            + ' | <input type="radio" name="swwpImgAlign" id="swwpImgAlignleft" value="left"/><label for="swwpImgAlignleft">Left</label>'
            + ' | <input type="radio" name="swwpImgAlign" id="swwpImgAligncenter" value="center"/><label for="swwpImgAligncenter">Center</label>'
            + ' | <input type="radio" name="swwpImgAlign" id="swwpImgAlignright" value="right"/><label for="swwpImgAlignright">Right</label></td></tr>'
            
            + '<tr><td>Size<span style="color:red">*</span>:</td><td>Width: <input id="swwpImageWidthInput" type="text" style="width:60px" /> Height: <input id="swwpImageHeightInput" type="text" style="width:60px" />(px)</td></tr>'
            
            
            + '<tr><td>Link image to:</td><td><input id="swwpImageLinkToInput" type="text" class="sw-image-input" autocomplete="off" /></td></tr>'
            
            
            + '</table>';
        
 		// Create the dialog to house the toolbox
		$j('#swImageDialogContent').dialog({
			title: "~Seaweed~ Edit Image",
			resizable : false,
			autoOpen: false,
            minHeight:0,
            width:460,
            modal:true,
			buttons: {
                'Ok' : function() {

                    var url = $j('#swwpImageURLInput').val();
                    
                    // Trim URL
                    url = url.replace(/^\s*/,"").replace(/\s*$/,"");
                    
                    // Check if URL has protocol
                    if (url && !/^.+:\/\/.+$/.test(url)) {
                        // Check if URL might be external
                        if (/^www\..+/.test(url) || /.+\.(com|net|org|info|uk|au|ca|nz|eu|us|jp|ie|cn)(\/.*)?$/.test(url)) {
                        // Ask user if want to add http://
                            if (confirm('The URL provided appers to be an external link, do you want to prepend "http://" ? (If not then the link will not be externally linked)'))
                                url = "http://" + url;
                        }
                    } else if (!url) {
                        alert("Must supply URL to image's source");
                        return;
                    }
                    
                    var linkToUrl = $j('#swwpImageLinkToInput').val();
                    
                    // Trim URL
                    linkToUrl = linkToUrl.replace(/^\s*/,"").replace(/\s*$/,"");
                    
                    // Check if URL has protocol
                    if (linkToUrl && !/^.+:\/\/.+$/.test(linkToUrl)) {
                        // Check if URL might be external
                        if (/^www\..+/.test(linkToUrl) || /.+\.(com|net|org|info|uk|au|ca|nz|eu|us|jp|ie|cn)(\/.*)?$/.test(linkToUrl)) {
                        // Ask user if want to add http://
                            if (confirm('The Link-to URL provided appers to be an external link, do you want to prepend "http://" ? (If not then the link will not be externally linked)'))
                                linkToUrl = "http://" + linkToUrl;
                        }
                    }
                    
                    
                    var title = $j('#swwpImageTitleInput').val(),
                        caption = $j('#swwpImageCaptionInput').val();
                    
                    if (!title) {
                        alert("Must supply title for image");
                        return;
                    }
                    
                    var alignment = "none";
                    if ($j("#swwpImgAlignleft").attr('checked'))
                        alignment = "left";
                    else if ($j("#swwpImgAligncenter").attr('checked'))
                        alignment = "center";
                    else if ($j("#swwpImgAlignright").attr('checked'))
                        alignment = "right";
                        
                    var width = $j('#swwpImageWidthInput').val(),
                        height = $j('#swwpImageHeightInput').val();
                        
                    // Strip pixel suffix if user provided one
                    if (width) {
                        width = width.replace(" ", "");
                        width = width.replace("px", "");
                    }
                    if (height) {
                        height = height.replace(" ", "");
                        height = height.replace("px", "");
                    }
                        
                    function isNumberValid(val) {
                        return val && /^\d+$/.test(val);
                    }
                    
                    if (!isNumberValid(width) || !isNumberValid(height)) {
                        alert("Must supply image width and height in pixels");
                        return;
                    }
                    
                    var newHTML;
                    if (caption) {
                        
                        newHTML = '<div class="wp-caption align' + alignment 
                        + '" style="width:' + (parseInt(width) + 10) + 'px" >';
                        
                        // add link
                        if (linkToUrl) 
                            newHTML += '<a href="' + linkToUrl + '">';
                        
                        // The image...
                        newHTML += '<img alt="' + caption 
                            + '" src="' + url 
                            + '" title="' + title 
                            + '" width="' + width
                            + '" height="' + height
                            + '"/>';
                            
                        if (linkToUrl) 
                            newHTML += '</a>';
                            
                        // add caption
                        newHTML += '<p class="wp-caption-text">' + caption + '</p>';
                                
                        newHTML += '</div>';
                        
                    } else {
                        
                        newHTML = '<img class="align' + alignment 
                        + '" src="' + url 
                        + '" title="' + title 
                        + '" width="' + width
                        + '" height="' + height
                        + '"/>';
                        
                        // Add link
                        if (linkToUrl) 
                            newHTML = '<a href="' + linkToUrl + '">' + newHTML + '</a>';
                        
                    }
                    
                    var capQry = $j(imageEditDialog.selectedImage).parents().filter(".caption,.wp-caption"),
                    	removeNode, refNode, refIndex;
                        
                    // Get caption wrapper if exists        
                    if (capQry.length > 0) {
                        
                        removeNode = refNode = capQry.get(0);
                        refIndex = 0;
                        
                        // Replace caption div with paragraph (if new image now has no caption)
                        if (!caption)
                            newHTML = "<p>" + newHTML + "<p>";
                        
                    } else {
                        
                        // Get the parent container.
                        var parentQry = $j(imageEditDialog.selectedImage).parents().filter('p,pre,h1,h2,h3,h4,h5,h6');
                        if (parentQry.length) {
                        
                            var parentContainer = parentQry.get(0);
                            if (/^[\r\n ]*$/.test($j(parentContainer).text())) {
                                
                                // If replacing an image within a container with no content,
                                // replace the container instead.
                                removeNode = refNode = parentContainer;
                                refIndex = 0;
                                
                                // wrap image with paragraph
                                if (!caption)
                                    newHTML = "<p>" + newHTML + "<p>";
                                
                            } else {
                                
                                if (caption) {
                                
                                    // If replacing an image with a container element, containing content
                                    // and the new image has a caption, then remove the image, but pplace
                                    // the captioned image after the container element
                                    removeNode = imageEditDialog.selectedImage;
                                    refNode = parentContainer;
                                    refIndex = 1;
                                    
                                } else {
                                    // If editing a image within a contain, and the new image
                                    // has no caption, simply replace the images
                                    removeNode = refNode = imageEditDialog.selectedImage;
                                    refIndex = 0;
                                }
                            
                            }
                        
                        } else {
                            
                            // wrap image with paragraph
                            if (!caption)
                                newHTML = "<p>" + newHTML + "<p>";
                                
                            removeNode = refNode = imageEditDialog.selectedImage;
                            refIndex = 0;
                            
                        }
                    // if contains empty text.. remove this instead
                    }
                    
                    // Step 1: insert HTML next to old image
                    de.UndoMan.execute("InsertHTML", newHTML, refNode.parentNode, refNode, refIndex);
                    
                    // Step 2: remove the old image... group action with insertion
                    de.UndoMan.execute(de.UndoMan.ExecFlag.GROUP, "RemoveNode", removeNode);
                    
                    $j(this).dialog('close');
                    
                },
                
                'Cancel' : function() {
                    $j(this).dialog('close');
                }
            }
		});
        
        // Protect dialog from seaweed selection
        $j(target.parentNode).addClass('sw-protect');
        
    },
    
    show : function(selectedImage) {
        
        if (!de.doc.isNodeEditable(selectedImage))
            return;
            
        this.selectedImage = selectedImage;
        
        // Set URL
        $j('#swwpImageURLInput').val(selectedImage.src);
        
        // Set title
        $j('#swwpImageTitleInput').val(selectedImage.title);

        // Does this image have a caption?
        var capQry = $j(selectedImage).parents().filter(".caption,.wp-caption"),
            captionDiv=0,
            alignElement;
            
        if (capQry.length > 0) {
            captionDiv = alignElement = capQry.get(0);
             $j('#swwpImageCaptionInput').val($j(captionDiv).text());

        } else alignElement = selectedImage;
        
        // Get alignment: wordpress uses classes: alignnone, alignleft etc..
        var alignment = "none";
        if (alignElement.className) {
            var match = /align(none|left|center|right)/.exec(alignElement.className);
            if (match) {
                alignment = match[1];
            }
        }
        
        $j('#swwpImgAlign' + alignment).attr('checked', 'checked');
        
        // Get width and height of image in pixels
        var width = $j(selectedImage).css('width'), match;
        if (width && (match=/^(\d+)px$/.exec(width))) {
            width = match[1];
        } else width = selectedImage.offsetWidth;
        
        var height = $j(selectedImage).css('height');
        if (height && (match=/^(\d+)px$/.exec(height))) {
            height = match[1];
        } else height = selectedImage.offsetHeight;
        
        $j('#swwpImageWidthInput').val(width);
        $j('#swwpImageHeightInput').val(height);
        
        // Set link to URL
        if (selectedImage.parentNode.nodeName.toLowerCase() == "a") 
            $j('#swwpImageLinkToInput').val(selectedImage.parentNode.href);

        $j(this.dialogContent).dialog('open');
    
    }

};



var confirmDialog = {
    
  init : function() {

	var target = document.createElement("div");
    document.body.appendChild(target);
    this.dialogContent = target;
    
    target.innerHTML = '<strong>.</strong>';

		// Create the dialog to house the toolbox
	$j(target).dialog({
		title: "~Seaweed~ Confirmation",
		resizable : false,
		autoOpen: false,
        modal:true,
		buttons: {
            'Yes' : function() {
                $j(this).dialog('close');
                confirmDialog.onConfirmed();
            },
            'Cancel' : function() {
                $j(this).dialog('close');
            }
        }
	}); 
  },
  
  show : function(msg, onConfirmed) {
      this.onConfirmed = onConfirmed;
      $j(this.dialogContent).find('strong').html(msg);
      $j(this.dialogContent).dialog('open');
  }
    
};


var notifyDialog = {
    
  init : function() {

	var target = document.createElement("div");
    document.body.appendChild(target);
    this.dialogContent = target;
    
    target.innerHTML = '<span id="swwpNotifyContent">.</span>';

		// Create the dialog to house the toolbox
	$j(target).dialog({
		resizable : false,
		autoOpen: false,
        modal:true,
		buttons: {
            'Ok' : function() {
                $j(this).dialog('close');
            }
        }
	}); 
  },
  
  show : function(title, msg) {
      if (!title) title = "~Seaweed~";
      $j("#swwpNotifyContent").html(msg);
      $j(this.dialogContent).dialog('option','title', title).dialog('open');
  }
    
};


var progressMessage = {
    
    /**
     * Displays a model message.
     * @param {String} msg1 The title-message
     * @param {String} msg2 (Optional) Italiced text
     */
    show : function(msg1, msg2) {
        
        debug.assert(!this.contentPane);
            
        var cpane = document.createElement("div");
        document.body.appendChild(cpane);
        
        // Add message pane
        $j(cpane)
            .addClass("sw-protect")
            .addClass("ui-widget-content")
            .addClass("ui-corner-all")
            .addClass("sw-progress-dialog")
            .html('<p style="text-align:center"><strong>' 
                + msg1
                + '</strong></p><p style="text-align:center"><img src="' 
                + swwpInfo.plugURL 
                + '/css/images/ajax.gif" \></p>'
                + (msg2 ? '<p style="text-align:center"><em>'+ msg2 + '</em></p>' : ''));
        
        this.contentPane = cpane;
        
        // Make model by placing overlay
        var overlay = document.createElement("div");
        document.body.appendChild(overlay);
        
        $j(overlay)
            .addClass('ui-widget-overlay')
            .addClass('sw-protect')
            .css('z-index', '1009')
            .css('position', supportsFixedPos ? 'fixed' :'absolute')
            .css('top', '0px')
            .css('left', '0px');
            
        this.overlay = overlay;
        
        this.reposition();
        
        de.events.addHandler(window, "resize", this.reposition);
        
    },
    
    error : function(msg) {
        
	    debug.assert(this.contentPane);
        
        $j(this.contentPane)
            .addClass('ui-state-error')
            .html(
            '<p style="text-align:center"><strong>Error: ' 
            + msg 
            + '</strong></p>'
            + '<p style="text-align:center"><button class="sw-button ui-state-default ui-priority-primary ui-corner-all">Ok</button></p>'
            );
            
        // Hide when button is clicked
        applyButtonHover($j(this.contentPane).find('button').click(this.hide));
        
        this.reposition();
        
    },
    
    hide : function() {
        $j(progressMessage.contentPane).remove();
        $j(progressMessage.overlay).remove();
        de.events.removeHandler(window, "resize", progressMessage.reposition);
        progressMessage.contentPane = null;
        progressMessage.overlay = null;
    },

    
    reposition : function() {
        
        var viewPortSize = de.getViewPortSize(1),
            docScroll = de.getDocumentScrollPos();
        
        $j(progressMessage.contentPane)
            .css('top', ((viewPortSize.height / 2) - (progressMessage.contentPane.offsetHeight / 2)) + "px")
            .css('left', ((viewPortSize.width / 2) - (progressMessage.contentPane.offsetWidth / 2)) + "px");
            
        $j(progressMessage.overlay)
            .css('width', viewPortSize.width + "px")
            .css('height', viewPortSize.height + "px");
            
        if (!supportsFixedPos)
            $j(progressMessage.overlay)
                .css('top', docScroll.top + "px")
                .css('left', docScroll.left + "px");
    }

  
};



// Setup initialization
swwpModules.push(saveDialog);
swwpModules.push(linkEditDialog);
swwpModules.push(confirmDialog);
swwpModules.push(notifyDialog);
swwpModules.push(imageEditDialog);


