#!/bin/bash
set -e

red='\033[0;31m'
blue='\033[36m'

echo -e "${blue}[INFO] Checking changes to protected files"

changes=$(git diff-index --name-only HEAD)
protected_files=(".github/workflows/main.yml" "trybe.yml" ".trybe/requirements.json")

for file in ${protected_files[@]}; do
  if [[ "${changes[*]}" =~ $file ]]; then
    echo -e "${red}[ERROR] Execution error"
    echo -e "The file ${file} cannot be modified."
    exit 1
  fi
done
