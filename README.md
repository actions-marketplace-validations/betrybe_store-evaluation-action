# store-evaluation-action
Action to store evaluation in Tryber projects

This action receives evaluation data from an evaluator and store it in Forest Admin.

## Inputs

### `evaluation-data`

JSON with structure below in the base64 format:

```json
{
  "github_username": "String",
  "github_repository_name": "String",
  "evaluations": [{
    "description": "String",
    "grade": "Integer"
  }, {...}]
}
```

### `environment`

Must be:

- development
- staging
- production

### `pr-number`

Pull Request number that trigger build.

## Usage example
```yml
- name: Evaluator
  id: evaluator
  uses: betrybe/jest-evaluator-action
- name: Store evaluation action
  uses: betrybe/store-evaluation-action@v2
  with:
    evaluation-data: ${{ steps.evaluator.outputs.result }}
    environment: production
    pr-number: ${{ github.event.inputs.pr_number }}
```

## Learn about GitHub Actions

- https://help.github.com/en/actions/automating-your-workflow-with-github-actions/creating-a-docker-container-action
