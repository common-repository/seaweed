<?php
/*
 * Skeleton page for the classic wordpress theme
 */
?>
<h2><?php echo date('F jS, Y'); ?></h2>
<div <?php post_class() ?> >
	 <h3 class="storytitle"><?php sw_skeleton_title(); ?></h3>
	<div class="storycontent">
		<?php sw_skeleton_content(); ?>
	</div>
</div>
<?php sw_print_metaform() ?>