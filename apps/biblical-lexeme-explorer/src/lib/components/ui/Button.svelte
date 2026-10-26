<script>
	let {
		buttonText = 'Reusable Button',
		buttonSubtext = '',
		buttonStyle = ' btn ',
		buttonOutline = ' focus:outline-none focus:ring-4 ',
		buttonColors = ' btn-primary ',
		buttonFocusHover = ' focus:ring-blue-300 hover:bg-blue-700',
		style = '',
		shapeStyle = 'rounded-xl shadow-xl',
		textSize = '', //'base'?
		toggled = () => {},
		tooltip = '',
		ready = true,

		children = null
	} = $props();

	function resetStyle() {
		buttonColors = ' text-current focus:ring-blue-300 hover:bg-base-300 ';
	}

	$effect(() => {
		if (false && !buttonColors) {
			resetStyle();
		}
	});

	if (!buttonColors || buttonColors.length == 0) {
		resetStyle();
	}
</script>

<button
	onclick={toggled}
	disabled={!ready}
	data-tip={tooltip}
	class=" {tooltip ? 'tooltip' : ''} {buttonSubtext
		? 'inline-block'
		: ''} {textSize} {buttonStyle} {buttonOutline} {buttonColors}  {buttonFocusHover} {style} "
>
	{buttonText} {@render children?.()}

	{#if buttonSubtext.length > 0}	
		<hr class="m-0 p-0 border-current opacity-30"/><p class="m-0 italic text-sm font-light">{buttonSubtext}</p>
	{/if}

</button>

<style>
	/*.base {
      @apply font-bold py-2 px-4 rounded cursor-pointer;
      
    }*/

	.sm {
		@apply text-sm;
	}

	.base {
		@apply text-base;
	}

	.lg {
		@apply text-lg;
	}
</style>
