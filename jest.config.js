module.exports = {
    transform: {
      '^.+\\.[tj]s$': [ 'ts-jest', {
      tsconfig: 'tsconfig.jest.json',
      }],
    },
    transformIgnorePatterns: [
      '/node_modules/(?!(shacl-engine|grapoi|rdf-validation|@rdfjs)/)',
    ],
    // Only run tests in the unit and integration folders.
    // All test files need to have the suffix `.test.ts`.
    testRegex: '/test/(unit|integration)/.*\\.test\\.ts$',
    moduleFileExtensions: [
      'ts',
      'js',
    ],
    testEnvironment: 'node',
    collectCoverage: true,
    coverageReporters: [ 'text', 'lcov' ],
    coveragePathIgnorePatterns: [
      '/dist/',
      '/node_modules/',
      '/test/',
    ],
    testTimeout: 90000,
  };