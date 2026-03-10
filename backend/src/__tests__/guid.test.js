const guid = require('../utils/guid');

describe('guid utility', () => {
  it('should generate a valid UUID v4 string', () => {
    const value = guid();
    // UUID v4 regex
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(typeof value).toBe('string');
    expect(uuidV4Regex.test(value)).toBe(true);
  });
});
