const fs = require('fs');
const path = require('path');
const logToFile = require('../utils/logToFile');

const LOG_FILE = path.join(__dirname, '../../../logs/backend.log');

describe('logToFile utility', () => {
  beforeEach(() => {
    if (fs.existsSync(LOG_FILE)) fs.unlinkSync(LOG_FILE);
  });

  afterAll(() => {
    if (fs.existsSync(LOG_FILE)) fs.unlinkSync(LOG_FILE);
  });

  it('should write a log message to the log file', () => {
    logToFile('Test log message');
    expect(fs.existsSync(LOG_FILE)).toBe(true);
    const content = fs.readFileSync(LOG_FILE, 'utf8');
    expect(content).toMatch(/Test log message/);
  });

  it('should stringify objects in log', () => {
    logToFile({ foo: 'bar' });
    const content = fs.readFileSync(LOG_FILE, 'utf8');
    expect(content).toMatch(/\{"foo":"bar"\}/);
  });
});
