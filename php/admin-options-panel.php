<?php 

$adminOptions = $this->getAdminOptions();

//Check to see if a user can access the panel
if ( function_exists('current_user_can') && !current_user_can('manage_options') )
			die(_("You do not have permisson to manage these options", $this->localizationName));

//Update settings
if (isset($_POST['update_swwp_settings'])) { 

	 check_admin_referer('swwp-admin-options');
    	 
        	 // Update settings
    	$adminOptions['cursor_zindex'] = $_POST['cursor_zindex']; 
        
        $adminOptions['spell_engine'] = $_POST['spell_engine'];
        $adminOptions['use_mb_convert'] = $_POST['use_mb_convert'] ? "true" : "false"; 
        
        // Verify
        $badFieldMsg = "";
        
        if (!preg_match("/^\d+$/",$adminOptions['cursor_zindex']))
            $badFieldMsg = "Cursor Z-Index must be a positive integer";
             
        if ($badFieldMsg) {
        
          ?>
          <div class="error"><p><strong><?php echo $badFieldMsg ?></strong></p></div>
          <?php
        
        } else {
        
    	 // Save options in database
    	 $this->adminOptions = $adminOptions;
    	 $this->saveAdminOptions()
    
          ?>
          <div class="updated"><p><strong><?php _e('Settings successfully updated.', $this->localizationName) ?></strong></p></div>
          <?php
        }

}


?>

<div class="wrap">
<form method="post" action="<?php echo $_SERVER["REQUEST_URI"]; ?>">
<?php wp_nonce_field('swwp-admin-options') ?>

<div class="icon32" id="icon-options-general"><br/></div><h2>~Seaweed~ <?php _e('Admin Settings', $this->localizationName); ?></h2>

<p>
<strong><?php _e('This is an experimental prototype.', $this->localizationName); ?></strong>
<?php _e('Need help using ~Seaweed~?', $this->localizationName); ?>
<a href="http://seaweed-editor.com/experiment/help" target="_blank">
<?php _e('Visit the online documentation at seaweed-editor.com', $this->localizationName); ?>
</a>.
</p>

<table class="form-table">
<tbody>

<tr valign="top">
<th scope="row"><?php _e('Cursor', $this->localizationName); ?></th>
<td>
<fieldset><legend class="screen-reader-text"><span><?php _e('Cursor', $this->localizationName); ?></span></legend>
<label for="cursor_zindex">
<?php _e('Z-Index:', $this->localizationName); ?>&nbsp;&nbsp;<input class="small-text" type="text" value="<?php echo $adminOptions['cursor_zindex'];?>" name="cursor_zindex"/>
(<?php _e('CSS z-index value', $this->localizationName); ?>)
</label>
</fieldset>
</td>
</tr>

  <tr valign="top">
  	<th scope="row"><label for="spell_engine"><?php _e('Spell Checker Engine',$this->localizationName) ?></label></th>
    
    <td>
    
<select class="postform" name="spell_engine" id="spell_engine">
    <option value="default" class="level-0" <?php if ($adminOptions[spell_engine]=='default'){echo'selected="selected"';}?>>[<?php _e('Default', $this->localizationName); ?>]</option>
	<option value="GoogleSpell" class="level-0" <?php if ($adminOptions[spell_engine]=='GoogleSpell'){echo'selected="selected"';}?>><?php _e('Google Spell', $this->localizationName); ?></option>
	<option value="PSpell" class="level-0" <?php if ($adminOptions[spell_engine]=='PSpell'){echo'selected="selected"';}?>><?php _e('PSpell', $this->localizationName); ?></option>
	<option value="PSpellShell" class="level-0" <?php if ($adminOptions[spell_engine]=='PSpellShell'){echo'selected="selected"';}?>><?php _e('PSpell (Shell)', $this->localizationName); ?></option>
</select>
<p><strong><?php _e('Note: '); ?></strong><?php _e('If your spell checker does not work then try and tweak this setting to get it working.', $this->localizationName) ?></p>
    </td>
  </tr>

  
 <tr valign="top">
  	<th scope="row"><?php _e('Character Encoding',$this->localizationName) ?></th>
    
    <td>
    <label for="use_mb_convert"><input type="checkbox" id="use_mb_convert" name="use_mb_convert" value="1" <?php if ($adminOptions['use_mb_convert'] == "true") { echo('checked="checked"'); }?> /> <?php _e('Enable mb_convert_encoding', $this->localizationName) ?></label>
    <p><strong><?php _e('Note: '); ?></strong><?php _e('Some servers do not have this installed.  If you disable this option, be sure to test out various characters.  The mb_convert_encoding function is necessary to convert from UTF-8 to various charsets.', $this->localizationName) ?></p>
    
    </td>
  </tr>
  
</tbody></table>
<div class="submit">
  <input type="submit" name="update_swwp_settings" value="<?php _e('Update Settings', $this->localizationName) ?>" />
</div>
</form>
</div>
