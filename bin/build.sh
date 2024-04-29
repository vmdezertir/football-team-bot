#!/usr/bin/env bash

echo "---Build stack---"

if [ ! -f ".env" ]; then
  echo ".env file bot exist! Please create"
  exit 1
fi

echo "--Clean before start--"

docker compose --env-file .env -f compose.yaml down

docker system prune -f

echo "--Start build--"

docker compose --env-file .env -f compose.yaml up --build

echo "--Done--"

docker compose --env-file .env -f compose.yaml ps
