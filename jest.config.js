export default {
  // Jest's --experimental-vm-modules loader races across parallel workers
  // when multiple workers first resolve culori's conditional subpath exports
  // (e.g. ./a98/definition.js) at the same time, causing intermittent
  // "is not in cache" / "can not be resolved" failures. Single worker avoids it.
  "maxWorkers": 1,
  "extensionsToTreatAsEsm": [".ts"],
  "roots": [
    "<rootDir>/src",
    "<rootDir>/test"
  ],
  "testMatch": [ "**.spec.ts" ],
  "testPathIgnorePatterns": [ "/test/e2e/" ],
  "transform": {
    "^.+\\.ts$": ["ts-jest", { useESM: true }]
  },
  "moduleNameMapper": {
    "^(\\..+)\\.js$": "$1"
  }
};
