<script lang="ts">
    import { EmojiEnum } from '$lib/types.d';

    declare type EmojiSize = 'lg' | 'sm';

    export let value: EmojiEnum|null = null
    export let size: EmojiSize|null = null

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

<style>
    .emoji-icon.icon-lg {
        width: 40px;
        height: 40px;
    }
    .emoji-icon.icon-md {
        width: 30px;
        height: 30px;
    }

    @media (max-width: 575.98px) {
        .emoji-icon.icon-lg {
            width: 30px;
            height: 30px;
        }
        .emoji-icon.icon-md {
            width: 25px;
            height: 25px;
        }
    }
</style>

{#if null !== value}
    <svg class="emoji-icon icon-{ size ?? 'md' } {$$props.class || ''}" style="box-sizing: content-box; {$$props.style || ''}">
        <use xlink:href="/emoji.svg#{ code }" />
        <rect id="content" width="100%" height="100%" opacity="0">
            <title>{ value }</title>
        </rect>
    </svg>
{/if}
