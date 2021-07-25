#!/bin/bash

set -e
set -o pipefail

eval $(docker-machine env rum-poker)

(
  source .env \
  && docker-compose build
)

docker-machine scp -r -d ${PWD}/ rum-poker:/var/app/

docker-compose up -d
docker-compose ps
docker-compose logs
docker image prune -a
