<script lang="ts">
	import { getKwicSnippet, type KwicSnippet as KwicSnippetData } from '../transliteration.js';
	import { isHebrewLanguage, isSyriacLanguage } from '../languages.js';

	let {
		text = '',
		matchWord = '',
		normQ = undefined,
		radius = 45,
		snippet = null,
		lang = 'greek',
		direction = undefined,
		wrap = true,
		class: className = '',
		markClass = '',
		beforeClass = '',
		afterClass = ''
	}: {
		text?: string;
		matchWord?: string;
		normQ?: string;
		radius?: number;
		snippet?: KwicSnippetData | { before: string; match: string; after: string } | null;
		lang?: string;
		direction?: 'ltr' | 'rtl';
		wrap?: boolean;
		class?: string;
		markClass?: string;
		beforeClass?: string;
		afterClass?: string;
	} = $props();

	let resolvedSnippet = $derived.by(() => {
		if (snippet) return snippet;
		if (text && matchWord) {
			return getKwicSnippet(text, matchWord, { normQ, radius, lang });
		}
		return { before: text, match: '', after: '', start: -1, end: -1 };
	});

	let isRtl = $derived(
		direction !== undefined
			? direction === 'rtl'
			: (isHebrewLanguage(lang) || isSyriacLanguage(lang))
	);
</script>

<span class="kwic-snippet {wrap ? 'kwic-wrap' : 'kwic-nowrap'} {className}" dir={isRtl ? 'rtl' : 'ltr'}>
	{#if resolvedSnippet.before}<span class="kwic-before {beforeClass}">{resolvedSnippet.before}</span>{/if}
	{#if resolvedSnippet.match}<mark class="kwic-mark {markClass}">{resolvedSnippet.match}</mark>{/if}
	{#if resolvedSnippet.after}<span class="kwic-after {afterClass}">{resolvedSnippet.after}</span>{/if}
</span>

<style>
	.kwic-snippet {
		font-size: 0.875rem;
		line-height: 1.5;
		color: var(--color-ink-muted, inherit);
		display: inline-block;
		max-width: 100%;
		vertical-align: middle;
	}

	.kwic-snippet.kwic-nowrap {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.kwic-snippet.kwic-wrap {
		white-space: normal;
		word-break: break-word;
	}

	.kwic-mark {
		background-color: #fef08a;
		color: #854d0e;
		font-weight: 700;
		padding: 0.05rem 0.35rem;
		border-radius: 0.25rem;
		margin: 0 0.15rem;
		display: inline-block;
	}

	:global(.dark) .kwic-mark,
	:global([data-theme="dark"]) .kwic-mark {
		background-color: #854d0e;
		color: #fef08a;
	}
</style>
