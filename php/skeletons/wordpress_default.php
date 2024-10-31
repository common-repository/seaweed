<?php
/*
 * Skeleton page for the default wordpress theme
 */
?>
<div id="content" class="widecolumn" role="main">
<div <?php post_class() ?> >
	<h2><?php sw_skeleton_title(); ?></h2>
	<small><?php echo date('F jS, Y'); ?></small>
	<div class="entry">
		<?php sw_skeleton_content(); ?>
	</div>
</div>
<?php sw_print_metaform() ?>
</div>