import { timestamp, isNonEmptyObject } from './utils';

describe('Utility functions', () => {
    it('should have a timestamp function which returns the correct date format', () => {
        expect(timestamp()).toMatch(/^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}/);
    });
    it('should behave...', () => {
        const emptyObject = {};
        const filledObject = {
            foo: 'bar',
        };
        expect(isNonEmptyObject(emptyObject)).toBe(false);
        expect(isNonEmptyObject(filledObject)).toBe(true);
    });
});
