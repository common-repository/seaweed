<?php 
$userOptions = $this->getUserOptions();

//Update settings
if (isset($_POST['update_swwp_settings'])) { 

	check_admin_referer('swwp-admin-options');
	
	if($userOptions['enabled'] != $_POST['enable_sw_plug']) {
 	
 		$userOptions['enabled'] = $_POST['enable_sw_plug'];
 		
    	 // Save options in database
    	 $this->userOptions = $userOptions;
    	 $this->saveUserOptions()
    
          ?>
          <div class="updated"><p><strong><?php 
          if ($userOptions['enabled'] == 'true') {
          	_e('Seaweed plugin enabled.', $this->localizationName);
          } else {
          	_e('Seaweed plugin disabled.', $this->localizationName);
          }
          ?></strong></p></div>
          <?php
	     
	     // Log enable state
	     $this->logStats("plugin-enable", $this->packDetails(array('enabled' => $userOptions['enabled'])));
	          
 	} else {
    	 
         // Update settings
    	 $userOptions['gui_theme'] = $_POST['gui_theme'];
    	 $userOptions['cpanel_start_expanded'] = $_POST['cpanel_start_expanded'];
    	 $userOptions['toolbox_show_onload'] = $_POST['toolbox_show_onload'];
    	$userOptions['toolbox_start_position'] = $_POST['toolbox_start_position'];
    	$userOptions['es_notifier_on'] = $_POST['es_notifier_on'] ? "true" : "false";
        $userOptions['cpanel_opacity'] = $_POST['cpanel_opacity']; 
        $userOptions['toolbox_opacity'] = $_POST['toolbox_opacity']; 
        $userOptions['undo_history'] = $_POST['undo_history']; 
        $userOptions['es_line_spacing'] = $_POST['es_line_spacing']; 
        
        // Validation checks
        $badFieldMsg = "";
            
        if (!preg_match("/^\d+$/",$userOptions['undo_history']))
            $badFieldMsg = "Undo history must be a positive integer";
            
        else if (!preg_match("/^\d+$/",$userOptions['cpanel_opacity']) || (0+$userOptions['cpanel_opacity']) > 100)
            $badFieldMsg = "Control panel opacity must be 0-100";
            
        else if (!preg_match("/^\d+$/",$userOptions['toolbox_opacity']) || (0+$userOptions['toolbox_opacity']) > 100)
            $badFieldMsg = "Toolbox opacity must be 0-100";
            
        else if ($userOptions['es_line_spacing'] != "OFF" && (!preg_match("/^\d+$/",$userOptions['es_line_spacing']) || (0+$userOptions['es_line_spacing']) < 100 || (0+$userOptions['es_line_spacing']) > 1000))
            $badFieldMsg = "Line spacing must be between 100-1000";
         
         
        if ($badFieldMsg) {
        
	          ?>
	          <div class="error"><p><strong><?php echo $badFieldMsg ?></strong></p></div>
	          <?php
	        
        } else {
	    	 // Save options in database
	    	 $this->userOptions = $userOptions;
	    	 $this->saveUserOptions()
	    
	          ?>
	          <div class="updated"><p><strong><?php _e('Settings successfully updated.', $this->localizationName) ?></strong></p></div>
	          <?php
        }

    }


}
?>

<div class="wrap">
<form method="post" action="<?php echo $_SERVER["REQUEST_URI"]; ?>">
<?php wp_nonce_field('swwp-admin-options') ?>

<div class="icon32" id="icon-options-general"><br/></div><h2>~Seaweed~ <?php _e('User Settings', $this->localizationName); ?></h2>

<p>
<strong><?php _e('Public-beta release.', $this->localizationName); ?></strong>
<?php _e('Need help using ~Seaweed~?', $this->localizationName); ?>
<a href="http://seaweed-editor.com/experiment/help" target="_blank">
<?php _e('Visit the online documentation at seaweed-editor.com', $this->localizationName); ?>
</a>.
</p>

<input type="hidden" id="enable_sw_plug" name="enable_sw_plug" value="<?php echo $userOptions['enabled'] ?>" />
<script type="text/JavaScript">
// <![CDATA[
function swwpSetEnabled(enabled) {
    document.getElementById('enable_sw_plug').value = enabled ? "true" : "false";
    return true;
}
// ]]>
</script>

