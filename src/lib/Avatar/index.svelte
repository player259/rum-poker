<script lang="ts">
    import { AvatarEnum } from '$lib/types.d';

    declare type AvatarSize = 'lg' | 'sm';

    export let value: AvatarEnum = AvatarEnum.man;
    export let size: AvatarSize|null = null;

    function toCode(enumerator, input): string|null {
        const index = Number.isInteger(input) ? input : Object.values(enumerator).indexOf(String(input));
        return undefined !== Object.values(enumerator)[index] ? Object.values(enumerator)[index].replaceAll('_', '-') : null;
    }

    let code;
    $: code = toCode(AvatarEnum, value);
</script>

<style>
    .avatar-icon.icon-lg {
        width: 100px;
        height: 100px;
    }
    .avatar-icon.icon-md {
        width: 50px;
        height: 50px;
    }
    .avatar-icon.icon-sm {
        width: 25px;
        height: 25px;
    }

    @media (max-width: 575.98px) {
        .avatar-icon.icon-lg {
            width: 75px;
            height: 75px;
        }
        .avatar-icon.icon-md {
            width: 35px;
            height: 35px;
        }
        .avatar-icon.icon-sm {
            width: 25px;
            height: 25px;
        }
    }
</style>

<svg class="avatar-icon icon-{ size ?? 'md' } {$$props.class || ''}" style="box-sizing: content-box; {$$props.style || ''}">
    <use xlink:href="/avatars.svg#{ code }" />
</svg>
