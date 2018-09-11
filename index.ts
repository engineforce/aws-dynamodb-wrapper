import { loadMakeWrapper } from './src/makeWrapper';
import AWS from 'aws-sdk';

const db = new AWS.DynamoDB.DocumentClient();
export function makeWrapper<TKey, TValue>({ tableName, keyName }) {
  return loadMakeWrapper<TKey, TValue>({ db, tableName, keyName });
}

export * from './src/makeWrapper';
