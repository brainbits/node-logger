

import config from './config';

describe('Config', () => {
    it('should have the correct levels', () => {
        expect(config.levels).toMatchSnapshot();
    });
    it('should have the correct timer level', () => {
        expect(config.timerLevel).toBe('debug');
    });
    it('should have the correct outputs', () => {
        expect(config.outputs.warning).toEqual(process.stdout);
        expect(config.outputs.emergency).toEqual(process.stderr);
    });
});
