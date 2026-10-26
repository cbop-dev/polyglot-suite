<script>
	const chevronStyle =
		'btn btn-circle btn-sm   btn-ghost     mb-3 mr-3 shadow-md font-bold h-30 v-30  ';
	import ChevronsDown from '../icons/chevrons-down2.svelte';
	/**
	 * @typedef {Object} Props
	 * @property {string} [buttonText] - "⤓"   ;/*"⇧", "↑", "Back to Top";
	 * @property {string} [buttonStyle]
	 * @property {any} [style]
	 * @property {string} [textSize]
	 * @property {any} [target=''] - id of element
	 * @property {any} [viewBox='0 0 24 24'] - ="0 0 30 30" ;
	 */

	/** @type {Props} */
	let {
		buttonText = '⮟',
		buttonStyle = 'btn btn-circle btn-sm   btn-ghost     mb-3 mr-3 shadow-md font-bold text-xl',
		style = '',
		textSize = 'base',
		target = '',
		viewBox = '0 0 24 24'
	} = $props();
</script>

<!--  <button  onclick={() => {document.getElementById(target).scrollIntoView();}} class="{textSize} {buttonStyle} rounded-xl shadow-xl">
    {buttonText}
    
  </button>-->
<!--<ChevronsDown  onclick={() => {document.getElementById(target).scrollIntoView();}} viewBox={viewBox} class="{chevronStyle}"/>-->
<svg
	xmlns="http://www.w3.org/2000/svg"
	onclick={() => {
		document.getElementById(target).scrollIntoView();
	}}
	{viewBox}
	class="{chevronStyle} {style}"
>
	<title>[Scroll Down]</title>
	<g id="Double_down" data-name="Double down">
		<path
			d="M12,17a1,1,0,0,1-.707-.293l-4-4a1,1,0,1,1,1.414-1.414L12,14.586l3.293-3.293a1,1,0,0,1,1.414,1.414l-4,4A1,1,0,0,1,12,17Z"
			style="fill:#1c1b1e"
		/>
		<path
			d="M12,13a1,1,0,0,1-.707-.293l-4-4A1,1,0,1,1,8.707,7.293L12,10.586l3.293-3.293a1,1,0,1,1,1.414,1.414l-4,4A1,1,0,0,1,12,13Z"
			style="fill:#1c1b1e"
		/>
	</g></svg
>

<div class="text-center"></div>

<style>
</style>
