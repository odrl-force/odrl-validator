module.exports = {
    transform: {
      '^.+\\.ts$': [ 'ts-jest', {
        tsconfig: 'tsconfig.json',
      }],
      // shacl-engine and some of its dependencies are ES modules: compile them to CommonJS for Jest.
      '^.+\\.m?js$': [ 'ts-jest', {
        tsconfig: { allowJs: true, module: 'commonjs', esModuleInterop: true },
        isolatedModules: true,
      }],
    },
    transformIgnorePatterns: [
      '/node_modules/(?!(shacl-engine|grapoi|@rdfjs|rdf-validation|@comunica)/)',
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