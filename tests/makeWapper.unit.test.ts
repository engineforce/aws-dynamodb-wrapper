import MockDate from 'mockdate';
import { loadMakeWrapper, IWrapper } from '../src/makeWrapper';
let db;
let dynamoDb: IWrapper<any, any>;

beforeEach(() => {
  const promise = jest.fn().mockReturnValue(Promise.resolve());
  db = {
    put: jest.fn().mockReturnValue({ promise }),
    update: jest.fn().mockReturnValue({
      promise: jest.fn().mockReturnValue(
        Promise.resolve({
          Attribute: {},
        })
      ),
    }),
    get: jest.fn().mockReturnValue({ promise }),
  };

  dynamoDb = loadMakeWrapper({ db, tableName: undefined, keyName: undefined });
});

describe('DynamoDb Wrapper', () => {
  describe('Set or Put', () => {
    describe('When any of the values is undefined', () => {
      test('should delete the property from the object when using set', async () => {
        MockDate.set(new Date());

        const keyToStore = { id: '000' };
        const valueToStore = {
          foo: undefined,
          bar: 'something',
        };
        const expectedArguments = {
          Key: keyToStore,
          UpdateExpression: 'set bar = :bar, dateModified = :dateModified',
          ExpressionAttributeValues: {
            ':bar': 'something',
            ':dateModified': JSON.stringify(new Date()),
          },
          ReturnValues: 'ALL_NEW',
        };

        db.get.mockReturnValue({
          promise: () => Promise.resolve({ Item: {} }),
        });
        await dynamoDb.set(keyToStore, valueToStore);
        const actualArguments = db.update.mock.calls[0][0];

        expect(actualArguments).toEqual(expectedArguments);
      });

      test('should delete the property from the object when using put', async () => {
        const valueToStore = {
          id: '000',
          foo: undefined,
          bar: 'something',
        };

        await dynamoDb.put(valueToStore);
        const actualArguments = db.put.mock.calls[0][0].Item;

        expect(actualArguments).not.toHaveProperty('foo');
      });
    });

    describe('When any of the input fields is an empty string', () => {
      test('should replace the value with undefined when using set', async () => {
        MockDate.set(new Date());
        const keyToStore = { id: '000' };
        const valueToStore = {
          foo: undefined,
          bar: 'something',
        };
        const expectedArguments = {
          Key: keyToStore,
          UpdateExpression:
            'set bar = :bar, dateModified = :dateModified, dateCreated = :dateCreated',
          ExpressionAttributeValues: {
            ':bar': 'something',
            ':dateModified': JSON.stringify(new Date()),
            ':dateCreated': JSON.stringify(new Date()),
          },
          ReturnValues: 'ALL_NEW',
        };

        await dynamoDb.set(keyToStore, valueToStore);
        const actualArguments = db.update.mock.calls[0][0];

        expect(actualArguments).toEqual(expectedArguments);
      });

      test('should replace the value with null when using put without specifying the keyName', async () => {
        MockDate.set(new Date());
        const valueToStore = {
          id: '000',
          bar: 'something',
        };
        const expectedArguments = {
          Item: {
            ...valueToStore,
            dateModified: JSON.stringify(new Date()),
          },
        };

        await dynamoDb.put(valueToStore);
        const actualArguments = db.put.mock.calls[0][0];

        expect(actualArguments).toEqual(expectedArguments);
      });

      test('should replace the value with null when using put with specified keyName', async () => {
        MockDate.set(new Date());
        const valueToStore = {
          id: '000',
          bar: 'something',
        };
        const expectedArguments = {
          Item: {
            ...valueToStore,
            dateModified: JSON.stringify(new Date()),
            dateCreated: JSON.stringify(new Date()),
          },
        };

        dynamoDb = loadMakeWrapper({ db, tableName: undefined, keyName: 'id' });
        await dynamoDb.put(valueToStore);
        const actualArguments = db.put.mock.calls[0][0];

        expect(actualArguments).toEqual(expectedArguments);
      });

      test('should replace the value with null when using put with specified keyName and key existed.', async () => {
        MockDate.set(new Date());
        const valueToStore = {
          id: '000',
          bar: 'something',
        };
        const expectedArguments = {
          Item: {
            ...valueToStore,
            dateModified: JSON.stringify(new Date()),
          },
        };

        db.get.mockReturnValue({
          promise: () => Promise.resolve({ Item: {} }),
        });

        dynamoDb = loadMakeWrapper({ db, tableName: undefined, keyName: 'id' });
        await dynamoDb.put(valueToStore);
        const actualArguments = db.put.mock.calls[0][0];

        expect(actualArguments).toEqual(expectedArguments);
      });

      test('should replace the value with null when using put', async () => {
        const valueToStore = {
          id: '000',
          foo: undefined,
          bar: 'something',
        };

        await dynamoDb.put(valueToStore);
        const actualArguments = db.put.mock.calls[0][0].Item;

        expect(actualArguments.foo).toBeUndefined();
      });

      test('should replace the value with null when using set', async () => {
        MockDate.set(new Date());
        const keyToStore = { id: '000' };
        const valueToStore = {
          foo: undefined,
          bar: 'something',
          car: '',
          obj: {
            baz: 'flub',
            bax: undefined,
            bar1: null,
          },
        };
        const expectedArguments = {
          Key: keyToStore,
          UpdateExpression:
            'set bar = :bar, car = :car, obj = :obj, dateModified = :dateModified, dateCreated = :dateCreated',
          ExpressionAttributeValues: {
            ':bar': 'something',
            ':car': null,
            ':obj': {
              baz: 'flub',
              bar1: null,
            },
            ':dateModified': JSON.stringify(new Date()),
            ':dateCreated': JSON.stringify(new Date()),
          },
          ReturnValues: 'ALL_NEW',
        };

        await dynamoDb.set(keyToStore, valueToStore);
        const actualArguments = db.update.mock.calls[0][0];

        expect(actualArguments).toEqual(expectedArguments);
      });

      test('should replace a nested empty value with null when using put', async () => {
        const valueToStore = {
          id: '000',
          foo: undefined,
          car1: '',
          car2: null,
          obj: {
            baz: 'something',
            bax: undefined,
            bar1: '',
            bar2: null,
          },
        };

        await dynamoDb.put(valueToStore);
        const actualArguments = db.put.mock.calls[0][0].Item;

        expect(actualArguments.foo).toBeUndefined();
        expect(actualArguments.obj.bax).toBeUndefined();

        expect(actualArguments.car1).toBe(null);
        expect(actualArguments.car2).toBe(null);
        expect(actualArguments.obj.bar1).toBe(null);
        expect(actualArguments.obj.bar2).toBe(null);
      });
    });
  });
});