<?php if ($userOptions['enabled'] == "true") { ?>



<table class="form-table">
<tbody>

<tr valign="top">
<th scope="row"><label for="gui_theme"><?php _e('GUI Theme', $this->localizationName); ?></label></th>
<td>
<select class="postform" name="gui_theme" id="gui_theme">
    <option value="smoothness" class="level-0" <?php if ($userOptions['gui_theme']=='smoothness'){echo'selected="selected"';}?>><?php _e('Smoothness', $this->localizationName); ?></option>
	<option value="deep-lagoon" class="level-0" <?php if ($userOptions['gui_theme']=='deep-lagoon'){echo'selected="selected"';}?>><?php _e('Deep Lagoon', $this->localizationName); ?></option>
	<option value="lightness" class="level-0" <?php if ($userOptions['gui_theme']=='lightness'){echo'selected="selected"';}?>><?php _e('Lightness', $this->localizationName); ?></option>
	<option value="darkness" class="level-0" <?php if ($userOptions['gui_theme']=='darkness'){echo'selected="selected"';}?>><?php _e('Darkness', $this->localizationName); ?></option>
</select>
</td>
</tr>

<tr valign="top">
<th scope="row"><?php _e('Control panel', $this->localizationName); ?></th>
<td>
<fieldset>
<label for="cpanel_start_expanded_yes">
<input type="radio" value="true" <?php if($userOptions['cpanel_start_expanded'] == "true" ) {echo 'checked="checked"';} ?> id="cpanel_start_expanded_yes" name="cpanel_start_expanded"/>
<?php _e('Expand the control panel once the page is loaded.', $this->localizationName); ?></label>
<label for="cpanel_start_expanded_no">
<br/>
<input type="radio" value="false" <?php if($userOptions['cpanel_start_expanded'] != "true" ) {echo 'checked="checked"';} ?> id="cpanel_start_expanded_no" name="cpanel_start_expanded"/>
<?php _e('Expand the control panel on first edit.', $this->localizationName); ?></label>
<br/>
<label for="cpanel_opacity">
<?php _e('Opacity', $this->localizationName); ?></label>:
<input type="text" class="small-text" maxlength="3" value="<?php echo $userOptions['cpanel_opacity'];?>" id="cpanel_opacity" name="cpanel_opacity"/>%
<p><strong><?php _e('Note: '); ?></strong><?php _e('Some browsers do not support transparency.', $this->localizationName) ?></p>

</fieldset>
</td>
</tr>


<tr valign="top">
<th scope="row"><?php _e('Toolbox', $this->localizationName); ?></th>
<td>
<fieldset><legend class="screen-reader-text"><span><?php _e('Toolbox', $this->localizationName); ?></span></legend>

<label for="toolbox_show_onload_yes">
<input type="radio" value="true" <?php if($userOptions['toolbox_show_onload'] == "true" ) {echo 'checked="checked"';} ?> name="toolbox_show_onload" id="toolbox_show_onload_yes"/>
<?php _e('Display the toolbox once the page is loaded.', $this->localizationName); ?></label>
<label for="toolbox_show_onload_no">
<br/>
<input type="radio" value="false" <?php if($userOptions['toolbox_show_onload'] != "true" ) {echo 'checked="checked"';} ?> name="toolbox_show_onload" id="toolbox_show_onload_no"/>
<?php _e('Display the toolbox on first edit.', $this->localizationName); ?></label>
</fieldset>
<br/>
<label for="toolbox_start_position">
<?php _e('Start position', $this->localizationName); ?></label>: <select class="postform" name="toolbox_start_position" value="<?php echo $userOptions['toolbox_start_position']; ?>">
    <option value="center-top" class="level-0" <?php if ($userOptions[toolbox_start_position]=='center-top'){echo'selected="selected"';}?>><?php _e('Center-Top', $this->localizationName); ?></option>
	<option value="left-top" class="level-0" <?php if ($userOptions[toolbox_start_position]=='left-top'){echo'selected="selected"';}?>><?php _e('Left-Top', $this->localizationName); ?></option>
	<option value="right-top" class="level-0" <?php if ($userOptions[toolbox_start_position]=='right-top'){echo'selected="selected"';}?>><?php _e('Right-Top', $this->localizationName); ?></option>
	<option value="left-bottom" class="level-0" <?php if ($userOptions[toolbox_start_position]=='left-bottom'){echo'selected="selected"';}?>><?php _e('Left-Bottom', $this->localizationName); ?></option>
	<option value="right-bottom" class="level-0" <?php if ($userOptions[toolbox_start_position]=='right-bottom'){echo'selected="selected"';}?>><?php _e('Right-Bottom', $this->localizationName); ?></option>
	<option value="center-center" class="level-0" <?php if ($userOptions[toolbox_start_position]=='center-center'){echo'selected="selected"';}?>><?php _e('Center-Center', $this->localizationName); ?></option>
</select> 
<br/>
<label for="toolbox_opacity">
<?php _e('Opacity', $this->localizationName); ?></label>:
<input type="text" class="small-text"  maxlength="3" value="<?php echo $userOptions['toolbox_opacity'];?>" id="toolbox_opacity" name="toolbox_opacity"/>%
<p><strong><?php _e('Note: '); ?></strong><?php _e('Some browsers do not support transparency.', $this->localizationName) ?></p>

</td>
</tr>


<tr valign="top">
<th scope="row"><?php _e('Editable Sections', $this->localizationName); ?></th>
<td>
<fieldset><legend class="screen-reader-text"><span><?php _e('Editable Sections', $this->localizationName); ?></span></legend>
<label for="es_notifier_on">
<input type="checkbox" value="1" <?php if($userOptions['es_notifier_on'] == "true" ) {echo 'checked="checked"';} ?> id="es_notifier_on" name="es_notifier_on"/>
<?php _e('Notify whether elements are editable or not on mouse hover.', $this->localizationName); ?></label>
</fieldset>
<br/>

<fieldset>
<label for="es_line_spacing"><?php _e('Line spacing for editable sections', $this->localizationName); ?>
<select class="postform" name="es_line_spacing" id="es_line_spacing">
    <option value="OFF" class="level-0" <?php if ($userOptions['es_line_spacing']=='OFF'){echo'selected="selected"';}?>><?php _e('Off', $this->localizationName); ?></option>
	<option value="100" class="level-0" <?php if ($userOptions['es_line_spacing']=='100'){echo'selected="selected"';}?>>100%</option>
	<option value="120" class="level-0" <?php if ($userOptions['es_line_spacing']=='120'){echo'selected="selected"';}?>>120%</option>
	<option value="140" class="level-0" <?php if ($userOptions['es_line_spacing']=='140'){echo'selected="selected"';}?>>140%</option>
	<option value="160" class="level-0" <?php if ($userOptions['es_line_spacing']=='160'){echo'selected="selected"';}?>>160%</option>
	<option value="180" class="level-0" <?php if ($userOptions['es_line_spacing']=='180'){echo'selected="selected"';}?>>180%</option>
	<option value="200" class="level-0" <?php if ($userOptions['es_line_spacing']=='200'){echo'selected="selected"';}?>>200%</option>
	<option value="220" class="level-0" <?php if ($userOptions['es_line_spacing']=='220'){echo'selected="selected"';}?>>220%</option>
	<option value="240" class="level-0" <?php if ($userOptions['es_line_spacing']=='240'){echo'selected="selected"';}?>>240%</option>
</select>
</label>
<br/>
<em><?php _e('If you are having issues with the cursor or selection it might be because of your theme having a line spacing smaller than 100% - try setting the line spacing above') ?></em>
</fieldset>

</td>
</tr>

  <tr valign="top">
  	<th scope="row"><?php _e('Undo History',$this->localizationName) ?></th>
    
    <td>
    <label for="undo_history"><?php _e('Store up to', $this->localizationName) ?> <input class="small-text" type="text" value="<?php echo $userOptions['undo_history'];?>" name="undo_history"/ id="undo_history"> <?php _e('undos', $this->localizationName) ?></label>
    </td>
  </tr>
  
  
</tbody></table>

<div class="submit">
  <input type="submit" value="Disable ~Seaweed~" onclick="return swwpSetEnabled(false);" name="update_swwp_settings" />
  &nbsp;&nbsp;&nbsp;&nbsp;
  <input type="submit" name="update_swwp_settings" value="<?php _e('Update Settings', $this->localizationName) ?>" />
</div>



<?php } else { ?>

<br/><br/>
<p>
	~Seaweed~ has been disabled.
</p>

<div class="submit">
  <input type="submit" value="Enable ~Seaweed~" onclick="return swwpSetEnabled(true);" name="update_swwp_settings" />
</div>

<?php } ?>

</form>
</div>
