/**
 * @see https://github.com/sveltejs/kit/issues/887
 */

import bodyParser from 'body-parser';

let clients = [];

let rooms = {};

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function cleanRooms() {
    if (Object.values(rooms).length > 100) {
        const index = Object.values(rooms).sort((a, b) => a.updatedAt - b.updatedAt)[0].roomNumber
        delete rooms[index]
    }
}

function buildRoomResponse(room, profileId) {
    let response = {
        roomNumber: room.roomNumber,
        show: room.show,
        data: []
    }

    room.data.forEach(item => {
        let data = {...item}
        if (item.profileId !== profileId) {
            delete data.profileId
        }

        // TODO Add enums (ts support)
        function getOffset(value) {
            switch (value) {
                case 'XS': return 0
                case 'S': return 1
                case 'M': return 2
                case 'L': return 3
                case 'XXL': return 7
                case 'Safe': return 0
                case 'Unclear': return 1
                case 'Risky': return 2
                case 'Ready': return 0
                case 'Solution/Contract required': return 1
                case 'Needs research': return 3
            }
            return 0
        }

        const spScale = [0, 1, 2, 3, 5, 8, 13, 20, 40, 100]
        data.calculated = spScale[Math.min(spScale.length - 1, getOffset(data.size) + getOffset(data.risk) + getOffset(data.status))]
        data.calculatedInfo = 'Size +' + getOffset(data.size) + '\nRisk +' + getOffset(data.risk) + '\nStatus +' + getOffset(data.status);

        const busy3min = data.online === 'Busy' && data.updatedAt + 180000 < Date.now()
        const away10min = data.updatedAt + 600000 < Date.now()
        if (item.profileId !== profileId && (busy3min || away10min)) {
            data.online = 'Offline'
        }

        response.data.push(data)
    })

    return response
}

const handler = async (req, res, next) => {
    const [ , profileId ] = req.url.match(/\?profileId=(.*)$/) ?? []
    const [ , roomNumber ] = req.url.match(/^\/room\/(\d+)\/updates/) ?? []

    if (undefined === profileId) {
        next();
        return;
    }

    if (req.url.startsWith('/room?') && req.method === 'POST') {
        // Using this middleware directly in polka stack causes infinite awaiting on 404 page

        await new Promise((resolve) => {
            bodyParser.json()(req, res, () => {
                let roomIndex
                do {
                    roomIndex = getRandomInt(99999)
                } while (undefined !== rooms[roomIndex])

                rooms[roomIndex] = {
                    ownerId: profileId,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    roomNumber: roomIndex,
                    data: []
                }
                rooms[roomIndex].data.push({...{ profileId }, ...req.body.item});

                res.end(`${JSON.stringify(buildRoomResponse(rooms[roomIndex], profileId))}\n`);

                resolve();
            })
        });

        cleanRooms()

        return;
    }

    if (undefined === roomNumber || undefined === rooms[roomNumber]) {
        next();
        return;
    }

    if (req.method === 'GET') {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no',
        });
        res.write('\n');

        const data = `data: ${JSON.stringify(buildRoomResponse(rooms[roomNumber], profileId))}\n\n`;
        res.write(data);
        clients.push({
            profileId,
            res
        });

        req.on('close', () => {
            clients = clients.filter(client => client.res !== res);
        });

        return;
    }

    if (req.method === 'PATCH') {
        // Using this middleware directly in polka stack causes infinite awaiting on 404 page
        await new Promise((resolve) => {
            bodyParser.json()(req, res, () => {
                rooms[roomNumber].updatedAt = Date.now();

                const updateData = { ...req.body.item, ...{ updatedAt: Date.now() }}
                let index = rooms[roomNumber].data.findIndex(item => item.profileId === profileId)
                if (-1 === index) {
                    rooms[roomNumber].data.push(updateData)
                } else {
                    rooms[roomNumber].data[index] = updateData
                }

                switch (req.body.action) {
                    case 'show':
                        rooms[roomNumber].show = true
                        break;
                    case 'hide':
                        rooms[roomNumber].show = false
                        break;
                    case 'reset':
                        rooms[roomNumber].data.forEach(item => {
                            item.sp = null
                            item.size = null
                            item.risk = null
                            item.status = null
                            item.reactions = []
                        })
                        rooms[roomNumber].show = false
                        break;
                    case 'clear':
                        rooms[roomNumber].data = [
                            updateData
                        ];
                        break;
                }

                res.end(`data: ${JSON.stringify(buildRoomResponse(rooms[roomNumber], profileId))}\n\n`);

                clients.forEach(client => {
                    client.res.write(`data: ${JSON.stringify(buildRoomResponse(rooms[roomNumber], client.profileId))}\n\n`)
                });

                resolve();
            })
        });

        return;
    }

    next();
}

export default handler;
