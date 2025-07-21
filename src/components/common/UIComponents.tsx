/**
 * Common UI Components
 * 
 * This file contains reusable UI components used throughout the application.
 * All components are TypeScript-enabled with proper prop types.
 */

import React from 'react';
import { InputFieldProps, NavButtonProps } from '../../types';

/**
 * InputField Component
 * Reusable input field with label and styling
 */
export const InputField: React.FC<InputFieldProps> = ({ 
  label, 
  value, 
  onChange, 
  type = "text", 
  placeholder = "", 
  required = false 
}) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
    />
  </div>
);

/**
 * NavButton Component
 * Navigation button with active state styling
 */
export const NavButton: React.FC<NavButtonProps> = ({ 
  text, 
  icon, 
  onClick, 
  isActive 
}) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 space-x-reverse px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
      isActive 
        ? 'bg-blue-500 text-white shadow-md' 
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
    }`}
  >
    {icon}
    <span>{text}</span>
  </button>
);

/**
 * PrintStyles Component
 * CSS-in-JS component for A4 printing styles
 */
export const PrintStyles: React.FC = () => (
  <style>{`
    body { 
      font-family: 'Tajawal', sans-serif; 
    }
    
    @page { 
      size: A4; 
      margin: 1.5cm; 
    }
    
    @media print {
      html, body { 
        width: 210mm; 
        height: 297mm; 
        margin: 0; 
        padding: 0; 
        font-size: 9.5pt; 
        background-color: #fff !important; 
        -webkit-print-color-adjust: exact; 
        print-color-adjust: exact; 
      }
      
      .no-print { 
        display: none !important; 
      }
      
      .printable-area { 
        width: 100%; 
        height: 100%; 
        padding: 0 !important; 
        margin: 0 !important; 
        border: none !important; 
        box-shadow: none !important; 
        border-radius: 0 !important; 
      }
      
      .printable-area header img { 
        height: 5rem !important; 
      }
      
      .printable-area h1 { 
        font-size: 16pt !important; 
      }
      
      .printable-area h2 { 
        font-size: 13pt !important; 
      }
      
      .printable-area h3 { 
        font-size: 11pt !important; 
      }
      
      .printable-area table { 
        font-size: 9pt !important; 
      }
      
      .printable-area th, .printable-area td { 
        padding: 3px !important; 
      }
      
      .printable-area footer { 
        margin-top: auto !important; 
        padding-top: 0.5rem !important; 
        page-break-before: avoid; 
      }
      
      /* Ensure proper page breaks */
      .page-break {
        page-break-before: always;
      }
      
      .avoid-break {
        page-break-inside: avoid;
      }
    }
  `}</style>
);

/**
 * LoadingSpinner Component
 * Simple loading spinner for async operations
 */
export const LoadingSpinner: React.FC<{ size?: number; className?: string }> = ({ 
  size = 20, 
  className = "" 
}) => (
  <div className={`inline-block animate-spin ${className}`}>
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        className="opacity-25"
      />
      <path
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        className="opacity-75"
      />
    </svg>
  </div>
);

/**
 * CompanyHeader Component
 * Reusable company header with logo and info
 */
export const CompanyHeader: React.FC<{ className?: string }> = ({ className = "" }) => (
  <header className={`text-center pb-6 border-b-2 border-gray-200 mb-6 ${className}`}>
    <img 
      src="https://i.ibb.co/bx1cZBC/image.png" 
      alt="شعار شركة أعمال الشاهين" 
      className="h-20 mx-auto mb-4" 
    />
    <h1 className="text-2xl font-bold text-gray-800 mb-2">
      شركة أعمال الشاهين للمقاولات
    </h1>
    <div className="text-sm text-gray-600">
      <p>المملكة العربية السعودية - الرياض</p>
      <p>هاتف: +966 XX XXX XXXX | البريد الإلكتروني: info@shaheen.com</p>
    </div>
  </header>
);