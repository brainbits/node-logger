import * as index from './index';

describe('Index', () => {
    it('should export correctly', () => {
        expect(index).toMatchSnapshot();
    });
});
