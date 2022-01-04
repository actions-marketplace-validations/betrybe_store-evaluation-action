#!/bin/bash
set -e

PAYLOAD=$(echo $EVALUATION_DATA \
  | base64 -d \
  | jq -c --arg number $PR_NUMBER '. + {pr_number: $number}'
)

if [[ "$ENVIRONMENT" == "staging" ]]; then
  ENDPOINT="https://evaluation-platform.betrybe.dev/v2/evaluation"
elif [[ "$ENVIRONMENT" == "production" ]]; then
  ENDPOINT="https://evaluation-platform.betrybe.com/v2/evaluation"
else
  ENVIRONMENT="development"
  ENDPOINT="http://localhost:3310/v2/evaluation"
fi

echo "Sending evaluation information using '$ENVIRONMENT'..."
curl \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  $ENDPOINT
echo "Done!"
