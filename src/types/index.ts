/**
 * Type definitions for Shaheen App
 * Contains all TypeScript interfaces and types used throughout the application
 */

// === Material Types ===
export interface Material {
  id: number;
  type: string;
  unit: string;
  defaultQuantity: number;
}

// === Conversation and Memory Types ===
export interface Conversation {
  id: string;
  timestamp: string;
  docType: string;
  userInput: string;
  generatedContent?: string;
  tags?: string[];
  rating?: number;
  similarity?: number;
}

export interface MemoryStats {
  totalConversations: number;
  docTypeDistribution: Record<string, number>;
  averageRating: number;
  mostUsedDocType: string;
}

// === Message Types ===
export interface Message {
  id: number;
  content: string;
  isUser: boolean;
  type: 'text' | 'document';
  timestamp: string;
}

// === Form Data Types ===
export interface RentalFormData {
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

// === Component Props Types ===
export interface InputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}

export interface NavButtonProps {
  text: string;
  icon: React.ReactNode;
  onClick: () => void;
  isActive: boolean;
}

export interface DocumentInfo {
  component: React.ComponentType;
  title: string;
  icon: React.ReactNode;
}

// === API Types ===
export interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

// === App State Types ===
export type ViewType = 'documents' | 'aiAgent';
export type ConversationStage = 'initial' | 'clarifying' | 'generating' | 'completed';

// === Document Types ===
export type DocumentType = 
  | 'عقد إيجار سقالات'
  | 'محضر بدء إيجار الشدات المعدنية'
  | 'عقد عمالة'
  | 'محضر تسليم واستلام'
  | 'مذكرة مطالبة مالية'
  | 'إشعار تسليم'
  | 'محضر إرجاع وفحص';

// === Environment Variables ===
export interface EnvConfig {
  REACT_APP_FIREBASE_CONFIG: string;
  REACT_APP_GEMINI_API_KEY: string;
}