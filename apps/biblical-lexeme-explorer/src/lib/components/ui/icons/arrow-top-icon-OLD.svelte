<!-- @migration-task Error while migrating Svelte code: Expected a valid element or component name. Components must have a valid variable name or dot notation expression
https://svelte.dev/e/tag_invalid_name -->
<script>
    let {
        height=122.433,
        width=122.433,
        scale=1.0
    } = $props();

    let theHeight=$derived(height*scale);
    let theWidth=$derived(width*scale);
</script>
<style>
    @reference 'tailwindcss';
    svg{
        @apply inline;

    }
</style>
<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" 
xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width={theWidth} height={theHeight} 
viewBox="0 0 {Math.floor(theWidth).toFixed(0)} {Math.floor(theHeight).toFixed(0)}" 
enable-background="new 0 0 {Math.floor(theWidth).toFixed(0)} {Math.floor(theHeight).toFixed(0)}" xml:space="default"><g><polygon fill-rule="evenodd" clip-rule="evenodd" 
    points="{theWidth/2},0 0,{theWidth/2} {theHeight/3},{theWidth/2} {theHeight/3},{theWidth} {2*theHeight/3},{theWidth} {2*theHeight/3},{theWidth/2} {theHeight},{theWidth/2} {theHeight/2},0"/></g></svg>