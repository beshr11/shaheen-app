/**
 * Enhanced AI Agent Component
 * 
 * This component provides an intelligent conversational interface for generating
 * legal documents using Google's Gemini AI. It includes conversation memory,
 * document type selection, and professional document preview capabilities.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bot, 
  Send, 
  Loader2, 
  History, 
  Printer, 
  MessageCircle,
  FileText 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { 
  Message, 
  DocumentType, 
  ConversationStage 
} from '../types';
import { MemoryManager } from '../utils/MemoryManager';
import { LoadingSpinner } from './common/UIComponents';

/**
 * Available document types for AI generation
 */
const DOCUMENT_TYPES: DocumentType[] = [
  'عقد إيجار سقالات',
  'محضر بدء إيجار الشدات المعدنية',
  'عقد عمالة',
  'محضر تسليم واستلام',
  'مذكرة مطالبة مالية',
  'إشعار تسليم',
  'محضر إرجاع وفحص'
];

/**
 * Enhanced AI Agent View Component
 */
export const EnhancedAiAgentView: React.FC = () => {
  // State management
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState<string>('');
  const [docType, setDocType] = useState<DocumentType>('عقد إيجار سقالات');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [conversationStage, setConversationStage] = useState<ConversationStage>('initial');
  const [clarificationQuestions, setClarificationQuestions] = useState<string[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showMemoryPanel, setShowMemoryPanel] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Initialize memory manager
  const memoryManager = new MemoryManager();

  /**
   * Add a new message to the conversation
   */
  const addMessage = useCallback((content: string, isUser = false, type: 'text' | 'document' = 'text') => {
    const newMessage: Message = {
      id: Date.now(),
      content,
      isUser,
      type,
      timestamp: new Date().toLocaleTimeString('ar-SA')
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  /**
   * Start a new conversation with welcome message
   */
  const startNewConversation = useCallback(() => {
    setMessages([]);
    setCurrentInput('');
    setConversationStage('initial');
    setClarificationQuestions([]);
    setUserAnswers({});
    setGeneratedContent('');
    setError('');

    // Check for similar conversations
    const similarConversations = memoryManager.getSimilarConversations(docType, '', 2);
    let welcomeMessage = `مرحباً! أنا مساعدك الذكي لإنشاء ${docType}. `;

    if (similarConversations.length > 0) {
      welcomeMessage += `لاحظت أنك أنشأت مستندات مشابهة من قبل. `;
    }

    welcomeMessage += `يرجى وصف ما تحتاجه بالتفصيل، وسأطرح عليك بعض الأسئلة التوضيحية لإنشاء أفضل مستند ممكن.`;

    addMessage(welcomeMessage, false);
  }, [docType, addMessage, memoryManager]);

  /**
   * Handle sending a message
   */
  const handleSendMessage = async () => {
    if (!currentInput.trim() || isLoading) return;

    const userText = currentInput;
    addMessage(userText, true);
    setCurrentInput('');

    if (conversationStage === 'initial') {
      await handleInitialInput(userText);
    } else if (conversationStage === 'clarifying') {
      await handleClarificationAnswer(userText);
    }
  };

  /**
   * Handle initial user input and generate clarification questions
   */
  const handleInitialInput = async (userText: string) => {
    setIsLoading(true);
    setError('');
    addMessage('جاري تحليل طلبك وإعداد الأسئلة التوضيحية...', false);

    try {
      // Generate context-aware clarification questions
      const questions = generateClarificationQuestions(docType, userText);
      setClarificationQuestions(questions);
      setConversationStage('clarifying');

      addMessage('ممتاز! لإنشاء أفضل مستند ممكن، أحتاج لبعض التوضيحات:', false);

      // Add questions with delay for better UX
      questions.forEach((question, index) => {
        setTimeout(() => {
          addMessage(`${index + 1}. ${question}`, false);
        }, (index + 1) * 500);
      });

      setTimeout(() => {
        addMessage('يرجى الإجابة على الأسئلة واحداً تلو الآخر، أو يمكنك الإجابة عليها جميعاً في رسالة واحدة.', false);
      }, (questions.length + 1) * 500);

    } catch (error) {
      console.error('Error in handleInitialInput:', error);
      setError('حدث خطأ في تحليل طلبك. يرجى المحاولة مرة أخرى.');
      addMessage('حدث خطأ في تحليل طلبك. يرجى المحاولة مرة أخرى.', false);
      setConversationStage('initial');
    }

    setIsLoading(false);
  };

  /**
   * Handle clarification answers
   */
  const handleClarificationAnswer = async (userText: string) => {
    const answerIndex = Object.keys(userAnswers).length;
    const currentAnswers = { ...userAnswers, [answerIndex]: userText };
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
   */
  const generateClarificationQuestions = (docType: DocumentType, userInput: string): string[] => {
    const baseQuestions: Record<string, string[]> = {
      'عقد إيجار سقالات': [
        'ما هو اسم المستأجر الكامل؟',
        'ما هو اسم المشروع وموقعه بالتفصيل؟',
        'ما هي مدة الإيجار المطلوبة؟',
        'ما هو المبلغ المتفق عليه (شهري/يومي)؟',
        'هل يشمل الإيجار التركيب والفك؟'
      ],
      'محضر بدء إيجار الشدات المعدنية': [
        'ما هو اسم المستأجر؟',
        'ما هو اسم المشروع وموقعه؟',
        'ما هو رقم العقد المرجعي؟',
        'ما هو تاريخ التركيب المخطط؟',
        'ما هو سعر الإيجار الشهري المتفق عليه؟',
        'ما هو اسم المهندس المشرف؟'
      ],
      'عقد عمالة': [
        'ما هو اسم الموظف أو العامل؟',
        'ما هو المنصب أو طبيعة العمل؟',
        'ما هو الراتب أو الأجر المتفق عليه؟',
        'ما هو تاريخ بداية العمل؟',
        'ما هي مدة العقد؟'
      ]
    };

    let questions = baseQuestions[docType] || [
      'ما هي التفاصيل الأساسية للمستند؟',
      'من هم الأطراف المعنية؟',
      'ما هي المدة الزمنية المطلوبة؟',
      'ما هي القيم المالية المتفق عليها؟'
    ];

    // Check for similar conversations to suggest reusing details
    const similarConversations = memoryManager.getSimilarConversations(docType, userInput, 2);
    if (similarConversations.length > 0) {
      questions.push('لاحظت أنك أنشأت مستندات مشابهة. هل تريد استخدام نفس التفاصيل أم تحديثها؟');
    }

    return questions;
  };

  /**
   * Generate document using Netlify Function
   */
  const generateDocument = async (answers: Record<string, string>) => {
    setIsLoading(true);
    setConversationStage('generating');
    setError('');

    try {
      // Prepare the request payload
      const requestBody = {
        prompt: Object.values(answers).join(' - '),
        docType: docType
      };

      // Call Netlify Function instead of direct API call
      const response = await fetch('/.netlify/functions/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.success || !data.content) {
        throw new Error('لم يتم إنشاء محتوى صالح من الخدمة');
      }

      const content = data.content;
      
      setGeneratedContent(content);
      setConversationStage('completed');
      addMessage('تم إنشاء المستند بنجاح! يمكنك مراجعته أدناه.', false);
      addMessage(content, false, 'document');

      // Save conversation to memory
      memoryManager.saveConversation({
        docType,
        userInput: Object.values(answers).join(' '),
        generatedContent: content,
        tags: extractTags(Object.values(answers).join(' '))
      });

    } catch (error) {
      console.error('Error generating document:', error);
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير معروف';
      setError(`حدث خطأ في إنشاء المستند: ${errorMessage}`);
      addMessage(`حدث خطأ في إنشاء المستند: ${errorMessage}. يرجى المحاولة مرة أخرى.`, false);
      setConversationStage('initial');
    }

    setIsLoading(false);
  };

  /**
   * Extract tags from text for better memory organization
   */
  const extractTags = (text: string): string[] => {
    const keywords = text.toLowerCase().match(/\b[\u0600-\u06FF]+\b/g) || [];
    return Array.from(new Set(keywords)).slice(0, 5);
  };

  /**
   * Handle key press events
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Initialize conversation when component mounts or docType changes
  useEffect(() => {
    startNewConversation();
  }, [startNewConversation]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <Bot size={32} />
              <div>
                <h2 className="text-2xl font-bold">الوكيل الذكي للمستندات</h2>
                <p className="text-blue-100">مدعوم بـ Gemini AI - آمن ومحمي</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <button 
                onClick={() => setShowMemoryPanel(!showMemoryPanel)} 
                className="p-2 bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors"
                title="سجل المحادثات"
              >
                <History size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex">
          {/* Memory Panel (if enabled) */}
          {showMemoryPanel && (
            <div className="w-80 bg-gray-50 border-r p-4">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <History size={20} className="ml-2" />
                سجل المحادثات
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {memoryManager.getAllConversations().slice(0, 10).map(conv => (
                  <div key={conv.id} className="bg-white p-3 rounded-lg border text-sm">
                    <div className="font-medium text-blue-600">{conv.docType}</div>
                    <div className="text-gray-600 truncate">{conv.userInput.substring(0, 50)}...</div>
                    <div className="text-xs text-gray-400">{new Date(conv.timestamp).toLocaleDateString('ar-SA')}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Chat Interface */}
          <div className="flex-1 flex flex-col">
            {/* Document Type Selection */}
            <div className="p-4 border-b bg-gray-50">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اختر نوع المستند:
              </label>
              <select 
                value={docType} 
                onChange={(e) => setDocType(e.target.value as DocumentType)} 
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={isLoading || conversationStage !== 'initial'}
              >
                {DOCUMENT_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 p-4 space-y-4 max-h-96 overflow-y-auto">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    msg.isUser 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {msg.type === 'document' ? (
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    )}
                    <p className={`text-xs mt-1 ${msg.isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                      {msg.timestamp}
                    </p>
                  </div>
                </div>
              ))}
              
              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 px-4 py-2 rounded-lg flex items-center space-x-2 space-x-reverse">
                    <LoadingSpinner size={16} />
                    <span className="text-sm text-gray-600">جاري المعالجة...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t">
              <div className="flex space-x-2 space-x-reverse">
                <textarea
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    conversationStage === 'initial' 
                      ? "اكتب تفاصيل المستند الذي تريد إنشاءه..." 
                      : "اكتب إجابتك هنا..."
                  }
                  className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={2}
                  disabled={isLoading}
                />
                <button 
                  onClick={handleSendMessage} 
                  disabled={isLoading || !currentInput.trim()} 
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={20} />
                </button>
                <button 
                  onClick={startNewConversation} 
                  className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  title="محادثة جديدة"
                >
                  <MessageCircle size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Generated Document Preview */}
        {generatedContent && (
          <div className="border-t p-6 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center">
                <FileText size={20} className="ml-2" />
                المستند المولد
              </h3>
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