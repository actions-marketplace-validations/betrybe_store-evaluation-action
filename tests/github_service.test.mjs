import nock from 'nock'
import * as core from '@actions/core'
import githubService from '../src/github_service.mjs'

const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/')

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
