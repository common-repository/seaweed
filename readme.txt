=== Seaweed ===
Contributors: brook novak
Tags: editor, wysiwyg, ajax
Requires at least: 2.5
Tested up to: 2.9
Stable tag: trunk

Enhances your Blog to allow users to edit post and comment content on the fly without the use of an external editor.

== Description ==

The Seaweed plugin enhances any Wordpress Blog to allow users to edit content without the use of an external editor. 
When logged into their blog, post titles, contents and comments become editable, without the aid of WYSIWYG editors (like tinyMCE). 
When an edit has been made, the user can choose to save their changes via AJAX - there is never any need for post "previews" because
their is no distinction between edit and view mode.
This process of editing has be coined as "Seamless editing".
The editing of content directly on the Blogs is possible using a JavaScript API called Seaweed (The Seamless Web Editor). 


== Installation ==

1. Upload the directory named `seaweed` into to the `/wp-content/plugins/` directory
2. Activate the plugin through the 'Plugins' menu in WordPress

Once installed, the next time your visit your blog while logged in, a registration form will appear.
Fill it out if you wish to help improve the plugin. (See http://seaweed-editor.com/experiment for more information).

== Frequently Asked Questions ==

= Can anyone edit my blog? =

NO! Only users who have permissions to edit your blog will be able to edit it.

More specifically; any user who has capabilities of an author (and up) can edit the blog. The plugin will not allow users to edit specific post/titles/comment etc unless they have permission to.

= Are shortcodes preserved? =

Yes, all shortcodes are preserved.

= Are all themes supported? =

= The cursor and selection is not working correctly! How do I fix it? =

This is probably because your theme using a line spacing of less than 100%. Seaweed
does not work very well with spacing less than 100%. So fix this go to
the Seaweed user settings (under the Users->Seaweed plugin options menu), then
set the "line spacing for editable sections" option to something like 100% 
(under the "Editable Sections" options). This will change the line spacing
so you can use Seaweed. NOTE: It will only change the line spacing for you 
(when your logged in), not your visitors.

The plugin is designed to work on all themes. Some themes work better than others.

= What versions of Wordpress are supported? =

The plugin has been tested with Wordpress 2.5 - 2.8, Wordpress MU 2.7.

= How secure is ~Seaweed~? =

All saving operations are secured using Wordpress's standard security features. 

== Screenshots ==

1. Editing a post using Seaweed. In this screenshot the user is changing the font size of the selected text.

2. Spell-checking on the fly using Seaweed.

== Changelog ==

= 0.3 =
* Stripped out research code, the plguin is now open beta and does not require people to sign up to use it.

= 0.2 =
* Fixed many little quirks
* Copy/pasting fixed for Safari on Mac
* Control panel now dockable
* Tags/Catagories now can be separated by new lines

== Upgrade Notice ==

= 0.3 =
The Seaweed Experiment has ended! Thank you for participating - we have got plenty of useful data. 

= 0.2 =
If somehow you got the first pilot-test release, upgrade now to
get a better experience :)

== Help / Manual ==
Visit the [Seaweed Experiement help page](http://seaweed-editor.com/experiment/help "Plugin Help").

== Feature Requests ==
These are some feature requests/changes that came from the experiment:
* Smaller control panel and toolbox
* Enable docking of control panel any side of the screen
* HTML Source editor
* Comment deletion and moderation
* Post metadata editing, such as permalinks, excerpts, categories and tags.
* Redesign new page/post feature
* Ability to edit existing drafts
* Overview table of all existing posts (where delete and publishing operations can be applied)
