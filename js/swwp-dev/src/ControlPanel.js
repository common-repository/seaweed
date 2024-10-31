/*
 * file: ControlPanel.js
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
 * The main control panel for actions like save, new post and delete.
 */
var controlPanel = {
    
    failedSaves : 0,
    
    isDocked : 1,
    
    /**
     * Creates and displays the control panel GUI
     */
    init: function() {
        
        var rootPane = document.createElement("div");
        rootPane.id = "swControlPanel";
        this.rootPane = rootPane;
        
        // Create widget header
        var panelMarkup = '<div class="sw-dialog-title ui-widget-header ui-corner-all ui-helper-clearfix">';
        panelMarkup += '<a id="cpanMinMax" class="swwp-dialog-button ui-corner-all"><span class="ui-icon ui-icon-carat-1-s">Minimize</span></a>';
        panelMarkup += '<a id="cpanDock" class="swwp-dialog-button ui-corner-all"><span class="ui-icon ui-icon-pin-w">Undock</span></a>';
    	panelMarkup += '<span class="ui-dialog-title">~Seaweed~ control panel</span>';
    	panelMarkup += '</div>';
        
        // Build content...
        panelMarkup += '<div id="swControlPanelContent">';
        
        // Add save-progress content (initialally hidden)
       panelMarkup += '<div id="swSaveProgress" style="padding:10px;display:none">';
       panelMarkup += '<p style="text-align:center;font-size:small;font-wight:bold"><span></span><br/>';
       panelMarkup += '<img src="' + swwpInfo.plugURL + '/css/images/ajax.gif" \></p>';
       panelMarkup += '</div>';
        
        // Save complete message (initialally hidden, shown on success and fades out)
       panelMarkup += '<div id="swSaveComplete" class="ui-widget-content" style="display:none;position:absolute;z-index:10;">';
       panelMarkup += '<p style="text-align:center;font-weight:bold"></p>'; 
       panelMarkup += '</div>';
       
        // Arrange buttons in a 2x3 table
        panelMarkup += '<table><tbody><tr><td>';
        
        // Save / Save Draft
        addButton('swSave', 'Save' + (isNewEntry() ? '&nbsp;Draft' : '&nbsp;...'));
        
        panelMarkup += '</td><td>';
        
        // New post
        if (!isNewEntry()) {
            addButton('swNewPost', 'New&nbsp;Post');
        	panelMarkup += '</td><td>';
        }
        
        // Delete
        addButton('swDelete', isNewEntry() ? "Cancel Draft" : ('Delete&nbsp;' + (swwpInfo.view.indexOf("page") != -1 ? "Page" : "Post")),
            !isNewEntry() && ($j('.editable-postContent').length == 0 || !isSingleView()));
            
            
        panelMarkup += '</td></tr><tr><td>';
        
        // SaveAll / Publish
        addButton('swSaveAllPublish', isNewEntry() ? "Publish" : "Quick&nbsp;Save");
        
        panelMarkup += '</td><td>';
        
        // New Page
        if (!isNewEntry()) {
            addButton('swNewPage', 'New&nbsp;Page');
        	panelMarkup += '</td><td>';
        }
        
        // Toolbox hide/show
        addButton('swViewToolbox', 'Show&nbsp;ToolBox');
        
        panelMarkup += '</td></tr></tbody></table>';
        
        panelMarkup += '</div>';
        
        // Create DOM from markup
        rootPane.innerHTML = panelMarkup;
        
        // Add pane to the document
        document.body.appendChild(rootPane);
        
        // Add classes to control panel widget
        $j(rootPane).addClass('sw-protect') /* protect against sw selection */
        	.addClass('ui-widget')
        	.addClass('ui-widget-content')
        	.addClass('ui-corner-all')
        
        	.css({
        		'position' : supportsFixedPos ? 'fixed' :'absolute',
        		'z-index' : '100',
                'opacity' : swwpInfo.cp_op
        	});
        
        // Bind click event - listen for button clicks
        $j("#swControlPanel button").bind('click', function(e) {
        	var target = de.events.getEventTarget(e);
        	
        	// Is this button disabled?
        	if ($j("#" + target.id).hasClass('ui-state-disabled'))
        		return;
        
        	// Exec event
        	controlPanel["on" + target.id.substr(2)]();
        	
        });
        
        // Bind min/max
        $j("#cpanMinMax").bind('click', function(e) {
        	controlPanel.setExpansion(!controlPanel.isExpanded());
        });
        
        
        // Keep the panel positioned on resize events
        de.events.addHandler(window, "resize", function(){
            if (controlPanel.isDocked)
        	    controlPanel.repositionPanel();
        });
        
        if (!supportsFixedPos)
            de.events.addHandler(window, "scroll", function(){
            if (controlPanel.isDocked)
        	    controlPanel.repositionPanel();
            });
                
        // IE Fix: content pane size auto-sizes to view-port size..
        if (de.browser == de.Platform.IE) {
            rootPane.style.width = $j(rootPane).find('table').attr("offsetWidth");
        }
        
        // Save content height info for min/max animation
        this.contentHeight = document.getElementById("swControlPanelContent").offsetHeight;

        // Start expanded if requested
        this.setExpansion(swwpInfo.cp_se, true);
        
        $j("#cpanDock").bind('click', function(e) {
        	controlPanel.setDockState(!controlPanel.isDocked);
        });
        
        this.setDockState(1, 1);
        
        // Center the panel if not already
        this.repositionPanel();
        
        
        // TODO: DOCKING PRECEDENCE
		// Auto-expand the toolbar on first execution of an action?
        if (!swwpInfo.cp_se) 
            de.UndoMan.addObserver({
                onBeforeExec : function() {
    				controlPanel.setExpansion(true);
    				de.UndoMan.removeObserver(this);
    			}
            });
            
            
        
        de.UndoMan.addObserver({
            onAfterExec: function(){
                // Explicitely set save buttons as enabled since we
                // know that there definatly will be changes - this will
                // help improve the performance of editing.
                controlPanel.updateSaveButtons(1);
            },
            onAfterUndo: function(){
                controlPanel.updateSaveButtons(); // ensure that update probes changes
            },
            onAfterRedo : function(){
                controlPanel.updateSaveButtons(); // ensure that update probes changes
            }
        });
        
        this.updateSaveButtons();

        /**
         * Appends button markup to local panelMarkup 
         */        
        function addButton(id, text, isDisabled) {
            panelMarkup += '<button id="' 
                        + id 
                        + '" title="' + text + '" class="sw-button ui-state-default ' 
                        +  (isDisabled ? 'ui-state-disabled' : 'ui-priority-primary') 
                        + ' ui-corner-all">'
                        + text 
                        + '</button>';
        }
        
    },
    
    // Run initialization code dependant on initialization of other modules
    afterInit : function() {
        
        // Keep toolbar show/hide button in sych with toolbar window state
        toolBox.addObserver({
            onToolboxOpenStateChanged : function(isOpened) {
                updateToolboxButton(isOpened);
            }
        });
        
        function updateToolboxButton(isOpened) {
            $j('#swViewToolbox').html((isOpened ? "Hide" : "Show") + "&nbsp;ToolBox");
        }
        
        swwpAjax.addObserver({
            
            onSave : function() {
                
                // Make sure the user get visual feedback of their ajax request
                if (!this.isExpanded())
                    this.setExpansion(true);
                    
                this.updateGUI();
            },
            
            onSaveSucceeded : function() {
                this.updateGUI(true);
            },
            
            onSaveFailed : function(esNode, reason) {
                alert('Failed to save item\n' + reason);
                this.failedSaves ++;
                this.updateGUI(true);
            }
            
        }, this);
        
        // Synch the show/hide toolbox button for first time
        updateToolboxButton(toolBox.isVisible());
    },
    
    /**
     * Enabled/disables the save / saveall / publish buttons depending on the
     * save state.
     * 
     * @param {Boolean} enabled (Optional) If given then the enable state will be set as this.
     *                                     Otherwise the enable state will be set according to the
     *                                     changes state (which can be an expensive operation).
     */
    updateSaveButtons : function(enabled) {
        
       if (!isNewEntry()) {
           if (typeof enabled == "undefined")
               enabled = de.Changes.getChangedEditableSections().length > 0; // can be expensive
               
           if (enabled) 
               $j('#swSave, #swSaveAllPublish').addClass('ui-priority-primary').removeClass('ui-state-disabled');
           else 
               $j('#swSave, #swSaveAllPublish').addClass('ui-state-disabled').removeClass('ui-priority-primary');
       }
        
    },
    
    /**
     * Updates the control panel GUI state
     * 
     * @param {Boolean} isAjaxEvent Set to true iff calling due to a ajax save operation completing (both successes or fails)
     */
    updateGUI : function(isAjaxEvent) {
    
        var saveCount = swwpAjax.itemsPending.length;
        
        // Is seaweed in a saving state?
        if (saveCount) {
        
            // Ensure that save progress notifier is shown - hide the standard control panel buttons
            $j(this.rootPane).find('table').css('display', 'none');
            $j('#swSaveProgress').css('display', '').find('p span')
                .text(
                isNewEntry() ? "Saving Draft" :
                   "Saving " +  (saveCount + " item" + (saveCount > 1 ? "s" : ""))
                + "...");
            
        } else { // Not a saving state
            
            // Ensure standard control panel buttons are shown and the save progress notifier is hidden
            $j(this.rootPane).find('table').css('display', '');
            $j('#swSaveProgress').css('display', 'none');
            
            // Did an ajax save finish just occur?
            if (isAjaxEvent) {
                // Update save operation complete notifier
                $j('#swSaveComplete').find('p') /* QJery/sizzle is having issue randomly if use descendant selector.. workaround form bug: use find*/
                    .text(this.failedSaves ? 
                        "Failed to save " + this.failedSaves + " item" + (this.failedSaves > 1 ? "s" : "") : 
                        "Save(s) completed successfully")
                    .css('color', this.failedSaves ? 'red' : 'green');
                 
                // Add/remove error class depending on result
                if (this.failedSaves)
                    $j('#swSaveComplete').addClass('ui-state-error');
                else $j('#swSaveComplete').removeClass('ui-state-error');
                
                // Reset fail counter now that fails are acknowledged
                this.failedSaves = 0;
                
                //Show the notifier and fade it out to reveal the standard buttons
                $j('#swSaveComplete')
                    .css('width',  $j(this.rootPane).find('table').attr('offsetWidth') + "px")
                    .css('height', $j(this.rootPane).find('table').attr('offsetHeight') + "px")
                    .css('display', '');
                    

                setTimeout(function() {
                    if ($j('#swSaveComplete').css('display') != 'none') {
                        $j('#swSaveComplete').fadeOut(1000);
                    }
                }, 1000);
                
            }
            
        }
        
        this.updateSaveButtons();
      
        // Keep panel centered
        if (controlPanel.isDocked)
    	    controlPanel.repositionPanel();

    },
    
	/**
	 * Positions the panel to the lower-center part of the page
	 */
	repositionPanel : function() {
        var viewPortSize = de.getViewPortSize(1),
            docScroll = de.getDocumentScrollPos();
        
        var pos = this.calculateDockPosition();    
        $j(this.rootPane)
            .css('top', pos.y + "px")
            .css('left', pos.x + "px");
    },
	
    
    calculateDockPosition : function() {
        
        var viewPortSize = de.getViewPortSize(1),
            docScroll = de.getDocumentScrollPos();
            
        return {
            y: ((viewPortSize.height - this.rootPane.offsetHeight) + (supportsFixedPos ?  0 : docScroll.top)),
            x : (((viewPortSize.width / 2) - (this.rootPane.offsetWidth / 2)) + (supportsFixedPos ?  0 : docScroll.left))
        };
    
    },
    
    
	/**
	 * Either mimizes or expands the control panel.
	 * @param {Boolean} maximize True to maximize, false ot minimize.
	 * @param {Boolean} noAnim True to instantly max/min
	 */
	setExpansion : function(maximize, noAnim) {
		
		var animFinished = false;
		
		if (maximize) {
			$j("#cpanMinMax").children()
				.removeClass('ui-icon-carat-1-n')
				.addClass('ui-icon-carat-1-s')
				.text('Minimize');
                
            $j("#cpanMinMax").attr("title", "Minimize control panel");
				
            if (noAnim) 
                $j("#swControlPanelContent").css('height', controlPanel.contentHeight + "px");
            else 
    			$j("#swControlPanelContent").animate({
    				height : controlPanel.contentHeight + "px"
    			}, 200, "linear", function() {
    				animFinished = true;
    			});
                
			
		} else {
            
            // Always set as docked when minimizing
            this.setDockState(1,1);
            
			$j("#cpanMinMax").children()
				.removeClass('ui-icon-carat-1-s')
				.addClass('ui-icon-carat-1-n')
				.text('Maximize');
                
            $j("#cpanMinMax").attr("title", "Maximize control panel");
            
            if (noAnim) 
                $j("#swControlPanelContent").css('height', "0px");
            else 
    			$j("#swControlPanelContent").animate({
    				height : '0px'
    			}, 500, "linear", function() {
    				animFinished = true;
    			});

		}
		
		// Keep panel anchored to bottom of page
        if (!noAnim) 
            setTimeout(function repos() {
    			controlPanel.repositionPanel();
    			if (!animFinished)
    				setTimeout(repos, 50);
    		}, 50);
		
	},
	
	/**
	 * @return {Boolean} True if panel is expanded, false is is minimized.
	 */
	isExpanded : function() {
		return $j("#cpanMinMax").children().hasClass('.ui-icon-carat-1-s');
	},
    
    
    setDockState : function(dock, noAnim) {
        
        this.isDocked = dock;  
        
        // Set/unset draggable behaviour
        if (dock) {
            
            $j(this.rootPane).draggable("destroy");
            $j("#cpanDock").attr("title", "Un-dock control panel").children().removeClass('ui-icon-pin-s').addClass('ui-icon-pin-w');
            
            
        } else { // Undock
            
            // Make the control panel dragable
            $j(this.rootPane).draggable({cancel: 'button,a,td,table'});
            $j("#cpanDock").attr("title", "Dock control panel").children().removeClass('ui-icon-pin-w').addClass('ui-icon-pin-s');
            
        }
        
        // Discover transition: show or hide
        if (!noAnim) {
            
            if (dock) {
                
                // Transition from undocked and expanded state to docked and expanded state.
                // Animate it to move to its new docked position
                 var pos = this.calculateDockPosition();    
                 
    			$j(this.rootPane).animate({
    				top : pos.y + "px", left : pos.x + "px"
    			}, 100, "linear");
            
            } else { // Undock
            
                if (!this.isExpanded()) 
                    this.setExpansion(1,1);

                // position the panel a little above the bottom of the screen
                // to show that the control panel is now free
                var pos = this.calculateDockPosition();
                
    			$j(this.rootPane).animate({
    				top : (pos.y - 10) + "px", left : (pos.x + 10) + "px"
    			}, 50, "linear");
                    
                
            }
            
        }
        
        
        
    },
    
    
    
    
	
	/**
	 * Invoked when user clicks save button
	 */
	onSave : function() {
		
		if (isNewEntry())
			swwpAjax.saveNewPost(false); // Save draft
			
		else {
			// Show save dialog
			saveDialog.show();
		}
		
	},
	
	/**
	 * Invoked when user clicks new post button
	 */
	onNewPost : function() {
        if (!isNewEntry())
            window.location.href = swwpInfo.plugURL + "/php/new-post.php?newtype=post&nonce=" + swwpInfo.nonce;
	},
	
	/**
	 * Invoked when user clicks new page button
	 */
	onNewPage : function() {
        if (!isNewEntry())
		    window.location.href = swwpInfo.plugURL + "/php/new-post.php?newtype=page&nonce=" + swwpInfo.nonce;
	},
	
	/**
	 * Invoked when user clicks saveall/publish button
	 */
	onSaveAllPublish : function() {
		
        if (isNewEntry()) {
			swwpAjax.saveNewPost(true); // save and publish
        } else { // Save all edit sections
            var esNodes = de.Changes.getChangedEditableSections();
            if (esNodes.length > 0) swwpAjax.saveExisting(esNodes);
        }                
	},
	
	/**
	 * Invoked when user clicks delete button
	 */
	onDelete : function() {
        swwpAjax.deletePost();
	},
	
	/**
	 * Invoked when user clicks view button
	 */
	onViewToolbox : function() {
		toolBox.setVisible(!toolBox.isVisible());
	}
    

};

// Setup initialization
swwpModules.push(controlPanel);

	
