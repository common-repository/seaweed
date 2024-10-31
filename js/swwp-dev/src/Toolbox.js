/*
 * file: Toolbox.js
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

// Create combo box items for font family
var fontFamilyItems = function(map) {
    var items = {};
    for (var font in map) {
        var val = font.toLowerCase() + (map[font] ? ', ' + map[font] : "" );
        items[font.replace(/\s/g, '')] = {
            name : font,
            markup: '<span style="font-family:' + val
                + ';font-weight:normal;">' 
                + font.replace(/\s/g, "&nbsp;") 
                + '</span>',
            value :  val
         };
    }
    return items;
}({
    'Andale Mono' : 'times', 
    'Arial' : 'helvetica, sans-serif', 
    'Arial Black' : 'arial black,avant garde',
    'Book Antiqua' : 'palatino',
    'Comic Sans MS' : 'sans-serif',
    'Courier New' : 'courier',
    'Georgia' : 'palatino',
    'Helvetica' : null,
    'Impact' : 'chicago',
    'Symbol' : null,
    'Tahoma' : 'arial,helvetica,sans-serif',
    'Terminal' : 'monaco',
    'Times New Roman' : 'times',
    'Trebuchet MS' : 'geneva',
    'Verdana' : 'geneva'
});

        


var formatItems = function(map) {
    var items = {};
    for (var tag in map) {
        items[tag] = {
            name : map[tag],
            markup : "<" + tag + ">" 
                + map[tag].replace(/\s/g, "&nbsp;")
                + "</" + tag + ">",
            value : tag
        };
    }
    return items;
}({
    'p': "Paragraph",
    'address' : 'Address',
    "pre" : "Preformatted",
    'h1' : 'Heading 1',
    'h2' : 'Heading 2',
    'h3' : 'Heading 3',
    'h4' : 'Heading 4',
    'h5' : 'Heading 5',
    'h6' : 'Heading 6'
});

var fontSizeItems = function(map) {
    var items = {};
    for (var size in map) {
        items[size.replace(/[^a-zA-Z0-9]/g, '')] = {
            markup: '<span style="font-size:' 
                + map[size]
                + ';font-weight:normal;">' 
                + size.replace(/\s/g, "&nbsp;") 
                + '</span>',
                
            value : map[size]
         };
    }
    return items;
}({
    'XX-Small (8pt)': 'xx-small',
    'X-Small': 'x-small',
    'Small (10pt)': 'small',
    'Medium (12pt)': 'medium',
    'Large (14pt)': 'large',
    'X-Large (18pt)': 'x-large',
    'XX-Large (24pt)': 'xx-large',
    '36pt': '36pt',
    'Smaller': 'smaller',
    'Larger': 'larger'
});

/**
 * @return {Number} Evaluates true if cursor currently is within a list item
 */
function isCursorInListItem() {
    var nd = de.cursor.getCurrentCursorDesc().domNode;
    while (nd && nd != document.body) {
        if (nd.nodeType == 1 && nd.nodeName.toLowerCase() == "li")
            return 1;
        nd = nd.parentNode;
    }
}   


/**
 * A floating toolbar which provides various editing operations
 */
