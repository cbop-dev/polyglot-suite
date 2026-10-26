<script>
	//import errorImage from '%sveltekit.assets%/404-error-road2.jpg';
	//import errorImage from '%sveltekit.assets%/404-error-road2.jpg';
	const imageURI = '/404-error-road3.jpg';
	//const image = new Image();
</script>

<div class="errorPage" style="--bgimage: url('{imageURI}')">
	<div class="text">
		<h1>Quo Vadis?</h1>
		<!-- <img alt="Winding Road to Nowhere--404 Error" src={imageURI} /> -->
		<span>This road leads nowhere. Perhaps turn around and try again?</span>
	</div>
</div>

<style>
	.errorPage {
		background-image: var(--bgimage);

		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		@apply h-screen w-screen bg-slate-700;
	}
	.h1 {
		@apply italic;
	}
	.text {
		/*@apply bg-slate-900/50;*/
		@apply bg-gradient-to-b from-slate-700/50 to-zinc-900/50;
		@apply rounded-lg p-4 text-center text-2xl font-bold text-white;

		/*@apply bg-radial from-slate-700 to-zinc-900 to-75%;*/
		font-family: 'SBL BibLit', serif;
	}
</style>
