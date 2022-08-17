import nock from 'nock'
import { Base64 } from 'base64-string'
import * as core from '@actions/core'

import evaluationService from '../src/evaluation_service.mjs'
import githubService from '../src/github_service.mjs'
const enc = new Base64()

describe('send evaluation to projects-service', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })
  
  it('should save evaluation with success', async () => {
    jest.spyOn(core, 'info').mockImplementation(jest.fn())
    jest.spyOn(core, 'info').mockImplementation(jest.fn())
    jest.spyOn(githubService, 'createFeedback').mockImplementation(jest.fn())
    jest.spyOn(evaluationService, 'hasInvalidChanges').mockReturnValue(false)
    const evaluationData = JSON.parse(enc.decode(process.env.EVALUATION_DATA))

    const payload = {
      ...evaluationData,
      processor_version: 2
    }

    nock('http://localhost:4000')
      .patch(`/projects-service/internal/v1/deliveries/${process.env.COMMIT_HASH}`, payload)
      .reply(200, {
        data: {
          id: 1,
          process_status: 'waiting_process'
        }
      })
    
    const result = await evaluationService.save()
    
    expect(core.info).toHaveBeenCalledTimes(2)
    expect(githubService.createFeedback).toHaveBeenCalled()
    expect(evaluationService.hasInvalidChanges).toHaveBeenCalled()
    expect(result.id).toBe(1)
    expect(result.process_status).toBe('waiting_process')
  })

  it('should returns error when commit hash doesn\'t exists', async () => {
    jest.spyOn(core, 'info').mockImplementation(jest.fn())
    jest.spyOn(core, 'setFailed').mockImplementation(jest.fn())
    jest.spyOn(githubService, 'createSummaryMessage').mockImplementation(jest.fn())
    jest.spyOn(githubService, 'createFeedback')
    jest.spyOn(evaluationService, 'hasInvalidChanges').mockReturnValue(false)
    
    const evaluationData = JSON.parse(enc.decode(process.env.EVALUATION_DATA))

    const payload = {
      ...evaluationData,
      processor_version: 2
    }

    nock('http://localhost:4000')
      .patch(`/projects-service/internal/v1/deliveries/${process.env.COMMIT_HASH}`, payload)
      .reply(422, {message: 'Delivery not found'})

    const result = await evaluationService.save()
      
    expect(core.setFailed).toHaveBeenCalledTimes(1)
    expect(core.info).toHaveBeenCalledTimes(1)
    expect(githubService.createSummaryMessage).toHaveBeenCalled()
    expect(githubService.createFeedback).not.toHaveBeenCalled()
    expect(evaluationService.hasInvalidChanges).toHaveBeenCalled()

    expect(result).toEqual({
      status: 422,
      reason: { message: 'Delivery not found' }
    })
  })
  
  it('shouldn\'t store evaluation when protected files is changed', async () => {
    jest.spyOn(core, 'setFailed').mockImplementation(jest.fn())
    jest.spyOn(githubService, 'createFeedback')
    jest.spyOn(evaluationService, 'hasInvalidChanges').mockReturnValue(true)

    await evaluationService.save()

    expect(evaluationService.hasInvalidChanges).toHaveBeenCalled()
    expect(core.setFailed).toHaveBeenCalledTimes(1)
    expect(githubService.createFeedback).not.toHaveBeenCalled()
  })
})

describe('validates changes in protected files', () => {
  it('returns falsy when changes not includes protected files', async () => {
    jest.spyOn(core, 'info').mockImplementation(jest.fn())
    jest.spyOn(githubService, 'fetchModifiedFiles').mockReturnValue([
      {
        filename: 'index.js',
        status: 'modified'
      }
    ])

    const result = await evaluationService.hasInvalidChanges()

    expect(result).toBeFalsy()
    expect(core.info).toHaveBeenCalledTimes(1)
  })

  it('returns truthy when changes includes protected files', async () => {
    jest.spyOn(core, 'setFailed').mockImplementation(jest.fn())
    jest.spyOn(githubService, 'fetchModifiedFiles').mockReturnValue([
      {
        filename: '.github/workflows/main.yml',
        status: 'modified'
      },
      {
        filename: 'trybe.yml',
        status: 'modified'
      },
      {
        filename: '.trybe/requirements.json',
        status: 'modified'
      },
    ])

    const result = await evaluationService.hasInvalidChanges()

    expect(result).toBeTruthy()
  })
})
