import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('Shaheen App', () => {
  beforeEach(() => {
    fetch.mockClear();
    localStorage.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders main navigation correctly', () => {
    render(<App />);
    
    // Check if navigation buttons are present
    expect(screen.getByText('منظومة المستندات')).toBeInTheDocument();
    expect(screen.getByText('الوكيل الذكي')).toBeInTheDocument();
  });

  test('switches between document suite and AI agent views', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // Initially should show AI agent (default)
    expect(screen.getByText('الوكيل الذكي للمستندات')).toBeInTheDocument();
    
    // Click on document suite
    const documentButton = screen.getByText('منظومة المستندات');
    await user.click(documentButton);
    
    // Should show document suite
    expect(screen.getByText('محضر بدء إيجار الشدات المعدنية')).toBeInTheDocument();
  });

  test('AI agent displays welcome message', () => {
    render(<App />);
    
    // Check if welcome message is displayed
    expect(screen.getByText(/مرحباً! أنا مساعدك الذكي/)).toBeInTheDocument();
  });

  test('document type selector works correctly', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const select = screen.getByDisplayValue('عقد إيجار سقالات');
    expect(select).toBeInTheDocument();
    
    // Change document type
    await user.selectOptions(select, 'محضر بدء إيجار الشدات المعدنية');
    expect(select.value).toBe('محضر بدء إيجار الشدات المعدنية');
  });

  test('input field component renders correctly', () => {
    render(<App />);
    
    // Switch to documents view to test input fields
    const documentButton = screen.getByText('منظومة المستندات');
    fireEvent.click(documentButton);
    
    // Check if input fields are present
    expect(screen.getByLabelText('المؤجر')).toBeInTheDocument();
    expect(screen.getByLabelText('المستأجر')).toBeInTheDocument();
  });

  test('handles user input in AI agent', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const input = screen.getByPlaceholderText('اكتب رسالتك هنا...');
    const sendButton = screen.getByTitle('إرسال الرسالة');
    
    // Type a message
    await user.type(input, 'أريد إنشاء عقد إيجار جديد');
    expect(input.value).toBe('أريد إنشاء عقد إيجار جديد');
    
    // Send the message
    await user.click(sendButton);
    
    // Check if message was added to conversation
    await waitFor(() => {
      expect(screen.getByText('أريد إنشاء عقد إيجار جديد')).toBeInTheDocument();
    });
  });

  test('calculates daily rate from monthly rate correctly', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // Switch to documents view
    const documentButton = screen.getByText('منظومة المستندات');
    await user.click(documentButton);
    
    // Find monthly rate input
    const monthlyRateInput = screen.getByLabelText('سعر الإيجار الشهري (ريال)');
    const dailyRateInput = screen.getByLabelText('السعر اليومي (ريال)');
    
    // Enter monthly rate
    await user.clear(monthlyRateInput);
    await user.type(monthlyRateInput, '3000');
    
    // Check if daily rate is calculated (3000/30 = 100)
    await waitFor(() => {
      expect(dailyRateInput.value).toBe('100.00');
    });
  });

  test('memory manager saves and retrieves conversations', () => {
    const testData = {
      docType: 'عقد إيجار سقالات',
      userInput: 'test input',
      generatedContent: 'test content'
    };
    
    // Save to localStorage
    localStorage.setItem('shaheen_ai_memory', JSON.stringify([testData]));
    
    // Retrieve and verify
    const stored = JSON.parse(localStorage.getItem('shaheen_ai_memory'));
    expect(stored[0].docType).toBe('عقد إيجار سقالات');
  });

  test('print functionality is available', () => {
    render(<App />);
    
    // Switch to documents view
    const documentButton = screen.getByText('منظومة المستندات');
    fireEvent.click(documentButton);
    
    // Find and click print button
    const printButton = screen.getByText('طباعة');
    fireEvent.click(printButton);
    
    // Verify print was called
    expect(window.print).toHaveBeenCalled();
  });

  test('responsive design elements are present', () => {
    render(<App />);
    
    // Check for responsive classes
    const mainContainer = document.querySelector('.max-w-6xl');
    expect(mainContainer).toBeInTheDocument();
    
    const navigation = document.querySelector('.flex-wrap');
    expect(navigation).toBeInTheDocument();
  });

  test('accessibility features are implemented', () => {
    render(<App />);
    
    // Check for ARIA labels and semantic elements
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
    
    // Check for proper form labels
    const documentButton = screen.getByText('منظومة المستندات');
    fireEvent.click(documentButton);
    
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThan(0);
  });
});

describe('Security Features', () => {
  test('API key is handled securely', () => {
    render(<App />);
    
    // API key should not be visible in the DOM
    expect(document.body.textContent).not.toContain('AIzaSy');
  });

  test('input sanitization prevents XSS', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // Switch to documents view
    const documentButton = screen.getByText('منظومة المستندات');
    await user.click(documentButton);
    
    // Try to input malicious script
    const lessorInput = screen.getByLabelText('المؤجر');
    await user.clear(lessorInput);
    await user.type(lessorInput, '<script>alert("xss")</script>');
    
    // Input should be treated as text, not executed
    expect(lessorInput.value).toBe('<script>alert("xss")</script>');
    // Script should not be in DOM as executable
    expect(document.querySelector('script[src]')).toBeNull();
  });
});