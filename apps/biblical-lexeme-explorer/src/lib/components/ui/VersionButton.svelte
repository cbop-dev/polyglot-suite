<script>
	import { APP_VERSION, APP_REPO } from '$lib/config/version.js';
</script>

<a
	href={APP_REPO}
	target="_blank"
	rel="noopener noreferrer"
	class="version-badge"
	title="View Biblical Lexeme Explorer on GitHub"
>
	v{APP_VERSION}
</a>

<style>
	.version-badge {
		padding: 0.15rem 0.4rem;
		background-color: rgba(102, 204, 138, 0.85);
		color: rgba(0, 0, 0, 0.85);
		border-radius: 10px;
		text-decoration: none;
		font-weight: 600;
		vertical-align: super;
		font-size: 0.75rem;
		line-height: 1rem;
		margin-left: 0.35rem;
		box-shadow: -1px 2px 3px rgba(0, 0, 0, 0.35);
		display: inline-block;
		transition: all 0.15s ease-in-out;
	}

	a:link.version-badge,
	a:visited.version-badge {
		text-decoration: none !important;
		font-weight: 600;
	}

	.version-badge:hover {
		background: #1f6f7a;
		color: #ffffff;
		box-shadow: -1px 2px 5px rgba(0, 0, 0, 0.5);
	}
</style>
