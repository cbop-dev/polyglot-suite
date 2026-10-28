<script>
import Button from "./Button.svelte";
import ModalButton from "./ModalButton.svelte";

let {
    itemsList,
    max = 10,
    labelText = "Input:",
    tooltip = '',
    placeholder = "Type here",
    helpTitle = "Text Filter Help",
    helpText = "Enter Latin characters, which will convert automatically to Greek/Hebrew!",
    filter = (input) => [input.trim()],
    theMatches = $bindable()
} = $props();

let inputText = $state('');

$effect(() => {
    filterItems(inputText);
});

function filterItems(input = inputText) {
    let matches = [];
    if (input.length > 0 && itemsList) {
        const inputsToCheck = filter(input);
        for (const inputToCheck of inputsToCheck) {
            if (inputToCheck.length > 0) {
                let count = 0;
                for (const k of itemsList.keys()) {
                    if (itemsList[k]?.includes(inputToCheck) && !matches.includes(k)) {
                        matches.push(k);
                        count += 1;
                    }
                    if (max > 0 && count > max) break;
                }
            }
        }
    }
    theMatches = matches;
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
    <input aria-label="Input" type="search" size="15" name="inputfilter" bind:value={inputText} {placeholder} class="input input-bordered w-full max-w-xs" />
    <Button buttonStyle="btn btn-ghost" buttonColors="text-ink" style="font-light" toggled={() => { inputText = ''; }} buttonText="Clear" />
</div>
