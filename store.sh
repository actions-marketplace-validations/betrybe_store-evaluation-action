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
  ENDPOINT="https://api.betrybe.dev/projects-service/internal/v2/deliveries"
elif [[ "$ENVIRONMENT" == "production" ]]; then
  ENDPOINT="https://api.betrybe.com/projects-service/internal/v2/deliveries"
else
  ENVIRONMENT="development"
  ENDPOINT="http://localhost:4000/projects-service/internal/v2/deliveries"
fi

echo -e "${blue}[INFO] Checking changes to protected files"

changes=$(git diff-index --name-only HEAD)
protected_files=(".github/workflows/main.yml" "trybe.yml" ".trybe/requirements.json")

for file in ${protected_files[@]}
do
  if [[ "${changes[*]}" =~ $file ]]; then
    echo -e "${red}[ERROR] Execution error"
    echo -e "The file ${file} cannot be modified."
    exit 1
  fi
done

echo -e "${blue}[INFO] Sending evaluation information using →${reset} '$ENVIRONMENT'"

status_code=$(
  curl \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $EVALUATION_SECRET" \
  -d "$PAYLOAD" \
  --write-out %{response_code} \
  --silent \
  --output response_output.txt \
  $ENDPOINT
)

echo -e "${blue}[INFO] Status Code →${reset} '$status_code'"
if [[ "$status_code" == 201 ]]; then
  echo '### ✅ Avaliação registrada' >> $GITHUB_STEP_SUMMARY
  echo -e "${green}[INFO] Delivery created successfully ✓"
else
  echo '### ❌ Avaliação não registrada' >> $GITHUB_STEP_SUMMARY

  response=$(<response_output.txt)
  username=$(echo $PAYLOAD | jq -r '.github_username')

  if [[ $(echo $response | jq -r '.message') = "Student not found" ]]; then
    echo "Não foi possível encontrar o nome de usuário \`$username\` na lista de pessoas estudantes" >> $GITHUB_STEP_SUMMARY
  fi

  if [[ $(echo $response | jq ".errors // empty | .evaluations // empty[] | .[] | select(.requirement_id) | any(.requirement_id[]; IN(\"can't be blank\"))") = true ]]; then 
    echo "Os requisitos do projeto não são válidos" >> $GITHUB_STEP_SUMMARY
  fi

  echo -e "${red}[ERROR] Execution error"
  echo -e "${red}[ERROR] Response ↓${reset}"
  echo $response
  exit 1
fi
