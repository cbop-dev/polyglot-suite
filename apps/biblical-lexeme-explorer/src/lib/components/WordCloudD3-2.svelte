<script>
	import { onMount } from 'svelte';
	//import { createEventDispatcher } from "svelte";
	import cloud from 'd3-cloud';
	import Button from './ui/Button.svelte';
	import { mylog } from '$lib/env/env.js';
	import { text } from '@sveltejs/kit';

	// color scheme
	const color_scheme = {
		schemeCategory10: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'],
		schemeAccent: ['#7fc97f', '#beaed4', '#fdc086', '#ffff99', '#386cb0', '#f0027f', '#bf5b17', '#666666'],
		schemeDark2: ['#1b9e77', '#d95f02', '#7570b3', '#e7298a', '#66a61e', '#e6ab02', '#a6761d', '#666666'],
		schemePaired: ['#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99', '#e31a1c', '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a', '#ffff99', '#b15928'],
		schemePastel1: ['#fbb4ae', '#b3cde3', '#ccebc5', '#decbe4', '#fed9a6', '#ffffcc', '#e5d8bd', '#fddaec', '#f2f2f2'],
		schemePastel2: ['#b3e2cd', '#fdcdac', '#cbd5e8', '#f4cae4', '#e6f5c9', '#fff2ae', '#f1e2cc', '#cccccc'],
		schemeSet1: ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#ffff33', '#a65628', '#f781bf', '#999999'],
		schemeSet2: ['#66c2a5', '#fc8d62', '#8da0cb', '#e78ac3', '#a6d854', '#ffd92f', '#e5c494', '#b3b3b3'],
		schemeSet3: ['#8dd3c7', '#ffffb3', '#bebada', '#fb8072', '#80b1d3', '#fdb462', '#b3de69', '#fccde5', '#d9d9d9', '#bc80bd', '#ccebc5', '#ffed6f'],
		schemeTableau10: ['#4e79a7', '#f28e2c', '#e15759', '#76b7b2', '#59a14f', '#edc949', '#af7aa1', '#ff9da7', '#9c755f', '#bab0ab']
	};

	function scaleOrdinal(colors) {
		const palette = colors || color_scheme.schemeTableau10;
		return (i) => palette[i % palette.length];
	}

	// props
	let {
		words = [],
		width = 800,
		height = 500,
		minWidth = 200,
		minHeight = 400,
		font = 'Impact',
		maxFontSize = 50,
		minFontSize = 8,
		minRotate = 0,
		maxRotate = 0,
		scheme = 'schemeTableau10',
		padding = 2,
		backgroundColor = '#fff',
		onWordClick=(id)=>{},
		
	} = $props();
	function invertHex(hex) {
		const clean = (hex || '#ffffff').replace('#', '');
		const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
		const num = parseInt(full, 16);
		if (isNaN(num)) return '#000000';
		return '#' + (0xffffff ^ num).toString(16).padStart(6, '0');
	}

	let colorInverted = $state(false);
	let textShadowOn = $state(true);
	let rgb = $state({ r: 255, g: 255, b: 255, a: 1 });
	// count max word occurence
	const maxWordCount = Math.max(...words.map((w) => w.count));

	// text color scheme
	const fill = scaleOrdinal(color_scheme[scheme]);
	//let h = $state();
	//let w = $state();

	// events
	//const onWordClick = (d) => dispatch("click", d);
	//const onWordMouserOver = (d) => dispatch("mouseover", d);
	//const onWordMouseOut = (d) => dispatch("mouseout", d);
	//const onWordMouseMove = (d) => dispatch("mousemove", d);
	//const minFontSize = 8;
	//const font = 'SBL BibLit, Serif';

	let cloudHeight = $state();
	let cloudWidth = $state();
	let theCloudDiv = $state();

	function invertCloudColor() {
		colorInverted = !colorInverted;
		backgroundColor = invertHex(backgroundColor);
	}


	let layout = $state(cloud());
	let renderedWords = $state([]);
	// mount


	/*function redraw() {
		layout

			.size([cloudWidth * 0.9, cloudHeight * 0.9])
			.words(words)
			.padding(padding)
			.rotate(() => ~~(Math.random() * maxRotate) + minRotate)
			.font(font)
			.fontWeight('bold')
			.fontSize((d) => {
				const relFreqRatioThisWord = d.count / maxWordCount;
				const weightRatio =
					//relFreqRatioThisWord < 0.1 ? Math.sqrt(relFreqRatioThisWord) :
					relFreqRatioThisWord;
				const fontSize = Math.floor(weightRatio * (maxFontSize - minFontSize) + minFontSize);
				mylog(`cloud font size=${fontSize}`);
				return fontSize;
			})
			.on('end', redrawSvelte);
		layout.start();
	}*/

		// mount
	function redrawSvelte() {
		const svgSizes = [cloudWidth * 0.9, cloudHeight * 0.9];
		const [svgWidth, svgHeight] = svgSizes;
		const maxFont=Math.floor((svgWidth + svgHeight)/ (2 * 7));
		const minFont=10;//Math.floor((svgWidth + svgHeight)/ (2 * 20));

		layout

			.size(svgSizes)
			.words(words.map(d => ({ ...d }))) // Clone to avoid mutation
			.padding(5)
			.rotate(() => (~~(Math.random() * 2) * 90))
			.fontSize(d => d.size)
			.padding(padding)
			.rotate(() => ~~(Math.random() * maxRotate) + minRotate)
			.font(font)
			.fontWeight('bold')
			.fontSize((d) => {
				const relFreqRatioThisWord = d.count / maxWordCount;
				const weightRatio =
					//relFreqRatioThisWord < 0.1 ? Math.sqrt(relFreqRatioThisWord) :
					relFreqRatioThisWord;
				const fontSize = Math.floor(weightRatio * (maxFont - minFont) + minFont);
				mylog(`cloud font size=${fontSize}`);
				return fontSize;
			})
			.on('end', (output) => renderedWords = output);
		layout.start();
	}
	function handleWordClick(id){
		if (enableWordClick) onWordClick(id);
	}
	
	onMount(async () => {
		redrawSvelte();
	});


	
	/**
	 * 
	 * @param {Object} word 
	 * @returns {string} css text-shadow value
	 */
	function generateTextShadow(word){
		function shadowColor(){
			if(colorInverted){
				return '#fff';
			}
			else{
				return '#000';
			}
		}
		let shadow = 'none'
		if (textShadowOn && word.size > 20) {
			shadow = `${Array(3).fill((Math.floor(Math.sqrt((word.size/20)))+1)+ 'px')
				.join(' ')} ` + '#555';
		}
		//mylog(`shadow${word.text}=${shadow}`,true);
		return shadow;
	}
	let componentHeight = $state();
	let componentWidth = $state();
	let enableWordClick = $state(true);
	$inspect('maxWordCount', maxWordCount);
	$inspect('words to wd3-2:', words);
	$inspect(
		`sizes: component --  ${componentWidth} x ${componentHeight}; cloud --${cloudWidth} x  ${cloudHeight} `
	);
	$inspect('rgb', rgb);
