<script lang="ts">
    import { EmojiEnum } from '$lib/types.d';

    declare type EmojiSize = 'lg' | 'sm';

    export let value: EmojiEnum|null = null
    export let size: EmojiSize|null = null

    let sizePx = (() => {
        switch (size) {
            case "lg":
                return 40;
            default:
                return 30;
        }
    })()

    let code;
    $: code = (() => {
        switch (value) {
            case EmojiEnum.person:
                return 'location';
            case EmojiEnum.vote:
                return 'poker-cards';
            case EmojiEnum.size:
                return 'caliper';
            case EmojiEnum.risk:
                return 'caution';
            case EmojiEnum.status:
                return 'traffic-lights';
            case EmojiEnum.scared:
                return 'shocked';
            case EmojiEnum.unsure:
                return 'weird';
            case EmojiEnum.loading:
                return 'loading';
            case EmojiEnum.communications:
                return 'chat';
            case EmojiEnum.doable:
                return 'strong';
            case EmojiEnum.learn:
                return 'books';
            case EmojiEnum.newbie:
                return 'apple';
            case EmojiEnum.refactoring:
                return 'wrench';
            case EmojiEnum.copypaste:
                return 'paste';
            case EmojiEnum.legacy:
                return 'ancient';
            case EmojiEnum.coffee_break:
                return 'coffee-break';
        }
    })()
</script>

{#if null !== value}
    <svg class="icon" style="width: { sizePx }px; height: { sizePx }px;">
        <use xlink:href="/emoji.svg#{ code }" />
        <rect id="content" width="100%" height="100%" opacity="0">
            <title>{ value }</title>
        </rect>
    </svg>
{/if}
