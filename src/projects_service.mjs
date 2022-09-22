import axios from 'axios'
import { Base64 } from 'base64-string'
import * as core from '@actions/core'

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

const endpoint = `${apiDomains[environment]}/projects-service/external/v1/deliveries/${commitHash}`
const options = { headers: { 'Authorization': `Basic ${evaluationSecret}` } }
const payload = { ...evaluationData, processor_version: 2 }

const evaluationService = {
  async save() {
    core.info(`\u001B[34m[INFO] Sending evaluation information using → ${environment}`)

    return await axios.patch(endpoint, payload, options)
      .then(async (response) => {
        core.info('\u001B[34m[INFO] Delivery updated successfully ✓')
        return { status: response.status, data: response.data.data }
      })
      .catch(async (error) => ({ status: error.response.status, data: error.response.data }))
  },
}

export default evaluationService
