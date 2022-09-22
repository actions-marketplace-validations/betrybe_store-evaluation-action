import * as github from '@actions/github'
import { Base64 } from 'base64-string'
import * as core from '@actions/core'

const enc = new Base64()
const token = process.env.TOKEN
const prNumber = process.env.PR_NUMBER
const ghUsername = process.env.GH_USERNAME
const commitHash = process.env.COMMIT_HASH
const octokit = github.getOctokit(token)
const gradeToApprove = 3
const evaluationData = JSON.parse(enc.decode(process.env.EVALUATION_DATA))
const defaultBranch = process.env.DEFAULT_BRANCH

const githubService = {
  repoIsTemplate(owner, repo) {
    return owner === 'betrybe' && repo.includes('0x')
  },

  async createFeedback(owner, repo, delivery) {
    core.info('\u001B[34m[INFO] Creating feedback...')

    return await octokit.rest.issues.createComment({
      issue_number: prNumber,
      owner,
      repo,
      body: this.buildComment(delivery)
    })
      .then((response) => {
        core.info('\u001B[34m[INFO] Feedback created successfully ✓')
        return { status: response.status, data: response.data.body }
      })
      .catch((error) => ({ status: error.response.status, data: error.response.data }))
  },

  async createErrorSummaryMessage(owner, repo, data) {
    if (data.message && data.message === 'Invalid Changes') {
      const protectedFiles = data.files.map(file => `<code>${file}</code>`).join(', ')
      return await core.summary
        .addHeading('❌ Avaliação não registrada', 2)
        .addRaw('Arquivos protegidos foram alterados')
        .addRaw(`Os seguintes arquivos não podem ser alterados: ${protectedFiles}`)
        .write()
    }

    if (data.message && data.message === 'Delivery not found') {
      return await core.summary
        .addHeading('❌ Avaliação não registrada', 2)
        .addRaw(`Entrega não encontrada para o commit <code>${commitHash}</code>.<br /><br />`)
        .addRaw('A entrega pode não ter sido registrada por:')
        .addList([
          `O projeto não ter sido encontrado pelo nome <code>${repo}</code>`,
          `A pessoa estudante não ter sido encontrada pelo username <code>${ghUsername}</code>`
        ])
        .write()
    }

    if (data.errors && data.errors.evaluations && data.errors.evaluations.find(ev => ev.requirement_id)) {
      return await core.summary
        .addHeading('❌ Avaliação não registrada', 2)
        .addRaw('Os requisitos do projeto não são válidos')
        .write()
    }

    return await core.summary.addHeading('❌ Avaliação não registrada', 2).write()
  },

  async hasInvalidChanges(owner, repo, protectedFiles) {
    core.info('\u001B[34m[INFO] Checking changes in protected files')
    const modifiedFiles = await fetchModifiedFiles(owner, repo, defaultBranch, commitHash)
    return modifiedFiles.some((modifiedFile) => protectedFiles.includes(modifiedFile.filename))
  },

  buildComment(delivery) {
    return `${commentHeader(delivery?.project_url)}\n  \n` +
      '### Resultado por requisito\n' +
      '*Nome* | *Avaliação*\n' +
      '--- | :---:\n' +
      `${generateEvaluationsTable()}`
  }
}

const fetchModifiedFiles = async (owner, repo, defaultBranch, headCommit) => {
  return await octokit.rest.repos.compareCommitsWithBasehead({
    owner,
    repo,
    basehead: `${defaultBranch}...${headCommit}`
  })
    .then(response => response.data.files.filter(file => file.status === 'modified')
    ).catch(error => {
      core.setFailed(`[ERROR] Could not fetch modified files. Status: ${error.status}. Reason: ${error.response.data.message}`)
    })
}

const commentHeader = (project_url) => {
  if (!project_url) return 'Repositório template, avaliação não registrada.'

  return `**Olá ${ghUsername}!**\n` +
    `Acompanhe a avaliação do seu commit diretamente na [página do projeto](${project_url}).\n` +
    'O feedback pode demorar até alguns minutos para aparecer. Caso esteja tendo problemas, **fale com nosso time**.'
}

const generateEvaluationsTable = () => {
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
