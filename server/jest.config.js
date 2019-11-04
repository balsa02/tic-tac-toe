module.exports = {
    roots: ['<rootDir>/src'],
    coveragePathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/src/skeleton/", "<rootDir>/src/global.ts", "<rootDir>/src/subscription.ts" ],
    transform: {
      '^.+\\.tsx?$': 'ts-jest',
    },
    testRegex: '(/__tests__/.*\\.test\\.tsx?$|(\\.|/)(test|spec))\\.tsx?$',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  }
  