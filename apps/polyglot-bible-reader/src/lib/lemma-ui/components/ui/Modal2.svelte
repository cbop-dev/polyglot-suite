<script>
	import { Modal2 as BaseModal2 } from '@polyglot/lemma-ui';

	let {
		showModal = $bindable(),
		title = '',
		onclose = () => {},
		children,
		max = $bindable(false)
	} = $props();
</script>

<BaseModal2 bind:showModal {title} {onclose} bind:max>
	{@render children?.()}
</BaseModal2>
