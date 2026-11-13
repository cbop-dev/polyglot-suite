<script lang="ts">
	import Portal from "$lib/Portal.svelte";
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
	$inspect("data: ", data);
</script>
<Portal {data}/>