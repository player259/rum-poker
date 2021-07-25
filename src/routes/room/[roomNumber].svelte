<script lang="ts">

    import { writable } from 'svelte-local-storage-store'
    import { get } from 'svelte/store'
    import { v4 as uuid4 } from 'uuid';

    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { browser } from '$app/env';

    import { onMount } from 'svelte';
    import { onDestroy } from 'svelte';
    import { fade } from 'svelte/transition';
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
        Label,
        Input,
        Popover,
        Alert,
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

    let newRoomNumber: number|null = null

    let eventSource: EventSource|null = null
    let lastUpdateData = {}

    function changeRoom(inputRoomNumber: number) {
        ready = null
        goto('/room/' + inputRoomNumber).then(() => {
            roomNumber = inputRoomNumber
            connectToSseServer()
        })
    }

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
                ready = null
                goto('/room/' + res.roomNumber).then(() => {
                    newRoomNumber = res.roomNumber
                    roomNumber = res.roomNumber
                    roomData = res
                    connectToSseServer()
                })
            });
    }

    let updateTimeoutId

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

        clearTimeout(updateTimeoutId)
        updateTimeoutId = setTimeout(() => {
            fetch(
                '/room/' + roomNumber + '/updates?profileId=' + profileId,
                {
                    method: 'PATCH',
                    body: JSON.stringify({item: updateData, action }),
                    headers: { 'Content-Type': 'application/json' }
                }
            )
                .then(res => res.ok ? lastUpdateData = updateData : ready = false)
        }, 500)
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
            eventSource.onerror = () => {
                if (null === ready) {
                    ready = false
                    eventSource?.close()
                }
            }
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

    let buttonStyle = 'shadow-none py-0 py-md-1 px-2'
    let compareMode = false
</script>

<style>
    .minimize-width {
        width: 1%;
        white-space: nowrap;
    }

    .profile-name {
        width: 200px;
        font-size: 1.3rem!important;
    }

    @media (max-width: 575.98px) {
        .minimize-width {
            width: inherit;
            white-space: inherit;
        }
        .profile-name {
            width: 100px;
            font-size: 1rem!important;
        }
        .reaction-name {
            font-size: 0.75rem!important;
        }
    }
</style>

<Styles />

