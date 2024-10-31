/*
 * file: ColorSelectBox.js
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

function getColorSelectBoxMarkup(id, wwIconClass) {
    return '<div id="' + id + '" class="sw-color-select">'
            
            // Button for applying color
            + '<a class="sw-colorsel-apply ww-button ui-state-default ui-corner-left">'
            
            // Color icon
            + '<span class="ww-icon ' + wwIconClass +'"></span>'
            
             // Color preview
             + '<span class="sw-color-preview"></span>'
             
            + '</a>'
            
            // Button for selecting color
            + '<a class="sw-colorsel-arrow ww-button ui-state-default ui-corner-right">'
            + '<span class="ui-icon ui-icon-carat-1-s"></span>'
            + '</a>'
            
            + '</div>';
            
}

var colorItems = function(colors){
    
    var items = [];
    for (var i in colors) {
        var col = colors[i];
        items.push({
            value : "#" + col
        });
    }
    return items;
    
}([
    "000000",
    "993300",
    "333300",
    "003300",
    "003366",
    "000080",
    "333399",
    "333333",
    
    "800000",
    "FF6600",
    "808000",
    "008000",
    "008080",
    "0000FF",
    "666699",
    "808080",

    "FF9900",
    "99CC00",
    "99CC00",
    "339966",
    "33CCCC",
    "3366FF",
    "800080",
    "999999",
  
    "FF00FF",
    "FFCC00",
    "FFFF00",
    "00FF00",
    "00FFFF",
    "00CCFF",
    "993366",
    "C0C0C0",
    
    "FF99CC",
    "FFCC99",
    "FFFF99",
    "CCFFCC",
    "CCFFFF",
    "99CCFF",
    "CC99FF",
    "FFFFFF",
]);

function ColorSelect(selectNode, title, onSelected) {
    
    this.selectNode = selectNode;
    
    var selectBox = this;
    this.isDefaultSelected = true;
    
    // Create the dropdown and assign the on click handler
    var dropDown = new DropDownPane(function(arg, e) {
        if (arg == "default") {
            // Special case: default
            selectBox.isDefaultSelected = true;
            $j(selectBox.selectNode).find('.sw-color-preview').css('background-color', '');
            onSelected(selectBox.getSelectedColor());
        }
    });

    this.dropDown = dropDown;

    $j(dropDown.container).addClass('sw-colorsel-dropdown');

    // Add special title item
    dropDown.addItem(null, '<div class="sw-colorsel-title">' + title + '</div>');
    
    var tableMarkup = '<table class="sw-colorsel-table">';
    
    // Add items
    for (var i = 0; i < colorItems.length; i++) {
        
        if (i % 8 == 0) {
            
            if (i > 0)
                 tableMarkup += "</tr>";
            
            tableMarkup += "<tr>";
        }
        
        tableMarkup += '<td><a class="ww-button ui-state-default"><span class="sw-color-option" style="background-color:' 
            + colorItems[i].value 
            + '"></span></a></td>'
    }
    
    tableMarkup + "</tr></table>";
    
    var table = dropDown.addItem('table', tableMarkup);
    
    
    dropDown.addItem("default", '<div style="text-align:center;margin-top:6px"><a class="sw-button ui-corner-all ui-state-default" style="float:none">Default</a></div>');
    
    
    var applyButton, arrowButton;
    $j(selectNode).find('.ww-button').each(function() {
            if ($j(this).hasClass('sw-colorsel-arrow'))
                arrowButton = this;
            else applyButton = this;
    });
    
    // Add handler for applying the selected color
    de.events.addHandler(applyButton, "click", function() {
  
        if (!$j(applyButton).hasClass('ui-state-disabled')) 
            onSelected(selectBox.getSelectedColor());
        
    });
    
    // Add handler for color selection
    $j(table).find('.ww-button').mousedown(function(e) {
        selectBox.isDefaultSelected = false;
        $j(selectBox.selectNode).find('.sw-color-preview').css('background-color', $j(this).find('span').css('background-color'));
        onSelected(selectBox.getSelectedColor());
    });
    
    // Add handler for the drop down button
    de.events.addHandler(arrowButton, "click", function() {
  
        if (selectBox.dropDown.isShown())
            selectBox.dropDown.hide();
            
        else if (!$j(arrowButton).hasClass('ui-state-disabled'))
            selectBox.showDropDown();
        
    });
    

    de.events.addHandler(window, "resize", function(){
		selectBox.positionDropDown();
	});
    
    de.events.addHandler(window, "scroll", function(){
		selectBox.positionDropDown();
	});
}

ColorSelect.prototype = {
    
    getSelectedColor : function() {
        
        return this.isDefaultSelected ? "default" : $j(this.selectNode).find('.sw-color-preview').css('background-color');
    },
    
    /**
     * Positions the drop down pane to sit below the sel button
     */
    positionDropDown : function() {
        
        // Get the combo box position in the window
        var pos = de.getPositionInWindow(this.selectNode),
            scrollPos = de.getDocumentScrollPos(),
            viewPortSize = de.getViewPortSize(),
            left = pos.x + scrollPos.left;
            
        // IE 6 For some reason extends the container to a large width.
        // So hacking a patch o set it to its appropriate size
        if (de.browser == de.Platform.IE && de.browserVersion < 7)
            $j(this.dropDown.container).css('width',
                $j(this.dropDown.container).find('table').attr('offsetWidth'));

        // Ensure that select box does not render outside of window            
        if ((left + this.dropDown.container.offsetWidth) > viewPortSize.width)
            left = viewPortSize.width - this.dropDown.container.offsetWidth;
            
        this.dropDown.container.style.top = (pos.y + this.selectNode.offsetHeight + scrollPos.top) + "px";
        this.dropDown.container.style.left = left + "px";
    
    },
    
    /**
     * Displays the drop down
     */
    showDropDown : function() {
        this.dropDown.show(); // Note: show before reposition otherwise container cannot be measured
        this.positionDropDown();
    },
    
    setEnabled : function(enable) {
        if (enable)
            $j(this.selectNode).find('.ww-button').removeClass('ui-state-disabled');
        else $j(this.selectNode).find('.ww-button').addClass('ui-state-disabled');
    }
    
}
