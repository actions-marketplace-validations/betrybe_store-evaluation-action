import axios from 'axios'
import { Base64 } from 'base64-string'
import * as core from '@actions/core'
import githubService from './github_service.mjs'

const enc = new Base64()
const commitHash = process.env.COMMIT_HASH
const environment = process.env.ENVIRONMENT
const evaluationSecret = process.env.EVALUATION_SECRET
const evaluationData = JSON.parse(enc.decode(process.env.EVALUATION_DATA))

const apiDomains = {
  'test': 'http://localhost:4000',
  'development': 'http://localhost:4000',
  'staging': 'https://api.betrybe.dev',
  'production': 'https://api.betrybe.com',
}

const endpoint = `${apiDomains[environment]}/projects-service/internal/v1/deliveries/${commitHash}`

const payload = {
  ...evaluationData,
  processor_version: 2
}

const evaluationService = {
  async save() {
    core.info(`\u001B[34m[INFO] Sending evaluation information using → ${environment}`)

    return await axios.patch(endpoint, payload, {headers: {'Authorization': `Basic ${evaluationSecret}`}})
      .then(async (response) => {
        const delivery = response.data.data

        core.info('\u001B[34m[INFO] Delivery updated successfully ✓')

        await githubService.createFeedback(delivery)
        
        return delivery
      })
      .catch(async (error) => {
        core.setFailed(`[ERROR] Evaluation could not be sent. Status: ${error.response.status}. Reason: ${JSON.stringify(error.response.data)}`)

        await githubService.createSummaryMessage(error.response.data)

        return {
          status: error.response.status,
          reason: error.response.data
        }
      }) 
  }
}

export default evaluationService
