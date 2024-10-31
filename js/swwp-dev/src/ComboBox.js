/*
 * file: ComboBox.js
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

function getComboBoxMarkup(id, value, width){

    return '<a id="' +
    id +
    '" class="sw-combo ui-state-default ui-corner-all" style="width:' +
    width +
    'px"><span class="sw-combo-value" style="overflow:hidden;width:' +
    (width - 16) +
    'px">' +
    value +
    '</span><span class="sw-combo-arrow ui-icon ui-icon-carat-1-s"></span></a>';
}

/* ----------------------------- COMBO BOX ------------------------------------ */
function ComboBox(buttonNode, title, maxHeight, items, onSelected) {
    
    // Record the combo-button node
    this.button = buttonNode;
    this.items = items;
    
    var comboBox = this;
    
    // Create the dropdown and assign the on click handler
    var dropDown = new DropDownPane(function(item) {
        
        if (item) { // Avoid selection of combo title
            // Set combo text / selected item
            comboBox.setText($j(comboBox.items[item].node).text());
            onSelected(item);
        }
    
    });

    this.dropDown = dropDown;

    $j(dropDown.container).addClass('sw-combo-dropdown');

    if (maxHeight) {
        $j(dropDown.container).css(de.browser == de.Platform.IE && de.browserVersion < 7 ? "height" : "max-height", maxHeight).css("overflow-y", "scroll");
        // Fix IE's scrollbar issue
        if (de.browser == de.Platform.IE) 
            $j(dropDown.container)
                .css("overflow-x", "hidden")
                .css("padding-right", "15px"); 
    }
    // Add special title item
    dropDown.addItem(null, '<div class="sw-combo-title">' + title + '</div>');
    
    // Add items
    for (var item in items) {
        var itemDiv = dropDown.addItem(item, 
            '<div class="sw-combo-item ui-state-default">' + items[item].markup + '</div>');
        itemDiv.style.borderStyle = "none";
        items[item].node = itemDiv;
    }
    
    // Add handlers
    var comboBox = this;
    
        
    de.events.addHandler(buttonNode, "click", function() {
        
        if (comboBox.dropDown.isShown())
            comboBox.dropDown.hide();
            
        else if (!$j(comboBox.button).hasClass('ui-state-disabled')) {
            // Delay showing popup since there could be a race condition with the auto-hiding logic
            // on this mouse event
            setTimeout(function(){
                comboBox.showDropDown();
            }, 1);
        }
            
    });

    de.events.addHandler(window, "resize", function(){
		comboBox.positionDropDown();
	});
    
    de.events.addHandler(window, "scroll", function(){
		comboBox.positionDropDown();
	});
}

ComboBox.prototype = {
    
    /**
     * Positions the combo box drop down pane to sit below the combo button
     */
    positionDropDown : function() {
        
        // Get the combo box position in the window
        var pos = de.getPositionInWindow(this.button),
            scrollPos = de.getDocumentScrollPos();
            
        this.dropDown.container.style.top = (pos.y + this.button.offsetHeight + scrollPos.top) + "px";
        this.dropDown.container.style.left = (pos.x + scrollPos.left) + "px";
    
    },
    
    /**
     * Displays the drop down
     */
    showDropDown : function() {
        this.positionDropDown();
        this.dropDown.show();
    },
    
    /**
     * Sets the combo box value
     * @param {String} str The value to set
     */
    setText : function(str) {
        // Set combo text / selected item
        $j(this.button).find('.sw-combo-value').html(str.replace(/\s/g, "&nbsp;"));
    }
    
}

    
