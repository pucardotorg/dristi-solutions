const mockDigit = {
  Hooks: {
    useStore: {
      getInitData: jest.fn()
    }
  }
};

global.Digit = mockDigit;
