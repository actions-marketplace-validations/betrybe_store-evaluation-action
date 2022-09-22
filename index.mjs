import storeEvaluation from './src/store_evaluation.mjs'
import * as github from '@actions/github'
const { owner, repo } = github.context.issue

storeEvaluation(owner, repo)
