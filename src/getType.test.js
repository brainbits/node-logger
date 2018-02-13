import { isError, isObject, isString, isArray, isFunction } from './getType';

describe('getType', () => {
    const error = new Error('ERROR!!!!!!');
    const object = { foo: 'bar' };
    const string = 'blah blah';
    const array = ['foo', 'bar'];
    const func = function bar(foo) {
        return foo;
    };

    it('should detect an error object correctly', () => {
        expect(isError(error)).toBe(true);
        expect(isError(object)).toBe(false);
        expect(isError(string)).toBe(false);
        expect(isError(array)).toBe(false);
        expect(isError(func)).toBe(false);
    });

    it('should match an object', () => {
        expect(isObject(object)).toBe(true);
        expect(isObject(error)).toBe(false);
        expect(isObject(string)).toBe(false);
        expect(isObject(array)).toBe(false);
        expect(isObject(func)).toBe(false);
    });

    it('should match a string', () => {
        expect(isString(string)).toBe(true);
        expect(isString(object)).toBe(false);
        expect(isString(error)).toBe(false);
        expect(isString(array)).toBe(false);
        expect(isString(func)).toBe(false);
    });

    it('should match an array', () => {
        expect(isArray(string)).toBe(false);
        expect(isArray(object)).toBe(false);
        expect(isArray(error)).toBe(false);
        expect(isArray(array)).toBe(true);
        expect(isArray(func)).toBe(false);
    });

    it('should match a function', () => {
        expect(isFunction(string)).toBe(false);
        expect(isFunction(object)).toBe(false);
        expect(isFunction(error)).toBe(false);
        expect(isFunction(array)).toBe(false);
        expect(isFunction(func)).toBe(true);
    });
});
