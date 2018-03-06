

import config from './config';

describe('Config', () => {
    it('should have the correct levels', () => {
        expect(config.levels).toEqual({
            alert: 1,
            critical: 2,
            debug: 7,
            emergency: 0,
            error: 3,
            info: 6,
            notice: 5,
            warning: 4,
        });
    });
    it('should have the correct timer level', () => {
        expect(config.timerLevel).toBe('debug');
    });
    it('should have the correct outputs', () => {
        expect(config.outputs.warning).toEqual(process.stdout);
        expect(config.outputs.emergency).toEqual(process.stderr);
    });
});
