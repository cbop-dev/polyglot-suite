<script>
  import { Tabs2 as BaseTabs2 } from '@polyglot/lemma-ui';

  let {
    headings = ['Tab 1', 'Tab 2', 'Tab 3'],
    selectedTabIndex = $bindable(0),
    classes = ['']
  } = $props();
</script>

<BaseTabs2 {headings} bind:selectedTabIndex {classes} />

