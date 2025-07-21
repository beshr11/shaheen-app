/**
 * Tests for UI Components
 * 
 * These tests verify the rendering and functionality of reusable UI components.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { InputField, NavButton, CompanyHeader } from '../components/common/UIComponents';

describe('UI Components', () => {
  describe('InputField', () => {
    it('renders with label and input', () => {
      const mockOnChange = jest.fn();
      
      render(
        <InputField
          label="Test Label"
          value="test value"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('Test Label')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test value')).toBeInTheDocument();
    });

    it('calls onChange when input value changes', () => {
      const mockOnChange = jest.fn();
      
      render(
        <InputField
          label="Test Label"
          value=""
          onChange={mockOnChange}
        />
      );

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'new value' } });

      expect(mockOnChange).toHaveBeenCalledWith('new value');
    });

    it('shows required indicator when required is true', () => {
      const mockOnChange = jest.fn();
      
      render(
        <InputField
          label="Required Field"
          value=""
          onChange={mockOnChange}
          required={true}
        />
      );

      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('applies different input types correctly', () => {
      const mockOnChange = jest.fn();
      
      const { rerender } = render(
        <InputField
          label="Date Field"
          value=""
          onChange={mockOnChange}
          type="date"
        />
      );

      const dateInput = screen.getByLabelText('Date Field');
      expect(dateInput).toHaveAttribute('type', 'date');

      rerender(
        <InputField
          label="Number Field"
          value=""
          onChange={mockOnChange}
          type="number"
        />
      );

      const numberInput = screen.getByLabelText('Number Field');
      expect(numberInput).toHaveAttribute('type', 'number');
    });
  });

  describe('NavButton', () => {
    it('renders with text and icon', () => {
      const mockOnClick = jest.fn();
      const TestIcon = () => <span data-testid="test-icon">Icon</span>;
      
      render(
        <NavButton
          text="Test Button"
          icon={<TestIcon />}
          onClick={mockOnClick}
          isActive={false}
        />
      );

      expect(screen.getByText('Test Button')).toBeInTheDocument();
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    it('calls onClick when clicked', () => {
      const mockOnClick = jest.fn();
      const TestIcon = () => <span>Icon</span>;
      
      render(
        <NavButton
          text="Test Button"
          icon={<TestIcon />}
          onClick={mockOnClick}
          isActive={false}
        />
      );

      fireEvent.click(screen.getByRole('button'));
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('applies active styles when isActive is true', () => {
      const mockOnClick = jest.fn();
      const TestIcon = () => <span>Icon</span>;
      
      render(
        <NavButton
          text="Active Button"
          icon={<TestIcon />}
          onClick={mockOnClick}
          isActive={true}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-blue-500', 'text-white');
    });

    it('applies inactive styles when isActive is false', () => {
      const mockOnClick = jest.fn();
      const TestIcon = () => <span>Icon</span>;
      
      render(
        <NavButton
          text="Inactive Button"
          icon={<TestIcon />}
          onClick={mockOnClick}
          isActive={false}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gray-100', 'text-gray-600');
    });
  });

  describe('CompanyHeader', () => {
    it('renders company information correctly', () => {
      render(<CompanyHeader />);

      expect(screen.getByText('شركة أعمال الشاهين للمقاولات')).toBeInTheDocument();
      expect(screen.getByText('المملكة العربية السعودية - الرياض')).toBeInTheDocument();
      expect(screen.getByText(/هاتف:.*البريد الإلكتروني:/)).toBeInTheDocument();
    });

    it('renders company logo', () => {
      render(<CompanyHeader />);

      const logo = screen.getByAltText('شعار شركة أعمال الشاهين');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', 'https://i.ibb.co/bx1cZBC/image.png');
    });

    it('applies custom className when provided', () => {
      render(<CompanyHeader className="custom-class" />);

      const header = screen.getByRole('banner');
      expect(header).toHaveClass('custom-class');
    });
  });
});