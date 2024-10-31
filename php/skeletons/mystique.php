<!-- main content: primary + sidebar(s) -->
  <div id="main">
   <div id="main-inside" class="clearfix">
    <!-- primary content -->
    <div id="primary-content">
        <div <?php post_class('clearfix'); ?>>
          <?php
           if(function_exists('the_post_thumbnail'))
            if (has_post_thumbnail()) $post_thumb = true; else $post_thumb = false;
           ?>
          <?php if (!get_post_meta($post->ID, 'hide_title', true) && !is_page_template('featured-content.php')): ?>
          
          <h1 class="title"><?php sw_skeleton_title(); ?></h1>
          
          <?php endif; ?>
          
          <div class="post-content clearfix">
           
           <?php if($post_thumb): ?>
           <div class="post-thumb alignleft"><?php the_post_thumbnail(); ?></div>
           <?php endif; ?>

           <?php sw_skeleton_content(); ?>

			<?php sw_print_metaform() ?>
			
			
          </div>
        </div>

    </div>
    <!-- /primary content -->

    <?php get_sidebar(); ?>

   </div>
  </div>
  <!-- /main content -->

