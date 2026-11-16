// NetInfo is a native module: use the library's own Jest mock.
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('@react-native-community/netinfo', () => require('@react-native-community/netinfo/jest/netinfo-mock.js'));
