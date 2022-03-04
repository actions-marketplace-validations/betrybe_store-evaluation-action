#!/bin/bash
set -e

red='\033[0;31m'
green='\033[32m'
blue='\033[36m'
reset='\033[0m'

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

echo -e "${blue}[INFO] Sending evaluation information using →${reset} '$ENVIRONMENT'"

status_code=$(
  curl \
  -X POST \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  --write-out %{response_code} \
  --silent \
  --output response_output.txt \
  $ENDPOINT
)

echo -e "${blue}[INFO] Status Code →${reset} '$status_code'"
if [[ "$status_code" == 201 ]]; then
  echo -e "${green}[INFO] Delivery created successfully ✓"
else
  echo -e "${red}[ERROR] Execution error"
  echo -e "${red}[ERROR] Response ↓${reset}" | cat - response_output.txt
  exit 1
fi
