/*
 * file: Media.js
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
 * Wordpresses handler which is invoked from the media inline frames
 * @param {String} html HTML to insert into the 'editor'
 */
send_to_editor = function(shortCode) {
    
    if (!shortCode)
        return;
        
    var html = decodeMediaShortcode(shortCode);
    
    // Check if the html has any block level elements
    var container = document.createElement('div'),
        containsBlock = false;
        
    container.innerHTML = html;
    $j(container).each(function(){
        if (de.isBlock(this)) {
            containsBlock = true;
            return false;
        }
    });
    
    // Restore selection and get the in-order range
    de.selection.setSelection(mediaDialog.selBefore.startNode, mediaDialog.selBefore.startIndex, mediaDialog.selBefore.endNode, mediaDialog.selBefore.endIndex);
    var sel = de.selection.getRange(true);
    
    if (sel) {
        
        
        // Insert the HTML near the selection
       // if (containsBlock) {
       
            if (!containsBlock) 
                html = "<p>" + html + "</p>"; // Keep inline elements within paragraphs
            
            // Get the last top-most node of the selection in the edit section
            var cur = sel.endNode ? sel.endNode : sel.startNode;
            var es = de.doc.getEditSectionContainer(cur);
            while (cur && cur.parentNode != es) {
                cur = cur.parentNode;
            }
            
            if (cur)
                de.UndoMan.execute("InsertHTML", html, es, cur, cur.nodeType == 3 ? cur.nodeValue.length : 1);
            
                
       // } else de.UndoMan.execute("InsertHTML", html, sel.startNode.parentNode, sel.startNode, sel.startIndex);
        
        // Re-add handlers for seaweed gallery placeholders
        $j('.swwp-gallery').unbind('click').click(mediaMenu.onGalleryClick);
    }
    
    // Get rid of the media dialog (now will be blank)
    mediaDialog.close();
    
} 

var mediaDialog = {
    
    /**
     * Displays the media manager dialog. Won't display unless the current selection is with an editable post
     * 
     * @param {String} type "image", "audio", "video" or "gallery"
     */
    show : function(type) {
        
        this.close();
        
        this.selBefore = de.selection.getRange(false);
        if (!this.selBefore)
            return false;
            
        var cDesc = de.cursor.getCurrentCursorDesc();
        if (!cDesc)
            return false;
            
        var selectedES = de.doc.getEditSectionContainer(cDesc.domNode);
        if (!selectedES)
            return false;
            
        var postID = isNewEntry() ? swwpInfo.tempID : extractPostID(selectedES);
        if (postID === null)
            return false;
        this.postID = postID;
        
        de.selection.clear();
        
        var contentPane = document.createElement('div');
        this.contentPane = contentPane;
        contentPane.innerHTML = '<iframe src="' + swwpInfo.siteURL + '/wp-admin/media-upload.php?post_id=' 
            + postID 
            + (type == "gallery" ? '&tab=' : '&type=') + type
            + '" frameborder="0" hspace="0" />';

        document.body.appendChild(contentPane);
        
        var iFrame = contentPane.firstChild;
        
        $j(contentPane)
            .dialog({
    			title: "~Seaweed~ " + (type == "gallery" ? "Edit" : "Upload") + "/Add " + type,
                width: 670,
                height: 400,
    			resizable : false,
                draggable: true,
                modal:true,
    			autoOpen: true,
                minHeight:0
            });
            
        $j(contentPane).css('padding', '0 0 0 0');
            
        // Measure the width for the inner frame
        var mesEle = document.createElement('div');
        $j(mesEle).css('width','1px').css('height','1px').css('float','right');
        contentPane.appendChild(mesEle);
        var width = (mesEle.offsetLeft + 1) - iFrame.offsetLeft;
        contentPane.removeChild(mesEle);
        
        $j(iFrame)
            .css('width', width + "px")
            .css('height', (contentPane.offsetHeight - 8) + "px");

		var dialog = contentPane.parentNode;
		$j(dialog).addClass('sw-protect'); /* protect from selection */
        
       
    },
    
    close : function() {
        if (this.contentPane) {
            $j(this.contentPane).dialog('destroy');
            $j(this.contentPane).remove();
            this.contentPane = null;
            
        }
    }
    
};

// Had to resort to decoding client side since shortcode is also sometimes constructed client side (javascript)
function decodeMediaShortcode(code) {
    
    // Decode captions
    var match, 
        captionRE = /\[(?:wp_)?caption([^\]]+)\]([\s\S]+?)\[\/(?:wp_)?caption\][\s\u00a0]*/g,
        galleryRE = /\[gallery([^\]]*)\]/g;
    
    while (match = captionRE.exec(code)) {
        
        var capArgs = match[1].replace(/\\'|\\&#39;|\\&#039;/g, '&#39;').replace(/\\"|\\&quot;/g, '&quot;'),
       	    longCode = match[2].replace(/\\&#39;|\\&#039;/g, '&#39;').replace(/\\&quot;/g, '&quot;');
            
       	var id = capArgs.match(/id=['"]([^'"]+)/i),
            cls = capArgs.match(/align=['"]([^'"]+)/i),
            w = capArgs.match(/width=['"]([0-9]+)/),
            cap = capArgs.match(/caption=['"]([^'"]+)/i);

        id = ( id && id[1] ) ? id[1] : '';
        cls = ( cls && cls[1] ) ? cls[1] : 'alignnone';
        w = ( w && w[1] ) ? w[1] : '';
        cap = ( cap && cap[1] ) ? cap[1] : '';
        
        // If the caption hs a width and text then encapsulate the image with the caption markup
        if (w && cap) 
            longCode = '<div ' + (id !== '' ? 'id="' + id + '" ' : "") 
                + 'class="wp-caption ' + cls 
                + '" style="width:' + (10 + parseInt(w)) + 'px">' 
                + longCode 
                + '<p class="wp-caption-text">' + cap
                + '</p></div>';
            
        code = code.substr(0, match.index) + longCode + code.substr(captionRE.lastIndex);
    }
    
    while (match = galleryRE.exec(code)) {
        code = code.substr(0, match.index) 
        
            + '<img class="swwp-gallery sw-packaged" title=\'gallery ' +  match[1] 
            + '\' src="' + swwpInfo.plugURL + '/css/images/trans.gif"/>'
            + code.substr(galleryRE.lastIndex);
    }

   return code;

}
