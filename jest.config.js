const { defaults: tsjPreset } = require('ts-jest/presets');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    ...tsjPreset.transform,
  },
  "moduleFileExtensions": [
    "ts",
    "js"
  ],
  "testMatch": [
    "**/tests/**/*.test.(ts|js)"
  ]
}