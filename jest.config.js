/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/server.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFiles: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@api/(.*)$': '<rootDir>/src/api/$1',
    '^@app$': '<rootDir>/src/core/app',
    '^@common$': '<rootDir>/src/common',
    '^@common/(.*)$': '<rootDir>/src/common/$1',
    '^@config$': '<rootDir>/src/config',
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^core/(.*)$': '<rootDir>/src/core/$1',
    '^@documentation$': '<rootDir>/src/documentation',
    '^@generated/(.*)$': '<rootDir>/src/generated/$1',
    '^@logger$': '<rootDir>/src/logger',
    '^@middleware/(.*)$': '<rootDir>/src/middleware/$1',
    '^@models$': '<rootDir>/src/models',
    '^@routes$': '<rootDir>/src/routes',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
  },
  testTimeout: 30000,
  verbose: true,
};
