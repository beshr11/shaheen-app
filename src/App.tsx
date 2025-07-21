import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FileText, Printer, Bot, Loader2, History, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import {
  Material,
  RentalCommencementFormData,
  Message,
  ConversationData,
  MemoryStats,
  DocumentType,
  ConversationStage,
  InputFieldProps,
  NavButtonProps,
  GeminiResponse,
  APIError,
  DocumentConfig,
} from './types';

/**
 * Material list configuration for metal scaffolding rental
 * Contains all standard materials with their units and default quantities
 */
const MATERIALS_LIST: Material[] = [
  { id: 1, type: 'قائم 3م', unit: 'قطعة', defaultQuantity: 0 },
  { id: 2, type: 'قائم 2.5م', unit: 'قطعة', defaultQuantity: 0 },
  { id: 3, type: 'قائم 2م', unit: 'قطعة', defaultQuantity: 0 },
  { id: 4, type: 'قائم 1.5م', unit: 'قطعة', defaultQuantity: 0 },
  { id: 5, type: 'قائم 1م', unit: 'قطعة', defaultQuantity: 0 },
  { id: 6, type: 'لدجر 1.8م', unit: 'قطعة', defaultQuantity: 0 },
  { id: 7, type: 'لدجر 1.5م', unit: 'قطعة', defaultQuantity: 0 },
  { id: 8, type: 'لدجر 1.60م', unit: 'قطعة', defaultQuantity: 0 },
  { id: 9, type: 'لدجر 1.00م', unit: 'قطعة', defaultQuantity: 0 },
  { id: 10, type: 'لدجر 1.25م', unit: 'قطعة', defaultQuantity: 0 },
  { id: 11, type: 'لدجر 0.9م', unit: 'قطعة', defaultQuantity: 0 },
  { id: 12, type: 'لدجر 1.2م', unit: 'قطعة', defaultQuantity: 0 },
  { id: 13, type: 'لدجر 0.8م', unit: 'قطعة', defaultQuantity: 0 },
  { id: 14, type: 'لدجر 0.6م', unit: 'قطعة', defaultQuantity: 0 },
  { id: 15, type: 'يوهد', unit: 'قطعة', defaultQuantity: 0 },
  { id: 16, type: 'ميزانيه', unit: 'قطعة', defaultQuantity: 0 },
  { id: 17, type: 'دوكا المنيوم', unit: 'قطعة', defaultQuantity: 0 },
  { id: 18, type: 'وصلات', unit: 'قطعة', defaultQuantity: 0 },
  { id: 19, type: 'ماسورة', unit: 'قطعة', defaultQuantity: 0 },
  { id: 20, type: 'كلامب', unit: 'قطعة', defaultQuantity: 0 },
  { id: 21, type: 'بليتة تثبيت', unit: 'قطعة', defaultQuantity: 0 },
  { id: 22, type: 'لوح بوندي 4م', unit: 'قطعة', defaultQuantity: 0 },
];

/**
 * Memory management system for AI agent conversations
 * Handles storage, retrieval, and analysis of conversation history
 */
class MemoryManager {
  private storageKey: string;
  private maxConversations: number;

  constructor() {
    this.storageKey = 'shaheen_ai_memory';
    this.maxConversations = 100;
  }

  /**
   * Save a new conversation to local storage
   * @param conversationData - The conversation data to save
   * @returns The generated conversation ID
   */
  saveConversation(conversationData: Omit<ConversationData, 'id' | 'timestamp'>): string {
    const conversations = this.getAllConversations();
    const newConversation: ConversationData = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      ...conversationData,
    };

    conversations.unshift(newConversation);

    // Limit the number of stored conversations
    if (conversations.length > this.maxConversations) {
      conversations.splice(this.maxConversations);
    }

