<script>
import Button from "./Button.svelte";
import ModalButton from "./ModalButton.svelte";

let {
    itemsList,
    max = 10,
    labelText = "Input:",
    casesensitive = $bindable(false),
    placeholder = "Type here",
    helpTitle = "Text Filter Help",
    helpText = "Enter Latin characters, which will convert automatically to Greek/Hebrew!",
    transform = (input) => input.trim(),
    searchTerms = (input) => [input],
    bestMatches = $bindable(),
    otherMatches = $bindable(),
    tooltip = ''
} = $props();

let inputText = $state('');
$effect(() => {
    inputText = transform(inputText);
});

let caseinsensitive = $derived(!casesensitive);
$effect(() => {
    casesensitive;
    filterItems(inputText);
});

function filterItems(input = inputText) {
    let middleMatches = [];
    let beginMatches = [];
    if (input.length > 1 && itemsList) {
        const inputsToCheck = searchTerms(input);
        for (const inputToCheck of inputsToCheck) {
            if (inputToCheck.length > 1) {
                let bestCount = 0;
                let otherCount = 0;

                for (const k of itemsList.keys()) {
                    const item = itemsList[k];
                    if (!item) continue;
                    if (
                        (caseinsensitive && item.toLowerCase().startsWith(inputToCheck.toLowerCase()) && !beginMatches.includes(k) && !middleMatches.includes(k)) ||
                        (!caseinsensitive && item.startsWith(inputToCheck) && !beginMatches.includes(k) && !middleMatches.includes(k))
                    ) {
                        if (bestCount <= max) {
                            beginMatches.push(k);
                            bestCount += 1;
                        }
                    } else if (
                        (caseinsensitive && item.toLowerCase().includes(inputToCheck.toLowerCase()) && !beginMatches.includes(k) && !middleMatches.includes(k)) ||
                        (!caseinsensitive && item.includes(inputToCheck) && !beginMatches.includes(k) && !middleMatches.includes(k))
                    ) {
                        if (otherCount <= max) {
                            middleMatches.push(k);
                            otherCount += 1;
                        }
                    }

                    if (max > 0 && bestCount > max && otherCount > max) break;
                }
            }
        }
    }
    bestMatches = beginMatches.sort((x, y) => itemsList[x].localeCompare(itemsList[y]));
    otherMatches = middleMatches.sort((x, y) => itemsList[x].localeCompare(itemsList[y]));
}

export function clear() {
    inputText = '';
}
</script>

<div>
    <label for="inputfilter">{labelText}</label>
    {#if helpText}
        <ModalButton title={helpTitle} buttonText="(?)">
            <div class="block text-left">
                {helpText}
            </div>
        </ModalButton>
    {/if}
    <br/>
    <input type="search" size="15" bind:value={inputText} {placeholder} class="input input-bordered w-full max-w-xs" />
    <br/>
    <Button buttonStyle="btn btn-ghost" buttonColors="text-ink" style="font-light" toggled={() => { inputText = ''; }} buttonText="Clear" />
    <label class="label cursor-pointer inline">
        <span class="label-text">Case&nbsp;sensitive</span>
        <input type="checkbox" bind:checked={casesensitive} class="checkbox" />
    </label>
</div>