</script>

<svelte:window bind:innerHeight={componentHeight} bind:innerWidth={componentWidth} />
<div id="wordcloud-controls" class="flex-row text-center inline-flex self-center m-auto">
	<Button
		buttonColors="btn-ghost text-base-content"
		buttonOutline="ring-1 ring-base-300"
		buttonFocusHover=" hover:bg-base-200 focus:ring-base-300 focus:ring-2"
		buttonStyle="btn btn-md"
		style="p-1 m-2 tab-border-none"
		buttonText="Redraw"
		tooltip="Redraw the wordcloud (e.g., after resizing the browswer window). This will not lookup words from a new section, just redraw the same words again."
		toggled={redrawSvelte}
	/>
	<Button
		buttonColors="btn-ghost text-base-content"
		buttonStyle="btn btn-md btn-circle"
		buttonOutline=""
		buttonFocusHover=" hover:bg-base-200 focus:ring-base-300 focus:ring-2"
		style="p-2 m-3 tab-border-none"
		buttonText=""
		tooltip="Toggle black/white background."
		toggled={invertCloudColor}
	><img width="20" height="20" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAACzklEQVR4nO2az0/UQBTHPyTEXY2RgK54lDPG+FcY8EdEbyie8YQEvS8XL8hFEhLP/gkaQtCTB2PQKOGiLrAnlYMRj+CGNTWTfJtMaru77XbbqeGbvKSbzs7rt983M2/eFI7w/2IImAAeAyvAF+AX0JCZ68+6Z9rcAAZxBGXgLvAS+AN4Ma0JrAFTQCkPAseBB8BugoePsu/AnF5OJrgK1FMkELQdYLyXBMybetJDAkF7BpxIm8Q54EOGJDzZe2A4LRIjktvLybb1DF2hAtRyJOHJ6oqKxGMij3DyLHsEvLXCLNGM9jRnEvN6jtNWVCwnmWJdIOHjIrCve2PEWOzqDpHwcd8a/B2F2EMHSRj0AxtqN0sblJQq5EGi2u7hgCtqu9tOlSkHlbDRZ82kt2mBV44qYWNa/1ulxX6i6agSNga1vzkEBgjBTceVsPFafVwnBIuOK2FjXv0sEIKVAigRjJ7nhGCrAEr4GFV/pi7wD/YKoISPM+rzByFoFISEv3Cbfn+TIZG0SbQlslcQEv6GLzK0thwd2LEH+0oBlPBxq9X0u1gAJTpaECcKoEQwRblGRDLWdFwJP7n1k8ZTRGDNcSUM7smnGdORuOOwEv7G6qP8TtJmofnmqBJoTBi/Xzs5hphzUAm/+LAp3zN0gHIHtd6sSdgvuBbnUGjcMRKXgAP5vxz3z8uOkKioKGf8LyXpoKzCsV1QzhongXX5X+/mnLGixMx09E6/yXDheyPfO2kc+IxY0tZUUM5iTGzLp8nKz6fV8bAVZvsqKJvpMG30a3Y6sMLpbNpOyoEJYCPF09c+HWVsWv0v9frsfcyS3VMtdjrhVwxDyp38tMNTKMWeYrtRZzaQzjSUXldVdxrVadMxmbm+oE1RVW3tOoFJO2by+gKipKr4asItwKGy2Mm8CIRhQLVYs2t7oQ9oflof1ZjrT9qeLqht5H7iCBQcfwH9k8Pdy5C2jAAAAABJRU5ErkJggg==" alt="black-and-white"></Button>

	<Button
		buttonColors="btn-ghost text-base-content"
		buttonStyle="btn btn-md btn-circle"
		buttonOutline=""
		buttonFocusHover=" hover:bg-base-200 focus:ring-base-300 focus:ring-2"
		style="p-2 m-3 tab-border-none"
		buttonText=""
		tooltip="Toggle text shadow effect."
		toggled={()=>{textShadowOn=!textShadowOn; updateCloudShadows();}}
	><img width="20" height="20" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAACAklEQVR4nO2XwUtUURTGf005bpJ0ghASNBTcZ9CywEVboVXpH5CSpQtbzULDldCuadeizdC0iRYugplN4NJxZlOkO1MhkJhwUSmmXDgPDs/35t773pvdfHB48M2c73wz995z7oMu3DEEfAKOgLOI+C2fj9EhzMYUDsc+UOiEgTwwKc8o3AQ2xUQx6+JlCRteiIFGlsVHRPSdwx6pq6UweZnguQg+VNyaw154lpWBGvAP6FPcNwcDJi81+oFj4LPiRh1PwwkwkNbAtIg9VdyiowETj9MaeB+xoWqqwFeLgUqa4nnpbk3FXZMlCQrcA/63MWC6Zm9SAw9EZFVxj5T4lnANy79gdBLhjQjcVVxZCS8Lt2IxUEpS/BLwA/gJ5IS7DBwq4dvCT1gM7ImeF+5I8lvF3Y8RNc9diwlj0gsvJXFKca+U4OvQ90sWA2aZvNAE/gJXFffd4/yHw2s4DUvSuuLGUxQP4pbv8HmiuKUMDDgPp5o0FzNeA3zJwEDVZ/jUFVeQwZLWwLHLcJoONRmDGY9fUU07nD5EnNuKEpi35M+nGU45GT4Hqsn0AC2Pa1ZwguKipTrrBQxG3GQmE5zlLYuJG3GJV4BfwB/pgObsb6hE16t2sU3xQ5kpsViMSdzzeNm4Li8nUToLLgJzwA5wKmv2Ue6BPhiVvJbobIcaWxcEOAfahVortHVzxwAAAABJRU5ErkJggg==" alt="a">
	</Button>

	<div id="enable-word-click-div" class="inline-block grid items-center">
	<div class="form-control align-middle">
	<label class="label cursor-pointer tooltip " for="enable-word-click" data-tip="Enable word click for lemma info.">
		<span class="label-text">Lemma info </span>
		<input type="checkbox" class="toggle" bind:checked={enableWordClick} />
	</label>
	</div>
	</div>
