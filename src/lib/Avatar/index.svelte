<script lang="ts">
    import { AvatarEnum } from '$lib/types.d';

    declare type AvatarSize = 'lg' | 'sm';

    export let value: AvatarEnum = AvatarEnum.man;
    export let size: AvatarSize|null = null;

    let sizePx = (() => {
        switch (size) {
            case "lg":
                return 100;
            case "sm":
                return 25;
            default:
                return 50;
        }
    })()

    function toCode(enumerator, input): string|null {
        const index = Number.isInteger(input) ? input : Object.values(enumerator).indexOf(String(input));
        return undefined !== Object.values(enumerator)[index] ? Object.values(enumerator)[index].replaceAll('_', '-') : null;
    }

    let code;
    $: code = toCode(AvatarEnum, value);
</script>

<svg class="icon" style="width: { sizePx }px; height: { sizePx }px;">
    <use xlink:href="/avatars.svg#{ code }" />
</svg>