    localStorage.setItem(this.storageKey, JSON.stringify(conversations));
    return newConversation.id!;
  }

  /**
   * Retrieve all conversations from local storage
   * @returns Array of conversation objects
   */
  getAllConversations(): ConversationData[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      // Error reading memory - return empty array
      return [];
    }
  }

  /**
   * Search conversations by query string
   * @param query - Search query
   * @returns Filtered conversations
   */
  searchConversations(query: string): ConversationData[] {
    const conversations = this.getAllConversations();
    const searchTerm = query.toLowerCase();

    return conversations.filter(
      conv =>
        conv.userInput?.toLowerCase().includes(searchTerm) ||
        conv.docType?.toLowerCase().includes(searchTerm) ||
        conv.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  /**
   * Get similar conversations based on document type and input
   * @param docType - Document type
   * @param userInput - User input text
   * @param limit - Maximum number of results
   * @returns Similar conversations
   */
  getSimilarConversations(
    docType: string,
    userInput: string,
    limit: number = 3
  ): (ConversationData & { similarity: number })[] {
    const conversations = this.getAllConversations();
    const keywords = this.extractKeywords(userInput);

    return conversations
      .filter(conv => conv.docType === docType)
      .map(conv => ({
        ...conv,
        similarity: this.calculateSimilarity(keywords, conv.userInput),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  /**
   * Extract keywords from text
   * @param text - Input text
   * @returns Array of keywords
   */
  extractKeywords(text: string): string[] {
    const stopWords = ['في', 'من', 'إلى', 'على', 'عن', 'مع', 'هذا', 'هذه', 'التي', 'الذي'];
    return text
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word));
  }

  /**
   * Calculate similarity between two text inputs
   * @param keywords1 - Keywords from first text
   * @param text2 - Second text
   * @returns Similarity score
   */
  calculateSimilarity(keywords1: string[], text2: string): number {
    const keywords2 = this.extractKeywords(text2);
    const intersection = keywords1.filter(word => keywords2.includes(word));
    return intersection.length / Math.max(keywords1.length, keywords2.length);
  }

  /**
   * Generate unique ID for conversations
   * @returns Unique identifier
   */
  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Delete a conversation by ID
   * @param id - Conversation ID to delete
   */
  deleteConversation(id: string): void {
    const conversations = this.getAllConversations();
    const filtered = conversations.filter(conv => conv.id !== id);
    localStorage.setItem(this.storageKey, JSON.stringify(filtered));
  }

  /**
   * Update an existing conversation
   * @param id - Conversation ID
   * @param updates - Updates to apply
   */
  updateConversation(id: string, updates: Partial<ConversationData>): void {
    const conversations = this.getAllConversations();
    const index = conversations.findIndex(conv => conv.id === id);
    if (index !== -1) {
      conversations[index] = { ...conversations[index], ...updates };
      localStorage.setItem(this.storageKey, JSON.stringify(conversations));
    }
  }

  /**
   * Get usage statistics for conversations
   * @returns Statistics object
   */
  getStats(): MemoryStats {
    const conversations = this.getAllConversations();
    const docTypes: Record<string, number> = {};
    const ratings: number[] = [];

    conversations.forEach(conv => {
      if (conv.docType) {
        docTypes[conv.docType] = (docTypes[conv.docType] || 0) + 1;
      }
      if (conv.rating) {
        ratings.push(conv.rating);
      }
    });

    return {
      totalConversations: conversations.length,
      docTypeDistribution: docTypes,
      averageRating: ratings.length > 0 ? ratings.reduce((a, b) => a + b) / ratings.length : 0,
      mostUsedDocType:
        Object.keys(docTypes).length > 0
          ? Object.keys(docTypes).reduce((a, b) => (docTypes[a] > docTypes[b] ? a : b))
          : '',
    };
  }
}

/**
 * Reusable input field component
 */
const InputField: React.FC<InputFieldProps> = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  required = false,
}) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
    />
  </div>
);

/**
 * Rental Commencement Note Component
 * Generates official document for metal scaffolding rental commencement
 */
