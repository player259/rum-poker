<script lang="ts">

    import { writable } from 'svelte-local-storage-store'
    import { get } from 'svelte/store'
    import { v4 as uuid4 } from 'uuid';

    import { goto } from '$app/navigation';
    import { browser } from '$app/env';

    import {
        Button,
        Col,
        Row,
        Styles
    } from 'sveltestrap'

    import {
        AvatarEnum,
        OnlineEnum,
    } from '$lib/types.d';

    const profileIdStore = writable('profileId', uuid4())
    const profileNameStore = writable('profileName', '')
    const profileAvatarStore = writable('profileAvatar', AvatarEnum.man)

    let profileId: string = get(profileIdStore)
    let profileName: string = get(profileNameStore)
    let profileAvatar: AvatarEnum = get(profileAvatarStore)

    $: profileIdStore.set(profileId)
    $: profileNameStore.set(profileName)
    $: profileAvatarStore.set(profileAvatar)

    function createRoom() {
        if (!browser) {
            return
        }

        const createData = {
            profileId,
            profileName,
            profileAvatar,
            online: OnlineEnum.online,
            sp: null,
            size: null,
            risk: null,
            status: null,
            reactions: [],
            action: null,
        }

        fetch(
            '/room?profileId=' + profileId,
            {
                method: 'POST',
                body: JSON.stringify({ item: createData }),
                headers: { 'Content-Type': 'application/json' }
            }
        )
            .then(res => res.json())
            .then(res => goto('/room/' + res.roomNumber));
    }

</script>

<Styles />

<div class="container">
    <Row class="pt-5">
        <Col>
            <div class="mx-auto mt-5 h3 text-center">Welcome to</div>
            <div class="mx-auto mb-5 h1 text-center">RUM-POKER.online</div>

            <Button color="primary" size="lg" outline class="d-block mx-auto shadow-none h1" on:click={() => createRoom()}>Create new room</Button>
        </Col>
    </Row>
</div>
