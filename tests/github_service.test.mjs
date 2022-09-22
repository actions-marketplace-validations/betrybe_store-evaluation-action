import nock from 'nock'
import * as core from '@actions/core'
import githubService from '../src/github_service.mjs'

const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/')
const delivery = { id: 1, project_url: 'https://app.betrybe.com/project-page' }

const commentTable = `  
### Resultado por requisito
*Nome* | *Avaliação*
--- | :---:
01 - Classe Race | :heavy_multiplication_x:
02 - Classes que herdam de Race | :heavy_multiplication_x:
03 - Energy | :heavy_multiplication_x:
04 - Classe Archetype | :heavy_multiplication_x:
05 - Classes que herdam de Archetype | :heavy_multiplication_x:
06 - Interface Fighter | :heavy_multiplication_x:
07 - Classe Character | :heavy_multiplication_x:
08 - Interface SimpleFighter | :heavy_multiplication_x:
09 - Classe Monster | :heavy_multiplication_x:
10 - Classe PVP | :heavy_multiplication_x:
11 - Classe PVE | :heavy_multiplication_x:
12 - Classe Dragon | :heavy_multiplication_x:
13 - Arquivo index | :heavy_multiplication_x:
`

const expectedProjectComment = `**Olá ${process.env.GH_USERNAME}!**
Acompanhe a avaliação do seu commit diretamente na [página do projeto](${delivery.project_url}).
O feedback pode demorar até alguns minutos para aparecer. Caso esteja tendo problemas, **fale com nosso time**.
${commentTable}`

const expectedTemplateComment = `Repositório template, avaliação não registrada.
${commentTable}`


describe('validate template detection', () => {
  it('should return true if the repository is a template', async () => {
    const result = githubService.repoIsTemplate('betrybe', 'project-0x-testing-library')
    expect(result).toBe(true)
  })

  it('should return false if the repository is not a template', async () => {
    const result = githubService.repoIsTemplate('betrybe', 'project-00-testing-library')
    expect(result).toBe(false)
  })

  it('should return false if the repository is not in the betrybe org', async () => {
    const result = githubService.repoIsTemplate('tryber', 'project-00-testing-library')
    expect(result).toBe(false)
  })

  it('should return false if the repository is not in the betrybe org and it has template naming', async () => {
    const result = githubService.repoIsTemplate('tryber', 'project-0x-testing-library')
    expect(result).toBe(false)
  })
})

describe('detect invalid changes', () => {
  afterEach(() => jest.restoreAllMocks())

  it('should return true if an protected file was modified', async () => {
    jest.spyOn(core, 'info').mockImplementation(jest.fn())

    const mockFiles = [
      { status: 'modified', filename: 'trybe.yml' },
      { status: 'added', filename: 'src/foo.js' }
    ]

    nock('https://api.github.com').get(/.*/).reply(200, { files: mockFiles })

    const protectedFiles = ['.github/workflows/main.yml', 'trybe.yml', '.trybe/requirements.json']
    const result = await githubService.hasInvalidChanges(owner, repo, protectedFiles)

    expect(result).toEqual(true)
    expect(core.info).toHaveBeenCalledWith('\u001B[34m[INFO] Checking changes in protected files')
  })

  it('should return false if no protected file was modified', async () => {
    jest.spyOn(core, 'info').mockImplementation(jest.fn())

    const mockFiles = [
      { status: 'modified', filename: 'index.js' },
      { status: 'added', filename: 'src/foo.js' }
    ]

    nock('https://api.github.com').get(/.*/).reply(200, { files: mockFiles })

    const protectedFiles = ['.github/workflows/main.yml', 'trybe.yml', '.trybe/requirements.json']
    const result = await githubService.hasInvalidChanges(owner, repo, protectedFiles)

    expect(result).toEqual(false)
    expect(core.info).toHaveBeenCalledWith('\u001B[34m[INFO] Checking changes in protected files')
  })
})

describe('send feedback to pull request', () => {
  afterEach(() => jest.restoreAllMocks())

  it('must be create feedback comment with success', async () => {
    jest.spyOn(core, 'info').mockImplementation(jest.fn())

    nock('https://api.github.com').post(/.*/)
      .reply(201, {
        id: 123,
        body: expectedProjectComment,
        url: `https://api.github.com/repos/${owner}/${repo}/issues/comments/123`
      })

    const result = await githubService.createFeedback(owner, repo, delivery)

    expect(core.info).toHaveBeenCalledWith('\u001B[34m[INFO] Creating feedback...')
    expect(core.info).toHaveBeenCalledWith('\u001B[34m[INFO] Feedback created successfully ✓')
    expect(result).toEqual({ status: 201, data: expectedProjectComment })
  })

  it('should returns error when request failed', async () => {
    jest.spyOn(core, 'info').mockImplementation(jest.fn())

    nock('https://api.github.com').post(/.*/).reply(401, { message: 'Bad credentials' })

    const result = await githubService.createFeedback(owner, repo, delivery)

    expect(core.info).toHaveBeenCalledTimes(1)
    expect(core.info).toHaveBeenCalledWith('\u001B[34m[INFO] Creating feedback...')
    expect(result).toEqual({ status: 401, data: { message: 'Bad credentials' } })
  })
})

describe('build the comment feedback', () => {
  afterEach(() => jest.restoreAllMocks())

  it('must build the feedback comment for regular projects', async () => {
    const result = githubService.buildComment(delivery)
    expect(result).toEqual(expectedProjectComment)
  })

  it('must build the feedback comment for templates', async () => {
    const result = githubService.buildComment()
    expect(result).toEqual(expectedTemplateComment)
  })
})
