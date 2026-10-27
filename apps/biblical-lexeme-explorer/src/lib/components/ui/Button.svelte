<script>
	let {
		buttonText = 'Reusable Button',
		buttonSubtext = '',
		buttonStyle = '',
		buttonOutline = '',
		buttonColors = 'btn-primary',
		buttonFocusHover = '',
		style = '',
		shapeStyle = 'rounded-lg shadow-xs',
		textSize = '',
		toggled = () => {},
		tooltip = '',
		ready = true,
		children = null
	} = $props();
</script>

<button
	type="button"
	onclick={toggled}
	disabled={!ready}
	title={tooltip}
	class="btn inline-flex items-center justify-center font-semibold transition-all duration-150 cursor-pointer border border-transparent {shapeStyle} {textSize} {buttonColors} {buttonStyle} {buttonOutline} {buttonFocusHover} {style} {!ready ? 'opacity-50 cursor-not-allowed' : ''}"
>
	{#if buttonText}
		<span>{buttonText}</span>
	{/if}
	{@render children?.()}
	{#if buttonSubtext.length > 0}
		<hr class="m-0 p-0 border-current opacity-30"/>
		<p class="m-0 italic text-xs font-light">{buttonSubtext}</p>
	{/if}
</button>
