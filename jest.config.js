module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  // Optional: If your component's JS file is not directly in root or src, adjust moduleDirectories
  // moduleDirectories: ['node_modules', 'src'], 
};
