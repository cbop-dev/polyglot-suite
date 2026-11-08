<script lang="ts">
	import Portal from "$lib/Portal.svelte";
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>
<Portal {data}/>