import * as github from '@actions/github'
import { Base64 } from 'base64-string'
import * as core from '@actions/core'

const enc = new Base64()
const token = process.env.TOKEN
const prNumber = process.env.PR_NUMBER
const ghUsername = process.env.GH_USERNAME
const octokit = github.getOctokit(token)
const gradeToApprove = 3
const evaluationData = JSON.parse(enc.decode(process.env.EVALUATION_DATA))
const { owner, repo } = github.context.issue

const githubService = {
  async createFeedback(delivery) {
    core.info('\u001B[34m[INFO] Creating feedback...')

    return await octokit.rest.issues.createComment({
      issue_number: prNumber,
      owner,
      repo,
      body: generateComment(delivery)
    })
      .then((response) => {
        core.info('\u001B[34m[INFO] Feedback created successfully ✓')

        return {
          status: response.status,
          comment: response.data.body
        }
      })
      .catch((error) => {
        core.setFailed(`[ERROR] Could not create feedback. Status: ${error.status}. Reason: ${error.response.data.message}`)

        return {
          status: error.response.status,
          reason: error.response.data.message
        }
      })
  },

  async createSummaryMessage(responseData) {
    if (responseData.message && responseData.message === 'Student not found') {
      return await core.summary
        .addHeading('❌ Avaliação não registrada', 2)
        .addRaw(`Não foi possível encontrar o nome de usuário ${ghUsername} na lista de pessoas estudantes`)
        .write()
    }
  
    if (responseData.message && responseData.message === 'Delivery not found') {
      return await core.summary
        .addHeading('❌ Avaliação não registrada', 2)
        .addRaw(`Entrega não encontrada para o commit ${commitHash}. A entrega pode não ter sido registrada por:`)
        .addList([
          'O projeto não ter sido encontrado pelo nome',
          'A pessoa estudante não ter sido encontrada pelo username'
        ])
        .write()
    }
  
    if (responseData.errors && responseData.errors.evaluations && responseData.errors.evaluations.find(ev => ev.requirement_id)) {
      return await core.summary
        .addHeading('❌ Avaliação não registrada', 2)
        .addRaw('Os requisitos do projeto não são válidos')
        .write()
    }
  }
}

function generateComment(delivery) {
  const comment = `
**Olá ${ghUsername}!**
Acompanhe a avaliação do seu commit diretamente na [página do projeto](${delivery.project_url}).

O feedback pode demorar até alguns minutos para aparecer. Caso esteja tendo problemas, **fale com nosso time**.

### Resultado por requisito
*Nome* | *Avaliação*
--- | :---:
${generateEvaluationsTable()}
`

  return comment
}

function generateEvaluationsTable() {
  return evaluationData.evaluations.reduce((acc, evaluation) => {
    const description = evaluation.description
    const grade = evaluation.grade ? evaluation.grade : 0
    
    return `${acc}${description} | ${getResultEmoji(grade)}\n`
  }, '')
}

const getResultEmoji = (grade) => {
  return grade >= gradeToApprove ? ':heavy_check_mark:' : ':heavy_multiplication_x:'
}

export default githubService
