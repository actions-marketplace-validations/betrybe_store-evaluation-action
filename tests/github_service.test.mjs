import nock from 'nock'
import * as core from '@actions/core'
import githubService from '../src/github_service.mjs'

describe('send feedback to pull request', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('must be create feedback comment with success', async () => {
    jest.spyOn(core, 'info').mockImplementation(jest.fn())
    const delivery = {id: 1, project_url: 'https://app.betrybe.com/project-page'}

    const expectedCommnent = `
    **Olá ${process.env.GH_USERNAME}!**
    Acompanhe a avaliação do seu commit diretamente na [página do projeto](${delivery.project_url}).

    O feedback pode demorar até alguns minutos para aparecer. Caso esteja tendo problemas, **fale com nosso time**.
  
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
    const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/')

    nock('https://api.github.com')
      .post(/.*/)
      .reply(201, {
        id: 123,
        body: expectedCommnent,
        url: `https://api.github.com/repos/${owner}/${repo}/issues/comments/123`
      })

    const result = await githubService.createFeedback(delivery)

    expect(core.info).toHaveBeenCalledTimes(2)

    expect(result).toEqual({
      status: 201,
      comment: expectedCommnent
    })
  })
  
  it('should returns error when request failed', async () => {
    jest.spyOn(core, 'info').mockImplementation(jest.fn())
    jest.spyOn(core, 'setFailed').mockImplementation(jest.fn())
    const delivery = {id: 1, project_url: 'https://app.betrybe.com/project-page'}

    nock('https://api.github.com')
      .post(/.*/)
      .reply(401, {
        message: 'Bad credentials'
      })

    const result = await githubService.createFeedback(delivery)
    
    expect(core.info).toHaveBeenCalledTimes(1)
    expect(core.setFailed).toHaveBeenCalledTimes(1)

    expect(result).toEqual({
      status: 401,
      reason: 'Bad credentials'
    })
  })
})
