# store-evaluation-action
Essa action recebe os dados de avaliação de um avaliador e manda para o [projects-service](https://github.com/betrybe/projects-service).

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

Deve ser:

- development
- staging
- production

### `token`

Token do projeto que está rodando o avaliador

## Exemplo de uso
```yml
- name: Fetch Store evaluation
    uses: actions/checkout@v2
  with:
    repository: betrybe/store-evaluation-action
    ref: v6.0
    token: ${{ secrets.GIT_HUB_PAT }}
    path: .github/actions/store-evaluation

- name: Run Store evaluation
  uses: ./.github/actions/store-evaluation
  with:
    environment: production
    token: ${{ secrets.GITHUB_TOKEN }}
    evaluation-data: ${{ steps.evaluator.outputs.result }}
```

## Aprenda mais sobre GitHub Actions

- https://help.github.com/en/actions/automating-your-workflow-with-github-actions/creating-a-docker-container-action