const RentalCommencementNote: React.FC = () => {
  const [formData, setFormData] = useState<RentalCommencementFormData>({
    lessor: 'شركة أعمال الشاهين للمقاولات',
    lessee: '',
    project: '',
    location: '',
    contractDate: '',
    installationDate: '',
    rentalStartDate: '',
    monthlyRate: '',
    dailyRate: '',
    installationIncluded: true,
    contractNumber: '',
    engineerName: '',
    notes: '',
    // Initialize material quantities
    ...MATERIALS_LIST.reduce(
      (acc, item) => {
        acc[`quantity_${item.id}`] = item.defaultQuantity;
        acc[`installed_${item.id}`] = item.defaultQuantity;
        return acc;
      },
      {} as Record<string, number>
    ),
  });

  /**
   * Handle form field changes
   * @param field - Field name
   * @param value - Field value
   */
  const handleInputChange = (field: string, value: string | number | boolean): void => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };

      // Auto-calculate daily rate from monthly rate
      if (field === 'monthlyRate' && typeof value === 'string' && value) {
        newData.dailyRate = (parseFloat(value) / 30).toFixed(2);
      }

      return newData;
    });
  };

  const materials = MATERIALS_LIST;

  return (
    <div className="printable-area bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
      {/* Company Header */}
      <header className="text-center pb-6 border-b-2 border-gray-200 mb-6">
        <img
          src="https://i.ibb.co/bx1cZBC/image.png"
          alt="شعار شركة أعمال الشاهين"
          className="h-20 mx-auto mb-4"
        />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">شركة أعمال الشاهين للمقاولات</h1>
        <div className="text-sm text-gray-600">
          <p>المملكة العربية السعودية - الرياض</p>
          <p>هاتف: +966 XX XXX XXXX | البريد الإلكتروني: info@shaheen.com</p>
        </div>
      </header>

      <div className="contract-text space-y-6">
        <h2 className="text-xl font-bold text-center text-gray-800 mb-6">
          محضر بدء إيجار الشدات المعدنية
        </h2>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <InputField
            label="المؤجر"
            value={formData.lessor}
            onChange={value => handleInputChange('lessor', value)}
          />
          <InputField
            label="المستأجر"
            value={formData.lessee}
            onChange={value => handleInputChange('lessee', value)}
          />
          <InputField
            label="اسم المشروع"
            value={formData.project}
            onChange={value => handleInputChange('project', value)}
          />
          <InputField
            label="موقع المشروع"
            value={formData.location}
            onChange={value => handleInputChange('location', value)}
          />
          <InputField
            label="رقم العقد"
            value={formData.contractNumber}
            onChange={value => handleInputChange('contractNumber', value)}
          />
          <InputField
            label="تاريخ العقد"
            type="date"
            value={formData.contractDate}
            onChange={value => handleInputChange('contractDate', value)}
          />
          <InputField
            label="تاريخ التركيب"
            type="date"
            value={formData.installationDate}
            onChange={value => handleInputChange('installationDate', value)}
          />
          <InputField
            label="تاريخ بدء الإيجار"
            type="date"
            value={formData.rentalStartDate}
            onChange={value => handleInputChange('rentalStartDate', value)}
          />
          <InputField
            label="سعر الإيجار الشهري (ريال)"
            value={formData.monthlyRate}
            onChange={value => handleInputChange('monthlyRate', value)}
          />
          <InputField
            label="السعر اليومي (ريال)"
            value={formData.dailyRate}
            onChange={value => handleInputChange('dailyRate', value)}
          />
          <InputField
            label="اسم المهندس المشرف"
            value={formData.engineerName}
            onChange={value => handleInputChange('engineerName', value)}
          />
        </div>

        {/* Installation Checkbox */}
        <div className="mb-4">
          <label className="flex items-center space-x-2 space-x-reverse">
            <input
              type="checkbox"
              checked={formData.installationIncluded}
              onChange={e => handleInputChange('installationIncluded', e.target.checked)}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm font-medium text-gray-700">الإيجار يشمل التركيب</span>
          </label>
        </div>

        {/* Contract Information Summary */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
          <h3 className="font-bold text-blue-800 mb-2">📋 معلومات المحضر:</h3>
          <div className="space-y-2 text-sm">
            <div>
              <strong>المؤجر:</strong> {formData.lessor}
            </div>
            <div>
              <strong>المستأجر:</strong> {formData.lessee}
            </div>
            <div>
              <strong>المشروع:</strong> {formData.project}
            </div>
            <div>
              <strong>الموقع:</strong> {formData.location}
            </div>
            <div>
              <strong>رقم العقد:</strong> {formData.contractNumber}
            </div>
            <div>
              <strong>تاريخ العقد:</strong> {formData.contractDate}
            </div>
            <div>
              <strong>تاريخ التركيب:</strong> {formData.installationDate}
            </div>
            <div>
              <strong>تاريخ بدء الإيجار:</strong> {formData.rentalStartDate}
            </div>
            <div>
              <strong>سعر الإيجار الشهري:</strong> {formData.monthlyRate} ريال سعودي
            </div>
            <div>
              <strong>السعر اليومي:</strong> {formData.dailyRate} ريال سعودي
            </div>
            <div>
              <strong>المهندس المشرف:</strong> {formData.engineerName}
            </div>
            <div>
              <strong>يشمل التركيب:</strong> {formData.installationIncluded ? 'نعم' : 'لا'}
            </div>
          </div>
        </div>

        {/* Materials Table */}
        <h3 className="text-lg font-bold text-gray-800 mt-6 mb-4">جدول الشدات المعدنية المؤجرة:</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right text-gray-600 border-collapse">
            <thead className="text-xs text-gray-700 uppercase bg-gray-100">
              <tr>
                <th className="p-3 border border-gray-300">م</th>
                <th className="p-3 border border-gray-300">البيان</th>
                <th className="p-3 border border-gray-300">الوحدة</th>
                <th className="p-3 border border-gray-300">الكمية المؤجرة</th>
                <th className="p-3 border border-gray-300">الكمية المركبة</th>
                <th className="p-3 border border-gray-300">ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((item, index) => (
                <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="p-2 border border-gray-300">{item.id}</td>
                  <td className="p-2 border border-gray-300">{item.type}</td>
                  <td className="p-2 border border-gray-300">{item.unit}</td>
                  <td className="p-2 border border-gray-300">
                    <input
                      type="number"
                      value={(formData[`quantity_${item.id}`] as number) || 0}
                      onChange={e => handleInputChange(`quantity_${item.id}`, e.target.value)}
                      className="w-full p-1 text-center border-none bg-transparent"
                    />
                  </td>
                  <td className="p-2 border border-gray-300">
                    <input
                      type="number"
                      value={(formData[`installed_${item.id}`] as number) || 0}
                      onChange={e => handleInputChange(`installed_${item.id}`, e.target.value)}
                      className="w-full p-1 text-center border-none bg-transparent"
                    />
                  </td>
                  <td className="p-2 border border-gray-300">
                    <input
                      type="text"
                      placeholder="ملاحظات..."
                      className="w-full p-1 border-none bg-transparent text-xs"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Rental Terms */}
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mt-6">
          <h3 className="font-bold text-yellow-800 mb-3">⚠️ شروط بدء الإيجار المهمة:</h3>
          <div className="space-y-2 text-sm text-yellow-900">
            <p>
              <strong>1. بدء الإيجار:</strong>{' '}
              {formData.installationIncluded
                ? 'يبدأ الإيجار بعد اكتمال التركيب'
                : 'يبدأ الإيجار من تاريخ التسليم'}
            </p>
            <p>
              <strong>2. انتهاء الإيجار:</strong> ينتهي الإيجار عند إشعار المؤجر بالإرجاع
            </p>
            <p>
              <strong>3. الشهر الثاني:</strong> يبدأ إيجار الشهر الثاني بعد 10 أيام من انتهاء الشهر
              الأول
            </p>
            <p>
              <strong>4. الفترات الأقل من 10 أيام:</strong> تحسب باليوم (نسبة وتناسب) بنفس سعر إيجار
              الشهر الأول
            </p>
            <p>
              <strong>5. طريقة الحساب:</strong> السعر اليومي = السعر الشهري ÷ 30 يوم
            </p>
            <p>
              <strong>6. المسؤولية:</strong> المستأجر مسؤول عن المحافظة على الشدات من تاريخ بدء
              الإيجار
            </p>
          </div>
        </div>

        {/* Additional Notes */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات إضافية:</label>
          <textarea
            value={formData.notes}
            onChange={e => handleInputChange('notes', e.target.value)}
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="أي ملاحظات إضافية حول بدء الإيجار..."
          />
        </div>

        {/* Acknowledgment */}
        <div className="bg-green-50 p-4 rounded-lg border border-green-200 mt-6">
          <h3 className="font-bold text-green-800 mb-2">✅ إقرار بدء الإيجار:</h3>
          <p className="text-sm text-green-900">
            نحن الموقعون أدناه نقر بأن إيجار الشدات المعدنية المذكورة أعلاه قد بدأ رسمياً
            {formData.installationIncluded ? ' بعد اكتمال التركيب' : ''} في تاريخ{' '}
            <strong>{formData.rentalStartDate}</strong> وفقاً للشروط المتفق عليها في العقد رقم{' '}
            <strong>{formData.contractNumber}</strong>.
          </p>
        </div>
      </div>

      {/* Signatures Section */}
      <footer className="mt-8 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-6">
          <div className="signature-box">
            <div className="text-center">
              <div className="border-b border-gray-400 mb-2 pb-8"></div>
              <p className="font-medium">توقيع المؤجر</p>
              <p className="text-sm text-gray-600">شركة أعمال الشاهين للمقاولات</p>
              <p className="text-xs text-gray-500 mt-1">التاريخ: ___________</p>
            </div>
          </div>
          <div className="signature-box">
            <div className="text-center">
              <div className="border-b border-gray-400 mb-2 pb-8"></div>
              <p className="font-medium">توقيع المستأجر</p>
              <p className="text-sm text-gray-600">{formData.lessee}</p>
              <p className="text-xs text-gray-500 mt-1">التاريخ: ___________</p>
            </div>
          </div>
          <div className="signature-box">
            <div className="text-center">
              <div className="border-b border-gray-400 mb-2 pb-8"></div>
              <p className="font-medium">توقيع المهندس المشرف</p>
              <p className="text-sm text-gray-600">{formData.engineerName}</p>
              <p className="text-xs text-gray-500 mt-1">التاريخ: ___________</p>
            </div>
          </div>
        </div>
        <div className="legal-note text-center text-xs text-gray-500 mt-4 pt-4 border-t border-gray-200">
          <p>هذا المحضر محرر في ثلاث نسخ أصلية، نسخة للمؤجر ونسخة للمستأجر ونسخة للمهندس المشرف</p>
          <p>
            تاريخ المحضر: {new Date().toLocaleDateString('ar-SA')} | رقم المحضر: RC-
            {formData.contractNumber}-{new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
};

/**
 * Enhanced AI Agent View Component
 * Provides intelligent document generation using Gemini API
 */
const EnhancedAiAgentView: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState<string>('');
  const [docType, setDocType] = useState<DocumentType>('عقد إيجار سقالات');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [conversationStage, setConversationStage] = useState<ConversationStage>('initial');
  const [clarificationQuestions, setClarificationQuestions] = useState<string[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [showMemoryPanel, setShowMemoryPanel] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mcpConnected, setMcpConnected] = useState<boolean>(false);

  const memoryManager = useMemo(() => new MemoryManager(), []);

  // Available document types
  const docTypes: DocumentType[] = [
    'عقد إيجار سقالات',
    'محضر بدء إيجار الشدات المعدنية',
    'عقد عمالة',
    'محضر تسليم واستلام',
    'مذكرة مطالبة مالية',
    'إشعار تسليم',
    'محضر إرجاع وفحص',
  ];

  /**
   * Add a new message to the conversation
   * @param content - Message content
   * @param isUser - Whether message is from user
   * @param type - Message type
   * @returns The new message object
   */
  const addMessage = (
    content: string,
    isUser: boolean = false,
    type: 'text' | 'document' = 'text'
  ): Message => {
    const newMessage: Message = {
      id: Date.now(),
      content,
      isUser,
      type,
      timestamp: new Date().toLocaleTimeString('ar-SA'),
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  /**
   * Start a new conversation session
   */
  const startNewConversation = useCallback((): void => {
    setMessages([]);
    setCurrentInput('');
    setConversationStage('initial');
    setClarificationQuestions([]);
    setUserAnswers({});
    setGeneratedContent('');

    const similarConversations = memoryManager.getSimilarConversations(docType, '', 2);
    let welcomeMessage = `مرحباً! أنا مساعدك الذكي لإنشاء ${docType}. `;

    if (similarConversations.length > 0) {
      welcomeMessage += `لاحظت أنك أنشأت مستندات مشابهة من قبل. `;
    }

    welcomeMessage += `يرجى وصف ما تحتاجه بالتفصيل، وسأطرح عليك بعض الأسئلة التوضيحية لإنشاء أفضل مستند ممكن.`;

    addMessage(welcomeMessage, false);
  }, [docType, memoryManager]);

  /**
   * Handle sending a new message
   */
  const handleSendMessage = async (): Promise<void> => {
    if (!currentInput.trim()) return;

    addMessage(currentInput, true);
    const userText = currentInput;
    setCurrentInput('');

    if (conversationStage === 'initial') {
      await handleInitialInput(userText);
    } else if (conversationStage === 'clarifying') {
      await handleClarificationAnswer(userText);
    }
  };

  /**
   * Handle initial user input
   * @param userText - User's initial input
   */
  const handleInitialInput = async (userText: string): Promise<void> => {
    setIsLoading(true);
    addMessage('جاري تحليل طلبك وإعداد الأسئلة التوضيحية...', false);

    try {
      const similarConversations = memoryManager.getSimilarConversations(docType, userText, 3);
      const questions = generateClarificationQuestions(docType, userText, similarConversations);
      setClarificationQuestions(questions);
      setConversationStage('clarifying');

      addMessage('ممتاز! لإنشاء أفضل مستند ممكن، أحتاج لبعض التوضيحات:', false);

      questions.forEach((question, index) => {
        setTimeout(
          () => {
            addMessage(`${index + 1}. ${question}`, false);
          },
          (index + 1) * 500
        );
      });

      setTimeout(
        () => {
          addMessage(
            'يرجى الإجابة على الأسئلة واحداً تلو الآخر، أو يمكنك الإجابة عليها جميعاً في رسالة واحدة.',
            false
          );
        },
        (questions.length + 1) * 500
      );
    } catch (error) {
      addMessage('حدث خطأ في تحليل طلبك. يرجى المحاولة مرة أخرى.', false);
      setConversationStage('initial');
    }

    setIsLoading(false);
  };

  /**
   * Handle clarification answers
   * @param userText - User's answer
   */
  const handleClarificationAnswer = async (userText: string): Promise<void> => {
    const currentAnswers = { ...userAnswers, [clarificationQuestions.length]: userText };
    setUserAnswers(currentAnswers);

    if (Object.keys(currentAnswers).length >= clarificationQuestions.length) {
      addMessage('ممتاز! تم استلام جميع المعلومات. جاري إنشاء المستند...', false);
      await generateDocument(currentAnswers);
    } else {
      addMessage('شكراً لك! يرجى الإجابة على باقي الأسئلة.', false);
    }
  };

  /**
   * Generate clarification questions based on document type
   * @param docType - Document type
   * @param userInput - User input
   * @param similarConversations - Similar past conversations
   * @returns Array of questions
   */
  const generateClarificationQuestions = (
    docType: DocumentType,
    userInput: string,
    similarConversations: (ConversationData & { similarity: number })[]
  ): string[] => {
    const baseQuestions: Record<string, string[]> = {
      'عقد إيجار سقالات': [
        'ما هو اسم المستأجر؟',
        'ما هو اسم المشروع وموقعه؟',
        'ما هي مدة الإيجار؟',
        'ما هو المبلغ المتفق عليه؟',
      ],
      'محضر بدء إيجار الشدات المعدنية': [
        'ما هو اسم المستأجر؟',
        'ما هو اسم المشروع وموقعه؟',
        'ما هو رقم العقد؟',
        'ما هو تاريخ التركيب؟',
        'ما هو سعر الإيجار الشهري؟',
      ],
      'عقد عمالة': [
        'ما هو اسم الموظف؟',
        'ما هو المنصب؟',
        'ما هو الراتب؟',
        'ما هو تاريخ بداية العمل؟',
      ],
    };

    const questions = [...(baseQuestions[docType] || [])];
    if (similarConversations.length > 0) {
      questions.push('لاحظت أنك أنشأت مستندات مشابهة. هل تريد استخدام نفس التفاصيل؟');
    }
    return questions;
  };

  /**
   * Generate document using Gemini AI
   * @param answers - User answers to clarification questions
   */
  const generateDocument = async (answers: Record<number, string>): Promise<void> => {
    setIsLoading(true);
    setConversationStage('generating');

    // Use environment variable for API key (secure approach)
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY;

    if (!apiKey) {
      addMessage('خطأ: مفتاح Gemini API غير موجود. يرجى التأكد من إعداده بشكل صحيح.', false);
      setIsLoading(false);
      setConversationStage('initial');
      return;
    }

    try {
      const fullPrompt = `
                مهمتك هي العمل كمستشار قانوني وتجاري خبير ومتخصص في الأنظمة السعودية لـ "شركة أعمال الشاهين للمقاولات".
                **المهمة الأساسية:** إنشاء مسودة احترافية للمستند المطلوب بناءً على التفاصيل التالية.
                **نوع المستند المطلوب:** ${docType}
                **تفاصيل من المستخدم:** ${Object.values(answers).join(' - ')}
                **تعليمات صارمة:**
                1. ابدأ دائماً بترويسة الشركة: "# شركة أعمال الشاهين للمقاولات"
                2. استخدم تنسيق Markdown مع عناوين واضحة.
                3. أضف البنود القانونية الضرورية حتى لو لم يذكرها المستخدم.
                4. اجعل المستند جاهزاً للطباعة.
                5. أضف قسم التواقيع في النهاية.
                أنشئ المستند كاملاً الآن:
            `;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }],
          }),
        }
      );

      if (!response.ok) {
        const errorData: APIError = await response.json();
        throw new Error(errorData.error?.message || 'حدث خطأ غير معروف من واجهة برمجة التطبيقات');
      }

      const data: GeminiResponse = await response.json();
      const content = data.candidates[0].content.parts[0].text;

      setGeneratedContent(content);
      setConversationStage('completed');
      addMessage('تم إنشاء المستند بنجاح! يمكنك مراجعته أدناه.', false);
      addMessage(content, false, 'document');

      // Save conversation to memory
      memoryManager.saveConversation({
        docType,
        userInput: Object.values(answers).join(' '),
        generatedContent: content,
        tags: extractTags(Object.values(answers).join(' ')),
      });
    } catch (error) {
      // Handle error without console.error in production
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
      addMessage(`حدث خطأ في إنشاء المستند: ${errorMessage}. يرجى المحاولة مرة أخرى.`, false);
      setConversationStage('initial');
    }

    setIsLoading(false);
  };

  /**
   * Extract tags from text for categorization
   * @param text - Input text
   * @returns Array of tags
   */
  const extractTags = (text: string): string[] => {
    const keywords = text.toLowerCase().match(/\b[\u0600-\u06FF]+\b/g) || [];
    return Array.from(new Set(keywords)).slice(0, 5);
  };

  /**
   * Toggle MCP connection status
   */
  const toggleMcpConnection = (): void => setMcpConnected(!mcpConnected);

  // Initialize conversation when component mounts or docType changes
  useEffect(() => {
    startNewConversation();
  }, [docType, startNewConversation]);

  return (
    <div className="max-w-6xl mx-auto p-0 sm:p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <Bot size={32} />
              <div>
                <h2 className="text-2xl font-bold">الوكيل الذكي للمستندات</h2>
                <p className="text-blue-100">مدعوم بـ Gemini 1.5 Flash</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <button
                onClick={toggleMcpConnection}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mcpConnected ? 'bg-green-500' : 'bg-gray-500'
                }`}
              >
                {mcpConnected ? '🟢 MCP متصل' : '🔴 MCP غير متصل'}
              </button>
              <button
                onClick={() => setShowMemoryPanel(!showMemoryPanel)}
                className="p-2 bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors"
              >
                <History size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex">
          {/* Memory Panel (Optional) */}
          {showMemoryPanel && (
            <div className="w-80 bg-gray-50 border-r p-4">
              <h3 className="font-bold text-gray-800 mb-4">الذاكرة والتاريخ</h3>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="البحث في المحادثات..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full p-2 border rounded-lg text-sm"
                />
                {/* Memory content would go here */}
                <div className="text-xs text-gray-500">
                  <p>إحصائيات الاستخدام:</p>
                  <p>المحادثات: {memoryManager.getStats().totalConversations}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 flex flex-col">
            {/* Document Type Selector */}
            <div className="p-4 border-b bg-gray-50">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اختر نوع المستند:
              </label>
              <select
                value={docType}
                onChange={e => setDocType(e.target.value as DocumentType)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {docTypes.map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 space-y-4 max-h-96 overflow-y-auto">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      msg.isUser ? 'bg-blue-600 text-white' : 'bg-gray-100'
                    }`}
                  >
                    {msg.type === 'document' ? (
                      <div className="prose prose-sm">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm">{msg.content}</p>
                    )}
                    <p className="text-xs mt-1 opacity-70">{msg.timestamp}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 px-4 py-2 rounded-lg flex items-center">
                    <Loader2 size={16} className="animate-spin mr-2" />
                    <span className="text-sm">جاري المعالجة...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t">
              <div className="flex space-x-2 space-x-reverse">
                <input
                  type="text"
                  value={currentInput}
                  onChange={e => setCurrentInput(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                  placeholder="اكتب رسالتك هنا..."
                  className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || !currentInput.trim()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <Send size={20} />
                </button>
                <button
                  onClick={startNewConversation}
                  className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  محادثة جديدة
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Generated Document Display */}
        {generatedContent && (
          <div className="border-t p-6 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">📄 المستند المولد</h3>
              <button
                onClick={() => window.print()}
                className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Printer size={16} />
                <span>طباعة</span>
              </button>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border prose prose-lg max-w-none">
              <ReactMarkdown>{generatedContent}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Navigation Button Component
 */
const NavButton: React.FC<NavButtonProps> = ({ text, icon, onClick, isActive }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 space-x-reverse px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
      isActive ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`}
  >
    {icon}
    <span>{text}</span>
  </button>
);

/**
 * Document Suite Component
 * Main container for document management
 */
const DocumentSuite: React.FC = () => {
  const documents: Record<string, DocumentConfig> = {
    rentalCommencement: {
      component: RentalCommencementNote,
      title: 'محضر بدء إيجار الشدات المعدنية',
      icon: <FileText size={16} />,
    },
  };

  const ActiveComponent = documents['rentalCommencement'].component;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">منظومة المستندات</h2>
        <p className="text-gray-600 mb-6">محضر بدء إيجار الشدات المعدنية مع الشروط المتقدمة</p>
      </div>
      <div className="bg-gray-50 p-6 rounded-lg">
        <div className="flex items-center justify-between mb-6 no-print">
          <h3 className="text-xl font-bold text-gray-800">
            {documents['rentalCommencement'].title}
          </h3>
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Printer size={16} />
            <span>طباعة</span>
          </button>
        </div>
        <ActiveComponent />
      </div>
    </div>
  );
};

/**
 * Print Styles Component
 * Handles print-specific CSS
 */
const PrintStyles: React.FC = () => (
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
        }
    `}</style>
);

/**
 * Main App Component
 * Entry point for the application
 */
const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'documents' | 'aiAgent'>('aiAgent');

  return (
    <>
      <PrintStyles />
      <div
        dir="rtl"
        className="bg-gray-100 min-h-screen p-4 sm:p-8"
        style={{ fontFamily: "'Tajawal', sans-serif" }}
      >
        {/* Navigation */}
        <div className="max-w-6xl mx-auto mb-6 no-print">
          <div className="bg-white p-2 rounded-lg shadow-md flex justify-center flex-wrap gap-2">
            <NavButton
              text="منظومة المستندات"
              icon={<FileText size={16} />}
              onClick={() => setActiveView('documents')}
              isActive={activeView === 'documents'}
            />
            <NavButton
              text="الوكيل الذكي"
              icon={<Bot size={16} />}
              onClick={() => setActiveView('aiAgent')}
              isActive={activeView === 'aiAgent'}
            />
          </div>
        </div>

        {/* Main Content */}
        {activeView === 'documents' ? <DocumentSuite /> : <EnhancedAiAgentView />}
      </div>
    </>
  );
};

export default App;
