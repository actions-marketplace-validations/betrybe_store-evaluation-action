const axios = require('axios');
const Base64 = require('base64-string').Base64;

// https://nodejs.org/en/knowledge/command-line/how-to-parse-command-line-arguments/
const enc = new Base64();
const evaluationData = JSON.parse(enc.decode(process.argv[2]));

const environment = process.argv[3];
let endpoint = ''
switch(environment) {
  case 'development':
    endpoint = 'http://localhost:3310/v2/evaluation';
    break;
  case 'staging':
    endpoint = 'https://evaluation-platform.betrybe.dev/v2/evaluation';
    break;
  case 'production':
    endpoint = 'https://evaluation-platform.betrybe.com/v2/evaluation';
    break;
  default:
    break;
}

const evaluationResponse = {
  ...evaluationData,
  pr_number: parseInt(process.argv[4])
}

console.log(evaluationResponse);

axios.post(endpoint, evaluationResponse)
.then((response) => {
  console.log(`Status: ${response.status}`);
  console.log(response.body);
  process.exit();
})
.catch((error) => {
  console.log(error.response.data);
  process.exit(1);
});
