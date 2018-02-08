import { isError, isObject, isString } from './getType';

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

    it('should match an string', () => {
        expect(isString(string)).toBe(true);
        expect(isString(object)).toBe(false);
        expect(isString(error)).toBe(false);
        expect(isString(array)).toBe(false);
        expect(isString(func)).toBe(false);
    });
});
