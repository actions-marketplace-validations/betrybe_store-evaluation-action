# store-evaluation-action
Essa action recebe os dados de avaliação de um avaliador, manda para o [projects-service](https://github.com/betrybe/projects-service), e cria o comentário de feedback no Pull Request.

Caso ela esteja sendo executada em um repositório template, ela somente faz o comentário de feedback.

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
    ref: v7
    token: ${{ secrets.GIT_HUB_PAT }}
    path: .github/actions/store-evaluation

- name: Run Store evaluation
  uses: ./.github/actions/store-evaluation
  with:
    environment: production
    token: ${{ secrets.GITHUB_TOKEN }}
    evaluation-data: ${{ steps.evaluator.outputs.result }}
```
