#!/bin/bash

set -e
set -o pipefail

docker-machine rm rum-poker -f

source .env

docker-machine create \
  --driver digitalocean \
  --engine-install-url "https://releases.rancher.com/install-docker/19.03.9.sh" \
  --digitalocean-region ams3 \
  --digitalocean-image ubuntu-20-04-x64 \
  --digitalocean-size s-1vcpu-1gb \
  --digitalocean-access-token $DOTOKEN \
  --digitalocean-monitoring \
  --digitalocean-ssh-key-fingerprint $DO_SSH_KEY_FINGERPRINT \
  --digitalocean-ssh-key-path $DO_SSH_KEY_PATH \
  --digitalocean-private-networking \
  rum-poker

./deploy.sh
