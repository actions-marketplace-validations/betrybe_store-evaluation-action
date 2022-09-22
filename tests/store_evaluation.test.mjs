import nock from 'nock'
import { Base64 } from 'base64-string'
import * as core from '@actions/core'

import githubService from '../src/github_service.mjs'
import projectsService from '../src/projects_service.mjs'
import storeEvaluation from '../src/store_evaluation.mjs'
const enc = new Base64()

describe('send evaluation to projects-service and treat errors if it is a regular project', () => {
  afterEach(() => jest.restoreAllMocks())

  const owner = 'betrybe'
  const repo = 'project-00-testing-library'

  it('should save evaluation with success', async () => {
    const evaluationData = JSON.parse(enc.decode(process.env.EVALUATION_DATA))

    jest.spyOn(core, 'info').mockImplementation(jest.fn())
    jest.spyOn(githubService, 'createFeedback').mockImplementation(jest.fn(() => ({ status: 201 })))
    jest.spyOn(githubService, 'hasInvalidChanges').mockReturnValue(false)
    jest.spyOn(projectsService, 'save').mockImplementation(jest.fn(() => ({ status: 200, data: { ...evaluationData, processor_version: 2 } })))

    await storeEvaluation(owner, repo)

    expect(githubService.createFeedback).toHaveBeenCalled()
    expect(githubService.hasInvalidChanges).toHaveBeenCalled()
  })

  it('should treat invalid changes', async () => {
    jest.spyOn(core, 'setFailed').mockImplementation(jest.fn())
    jest.spyOn(core.summary, 'write').mockImplementation(jest.fn())
    jest.spyOn(githubService, 'hasInvalidChanges').mockReturnValue(true)
    jest.spyOn(githubService, 'createFeedback').mockImplementation(jest.fn(() => ({ status: 201 })))

    await storeEvaluation(owner, repo)

    expect(core.setFailed).toHaveBeenCalledWith('[ERROR] The files .github/workflows/main.yml, trybe.yml, .trybe/requirements.json cannot be modified.')
    expect(githubService.hasInvalidChanges).toHaveBeenCalled()
    expect(githubService.createFeedback).toHaveBeenCalledTimes(0)
    expect(core.summary.write).toHaveBeenCalled()
  })

  it('should treat saving the delivery errors', async () => {
    jest.spyOn(core, 'info').mockImplementation(jest.fn())
    jest.spyOn(core, 'setFailed').mockImplementation(jest.fn())
    jest.spyOn(core.summary, 'write').mockImplementation(jest.fn())
    jest.spyOn(githubService, 'hasInvalidChanges').mockReturnValue(false)
    jest.spyOn(githubService, 'createFeedback').mockImplementation(jest.fn(() => ({ status: 201 })))
    jest.spyOn(projectsService, 'save').mockImplementation(jest.fn(() => ({ status: 400, data: { message: 'Delivery not found' } })))

    await storeEvaluation(owner, repo)

    expect(core.setFailed).toHaveBeenCalledWith('[ERROR] Evaluation could not be sent. Status: 400. Data: {\"message\":\"Delivery not found\"}')
    expect(githubService.hasInvalidChanges).toHaveBeenCalled()
    expect(githubService.createFeedback).toHaveBeenCalledTimes(0)
    expect(core.summary.write).toHaveBeenCalled()
  })

  it('should treat create feedback errors', async () => {
    const evaluationData = JSON.parse(enc.decode(process.env.EVALUATION_DATA))

    jest.spyOn(core, 'info').mockImplementation(jest.fn())
    jest.spyOn(core, 'setFailed').mockImplementation(jest.fn())
    jest.spyOn(githubService, 'hasInvalidChanges').mockReturnValue(false)
    jest.spyOn(githubService, 'createFeedback').mockImplementation(jest.fn(() => ({ status: 500, data: { message: 'Internal Server Error' } })))
    jest.spyOn(projectsService, 'save').mockImplementation(jest.fn(() => ({ status: 200, data: { ...evaluationData, processor_version: 2 } })))

    await storeEvaluation(owner, repo)

    expect(core.setFailed).toHaveBeenCalledWith('[ERROR] Could not create feedback. Status: 500. Data: {\"message\":\"Internal Server Error\"}')
    expect(githubService.hasInvalidChanges).toHaveBeenCalled()
    expect(githubService.createFeedback).toHaveBeenCalledTimes(1)
  })
})

describe('does not send evaluation to projects-service if it is a template', () => {
  afterEach(() => jest.restoreAllMocks())

  const owner = 'betrybe'
  const repo = 'project-0x-testing-library'

  it('should save evaluation with success', async () => {
    jest.spyOn(core, 'info').mockImplementation(jest.fn())
    jest.spyOn(githubService, 'createFeedback').mockImplementation(jest.fn(() => ({ status: 201 })))
    jest.spyOn(githubService, 'hasInvalidChanges').mockReturnValue(false)
    jest.spyOn(projectsService, 'save').mockImplementation(jest.fn())

    await storeEvaluation(owner, repo)

    expect(githubService.createFeedback).toHaveBeenCalled()
    expect(githubService.hasInvalidChanges).toHaveBeenCalled()
    expect(projectsService.save).toHaveBeenCalledTimes(0)
  })
})