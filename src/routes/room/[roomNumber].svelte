<script lang="ts">

    import { writable } from 'svelte-local-storage-store'
    import { get } from 'svelte/store'
    import { v4 as uuid4 } from 'uuid';

    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { browser } from '$app/env';

    import { onMount } from 'svelte';
    import { onDestroy } from 'svelte';
    import {
        Button,
        Col,
        Row,
        Icon,
        Table,
        Dropdown,
        DropdownToggle,
        DropdownMenu,
        DropdownItem,
        Tooltip,
        Input,
        Popover,
        Styles
    } from 'sveltestrap'
    import Avatar from '$lib/Avatar/index.svelte'
    import Emoji from '$lib/Emoji/index.svelte'
    import {
        AvatarEnum,
        EmojiEnum,
        StoryPointEnum,
        SizeEnum,
        RiskEnum,
        StatusEnum,
        OnlineEnum
    } from '$lib/types.d'

    const profileIdStore = writable('profileId', uuid4())
    const profileNameStore = writable('profileName', '')
    const profileAvatarStore = writable('profileAvatar', AvatarEnum.man)

    let profileId: string = get(profileIdStore)
    let profileName: string = get(profileNameStore)
    let profileAvatar: AvatarEnum = get(profileAvatarStore)

    $: profileIdStore.set(profileId)
    $: profileNameStore.set(profileName)
    $: profileAvatarStore.set(profileAvatar)

    let online: OnlineEnum = OnlineEnum.online
    let sp: StoryPointEnum|null = null
    let size: SizeEnum|null = null
    let risk: RiskEnum|null = null
    let status: StatusEnum|null = null
    let reactions: EmojiEnum[] = []

    $: ready && sendUpdate() && profileId && profileName && profileAvatar && online && sp && size && risk && status && reactions

    export let roomNumber: number = get(page).params.roomNumber
    let roomData = null

    let eventSource: EventSource|null = null
    let lastUpdateData = {}

    function createRoom() {
        if (!browser) {
            return
        }

        const createData = {
            profileId,
            profileName,
            profileAvatar,
            online,
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
            .then(res => {
                goto('/room/' + res.roomNumber).then(() => {
                    roomNumber = res.roomNumber
                    roomData = res
                    connectToSseServer()
                })
            });
    }

    function sendUpdate(action: string|null = null) {
        if (!browser) {
            return
        }

        const updateData = {
            profileId,
            profileName,
            profileAvatar,
            online,
            sp,
            size,
            risk,
            status,
            reactions: [ ...reactions ],
        }

        if (null === action && JSON.stringify(updateData) === JSON.stringify(lastUpdateData)) {
            return
        }

        fetch(
            '/room/' + roomNumber + '/updates?profileId=' + profileId,
            {
                method: 'PATCH',
                body: JSON.stringify({item: updateData, action }),
                headers: { 'Content-Type': 'application/json' }
            }
        )
            .then(res => res.ok ? lastUpdateData = updateData : ready = false)
    }

    function connectToSseServer(): void {
        if (!browser) {
            return
        }

        const path = '/room/' + roomNumber + '/updates?profileId=' + profileId;

        if (null === eventSource || !eventSource.url.endsWith(path)) {
            sp = null
            size = null
            risk = null
            status = null
            reactions = []
            lastUpdateData = {}

            eventSource?.close()
            eventSource = new EventSource('/room/' + roomNumber + '/updates?profileId=' + profileId);
            eventSource.onmessage = event => {
                roomData = JSON.parse(event.data)

                let index = roomData.data.findIndex(item => item.profileId === profileId)
                if (-1 !== index) {
                    sp = roomData.data[index].sp
                    size = roomData.data[index].size
                    risk = roomData.data[index].risk
                    status = roomData.data[index].status
                    reactions = roomData.data[index].reactions

                    lastUpdateData = {
                        profileId: roomData.data[index].profileId,
                        profileName: roomData.data[index].profileName,
                        profileAvatar: roomData.data[index].profileAvatar,
                        online: roomData.data[index].online,
                        sp,
                        size,
                        risk,
                        status,
                        reactions: [ ...reactions ],
                    }
                }

                sendUpdate()

                ready = true
            }
            eventSource.onerror = () => { ready = false }
        }
    }

    let ready: boolean|null = null

    onMount(() => connectToSseServer())
    onDestroy(() => eventSource?.close())

    function getColor(value): string {
        const success = 'success'
        const primary = 'primary'
        const danger = 'danger'
        const secondary = 'secondary'
        const warning = 'warning'

        if (null === value) {
            return secondary
        }

        switch (value) {
            case SizeEnum.XS:
            case RiskEnum.Safe:
            case StatusEnum.Ready:
            case OnlineEnum.online:
                return success
            case SizeEnum.XXL:
            case RiskEnum.Risky:
            case StatusEnum.NeedsResearch:
            case OnlineEnum.offline:
                return danger
            case OnlineEnum.busy:
                return warning
        }

        return primary
    }

    if (browser) {
        document.addEventListener("visibilitychange", function() {
            online = document.hidden ? OnlineEnum.busy : OnlineEnum.online
        });
    }
</script>

<style>
    .minimize-width {
        width: 1%;
        white-space: nowrap;
    }
</style>

<Styles />

<div class="container">
    <Row class="pt-5">
        <Col>
            <span class="h3">Room #{ roomNumber }</span>
            <Button color="link" size="sm" class="align-top shadow-none" id="share-room" on:click={() => navigator.clipboard.writeText(window.location.href)}><Icon name="share" /></Button>
            <Popover placement="right" target="share-room" dismissible>
                <div class="text-nowrap text-truncate">
                    Link copied: <a href="{ window.location.href }" target="_blank">{ window.location.href }</a>
                </div>
            </Popover>
            &nbsp;&nbsp;&nbsp;
            <Button color="primary" size="sm" outline class="align-top shadow-none" on:click={() => createRoom()}>New room</Button>
        </Col>
    </Row>
    <Row class="pb-5 { ready === null ? '' : 'd-none' }">
        <div class="mt-5 mx-auto h5 text-center">Loading...</div>
        <div class="mx-auto spinner-border text-secondary">
            <span class="visually-hidden">Loading...</span>
        </div>
    </Row>
    <Row class="pb-5 { ready === false ? '' : 'd-none' }">
        <div class="mt-5 mx-auto h5 text-center">Room doesn't exist</div>
        <div class="mx-auto h1 text-center">404</div>
    </Row>
    <Row class="pb-5 { ready === true ? '' : 'd-none' }">
        <Col>
            <Table class="align-middle my-3">
                <thead>
                <tr class="align-middle">
                    <th class="minimize-width">
                        <Emoji size="lg" value="{ EmojiEnum.person }" />
                        <span>You:</span>
                    </th>
                    <th class="minimize-width border-end">
                        <Input plaintext bind:value="{ profileName }" placeholder="Enter your name" class="d-inline-block lead px-2 { '' === profileName ? 'border border-danger' : '' }" style="width: 200px" />
                    </th>
                    <th>
                        <Dropdown class="d-inline-block me-3">
                            <DropdownToggle size="sm" color="link" outline caret><Avatar value="{ profileAvatar }" /></DropdownToggle>
                            <DropdownMenu>
                                <div style="column-count: 7;">
                                    {#each Object.values(AvatarEnum).filter(key => !Number.isInteger(key)) as value}
                                        <DropdownItem class="small" title="{ value }" on:click={() => profileAvatar = value}>
                                            <Avatar value="{ value }" />
                                        </DropdownItem>
                                    {/each}
                                </div>
                            </DropdownMenu>
                        </Dropdown>
                    </th>
                </tr>
                </thead>
                <tbody>
                <tr class="align-middle">
                    <td class="minimize-width">
                        <span class="text-nowrap" id="estimation-rate">
                            <Emoji size="lg" value="{ EmojiEnum.vote }" />
                            <span>SP:</span>
                        </span>
                        <Tooltip target="estimation-rate">Usual story points</Tooltip>
                    </td>
                    <td colspan="2">
                        {#each Object.values(StoryPointEnum) as value}
                            <Button color="secondary"
                                    size="sm"
                                    outline
                                    class="mb-1 shadow-none"
                                    active="{ sp === value }"
                                    on:click={() => sp = sp === value ? null : value}
                            >
                                { value }
                            </Button>&nbsp;
                        {/each}
                    </td>
                </tr>
                <tr>
                    <td class="minimize-width">
                        <span class="text-nowrap" id="estimation-size">
                            <Emoji size="lg" value="{ EmojiEnum.size }" />
                            <span>Size:</span>
                        </span>
                        <Tooltip target="estimation-size">Amount of work</Tooltip>
                    <td colspan="2">
                        {#each [
                            SizeEnum.XS,
                            SizeEnum.S,
                            SizeEnum.M,
                            SizeEnum.L,
                            SizeEnum.XXL
                        ] as value}
                            <Button color="{ getColor(value) }"
                                    size="sm"
                                    outline
                                    class="mb-1 shadow-none"
                                    active="{ size === value }"
                                    on:click={() => size = size === value ? null : value}
                            >
                                { value }
                            </Button>&nbsp;
                        {/each}
                    </td>
                </tr>
                <tr>
                    <td class="minimize-width">
                        <span class="text-nowrap" id="estimation-risk">
                            <Emoji size="lg" value="{ EmojiEnum.risk }" />
                            <span>Risk:</span>
                        </span>
                        <Tooltip target="estimation-risk">Unpredictable conditions</Tooltip>
                    </td>
                    <td colspan="2">
                        {#each [
                            RiskEnum.Safe,
                            RiskEnum.Unclear,
                            RiskEnum.Risky,
                        ] as value}
                            <Button color="{ getColor(value) }"
                                    size="sm"
                                    outline
                                    class="mb-1 shadow-none"
                                    active="{ risk === value }"
                                    on:click={() => risk = risk === value ? null : value}
                            >
                                { value }
                            </Button>&nbsp;
                        {/each}
                    </td>
                </tr>
                <tr>
                    <td class="minimize-width">
                        <span class="text-nowrap" id="estimation-status">
                            <Emoji size="lg" value="{ EmojiEnum.status }" />
                            <span>Status:</span>
                        </span>
                        <Tooltip target="estimation-status">Needed preparations</Tooltip>
                    </td>
                    <td colspan="2">
                        {#each [
                            StatusEnum.Ready,
                            StatusEnum.SolutionContractRequired,
                            StatusEnum.NeedsResearch,
                        ] as value}
                            <Button color="{ getColor(value) }"
                                    size="sm"
                                    outline
                                    class="mb-1 shadow-none"
                                    active="{ status === value }"
                                    on:click={() => status = status === value ? null : value}
                            >
                                { value }
                            </Button>&nbsp;
                        {/each}
                    </td>
                </tr>
                </tbody>
                <tfoot>
                <tr>
                    <td colspan="3">
                        {#if reactions}
                            {#each [
                                EmojiEnum.scared,
                                EmojiEnum.unsure,
                                EmojiEnum.loading,
                                EmojiEnum.communications,
                                EmojiEnum.doable,
                                EmojiEnum.learn,
                                EmojiEnum.newbie,
                                EmojiEnum.refactoring,
                                EmojiEnum.copypaste,
                                EmojiEnum.legacy,
                                EmojiEnum.coffee_break,
                            ] as value}
                                <Button color="link"
                                        outline
                                        class="mb-1 shadow-none { reactions.indexOf(value) !== -1 ? 'border border-secondary bg-light' : '' }"
                                        active="{ reactions.indexOf(value) !== -1 }"
                                        on:click={() => {
                                          const index = reactions.indexOf(value);
                                          if (index === -1) {
                                            reactions.push(value);1
                                          } else {
                                            reactions.splice(index, 1)
                                          }
                                          reactions = reactions;
                                        }}
                                >
                                    <Emoji value="{ value }" /><div class="small">{ value }</div>
                                </Button>&nbsp;
                            {/each}
                        {/if}
                    </td>
                </tr>
                </tfoot>
            </Table>

            <div class="d-flex mt-5 mb-3">
                <span class="h3">Results</span>
                &nbsp;&nbsp;&nbsp;
                <Button color="primary" size="sm" outline class="me-auto align-self-baseline shadow-none" on:click={() => sendUpdate(!roomData.show ? 'show' : 'hide') }>{ !roomData?.show ? 'Show' : 'Hide' }</Button>
                <Button color="secondary" size="sm" outline class="align-self-baseline shadow-none" on:click={() => sendUpdate('delete') }>Delete estimates</Button>
                &nbsp;
                <Button color="secondary" size="sm" outline class="align-self-baseline shadow-none" on:click={() => sendUpdate('clear') }>Clear room</Button>
            </div>

            <Table class="align-middle">
                <thead>
                <tr>
                    <th class="minimize-width"></th>
                    <th colspan="3">Name</th>
                    <th class="minimize-width">Estimation</th>
                    <th>Details</th>
                </tr>
                </thead>
                <tbody>
                {#if roomData}
                    {#each roomData.data as item}
                        <tr class="{ item.profileId === profileId ? 'bg-light' : '' }">
                            <td class="minimize-width">
                                <Icon name="circle-fill { item.profileId === profileId ? 'fs-4' : 'small' }" class="text-{ getColor(item.online) }" />
                            </td>
                            <td class="minimize-width">
                                <Avatar value="{ item.profileAvatar }" />
                            </td>
                            <td>
                                <span class="lead">{ item.profileName }</span>
                            </td>
                            <td>
                                {#if roomData.show || item.profileId === profileId}
                                    {#each item.reactions as reaction}
                                        <span class="p-1"><Emoji value="{ reaction }" /></span>
                                    {/each}
                                {/if}
                            </td>
                            <td class="minimize-width">
                                {#if roomData.show || item.profileId === profileId}
                                    <span class="fs-4">{ item.sp ?? '-' }</span>
                                {:else}
                                    <span class="fs-4">X</span>
                                {/if}
                            </td>
                            <td class="small">
                                <span class="text-nowrap pe-1">Size:</span>
                                {#if roomData.show || item.profileId === profileId}
                                    <span class="text-{ getColor(item.size) } pe-2">{ item.size ?? '?' }</span>
                                {:else}
                                    <span class="text-secondary pe-2">X</span>
                                {/if}

                                <span class="text-nowrap pe-1">Risk:</span>
                                {#if roomData.show || item.profileId === profileId}
                                    <span class="text-{ getColor(item.risk) } pe-2">{ item.risk ?? '?' }</span>
                                {:else}
                                    <span class="text-secondary pe-2">X</span>
                                {/if}

                                <span class="text-nowrap pe-1">Status:</span>
                                {#if roomData.show || item.profileId === profileId}
                                    <span class="text-{ getColor(item.status) } pe-2">{ item.status ?? '?' }</span>
                                {:else}
                                    <span class="text-secondary pe-2">X</span>
                                {/if}

                                <span class="fs-5 text-muted">
                                <Icon name="calculator" />?</span>
                            </td>
                        </tr>
                    {/each}
                {/if}
                </tbody>
            </Table>
        </Col>
    </Row>
</div>

<footer class="footer mt-auto py-3 bg-light">
    <div class="container" style="font-size: 0.8em">
        <div>
            Icons made by

            <a href="https://www.freepik.com" title="Freepik">Freepik</a> /
            <a href="https://www.flaticon.com/authors/payungkead" title="Payungkead">Payungkead</a> /
            <a href="https://www.flaticon.com/authors/those-icons" title="Those Icons">Those Icons</a> /
            <a href="https://www.flaticon.com/authors/good-ware" title="Good Ware">Good Ware</a> /
            <a href="https://www.flaticon.com/authors/photo3idea-studio" title="photo3idea_studio">photo3idea_studio</a> /
            <a href="https://www.flaticon.com/authors/smashicons" title="Smashicons">Smashicons</a> /
            <a href="https://www.flaticon.com/authors/darius-dan" title="Darius Dan">Darius Dan</a>

            from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div>
    </div>
</footer>
