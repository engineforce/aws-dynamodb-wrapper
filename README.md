## Integration tests

[![Greenkeeper badge](https://badges.greenkeeper.io/engineforce/aws-dynamodb-wrapper.svg)](https://greenkeeper.io/)

```bash
brew update
brew cask install java    # required by serverless-dynamodb-local

# Need to run this every time after run yarn install
sls dynamodb install
yarn run test-integration
```
