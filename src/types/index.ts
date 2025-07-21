/**
 * Type definitions for Shaheen App
 * Contains all interfaces and types used throughout the application
 */

// Material interface for scaffolding materials
export interface Material {
  id: number;
  type: string;
  unit: string;
  defaultQuantity: number;
}

// Form data interface for rental commencement note
export interface RentalCommencementFormData {
  lessor: string;
  lessee: string;
  project: string;
  location: string;
  contractDate: string;
  installationDate: string;
  rentalStartDate: string;
  monthlyRate: string;
  dailyRate: string;
  installationIncluded: boolean;
  contractNumber: string;
  engineerName: string;
  notes: string;
  [key: string]: string | number | boolean; // For dynamic material quantities
}

// Message interface for AI agent conversations
export interface Message {
  id: number;
  content: string;
  isUser: boolean;
  type: 'text' | 'document';
  timestamp: string;
}

// Conversation data interface for memory management
export interface ConversationData {
  id?: string;
  docType: string;
  userInput: string;
  generatedContent?: string;
  tags?: string[];
  rating?: number;
  timestamp?: string;
}

// Memory statistics interface
export interface MemoryStats {
  totalConversations: number;
  docTypeDistribution: Record<string, number>;
  averageRating: number;
  mostUsedDocType: string;
}

// Document types enum
export type DocumentType =
  | 'عقد إيجار سقالات'
  | 'محضر بدء إيجار الشدات المعدنية'
  | 'عقد عمالة'
  | 'محضر تسليم واستلام'
  | 'مذكرة مطالبة مالية'
  | 'إشعار تسليم'
  | 'محضر إرجاع وفحص';

// Conversation stage enum
export type ConversationStage = 'initial' | 'clarifying' | 'generating' | 'completed';

// Input field props interface
export interface InputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}

// Navigation button props interface
export interface NavButtonProps {
  text: string;
  icon: React.ReactNode;
  onClick: () => void;
  isActive: boolean;
}

// API response interface for Gemini
export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

// Error interface for API responses
export interface APIError {
  error: {
    message: string;
    code?: number;
  };
}

// Document configuration interface
export interface DocumentConfig {
  component: React.ComponentType;
  title: string;
  icon: React.ReactNode;
}

// Environment variables interface
export interface EnvironmentVariables {
  REACT_APP_GEMINI_API_KEY?: string;
  REACT_APP_FIREBASE_CONFIG?: string;
}