</div>
<!-- <ColorPicker
	bind:hex
	bind:rgb
	bind:hsv
	bind:color
  position="responsive"
/>-->
<!--<ColorPicker
	label="Change Background"
	bind:rgb={rgb}
  position="responsive"
/>-->
<div id="wordcloud2" style="background-color: {backgroundColor}; --minH: {minHeight}px; --minW: {minWidth}px; 
	--maxH: {componentHeight}px; --maxW: {componentWidth}px;"
	bind:clientHeight={cloudHeight}
	bind:clientWidth={cloudWidth}
	bind:this={theCloudDiv}>

<svg width={cloudWidth} height={cloudHeight}>
  <g transform="translate({cloudWidth / 2}, {cloudHeight / 2})">
    {#each renderedWords as word,i}
      <text
        font-size="{word.size}px"
        text-anchor="middle"
        transform="translate({word.x}, {word.y}) rotate({word.rotate})"
        style="{enableWordClick ? 'cursor: pointer;': ''} fill: {fill(i)}; text-shadow: {generateTextShadow(word)};"
        on:click={() => handleWordClick(word.id)}
      >
        {word.text}
      </text>
    {/each}
  </g>
</svg>
</div>

<!--<div
	id="wordcloud"
	class="veryFunnyStuff"
	style="background-color: {backgroundColor}; --minH: {minHeight}px; --minW: {minWidth}px; 
	--maxH: {componentHeight}px; --maxW: {componentWidth}px;"
	bind:clientHeight={cloudHeight}
	bind:clientWidth={cloudWidth}
	bind:this={theCloudDiv}
/>-->



<style>
	div#wordcloud2 {
		display: block;
		margin: auto;
		/*width: fit-content;
		height: fit-content;*/
		min-height: var(--minH);
		min-width: var(--minW);
		max-height: var(--maxH);
		max-width: var(--maxW);
		@apply h-lvh w-lvw;
		/*@apply h-screen w-screen;*/
	}
	div#wordcloud2 svg g text {
		@apply drop-shadow-lg font-black;
		font-family:"SBL BibLit";
	}
</style>