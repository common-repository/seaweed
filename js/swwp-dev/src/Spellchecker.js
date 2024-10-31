/*
 * file: Spellchecker.js
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

var SpellChecker = function() {

    function ajaxSpellAction(action, args, onSuccess, onError) {
        
    	$j.ajax({
    		type: "POST",
    	    url: swwpInfo.plugURL + "/php/ajax-action.php",
    		data : $j.extend({
                _ajax_nonce: swwpInfo.nonce,
    	        action: action
    		}, args),
    		success : onSuccess, 
    		error : onError
    	});
        
    }

    return {
        
        ignoreWords : {},
        
        /**
         * Retrieves spelling suggestions for the given word.
         * 
         * @param {String} word        The word to get suggestions for
         * 
         * @param {Function} callback  A callback function invoked in ajax responce
         *                             thread... if something went word then no arguments
         *                             are given, otherwise an array of words will be given
         *                             as the first argument (an empty array implies no suggestions).
         */
        getSuggestions : function(word, callback) {
            
            ajaxSpellAction("spellsuggest", 
                {word:word},
            
                // on ajax success
                function(data) {
                    
                    var res = wpAjax.parseAjaxResponse(data, data.response, data.element);
                        
                    if (res) {
                        for (var i in res.responses) {
                            var resp = res.responses[i];
                            if (resp.what == "error") { // an actual server-side error occurred?
                                callback();
                                return;
                            } else if (resp.what == "suggestions") {
                                callback(resp.data.split(' '));
                                return;
                            } else if (resp.what == "nosuggestions") {
                                callback([]);
                                return;
                            }
                        }
                    }
                    
                    callback(); // Error - unexpected responce
                    
                },
                
                // On Ajax error
                function() {
                    callback();
                }
            
            );
            
        },
       
        /**
         * Scans the words in the given set of editable sections and marks any found spelling errors.
         * Communicates with the server to get the spelling errors, a progress message is shown while 
         * communicating with the server.
         * 
         * @param {[Element]} editableSections (Optional) The editable sections to spell check.
         */
        markErrors : function(editableSections) {
            
            var allWords = de.spell.getWords(editableSections),
                words = [];
            
            // Filter out words marked as "ignore always" by user for this session
            for (var i in allWords) {
                if (!this.ignoreWords[allWords[i]]) 
                    words.push(allWords[i]);
            }
            
            if (words.length > 0) {

                // Display the (model) progress message
                progressMessage.show("Spell Checking...");
                
                ajaxSpellAction(
                    "spellcheck", 
                    {  words: words.join(' ') }, 
                 
                     // on ajax success
                    function(data) {
                        
                        var res = wpAjax.parseAjaxResponse(data, data.response, data.element), 
                            errorMsg;
                        
                        if (res) {
                            // Get errorsome words
                            for (var i in res.responses) {
                                var resp = res.responses[i];
                                if (resp.what == "error") { // an actual server-side error occurred?
                                    errorMsg = resp.data;
                                    break;
                                } else if (resp.what == "mistakes") {
                                
                                    // Mark bad words in editable sections
                                    de.spell.markWords(resp.data, editableSections);
                                }
                            }
                            
                        } else errorMsg = "Internal server error: " + data;
                        
                        if (errorMsg) 
                            progressMessage.error(errorMsg);
                        else 
                            progressMessage.hide();
                        
                    },
                    
                    // on ajax failure
                    function(resp) {
                        progressMessage.error("Failed to communicate with server");
                    }
                );
            }
            
        }
        
    };

}();

