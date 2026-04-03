export default {
  "extensionsToTreatAsEsm": [".ts"],
  "roots": [
    "<rootDir>/src",
    "<rootDir>/test"
  ],
  "testMatch": [ "**.spec.ts" ],
  "transform": {
    "^.+\\.ts$": ["ts-jest", { useESM: true }]
  },
  "moduleNameMapper": {
    "^(\\..+)\\.js$": "$1"
  }
};
