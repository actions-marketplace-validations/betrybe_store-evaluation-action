import projectsService from './projects_service.mjs'
import githubService from './github_service.mjs'
import * as core from '@actions/core'

const run = async (owner, repo) => {
    const protectedFiles = ['.github/workflows/main.yml', 'trybe.yml', '.trybe/requirements.json']
    if (await githubService.hasInvalidChanges(owner, repo, protectedFiles)) {
        githubService.createErrorSummaryMessage(owner, repo, { message: 'Invalid Changes', files: protectedFiles })
        core.setFailed(`[ERROR] The files ${protectedFiles.join(', ')} cannot be modified.`)
        return
    }

    if (githubService.repoIsTemplate(owner, repo)) {
        return
    }

    const saveRequest = await projectsService.save()

    if (saveRequest.status !== 200) {
        githubService.createErrorSummaryMessage(owner, repo, saveRequest.data)
        core.setFailed(`[ERROR] Evaluation could not be sent. Status: ${saveRequest.status}. Data: ${JSON.stringify(saveRequest.data)}`)
        return
    }

    core.exportVariable("PROJECT_URL", saveRequest.data.project_url)
}

export default run
