import { reservedWords } from './reservedWords';

export function getKeyConditionExpression(action: string, values: any): string {
  const queryText = Object.keys(values).reduce((expression, key) => {
    let variableName = key;
    if (reservedWords.indexOf(key.toUpperCase()) > -1) {
      variableName = '#' + variableName;
    }

    if (expression) {
      return expression.concat(` ${action} ${variableName} = :${key}`);
    }

    return expression.concat(`${variableName} = :${key}`);
  }, '');
  return queryText;
}
