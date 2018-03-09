import { timestamp, isNonEmptyObject } from './utils';

describe('Utility functions', () => {
    describe('timestamp()', () => {
        it('should return the correct date for monolog', () => {
            expect(timestamp('YYYY-MM-DD HH:mm:ss')).toMatch(/^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}$/);
        });

        it('should return the correct date', () => {
            expect(timestamp('YYYY-MM-DD')).toMatch(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/);
        });
    });

    describe('isNonEmptyObject()', () => {
        it('should return false for a non empty object', () => {
            expect(isNonEmptyObject({})).toBe(false);
        });

        it('should return true for an empty object', () => {
            expect(isNonEmptyObject({
                foo: 'bar',
            })).toBe(true);
        });

        it('should return false for an object with only undefined properties', () => {
            expect(isNonEmptyObject({
                foo: undefined,
            })).toBe(false);
        });
    });
});
