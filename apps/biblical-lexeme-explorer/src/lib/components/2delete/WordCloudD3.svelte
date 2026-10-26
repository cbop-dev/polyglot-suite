<script>
	import WordCloud from 'svelte-d3-cloud';
	const defaultWords = [
		{ text: 'Halo', count: 100 },
		{ text: 'Dunia', count: 50 },
		{ text: 'Gaib', count: 75 }
	];
	let { words = defaultWords } = $props();
	//$inspect(words, 'wordcloud3 words');
</script>

<div>
	<!--<WordCloud words={defaultWords} font={'Arial'} minRotate={-60} maxRotate={90} />-->
	{#if words.length}
		<!--<WordCloud {words} minRotate={-90} maxRotate={90} />-->
	{/if}
</div>
