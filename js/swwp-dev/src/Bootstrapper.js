/*
 * file: Bootstrapper.js
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
/*
 * This is a development hack - hard coded paths for the wordpress javascripts
 * 
 * Pulls in all scripts needed for word press
 */

(function() {
    
    var pathPrefex = "";
    
    // Hard coded sources
    var sources = [
        'Core',
        'ComboBox',
        'ControlPanel',
        'ContextMenus',
        'Dialogs',
        'DropDownPane',
        'Toolbox',
        'WPActions',
        'ColorSelectBox',
        'Media',
        'Spellchecker'
    ];
    
    // Determine the base URL of the library.
    var baseURL;
    var libcoreRegExp = new RegExp("(^|[\\/\\\\])SWWP.js(\\?|$)");
    var scriptElements = document.getElementsByTagName("script");
    
    for (var i in scriptElements) {
        var src = scriptElements[i].src;
        if (src && src.match(libcoreRegExp)) {
    
            baseURL = src;
            i = src.lastIndexOf("/");
            if (i == -1) i = src.lastIndexOf("\\");
            baseURL = (i == -1) ? "" : src.substring(0, i + 1);
    
            break;
        }
        
    }
    
    if (!baseURL) 
        throw new Error("Unable to import seaweed wordpress library");

    pathPrefex = baseURL;
    
    for (var src in sources) {
        loadScript(pathPrefex + sources[src] + ".js");
    }

    function loadScript(scriptSrc){
    
        // gets document head element  
        var docHead = document.getElementsByTagName('head')[0];
        
        if (docHead) {
            // creates a new script tag        
            var scriptEl = document.createElement('script');
            
            // adds src and type attribute to script tag  
            scriptEl.setAttribute('src', scriptSrc);
            scriptEl.setAttribute('type', 'text/javascript');
    
            // append the script tag to document head element          
            docHead.appendChild(scriptEl);
        }
    }
    
    
    var initWaiting = false, loadedSourceCount = 0;
    
    // Declare the init function - this will be overrided once the seaeed init script is loaded
    swwp = {
        init: function(){
            if (loadedSourceCount == sources.length) {
                swwp.init();
            } else 
                initWaiting = true;
        }
    };
    
    // Declare module array - will eventually be overridden via init module
    swwpModules = [];
    var modules = swwpModules; // Keep a local reference

    swwpBootstrap = {
        scriptLoaded : function() {
            loadedSourceCount++;
        	if (sources.length == loadedSourceCount) {
                
                setTimeout(function() { // Let last script load
                
                    if (initWaiting) {
                        swwpModules = swwpModules.concat(modules); // Store any early birds
                        swwp.init(); // Prevent race condition
                    }
            
                }, 1);
            
            }
        }  
    };

})();
