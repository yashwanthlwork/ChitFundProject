module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/backend/src', '<rootDir>/frontend/src'],
  moduleFileExtensions: ['js', 'jsx', 'json'],
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest'
  },
  setupFilesAfterEnv: ['@testing-library/jest-dom', '<rootDir>/frontend/jest.setup.js'],
  moduleNameMapper: {
    '^react$': '<rootDir>/frontend/node_modules/react',
    '^react-dom$': '<rootDir>/frontend/node_modules/react-dom',
    '\\.(css|less|scss|sass)$': '<rootDir>/styleMock.js'
  },
  verbose: true,
};
