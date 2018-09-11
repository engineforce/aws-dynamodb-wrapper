## Integration tests

```bash
brew update
brew cask install java    # required by serverless-dynamodb-local

# Need to run this every time after run yarn install
sls dynamodb install
yarn run test-integration
```
