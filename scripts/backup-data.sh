#!/bin/sh
set -eu

mkdir -p backups

timestamp="$(date +"%Y-%m-%d-%H-%M-%S")"
cp data/assets.json "backups/assets-${timestamp}.json"

echo "Backup created: backups/assets-${timestamp}.json"
