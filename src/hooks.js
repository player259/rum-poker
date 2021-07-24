import sseServer from '$lib/sseServer'

export function sseServerMiddleware(req, res, next) {
    return sseServer(req, res, next)
}
