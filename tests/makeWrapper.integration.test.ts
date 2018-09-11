import AWS from 'aws-sdk';
import { loadMakeWrapper } from '../src/makeWrapper';
let _dynamoDB;
import _ from 'lodash';

const _prefix = Math.random();

beforeEach(() => {
  const db = new AWS.DynamoDB.DocumentClient({
    region: 'localhost',
    endpoint: 'http://localhost:8001',
  });

  _dynamoDB = loadMakeWrapper({
    db,
    tableName: `dynamo-wrapper-${process.env.NODE_CONFIG_ENV}`,
    keyName: 'productId',
  });
});

test('put', async () => {
  // test adding id 0
  await _dynamoDB.put({
    productId: _prefix + '000',
    foo: undefined,
    bar: 'something',
    bar2: '',
    bar3: null,
    obj: {
      foo: undefined,
      bar: 'something',
      bar2: '',
      bar3: null,
    },
  });
  let value = await _dynamoDB.get({ productId: _prefix + '000' });

  expect(value).toMatchObject({
    productId: _prefix + '000',
    bar: 'something',
    bar2: null,
    bar3: null,
    obj: {
      bar: 'something',
      bar2: null,
      bar3: null,
    },
  });

  // test adding id 1
  await _dynamoDB.put({
    productId: _prefix + '001',
    foo: 'foo 1',
    bar: 'bar 1',
  });
  value = await _dynamoDB.get({ productId: _prefix + '001' });

  expect(value).toMatchObject({
    productId: _prefix + '001',
    foo: 'foo 1',
    bar: 'bar 1',
  });

  // test id 0 has not been changed
  value = await _dynamoDB.get({ productId: _prefix + '000' });
  expect(value).toMatchObject({
    productId: _prefix + '000',
    bar: 'something',
  });

  // test updating id 0
  await _dynamoDB.put({
    productId: _prefix + '000',
    foo: 'foo 2',
    address: 'address 2',
  });
  value = await _dynamoDB.get({ productId: _prefix + '000' });

  expect(value).toMatchObject({
    productId: _prefix + '000',
    foo: 'foo 2',
    address: 'address 2',
  });

  // put() to existing id will override all columns, i.e., removing all columns that are not part of the put().
  // Use set() if you want to preserve them.
  expect(value.bar).toBeUndefined();
});

test('set', async () => {
  // test adding id 0
  await _dynamoDB.set(
    {
      productId: _prefix + '100',
    },
    {
      foo: undefined,
      bar: 'something',
      state: 'Vic',
      bar2: '',
      bar3: null,
      obj: {
        foo: undefined,
        bar: 'something',
        bar2: '',
        bar3: null,
      },
    }
  );
  let value = await _dynamoDB.get({ productId: _prefix + '100' });

  expect(value).toMatchObject({
    productId: _prefix + '100',
    bar: 'something',
    state: 'Vic',
    bar2: null,
    bar3: null,
    obj: {
      bar: 'something',
      bar2: null,
      bar3: null,
    },
  });

  // test adding id 1
  await _dynamoDB.set(
    {
      productId: _prefix + '101',
    },
    {
      foo: 'foo 1',
      bar: 'bar 1',
      state: 'Tas',
    }
  );
  value = await _dynamoDB.get({ productId: _prefix + '101' });

  expect(value).toMatchObject({
    productId: _prefix + '101',
    foo: 'foo 1',
    bar: 'bar 1',
    state: 'Tas',
  });

  // test id 0 has not been changed
  value = await _dynamoDB.get({ productId: _prefix + '100' });
  expect(value).toMatchObject({
    productId: _prefix + '100',
    bar: 'something',
    state: 'Vic',
  });

  // test updating id 0
  await _dynamoDB.set(
    {
      productId: _prefix + '100',
    },
    {
      foo: 'foo 2',
      address: 'address 2',
      state: 'NSW',
    }
  );
  value = await _dynamoDB.get({ productId: _prefix + '100' });

  expect(value).toMatchObject({
    productId: _prefix + '100',
    bar: 'something',
    foo: 'foo 2',
    address: 'address 2',
    state: 'NSW',
  });

  // set() to existing id will keep all columns.
  expect(value.bar).toBe('something');
});

test('exists', async () => {
  expect(await _dynamoDB.exists({ productId: _prefix + '200' })).toBe(false);

  // test adding id 0
  await _dynamoDB.put({
    productId: _prefix + '200',
    foo: undefined,
    bar: 'something',
  });
  expect(await _dynamoDB.exists({ productId: _prefix + '200' })).toBe(true);

  // test adding id 1
  await _dynamoDB.put({
    productId: _prefix + '201',
    foo: 'foo 1',
    bar: 'bar 1',
  });
  expect(await _dynamoDB.exists({ productId: _prefix + '201' })).toBe(true);
  expect(await _dynamoDB.exists({ productId: _prefix + '200' })).toBe(true);

  // test updating id 0
  await _dynamoDB.put({
    productId: _prefix + '200',
    foo: 'foo 2',
    address: 'address 2',
  });
  expect(await _dynamoDB.exists({ productId: _prefix + '200' })).toBe(true);
});

test('find', async () => {
  await _dynamoDB.put({
    productId: _prefix + 'p300',
    userId: _prefix + 'u300',
    foo: undefined,
    bar: 'bar 1',
    state: 'Vic',
  });
  await _dynamoDB.put({
    productId: _prefix + 'p301',
    userId: _prefix + 'u300',
    foo: 'foo 2',
    bar: undefined,
    state: 'Vic',
  });
  await _dynamoDB.put({
    productId: _prefix + 'p302',
    userId: _prefix + 'u301',
    foo: 'foo 3',
    bar: 'bar 3',
    state: 'Vic',
  });
  await _dynamoDB.put({
    productId: _prefix + 'p303',
    userId: _prefix + 'u300',
    foo: 'foo 4',
    bar: 'bar 4',
    state: 'Vic',
  });
  await _dynamoDB.put({
    productId: _prefix + 'p304',
    userId: _prefix + 'u300',
    foo: 'foo 5',
    bar: 'bar 5',
    state: 'Tas',
  });

  // Found by secondary index that returns multiple rows
  let value = await _dynamoDB.find('userId', {
    userId: _prefix + 'u300',
    state: 'Vic',
  });

  expect(_.orderBy(value, 'productId')).toMatchObject([
    {
      productId: _prefix + 'p300',
      userId: _prefix + 'u300',
      bar: 'bar 1',
      state: 'Vic',
    },
    {
      productId: _prefix + 'p301',
      userId: _prefix + 'u300',
      foo: 'foo 2',
      state: 'Vic',
    },
    {
      productId: _prefix + 'p303',
      userId: _prefix + 'u300',
      foo: 'foo 4',
      bar: 'bar 4',
      state: 'Vic',
    },
  ]);

  // Found by secondary index that returns a single row
  value = await _dynamoDB.find('userId', { userId: _prefix + 'u301' });

  expect(value).toMatchObject([
    {
      productId: _prefix + 'p302',
      userId: _prefix + 'u301',
      foo: 'foo 3',
      bar: 'bar 3',
    },
  ]);

  // Found by secondary index that returns no rows
  value = await _dynamoDB.find('userId', { userId: _prefix + 'u303' });
  expect(value).toEqual([]);

  // Found by primary index that returns one row
  value = await _dynamoDB.find(undefined, { productId: _prefix + 'p301' });
  expect(value).toMatchObject([
    {
      productId: _prefix + 'p301',
      userId: _prefix + 'u300',
      foo: 'foo 2',
    },
  ]);
});
