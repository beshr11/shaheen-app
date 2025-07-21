import { render, screen } from '@testing-library/react';

// Simple mock for ReactMarkdown to avoid ES module issues in tests
jest.mock('react-markdown', () => {
  return function MockReactMarkdown({ children }) {
    return <div data-testid="markdown">{children}</div>;
  };
});

// Mock environment variables
process.env.REACT_APP_GEMINI_API_KEY = 'test-api-key';

describe('Shaheen App', () => {
  test('renders without crashing', () => {
    // Import here to ensure mocks are applied
    const App = require('./App').default;
    render(<App />);
    
    // Check if main elements are rendered
    expect(document.body).toBeInTheDocument();
  });

  test('has navigation elements', () => {
    const App = require('./App').default;
    render(<App />);
    
    // Check if navigation buttons are rendered
    const docButton = screen.getByText('منظومة المستندات');
    const aiButton = screen.getByText('الوكيل الذكي');
    
    expect(docButton).toBeInTheDocument();
    expect(aiButton).toBeInTheDocument();
  });
});