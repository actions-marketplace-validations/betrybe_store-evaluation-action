#!/bin/bash
set -e

PAYLOAD=$(echo $EVALUATION_DATA \
  | base64 -d \
  | jq -c --arg number $PR_NUMBER '. + {pr_number: $number}'
)

if [[ "$ENVIRONMENT" == "staging" ]]; then
  ENDPOINT="https://projects-service.betrybe.dev/api/v1/deliveries"
elif [[ "$ENVIRONMENT" == "production" ]]; then
  ENDPOINT="https://projects-service.betrybe.com/api/v1/deliveries"
else
  ENVIRONMENT="development"
  ENDPOINT="http://localhost:4000/api/v1/deliveries"
fi

echo "Sending evaluation information using '$ENVIRONMENT'..."

status_code=$(
  curl \
  -X POST \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  --write-out %{http_code} \
  --silent \
  --output /dev/null \
  $ENDPOINT
)

if [[ "$status_code" == 201 ]]; then
  echo "Done!"
else
  echo "Execution error"
  exit 1
fi