var toolBox = {
	
	/**
	 * The offset in pixels of the dialog from the top of the window.
	 */
	yOffset : 0, // Used if browser does not support fixed positioning
    
    xOffset : 0, // Used if browser does not support fixed positioning
    
    /* The action data of the currently executing action - 0/null if there is none */
    execActionData : 0,
    
    lastSynchEditable : 0,
	
	/**
	 * Creates the toolBox ready for displaying. But does not show it.
	 */
	init : function() {
        
        // Make model
        de.model(this);
        
		// Keep the panel positioned. Note: add this before creating combo boxes so
        // Dropdowns are positioned after the toolbox is positioned.
        de.events.addHandler(window, "resize", function(){
			toolBox.repositionPanel();
		});
        
        if (!supportsFixedPos) {
            de.events.addHandler(window, "scroll", function(){
    			toolBox.repositionPanel();
    		});
        }

		var target = document.createElement("div");
		target.id = "swToolboxContent";
        
        var toolBoxContent = '<div style="width:100%">';
        
		// Undo | Redo
		newButtonSet();
        addButton("undo", "all"); 
        addButton("redo", "all");
		endButtonSet();
		
		addSeparator();
		
		// Bold | Italics | Underline | Strikethrough
		newButtonSet();
        addButton("bold", "left"); 
        addButton("italic"); 
        addButton("underline"); 
        addButton("strikethrough", "right"); 
	 	endButtonSet();
		
		addSeparator();
		
		// Text alignment: left | center | right | Justify
		newButtonSet();
        addButton("justifyleft", "left", "Align Left"); 
        addButton("justifycenter", "center", "Align Center"); 
        addButton("justifyright", "right", "Align Right"); 
        addButton("justifyfull", "justify", "Justify"); 
	 	endButtonSet();
        
        addSeparator();

		// Bullets | Numbers
		newButtonSet();
        addButton("bullist", "all", "Create/Destroy Bullets"); 
        addButton("numlist", "all", "Create/Destroy Numbers");
		endButtonSet();
		
		addSeparator();
		
		// Indent left, indent right
		newButtonSet();
        addButton("indent", "all"); 
        addButton("outdent", "all"); 
	 	endButtonSet();
		
		addSeparator();
        
        
		// Create/Edit and Remove link
		newButtonSet();
		addButton("link", "all", "Create/Edit Link"); 
        addButton("unlink", "all", "Destroy Link"); 
        
                    
        // BlockQuote
        addButton("blockquote", "all", "Create/Destroy Block Quote"); 
        addButton("pagebreak", "all", "Insert Page-break"); 
        
	 	endButtonSet();
		
        addSeparator();

        newButtonSet();
        
        addButton("spell", "all", "Spell check"); 
        
        endButtonSet();
        
        // Next line - clear floats
        toolBoxContent += '<span style="clear:both"></span>';
        
         // Format/Font-family/Font-size
        newButtonSet();
        toolBoxContent += getComboBoxMarkup('swFormat', 'Format', 98);
        toolBoxContent += getComboBoxMarkup('swFontFamily', 'Font&nbsp;Family', 98);
        toolBoxContent += getComboBoxMarkup('swFontSize', 'Font&nbsp;Size', 98);
		endButtonSet();
		
		// TODO: Table operations
		// New, delete row/column, insert row/column
		
        addSeparator();

        
		// Font color/highlight
		newButtonSet();
        
        toolBoxContent += getColorSelectBoxMarkup('swForeColor', 'ww-icon-forecolor');
        toolBoxContent += getColorSelectBoxMarkup('swBackColor', 'ww-icon-backcolor');
        
	 	endButtonSet();
        
        addSeparator();
        

		// Wordpress specials: image/video/audio
        newButtonSet();
        
        addButton("wpimage", "all", "Add Image"); 
        addButton("wpvideo", "all", "Add Video"); 
        addButton("wpaudio", "all", "Add Audio"); 
        
        endButtonSet();
        
		toolBoxContent += '</div>';
        
        // Clearer / padding between buttons and context
        toolBoxContent += '<div style="clear:both;padding:4px;"></div>';

        // Context pane
        toolBoxContent += '<div class="sw-edit-context-container ui-widget-content">Edit-Location:<span id="swEditContext">&nbsp;</span></div>';
		
		target.innerHTML = toolBoxContent;

		document.body.appendChild(target);
        
        // Create combo boxes
        

        
        this.formatCombo = new ComboBox(document.getElementById("swFormat"), "Format", "100px", formatItems, 
        function(id) {
            de.UndoMan.execute("ChangeContainer", formatItems[id].value);
        });

        
        this.fontFamilyCombo = new ComboBox(document.getElementById("swFontFamily"), "Font&nbsp;Family", "100px", fontFamilyItems, 
            function(id) {
            
            de.UndoMan.execute("Format", "fontfamily", fontFamilyItems[id].value);
            
        });
        
        this.fontSizeCombo = new ComboBox(document.getElementById("swFontSize"), "Font&nbsp;Size", "100px", fontSizeItems, 
            function(id) {
            
            de.UndoMan.execute("Format", "fontsize", fontSizeItems[id].value);
            
        });
        
        this.foreColorCombo = new ColorSelect(document.getElementById("swForeColor"), "Forecolor", function(color) {
            de.UndoMan.execute("Format", "color", color == "default" ? null : color);
            de.cursor.setCursor(de.cursor.getCurrentCursorDesc()); // Clear highlight but keep cursor
        });
        
        this.backColorCombo = new ColorSelect(document.getElementById("swBackColor"), "Backcolor", function(color) {
            de.UndoMan.execute("Format", "backcolor", color == "default" ? null : color);
            de.cursor.setCursor(de.cursor.getCurrentCursorDesc()); // Clear highlight but keep cursor
        });
        
		// Create the dialog to house the toolbox
		$j('#swToolboxContent').dialog({
			title: "~Seaweed~ toolbox",
			resizable : false,
			autoOpen: isNewEntry(),
			width: 510,
            minHeight:0,
            position: swwpInfo.tb_sp.split('-'),
            open: function() {
                // Keep observers notified of open state
                toolBox.fireEvent("ToolboxOpenStateChanged", true);
            },
            close: function() {
                // Keep observers notified of open state
                toolBox.fireEvent("ToolboxOpenStateChanged", false);
            },
            dragStop: function() {
                
                var scrollPos = de.getDocumentScrollPos();
                toolBox.yOffset = toolBox.dialogPane.offsetTop - scrollPos.top;
                toolBox.xOffset = toolBox.dialogPane.offsetLeft - scrollPos.left;
                
            }
		});

		var dialog = target.parentNode;
		dialog.id = "swToolbox";
        this.dialogPane = dialog;
		$j(dialog)
            .addClass('sw-protect')
            .addClass('sw-toolbox')
            .css('position', supportsFixedPos ? 'fixed' : 'absolute')
            .css('opacity', swwpInfo.tb_op); /* protect from selection */
           
         
		// Auto-show the toolbar on first execution of an action?
        if (swwpInfo.tb_sol) 
            toolBox.setVisible(true); // Onload
        else  // On first edit
            de.UndoMan.addObserver({
                onBeforeExec : function() {
    				toolBox.setVisible(true);
    				de.UndoMan.removeObserver(this);
    			}
            });
        
        // Observe actions ... synchronize GUI after actions exec, or
        // when selecting - but not both (other performance becomes sluggish).
        de.UndoMan.addObserver({
            onBeforeExec : this.onBeforeAction,
            onBeforeUndo : this.onBeforeAction,
            onBeforeRedo : this.onBeforeAction,
            onAfterExec : this.onAfterAction,
            onAfterUndo : this.onAfterAction,
            onAfterRedo : this.onAfterAction
        }, this, 1); // Make sure this observer is notified before the selection module.
        
        // JQuery UI stops mouseup propogation on dragable widgets - which prevents the seaweed
        // mouse module from sniffing the mouse ups and consequently thinks the mouse button states
        // are left down. To remedy this just register a dummy mouseup event on the dialog.
     //   de.events.addHandler(dialog, "mouseup", function() {}); // DEPRECIATED: Selection does not range unless last mousedown was not in a protected node
        
        // Listen for selection events
        de.selection.addObserver(this);
        
        // Hook click events
        $j(target).find('.ww-button:not(.sw-colorsel-arrow, .sw-colorsel-apply)').click(function() {
            if (!$j(this).hasClass('ui-state-disabled'))
                toolBox["on" + this.id.charAt(2).toUpperCase() + this.id.substr(3) + "Click"]();
        });
        
        function newButtonSet() {
            toolBoxContent += '<div class="ww-buttonset ui-helper-clearfix">';
        }
        
        function endButtonSet() {
            toolBoxContent += '</div>';
        }
        function addButton(name, cornerType, tiptext) {
            tiptext = tiptext || (name.charAt(0).toUpperCase() + name.substr(1));
            toolBoxContent += '<a id="sw' + name + 
                              '" class="ww-button ui-state-default' +  
                              (cornerType ? ' ui-corner-' + cornerType :'') + 
                              '" title="' + tiptext + '"><span class="ww-icon ww-icon-' + name +'"></span></a>';
        }
        
        function addSeparator() {
            toolBoxContent += '<span class="ww-seperator"></span>';
        }

	},
    
	
	/**
	 * Shows or hides the toolBox panel
	 * @param {Boolean} visible True to show, false to hide
	 */
	setVisible : function(visible) {
		if (visible) {
			$j('#swToolboxContent').dialog('open');
            this.repositionPanel();
            this.synchGUI();
		} else {
			$j('#swToolboxContent').dialog('close');
		}
	},
    
    isVisible : function() {
        return $j('#swToolboxContent').dialog('isOpen');
    },
	
	/**
	 * Positions the toolBox dialog so that it is in view.
	 */
	repositionPanel : function() {
        
        if (this.isVisible()) {
        
            var viewPortSize = de.getViewPortSize(1);
            
            var top = this.dialogPane.offsetTop, 
                left = this.dialogPane.offsetLeft;
            
            if (supportsFixedPos) {
                // Clamp top
                if (top >= viewPortSize.height) top = viewPortSize.height - 100;
                if (top < 0) top = 0;
                
                // Clamp left
                if (left >= viewPortSize.width) left = viewPortSize.width - 100;
                if (left < 0) left = 0;
            } else {
                
                var scrollPos = de.getDocumentScrollPos();
                top = scrollPos.top + this.yOffset;
                left = scrollPos.left + this.xOffset;
            }
            
            $j(this.dialogPane).css('top', top + "px").css('left', left + 'px');
            
        }
    },
    
    onBeforeAction : function(actionData) {
        this.execActionData = actionData;
    },
    
    onAfterAction : function() {
        
        // Only synchronize the GUI after actions which
        // would change the GUI context: inserting and deleting text
        // is the most used command and needs to be quick at executing -
        // therefore the gui isn't synchronized after these commands for
        // best end-user experience.
        if (!this.lastSynchEditable || (this.execActionData && this.execActionData.name != "InsertText" && this.execActionData.name != "RemoveText"))
            this.synchGUI();
        
        this.execActionData = 0;
    },
    
    onSelectionChanged : function() {
        if (!this.execActionData)
            this.synchGUI();
    },
    
    /**
     * Synchronizes the WIZZYWIG button states to reflect available options
     * depending on the current selection
     */
    synchGUI : function() {
        
        if (!this.isVisible())
            return;

        // Check to see if there is anything selected
       var isSelectionEditable = de.selection.isRangeEditable(),
           actionFilterRE, 
           actionFilterInclusive,
           isPostContentSelected;
       
       this.lastSynchEditable = isSelectionEditable;
       
       if (isSelectionEditable) {
           var cDesc = de.cursor.getCurrentCursorDesc();
           if (cDesc) {
               var eSec = de.doc.getEditSectionContainer(cDesc.domNode);
               
               isPostContentSelected = $j(eSec).hasClass("editable-postContent") || $j(eSec).hasClass("editable-newContent");
               
               var eProps = de.doc.getEditProperties(eSec);
               if (eProps) {
                   actionFilterRE = eProps.afRE ? eProps.afRE : 0;
                   actionFilterInclusive = eProps.afInclusive ? true : false;
               }
           }
       }
        
        this.setEnableState('swundo', de.UndoMan.hasUndo());
        this.setEnableState('swredo', de.UndoMan.hasRedo());

        // Get the edit state
        var eState = de.selection.getEditState(['bold','italics', 'strike', 'underline', 'fontfamily','fontsize', 'link']);
        var fState = eState.formatStates;
        
        this.setPressedState('swbold', fState['bold'] === true);
        this.setEnableState('swbold', isSelectionEditable && checkActionFilter("formatbold"));
        
        this.setPressedState('switalic', fState['italics'] === true);
        this.setEnableState('switalic', isSelectionEditable && checkActionFilter("formatitalics"));
        
        this.setPressedState('swunderline', fState['underline'] === true);
        this.setEnableState('swunderline', isSelectionEditable && checkActionFilter("formatunderline"));
        
        this.setPressedState('swstrikethrough', fState['strike'] === true);
        this.setEnableState('swstrikethrough', isSelectionEditable && checkActionFilter("formatstrike"));
        
        var enableTextAlign = checkActionFilter("textalign");
        this.setPressedState('swjustifyleft', eState.textAlign == "left");
        this.setEnableState('swjustifyleft', isSelectionEditable && enableTextAlign);
        
        this.setPressedState('swjustifycenter', eState.textAlign == "center");
        this.setEnableState('swjustifycenter', isSelectionEditable && enableTextAlign);
        
        this.setPressedState('swjustifyright', eState.textAlign == "right");
        this.setEnableState('swjustifyright', isSelectionEditable && enableTextAlign);
        
        this.setPressedState('swjustifyfull', eState.textAlign == "justify");
        this.setEnableState('swjustifyfull', isSelectionEditable && enableTextAlign);
        
        this.formatCombo.setText(formatItems[eState.inlineContainerType || ""] ?  
            formatItems[eState.inlineContainerType || ""].name
            : "Format");
            
        this.setEnableState(this.formatCombo.button.id, isSelectionEditable && checkActionFilter("changecontainer"));
        
        // Set font family
        var font = fState['fontfamily'];
        if (!font) font = "mixed";
        
        if (font != "mixed") {
            var useFontName = null;
            for (var f in fontFamilyItems) {
                
                var f1 = fontFamilyItems[f].value.replace(/\s/g,"").replace(/\,/g,"").toLowerCase(), 
                    f2 = font.replace(/\s/g,"").replace(/\,/g,"").toLowerCase();
                
                if (f1 == f2) {
                    useFontName = fontFamilyItems[f].name;
                    break;
                }
            }
            font = useFontName || "mixed";
        }
        
        this.fontFamilyCombo.setText(font == "mixed" ? "Font Family" : font);
        this.setEnableState(this.fontFamilyCombo.button.id, isSelectionEditable && checkActionFilter("formatfontfamily"));
        
        var size = fState['fontsize'];
        if (!size) size = "mixed"; 
        
        this.fontSizeCombo.setText(size == "mixed" ? "Font Size" : size);
        this.setEnableState(this.fontSizeCombo.button.id, isSelectionEditable && checkActionFilter("formatfontsize"));
        
        var enableItemize = checkActionFilter("itemize"),
            enableIndent = checkActionFilter("indent");
		this.setEnableState('swbullist', isSelectionEditable && enableItemize);
        this.setEnableState('swnumlist', isSelectionEditable && enableItemize);
        this.setEnableState('swindent', isSelectionEditable && enableIndent);
        this.setEnableState('swoutdent', isSelectionEditable && enableIndent);
        
        var enableLink = checkActionFilter("formatlink");
        this.setEnableState('swlink', isSelectionEditable && enableLink);
        this.setEnableState('swunlink', isSelectionEditable && (fState['link'] ? true : false) && enableLink);
        
        this.foreColorCombo.setEnabled(isSelectionEditable && checkActionFilter("formatcolor"));
        this.backColorCombo.setEnabled(isSelectionEditable && checkActionFilter("formatbackcolor"));
        
        this.setPressedState('swblockquote', eState.blockQuote);
        this.setEnableState('swblockquote', isSelectionEditable && checkActionFilter("blockquote"));


        this.setEnableState('swpagebreak', isSelectionEditable && isPostContentSelected);
        
        this.setEnableState('swwpimage', isSelectionEditable && isPostContentSelected);
        this.setEnableState('swwpvideo', isSelectionEditable && isPostContentSelected);
        this.setEnableState('swwpaudio', isSelectionEditable && isPostContentSelected);
        
        // Context
        var context = null;
        var cDesc = de.cursor.getCurrentCursorDesc();
        if (cDesc) {
            
            var current = cDesc.domNode;
            
            while(current && de.doc.isNodeEditable(current)) {
                
                if (current.nodeType == 1 && !$j(current).hasClass('dehighlight-node')) {
                    
                    if (context)
                        context = "&nbsp;&#8594;&nbsp;" + context;
                    else context = "";
                    
                    context = current.nodeName.toLowerCase() + context;
                    
                }
                
                current = current.parentNode;
            }
            

             
            var eProps = de.doc.getEditProperties(cDesc.domNode);
            
            if (eProps && eProps.name) {
                if (context)
                	context = "&nbsp;&#8594;&nbsp;" + context;
                else context = "";
                
                context = "[" + eProps.name + "]" + context;
                
            }
            
            if (!context) context = "<em>unknown</em>";
            
        } else context = "<em>none</em>";
        
        $j('#swEditContext').html(context);
        
        function checkActionFilter(actionName) {
            return actionFilterRE ? actionFilterRE.test(actionName.toLowerCase()) == actionFilterInclusive : true;
        }
        
    },
    
    setPressedState : function (id, isPressed) {
        if (isPressed)
            $j('#'+id).addClass('ui-state-active');
        else $j('#'+id).removeClass('ui-state-active');
    },
    
    setEnableState : function (id, isEnabled) {
        if (isEnabled)
            $j('#'+id).removeClass('ui-state-disabled');
        else $j('#'+id).addClass('ui-state-disabled');
    },
    
    
    onUndoClick : function() {
        de.UndoMan.undo();
    },
    
    onRedoClick : function() {
        de.UndoMan.redo();
    },
    
    onBoldClick : function() {
        if (de.selection.isRangeEditable())
            de.UndoMan.execute("Format", "bold", !de.selection.getEditState(['bold']).formatStates['bold']);
    },
    
    onItalicClick : function() {
        if (de.selection.isRangeEditable())
            de.UndoMan.execute("Format", "italics", !de.selection.getEditState(['italics']).formatStates['italics']);
    },
    
    onUnderlineClick : function() {
        if (de.selection.isRangeEditable())
            de.UndoMan.execute("Format", "underline", !de.selection.getEditState(['underline']).formatStates['italics']);
    },
    
    onStrikethroughClick : function() {
        if (de.selection.isRangeEditable())
            de.UndoMan.execute("Format", "strike", !de.selection.getEditState(['strike']).formatStates['strike']);
    },
    
    doJustify : function(align) {
        if (de.selection.isRangeEditable())
            de.UndoMan.execute("TextAlign", align);
    },
    
    onJustifyleftClick : function() {
        this.doJustify("left");
    },
    
    onJustifyrightClick : function() {
        this.doJustify("right");
    },
    
    onJustifycenterClick : function() {
        this.doJustify("center");
    },
    
    onJustifyfullClick : function() {
        this.doJustify("justify");
    },
    
    onBullistClick : function() {
        if (de.selection.isRangeEditable())
            de.UndoMan.execute("Itemize", true);
    },
    
    onNumlistClick : function() {
        if (de.selection.isRangeEditable())
            de.UndoMan.execute("Itemize", false);
    },
    
    onIndentClick : function() {
        // HACK! Should have dedicated promotion button...
        if (de.selection.isRangeEditable()) {
            if (isCursorInListItem())
                de.UndoMan.execute("PromoteItem");
            else de.UndoMan.execute("Indent", true);
        }


    },
    
    onOutdentClick : function() {
        // HACK! Should have dedicated demotion button...
        if (de.selection.isRangeEditable()) {
            if (isCursorInListItem())
                de.UndoMan.execute("DemoteItem");
            else de.UndoMan.execute("Indent", false);
        }
    },
    
    onLinkClick : function() {
        linkEditDialog.show();
    },
    
    onUnlinkClick : function() {
        if (de.selection.isRangeEditable()) 
            de.UndoMan.execute("Format", "link", null);
            
    },
    
    onBlockquoteClick : function() {
        if (de.selection.isRangeEditable()) 
            de.UndoMan.execute("Blockquote");
    },
    
    onPagebreakClick : function() {

        var sel = de.selection.getRange(true);
        if (sel) {
            // Get the last top-most node of the selection in the edit section
            var cur = sel.endNode ? sel.endNode : sel.startNode;
            var es = de.doc.getEditSectionContainer(cur);
            while(cur && cur.parentNode != es) {
                cur = cur.parentNode;
            }
             if (cur) // Insert "more" tag after end of selection as immediate child of editable section
                de.UndoMan.execute(
                    "InsertHTML",
                     moreElementMarkup,
                     es,
                     cur,
                     cur.nodeType == 3 ? cur.nodeValue.length : 1
                    );
        }
    },
    
    onWpimageClick : function() {
        mediaDialog.show('image');
    },
    onWpvideoClick : function() {
        mediaDialog.show('video');
    },
    onWpaudioClick : function() {
        mediaDialog.show('audio');
    },
    
    onSpellClick : function() {
        
        var editableSections = de.doc.getAllEditSections(),
            editSectionsToCheck = [];
        
        // Filter out editable sections which should not be spell checked
        for (var i in editableSections) {
            var clsName = $j(editableSections[i]).attr('className');
            if (clsName == "editable-postContent" ||
                clsName == "editable-commentContent" || 
                clsName == "editable-postTitle" || 
                clsName == "editable-newTitle" || 
                clsName == "editable-newContent")
                editSectionsToCheck.push(editableSections[i]);
        }
        
        if (editSectionsToCheck.length) 
            SpellChecker.markErrors(editSectionsToCheck);
    }
        
};

swwpModules.push(toolBox);

