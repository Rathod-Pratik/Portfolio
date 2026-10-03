/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^@utils$": "<rootDir>/src/utils/index.ts",
    "^@Middleware/(.*)$": "<rootDir>/src/middlewares/$1",
    "^@Middleware$": "<rootDir>/src/middlewares/index.ts",
    "^@modules/(.*)$": "<rootDir>/src/modules/$1",
    "^@config/(.*)$": "<rootDir>/src/config/$1",
    "^@type$": "<rootDir>/src/Type/index.ts",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: {
          module: "nodenext",
          target: "esnext",
          verbatimModuleSyntax: false,
          allowImportingTsExtensions: false,
          noEmit: false,
        },
      },
    ],
  },
  testMatch: ["**/*.test.ts", "**/*.spec.ts"],
  clearMocks: true,
};
