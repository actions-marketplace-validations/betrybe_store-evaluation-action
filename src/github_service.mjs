import * as github from '@actions/github'
import * as core from '@actions/core'

const token = process.env.TOKEN
const ghUsername = process.env.GH_USERNAME
const commitHash = process.env.COMMIT_HASH
const octokit = github.getOctokit(token)
const defaultBranch = process.env.DEFAULT_BRANCH

const githubService = {
  repoIsTemplate(owner, repo) {
    return owner === 'betrybe' && repo.includes('0x')
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

export default githubService
