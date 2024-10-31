/*
 * file: DropDownPane.js
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

// Used by context menus and combo boxes
function DropDownPane(onItemClick) {
    
    if (typeof autoHide == "undefined")
        autoHide = true;
    
    var pane = document.createElement("div");
    
    this.container = pane;
    this.onItemClick = onItemClick;
    
    pane.className = 'sw-protect sw-dropdown ui-corner-all ui-widget-content';
    pane.style.display = 'none';
    
    document.body.appendChild(pane);

    // Autohide dropdowns on mouse click        
    var dropDown = this;
    
    var target = de.Platform.engine == de.Platform.GECKO ? window : document;
       
    de.events.addHandler(target, "mousedown", function(e){
        var etarget = de.events.getEventTarget(e);
        if (etarget != dropDown.container) dropDown.hide();
    });
    
}

/* ----------------------------- DROP DOWN PANE ------------------------------------ */
DropDownPane.prototype = {
    
    /**
     * Adds a new drop down item
     * 
     * @param {Object} callbackArg The argument to be passed in the onItemClicked function for this item.
     *                             The second argument will be the event object
     *                         
     * @param {String} markup      The HTML markup for the item. Must contain one root element.
     * 
     * @param {Node} beforeItemNode (Optional) The item node to add before. Omit to append as last item.
     * 
     * @return {Node}              The created button node
     */
    addItem : function(callbackArg, markup, beforeItemNode) {
        
        // Create DOM
        var item = document.createElement("div");
        item.innerHTML = markup;
        
        // Get root element
        var firstNode = item.firstChild;
        
        // Move item into drop down
        var node = item.firstChild;
        item.removeChild(node);
        
        if (beforeItemNode)
            this.container.insertBefore(node, beforeItemNode);
        else
            this.container.appendChild(node);
    
        // Add on click event
        var dropDown = this;
        
        // Hack: when the drop down is hidden via click, then the mouseup event
        // won't be raised. Thus leaving the seaweed mouse module's button state
        // down. Work-around: register mousedown via jquery and stop event propogation
        // to avoid sniffing the mouse down event at all
        $j(firstNode).mousedown(function(e) {
            if (dropDown.onItemClick)
                dropDown.onItemClick(callbackArg, e);
                
            dropDown.hide();
            return de.events.consume(e); // Stop 
        });
           
        return firstNode;
    },
    
    /**
     * Reveals the drop down
     */
    show : function() {
        // Clear hover/press states - since auto-hide may have interupted the clearing logic
        $j(this.container).find('.ui-state-hover, .ui-state-active').removeClass('ui-state-hover').removeClass('ui-state-active');
        
        $j(this.container).css('display', '');
    },
    
    /**
     * Hides the drop down
     */
    hide : function() {
        $j(this.container).css('display', 'none');
    },
    
    isShown : function() {
        return $j(this.container).css('display') != 'none';
    }
}
