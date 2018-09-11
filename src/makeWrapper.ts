import { reservedWords } from './reservedWords';
import reduce from 'lodash/reduce';
import curry from 'lodash/fp/curry';
import AWS from 'aws-sdk';
import { getKeyConditionExpression } from './getKeyConditionExpression';

export interface ILoadMakeWrapperOptions {
  db: AWS.DynamoDB.DocumentClient;
  tableName: string;
  keyName: string;
}

export interface IWrapper<TKey, TValue> {
  exists: (key: TKey) => Promise<boolean>;
  get: (key: TKey) => Promise<TKey & TValue>;
  put: (obj: TKey & TValue) => Promise<TKey & TValue>;
  set: (key: TKey, value: Partial<TValue>) => Promise<TKey & TValue>;
  find: (index: string, query: Partial<TValue>) => Promise<(TKey & TValue)[]>;
  delete: (key: TKey) => Promise<boolean>;
}

export function loadMakeWrapper<TKey, TValue>(
  options: ILoadMakeWrapperOptions
): IWrapper<TKey, TValue> {
  return {
    exists: curry(exists)(options),
    get: <any>curry(get)(options),
    put: <any>curry(put)(options),
    set: <any>curry(set)(options),
    find: <any>curry(find)(options),
    delete: curry(_delete)(options),
  };
}

async function exists<TKey>(
  options: ILoadMakeWrapperOptions,
  key: TKey
): Promise<boolean> {
  let value = await options.db
    .get({ Key: key, TableName: options.tableName })
    .promise();
  return value && value.Item !== undefined;
}

async function get<TKey, TValue>(
  options: ILoadMakeWrapperOptions,
  key: TKey
): Promise<TValue> {
  let value = await options.db
    .get({ Key: key, TableName: options.tableName })
    .promise();

  return <TKey & TValue>value.Item;
}

async function put<TKey, TValue>(
  options: ILoadMakeWrapperOptions,
  obj: TKey & TValue
): Promise<TKey & TValue> {
  const cleanObj = _deepClean(obj);
  let key;
  if (options.keyName) {
    key = { [options.keyName]: obj[options.keyName] };
  }
  const newObj = await _setDateCreated(
    options,
    key,
    _setDateModified(cleanObj)
  );

  await options.db
    .put({ Item: newObj, TableName: options.tableName })
    .promise();

  return newObj;
}

async function set<TKey, TValue>(
  options: ILoadMakeWrapperOptions,
  key: TKey,
  value: TValue
): Promise<TKey & TValue> {
  const cleanObject = _deepClean(value);
  const newValues = await _setDateCreated(
    options,
    key,
    _setDateModified(cleanObject)
  );

  const result = await options.db
    .update({
      TableName: options.tableName,
      Key: key,
      UpdateExpression: _getActionExpression('set', newValues),
      ExpressionAttributeNames: _getExpressionAttributeNames(newValues),
      ExpressionAttributeValues: _getExpressionAttributeValues(newValues),
      ReturnValues: 'ALL_NEW',
    })
    .promise();

  return <TKey & TValue>result.Attributes;
}

async function find<TKey, TValue>(
  options: ILoadMakeWrapperOptions,
  index: string,
  query: Partial<TValue>
): Promise<(TKey & TValue)[]> {
  return <(TKey & TValue)[]>await _query(options, {
    IndexName: index,
    KeyConditionExpression: getKeyConditionExpression('and', query),
    ExpressionAttributeNames: _getExpressionAttributeNames(query),
    ExpressionAttributeValues: _getExpressionAttributeValues(query),
    TableName: options.tableName,
  });
}

async function _delete<TKey>(
  options: ILoadMakeWrapperOptions,
  key: TKey
): Promise<boolean> {
  try {
    await options.db
      .delete({ TableName: options.tableName, Key: key })
      .promise();
    return true;
  } catch (e) {
    console.error('Delete failed', e);
    throw e;
  }
}

async function _query(
  options: ILoadMakeWrapperOptions,
  query: AWS.DynamoDB.DocumentClient.QueryInput
) {
  let result = await options.db.query(query).promise();
  return result.Items || [];
}

function _getExpressionAttributeNames(value: any) {
  return reduce(
    value,
    (attributeNames, value, key) => {
      if (reservedWords.indexOf(key.toUpperCase()) > -1) {
        if (!attributeNames) {
          attributeNames = {};
        }
        attributeNames[`#${key}`] = key;
      }
      return attributeNames;
    },
    undefined
  );
}

function _getExpressionAttributeValues(value: any) {
  return Object.entries(value).reduce((attrMap, [key, value]) => {
    attrMap[`:${key}`] = value;
    return attrMap;
  }, {});
}

function _getActionExpression(action: string, value: any) {
  let expression = Object.keys(value).reduce((expression, key) => {
    let variableName = key;
    if (reservedWords.indexOf(key.toUpperCase()) > -1) {
      variableName = '#' + variableName;
    }
    if (!expression) {
      return expression.concat(`${action} ${variableName} = :${key}`);
    }

    return expression.concat(`, ${variableName} = :${key}`);
  }, '');

  return expression;
}

function _setDateModified<T>(value: T): T {
  return {
    ...(<any>value),
    dateModified: JSON.stringify(new Date()),
  };
}

async function _setDateCreated<T>(
  options: ILoadMakeWrapperOptions,
  key: AWS.DynamoDB.DocumentClient.Key,
  value: T
): Promise<T> {
  if (key && !(await exists(options, key))) {
    return {
      ...(<any>value),
      dateCreated: JSON.stringify(new Date()),
    };
  }

  return value;
}

function _deepClean<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (key, value) => {
      if (value === '') {
        return null;
      }
      return value;
    })
  );
}
