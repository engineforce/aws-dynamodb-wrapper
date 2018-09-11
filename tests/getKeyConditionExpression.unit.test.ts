import { getKeyConditionExpression } from '../src/getKeyConditionExpression';

describe('DynamoDb Wrapper', () => {
  describe('getKeyConditionExpression', () => {
    test('a single key passed', () => {
      const findQuery = { dog: 'cat' };
      const expectedKeyCondition = 'dog = :dog';

      const keyConditionExpressionResult = getKeyConditionExpression(
        'and',
        findQuery
      );

      expect(keyConditionExpressionResult).toEqual(expectedKeyCondition);
    });

    test('two keys passed', () => {
      const findQuery = { dog: 'cat', sheep: 'wolf' };
      const expectedKeyCondition = 'dog = :dog and sheep = :sheep';

      const keyConditionExpressionResult = getKeyConditionExpression(
        'and',
        findQuery
      );

      expect(keyConditionExpressionResult).toEqual(expectedKeyCondition);
    });
  });
});