<div class="container">
    <Row class="pt-3 pt-md-5">
        <Col>
            <span class="h3">
                <span>Room #</span>
                <Input plaintext
                       type="number"
                       value="{ roomNumber }"
                       on:change={(e) => changeRoom(e.target.value)}
                       placeholder="Enter room"
                       class="room-number d-inline-block"
                       style="width: 90px"
                />
            </span>
            <Button color="link" size="sm" class="align-text-bottom shadow-none" id="share-room" on:click={() => navigator.clipboard.writeText(window.location.href)}><Icon name="share" /></Button>
            <Popover placement="right" target="share-room" dismissible>
                <div class="text-nowrap text-truncate">
                    Link copied: <a href="{ window.location.href }" target="_blank">{ window.location.href }</a>
                </div>
            </Popover>
            <Button color="primary" size="sm" outline class="align-text-bottom { buttonStyle }" on:click={() => createRoom()}>New room</Button>
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
            {#if null !== newRoomNumber }
                <div
                    in:fade="{{delay: 0, duration: 0}}"
                    out:fade="{{delay: 1500, duration: 250}}"
                    on:introend="{() => newRoomNumber = null }"
                >
                    <Alert color="success" class="my-3" style="opacity: 1 !important;" isOpen={true} fade={false}>Room successfully created!</Alert>
                </div>
            {/if}
            <Table class="align-middle my-3">
                <thead>
                <tr class="align-middle">
                    <th class="minimize-width">
                        <Emoji size="lg" value="{ EmojiEnum.person }" />
                        <span class="align-middle">You:</span>
                    </th>
                    <th class="minimize-width border-end">
                        <div class="profile-name">
                            <Input plaintext bind:value="{ profileName }" placeholder="Enter your name" class="d-inline-block fw-light px-2 { '' === profileName ? 'border border-danger' : '' }" />
                        </div>
                    </th>
                    <th>
                        <Dropdown class="d-inline-block me-3">
                            <DropdownToggle size="sm" color="link" outline caret><Avatar value="{ profileAvatar }" /></DropdownToggle>
                            <DropdownMenu>
                                <div style="column-count: 7;">
                                    {#each Object.values(AvatarEnum).filter(key => !Number.isInteger(key)) as value}
                                        <DropdownItem class="small px-0 py-1 px-md-2 py-md-1" title="{ value }" on:click={() => profileAvatar = value}>
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
                                    class="mb-1 { buttonStyle }"
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
                                    class="mb-1 { buttonStyle }"
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
                                    class="mb-1 { buttonStyle }"
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
                                    class="mb-1 { buttonStyle }"
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
                                        class="shadow-none mb-1 py-sm-1 px-sm-2 { reactions.indexOf(value) !== -1 ? 'border border-secondary bg-light' : '' }"
                                        style="padding: 0 0.2em"
                                        disabled="{ reactions.length >= 3 && reactions.indexOf(value) === -1 }"
                                        active="{ reactions.indexOf(value) !== -1 }"
                                        on:click={() => {
                                          const index = reactions.indexOf(value);
                                          if (index === -1) {
                                            reactions.push(value);
                                          } else {
                                            reactions.splice(index, 1);
                                          }
                                          reactions = reactions.slice(0, 3);
                                        }}
                                >
                                    <Emoji value="{ value }" /><div class="small reaction-name">{ value }</div>
                                </Button>&nbsp;
                            {/each}
                        {/if}
                    </td>
                </tr>
                </tfoot>
            </Table>

            <div class="d-flex mt-5 mb-3 align-items-center">
                <span class="h3">Results</span>
                &nbsp;&nbsp;&nbsp;
                <Button color="primary" size="sm" outline class="{ buttonStyle }" on:click={() => sendUpdate(!roomData.show ? 'show' : 'hide') }>{ !roomData?.show ? 'Show' : 'Hide' }</Button>
                &nbsp;&nbsp;&nbsp;
                <Label for="compare-mode" class="mb-1">Compare mode</Label>
                &nbsp;
                <Input type="switch"
                       id="compare-mode"
                       bind:value="{ compareMode }"
                       on:change={() => compareMode = !compareMode}
                       class="me-auto"
                />
                &nbsp;
                <div class="d-none d-md-inline-block">
                    <Button color="secondary" size="sm" outline class="{ buttonStyle }" on:click={() => sendUpdate('delete') }>Delete estimates</Button>
                    &nbsp;
                    <Button color="secondary" size="sm" outline class="{ buttonStyle }" on:click={() => sendUpdate('clear') }>Clear room</Button>
                </div>
            </div>
            <Table class="align-middle">
                <thead>
                <tr>
                    <th class="minimize-width"></th>
                    <th colspan="3" class="{ compareMode ? 'minimize-width' : '' }">Name</th>
                    <th class="{ !compareMode ? 'minimize-width' : '' }">Estimation</th>
                    {#if !compareMode}
                        <th class="d-none d-md-table-cell">Details</th>
                    {/if}
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
                                <div class="d-block d-md-none profile-name fw-light">{ item.profileName }</div>
                                <Avatar class="d-none d-md-block" value="{ item.profileAvatar }" />
                                {#if !compareMode}
                                    <div class="d-inline-block d-md-none mt-1">
                                        <Avatar size="sm" class="p-1" value="{ item.profileAvatar }" />
                                        {#if roomData.show || item.profileId === profileId}
                                            {#each item.reactions as reaction}
                                                <Emoji class="p-1" value="{ reaction }" />
                                            {/each}
                                        {/if}
                                    </div>
                                {/if}
                            </td>
                            <td class="p-0 p-md-2 minimize-width">
                                <div class="d-none d-md-table-cell">
                                    <span class="profile-name fw-light">{ item.profileName }</span>
                                </div>
                            </td>
                            <td class="p-0 p-md-2 minimize-width">
                                {#if !compareMode}
                                    <div class="d-none d-md-table-cell">
                                        {#if roomData.show || item.profileId === profileId}
                                            {#each item.reactions as reaction}
                                                <Emoji class="p-1" value="{ reaction }" />
                                            {/each}
                                        {/if}

                                    </div>
                                {/if}
                            </td>
                            <td class="{ !compareMode ? 'minimize-width' : '' }">
                                {#if roomData.show || item.profileId === profileId}
                                    <span class="fs-4">{ item.sp ?? '-' }</span>
                                {:else}
                                    <span class="fs-4">X</span>
                                {/if}
                                {#if !compareMode && (roomData.show || item.profileId === profileId)}
                                    <div class="d-block d-md-none text-break text-wrap">
                                        {#if null !== item.size}
                                            <span class="text-nowrap small">
                                                <span>Size:</span>&nbsp;
                                                <span class="text-{ getColor(item.size) }">{ item.size ?? '' }</span>
                                            </span>
                                        {/if}

                                        {#if null !== item.risk}
                                            {#if null !== item.size}<span class="text-muted small pe-1"></span>{/if}
                                            <span class="text-nowrap small text-{ getColor(item.risk) }">{ item.risk ?? '' }</span>
                                        {/if}

                                        {#if null !== item.status}
                                            {#if null !== item.risk || null !== item.size}<span class="text-muted small pe-1"></span>{/if}
                                            <span class="text-nowrap small text-{ getColor(item.status) }">{ item.status ?? '' }</span>
                                        {/if}

                                        {#if null !== sp && null !== (item.calculated ?? null)}
                                            {#if null !== item.risk || null !== item.size || null !== item.status}<span class="text-muted small pe-1">/</span>{/if}
                                            <span class="text-nowrap small text-muted" title="{ item.calculatedInfo ?? ''}"><Icon name="calculator" />&nbsp;{ item.calculated ?? ''}</span>
                                        {/if}
                                    </div>
                                {/if}
                            </td>
                            {#if !compareMode}
                                <td class="d-none d-md-table-cell">
                                    {#if roomData.show || item.profileId === profileId}
                                        {#if null !== item.size}
                                            <span class="text-nowrap small">
                                                <span>Size:</span>&nbsp;
                                                <span class="text-{ getColor(item.size) }">{ item.size ?? '' }</span>
                                            </span>
                                        {/if}

                                        {#if null !== item.risk}
                                            {#if null !== item.size}<span class="text-muted small px-1">/</span>{/if}
                                            <span class="text-nowrap small text-{ getColor(item.risk) }">{ item.risk ?? '' }</span>
                                        {/if}

                                        {#if null !== item.status}
                                            {#if null !== item.risk || null !== item.size}<span class="text-muted small px-1">/</span>{/if}
                                            <span class="text-nowrap small text-{ getColor(item.status) }">{ item.status ?? '' }</span>
                                        {/if}

                                        {#if null !== sp && null !== (item.calculated ?? null)}
                                            {#if null !== item.risk || null !== item.size || null !== item.status}<span class="text-muted small px-1">/</span>{/if}
                                            <span class="text-nowrap fs-5 text-muted" title="{ item.calculatedInfo ?? ''}"><Icon name="calculator" />&nbsp;{ item.calculated ?? ''}</span>
                                        {/if}
                                    {/if}
                                </td>
                            {/if}
                        </tr>
                    {/each}
                {/if}
                </tbody>
            </Table>

            <div class="d-block d-md-none mt-5">
                <Button color="secondary" size="sm" outline class="align-self-baseline { buttonStyle }" on:click={() => sendUpdate('delete') }>Delete estimates</Button>
                &nbsp;
                <Button color="secondary" size="sm" outline class="align-self-baseline { buttonStyle }" on:click={() => sendUpdate('clear') }>Clear room</Button>
            </div>
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
