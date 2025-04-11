import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Header from '../components/Header';
import '../__mocks__/digit.mock';
import { useTranslation } from 'react-i18next';

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key })
}));

describe('Header Component', () => {
  beforeEach(() => {
    // Clear mock data before each test
    jest.clearAllMocks();
  });

  test('renders loader when data is loading', () => {
    // Mock the loading state
    Digit.Hooks.useStore.getInitData.mockReturnValue({
      data: null,
      isLoading: true
    });

    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('renders header with state info when data is loaded', () => {
    // Mock the successful data load
    const mockData = {
      stateInfo: {
        logoUrl: 'test-logo-url',
      }
    };

    Digit.Hooks.useStore.getInitData.mockReturnValue({
      data: mockData,
      isLoading: false
    });

    render(
      <BrowserRouter>
        <Header tenantsData={[{ state: 'test-state' }]} />
      </BrowserRouter>
    );
    
    const logo = screen.getByRole('img');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', 'test-logo-url');
    expect(screen.getByText('test-state')).toBeInTheDocument();
  });
});
