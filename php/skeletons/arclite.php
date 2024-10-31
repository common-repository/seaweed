<?php
/*
 * Skeleton page for the arclight theme
 */
?>

<!-- main wrappers -->
<div id="main-wrap1">
<div id="main-wrap2">

  <!-- main page block -->
  <div id="main" class="block-content">
   <div class="mask-main rightdiv">
    <div class="mask-left">

     <!-- first column -->
     <div class="col1">
      <div id="main-content">
        <!-- post -->
        <div <?php post_class() ?> >
        	 <h2 class="post-title"><?php sw_skeleton_title(); ?></h2>
        	<div class="post-content clearfix">
        		<?php sw_skeleton_content(); ?>
        	</div>
        </div>
        
        <!-- Seaweed's meta data form -->
        <?php sw_print_metaform() ?>
        
      </div>
     </div>
     
     <?php
       if(!is_page_template('page-nosidebar.php')):
        get_sidebar();
        include(TEMPLATEPATH . '/sidebar-secondary.php');
       endif;
     ?>

    </div>
   </div>
   <div class="clear-content"></div>
  </div>
  <!-- /main page block -->

 </div>
</div>
<!-- /main wrappers -->



