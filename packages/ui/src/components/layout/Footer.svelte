<script lang="ts">
//import { resolve } from '$app/paths';
let {
    baseURL="/"
}=$props();

</script>
<div class="mt-12 mb-8 mx-auto max-w-3xl border border-rule bg-page p-6 text-center rounded-lg shadow-sm sm:p-8">
    <h3 class="mb-2 text-lg font-bold">Open Source &amp; Open Data</h3>
    <p class="mx-auto mb-4 max-w-2xl text-sm text-ink-soft">
    Polyglot Bible Reader is built on open-source code (<a
        href="https://www.gnu.org/licenses/agpl-3.0.html"
        target="_blank"
        rel="noopener noreferrer"
        class="text-link underline font-semibold hover:opacity-80">AGPL-3.0</a
    >) and variously open-licensed Biblical datasets (<a
        href="https://creativecommons.org/licenses/by-sa/4.0/"
        target="_blank"
        rel="noopener noreferrer"
        class="text-link underline font-semibold hover:opacity-80">CC BY-SA 4.0</a
    > and <a href="https://creativecommons.org/licenses/by-nc/4.0/" target="_blank" rel="noopener noreferrer" class="text-link underline font-semibold hover:opacity-80">CC BY-NC 4.0 (BHS)</a>).
    </p>
    <div>
    <a href="{baseURL}sources-and-licenses" class="inline-flex items-center gap-2 border border-rule px-4 py-2 rounded text-sm font-medium hover:bg-rule transition-colors">
        <span>View Full Sources &amp; Licensing Framework</span>
        <span aria-hidden="true">&rarr;</span>
    </a>
    </div>
</div>

<style>
@reference "tailwindcss";

</style>