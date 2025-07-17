// الملف الكامل والنهائي لـ src/App.js مع جميع المكونات الأصلية + نظام الذاكرة

import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { FileText, Printer, Bot, Edit, Loader2, History, Star, Search, Trash2, Download, Upload } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// === نظام الذاكرة والتعلم ===

class MemoryManager {
    constructor() {
        this.storageKey = 'shaheen_ai_memory';
        this.maxConversations = 100;
    }

    saveConversation(conversationData) {
        const conversations = this.getAllConversations();
        const newConversation = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            ...conversationData
        };
        
        conversations.unshift(newConversation);
        
        if (conversations.length > this.maxConversations) {
            conversations.splice(this.maxConversations);
        }
        
        localStorage.setItem(this.storageKey, JSON.stringify(conversations));
        return newConversation.id;
    }

    getAllConversations() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('خطأ في قراءة الذاكرة:', error);
            return [];
        }
    }

    searchConversations(query) {
        const conversations = this.getAllConversations();
        const searchTerm = query.toLowerCase();
        
        return conversations.filter(conv => 
            conv.userInput?.toLowerCase().includes(searchTerm) ||
            conv.docType?.toLowerCase().includes(searchTerm) ||
            conv.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
        );
    }

    getSimilarConversations(docType, userInput, limit = 3) {
        const conversations = this.getAllConversations();
        const keywords = this.extractKeywords(userInput);
        
        return conversations
            .filter(conv => conv.docType === docType)
            .map(conv => ({
                ...conv,
                similarity: this.calculateSimilarity(keywords, conv.userInput)
            }))
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit);
    }

    extractKeywords(text) {
        const stopWords = ['في', 'من', 'إلى', 'على', 'عن', 'مع', 'هذا', 'هذه', 'التي', 'الذي'];
        return text.toLowerCase()
            .split(/\s+/)
            .filter(word => word.length > 2 && !stopWords.includes(word));
    }

    calculateSimilarity(keywords1, text2) {
        const keywords2 = this.extractKeywords(text2);
        const intersection = keywords1.filter(word => keywords2.includes(word));
        return intersection.length / Math.max(keywords1.length, keywords2.length);
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    deleteConversation(id) {
        const conversations = this.getAllConversations();
        const filtered = conversations.filter(conv => conv.id !== id);
        localStorage.setItem(this.storageKey, JSON.stringify(filtered));
    }

    updateConversation(id, updates) {
        const conversations = this.getAllConversations();
        const index = conversations.findIndex(conv => conv.id === id);
        if (index !== -1) {
            conversations[index] = { ...conversations[index], ...updates };
            localStorage.setItem(this.storageKey, JSON.stringify(conversations));
        }
    }

    getStats() {
        const conversations = this.getAllConversations();
        const docTypes = {};
        const ratings = [];
        
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
            mostUsedDocType: Object.keys(docTypes).reduce((a, b) => docTypes[a] > docTypes[b] ? a : b, '')
        };
    }
}

const ConversationHistory = ({ memoryManager, onSelectConversation }) => {
    const [conversations, setConversations] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDocType, setSelectedDocType] = useState('');

    useEffect(() => {
        loadConversations();
    }, [searchTerm, selectedDocType]);

    const loadConversations = () => {
        let results = memoryManager.getAllConversations();
        
        if (searchTerm) {
            results = memoryManager.searchConversations(searchTerm);
        }
        
        if (selectedDocType) {
            results = results.filter(conv => conv.docType === selectedDocType);
        }
        
        setConversations(results);
    };

    const formatDate = (timestamp) => {
        return new Date(timestamp).toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const docTypes = [...new Set(memoryManager.getAllConversations().map(conv => conv.docType))];

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold mb-4">تاريخ المحادثات</h3>
            
            <div className="flex gap-4 mb-6">
                <input
                    type="text"
                    placeholder="البحث في المحادثات..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 p-2 border rounded-md"
                />
                <select
                    value={selectedDocType}
                    onChange={(e) => setSelectedDocType(e.target.value)}
                    className="p-2 border rounded-md"
                >
                    <option value="">جميع أنواع المستندات</option>
                    {docTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </select>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
                {conversations.map(conv => (
                    <div
                        key={conv.id}
                        className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => onSelectConversation(conv)}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className="font-semibold text-blue-600">{conv.docType}</span>
                            <span className="text-sm text-gray-500">{formatDate(conv.timestamp)}</span>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2">{conv.userInput}</p>
                        {conv.rating && (
                            <div className="flex items-center mt-2">
                                <span className="text-xs text-gray-500 ml-2">التقييم:</span>
                                {'★'.repeat(conv.rating)}{'☆'.repeat(5 - conv.rating)}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {conversations.length === 0 && (
                <p className="text-center text-gray-500 py-8">لا توجد محادثات مطابقة للبحث</p>
            )}
        </div>
    );
};

const UsageStats = ({ memoryManager }) => {
    const [stats, setStats] = useState(null);

    useEffect(() => {
        setStats(memoryManager.getStats());
    }, []);

    if (!stats) return null;

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold mb-4">إحصائيات الاستخدام</h3>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{stats.totalConversations}</div>
                    <div className="text-sm text-gray-600">إجمالي المحادثات</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{stats.averageRating.toFixed(1)}</div>
                    <div className="text-sm text-gray-600">متوسط التقييم</div>
                </div>
            </div>

            <div className="mt-4">
                <h4 className="font-semibold mb-2">أكثر أنواع المستندات استخداماً:</h4>
                {Object.entries(stats.docTypeDistribution)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([type, count]) => (
                        <div key={type} className="flex justify-between py-1">
                            <span>{type}</span>
                            <span className="font-semibold">{count}</span>
                        </div>
                    ))}
            </div>
        </div>
    );
};

const ConversationRating = ({ conversationId, memoryManager, onRated }) => {
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = () => {
        memoryManager.updateConversation(conversationId, {
            rating,
            userFeedback: feedback,
            ratedAt: new Date().toISOString()
        });
        onRated && onRated(rating, feedback);
        setIsSubmitted(true);
    };

    if (isSubmitted) {
        return (
            <div className="bg-green-50 p-4 rounded-lg mt-4">
                <p className="text-green-800 font-semibold">شكراً لك! تم حفظ تقييمك وسيساعدني في التحسن.</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 p-4 rounded-lg mt-4">
            <h4 className="font-semibold mb-3">قيّم جودة هذا المستند:</h4>
            
            <div className="flex gap-2 mb-3">
                {[1, 2, 3, 4, 5].map(star => (
                    <button
                        key={star}
                        onClick={() => setRating(star)}
                        className={`text-2xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                    >
                        ★
                    </button>
                ))}
            </div>

            <textarea
                placeholder="ملاحظات أو اقتراحات للتحسين (اختياري)"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full p-2 border rounded-md text-sm"
                rows="3"
            />

            <button
                onClick={handleSubmit}
                disabled={rating === 0}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-400"
            >
                حفظ التقييم
            </button>
        </div>
    );
};

// === الوكيل الذكي المحسن ===

const EnhancedAiAgentView = () => {
    const [prompt, setPrompt] = useState('');
    const [docType, setDocType] = useState('عقد');
    const [generatedContent, setGeneratedContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentConversationId, setCurrentConversationId] = useState(null);
    const [conversationStep, setConversationStep] = useState('initial'); // 'initial', 'clarifying', 'generating', 'completed'
    const [clarifyingQuestions, setClarifyingQuestions] = useState([]);
    const [userAnswers, setUserAnswers] = useState({});
    
    const [activeTab, setActiveTab] = useState('generate');
    const [memoryManager] = useState(new MemoryManager());
    const [similarConversations, setSimilarConversations] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        if (prompt.length > 10) {
            const similar = memoryManager.getSimilarConversations(docType, prompt, 3);
            setSimilarConversations(similar);
            setShowSuggestions(similar.length > 0);
        } else {
            setShowSuggestions(false);
        }
    }, [prompt, docType]);

    const buildContextFromMemory = () => {
        const recentConversations = memoryManager.getAllConversations()
            .filter(conv => conv.docType === docType)
            .slice(0, 5);

        if (recentConversations.length === 0) return '';

        let context = '\n\n**السياق من التجارب السابقة:**\n';
        
        recentConversations.forEach((conv, index) => {
            if (conv.userFeedback) {
                context += `- في محادثة سابقة، طلب المستخدم تحسينات: "${conv.userFeedback}"\n`;
            }
            if (conv.rating && conv.rating >= 4) {
                context += `- مستند ناجح سابق كان عن: "${conv.userInput.substring(0, 100)}..."\n`;
            }
        });

        if (similarConversations.length > 0) {
            context += '\n**محادثات مشابهة للاستفادة منها:**\n';
            similarConversations.forEach(conv => {
                context += `- "${conv.userInput}" (تقييم: ${conv.rating || 'غير مقيم'})\n`;
            });
        }

        return context;
    };

    const buildClarificationPrompt = () => {
        const memoryContext = buildContextFromMemory();
        
        return `
            أنت مستشار قانوني وتجاري خبير في الأنظمة السعودية لـ "شركة أعمال الشاهين للمقاولات".
            
            المستخدم يريد إنشاء: ${docType}
            وصف المستخدم: "${prompt}"
            
            ${memoryContext}
            
            مهمتك الآن هي تحليل طلب المستخدم وتحديد ما إذا كان يحتاج توضيحات إضافية.
            
            إذا كان الطلب واضحاً ومفصلاً بما فيه الكفاية، أجب بـ: "الطلب واضح ومفصل"
            
            إذا كان الطلب يحتاج توضيحات، اطرح 3-5 أسئلة محددة وعملية لتحسين جودة المستند.
            
            اجعل أسئلتك في شكل قائمة مرقمة، مثل:
            1. ما هي المدة الزمنية للعقد؟
            2. ما هي قيمة الإيجار الشهرية؟
            3. هل هناك شروط خاصة للتأمين؟
            
            ركز على الجوانب القانونية والمالية المهمة لحماية مصالح الشركة.
        `;
    };

    const buildFinalPrompt = () => {
        const memoryContext = buildContextFromMemory();
        const stats = memoryManager.getStats();
        
        let answersText = '';
        if (Object.keys(userAnswers).length > 0) {
            answersText = '\n**إجابات المستخدم على الأسئلة التوضيحية:**\n';
            Object.entries(userAnswers).forEach(([question, answer]) => {
                answersText += `- ${question}: ${answer}\n`;
            });
        }
        
        return `
            أنت مستشار قانوني وتجاري خبير ومتخصص في الأنظمة السعودية لـ "شركة أعمال الشاهين للمقاولات".
            
            **المهمة:** إنشاء مسودة احترافية ومكتملة للمستند التالي:
            
            **نوع المستند:** ${docType}
            **الطلب الأصلي:** "${prompt}"
            ${answersText}
            
            **معلومات من ذاكرة النظام:**
            - إجمالي المستندات المنشأة: ${stats.totalConversations}
            - متوسط تقييم المستخدم: ${stats.averageRating.toFixed(1)}/5
            ${memoryContext}
            
            **تعليمات صارمة:**
            1. ابدأ بترويسة احترافية تتضمن:
               - شعار وعنوان "شركة أعمال الشاهين للمقاولات"
               - رقم السجل التجاري: 1009148705
               - رقم الجوال: 0558203077
               - العنوان: المملكة العربية السعودية - الرياض - حي العارض
            
            2. أنشئ عنواناً واضحاً للمستند
            
            3. قسّم المستند إلى مواد مرقمة وواضحة تغطي:
               - جميع الجوانب القانونية والمالية
               - حقوق والتزامات كل طرف
               - شروط الدفع والتسليم
               - آليات حل النزاعات
               - أي شروط خاصة بنوع المستند
            
            4. اختتم بقسم التواقيع مع مساحات للأطراف
            
            5. استخدم لغة عربية قانونية رسمية وواضحة
            
            6. نسّق النص باستخدام Markdown للعناوين والقوائم
            
            **الهدف:** إنشاء مستند جاهز للاستخدام يحمي مصالح الشركة إلى أقصى درجة ممكنة.
        `;
    };

    const handleInitialGenerate = async () => {
        if (!prompt.trim()) {
            alert("يرجى إدخال وصف للمستند المطلوب.");
            return;
        }
        
        setIsLoading(true);
        setConversationStep('clarifying');

        const clarificationPrompt = buildClarificationPrompt();
        const apiKey = process.env.REACT_APP_GEMINI_API_KEY;

        if (!apiKey) {
            const errorMsg = "مفتاح Gemini API غير موجود. يرجى التأكد من إعداده بشكل صحيح.";
            console.error(errorMsg);
            setGeneratedContent(errorMsg);
            setIsLoading(false);
            return;
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const payload = { contents: [{ role: "user", parts: [{ text: clarificationPrompt }] }] };

        try {
            const response = await fetch(apiUrl, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(payload) 
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error.message || response.statusText);
            }
            
            const result = await response.json();
            if (result.candidates?.[0]?.content?.parts?.[0]) {
                const aiResponse = result.candidates[0].content.parts[0].text;
                
                if (aiResponse.includes("الطلب واضح ومفصل")) {
                    // الطلب واضح، ننتقل مباشرة لإنشاء المستند
                    handleFinalGenerate();
                } else {
                    // نحتاج توضيحات
                    const questions = extractQuestions(aiResponse);
                    setClarifyingQuestions(questions);
                    setConversationStep('clarifying');
                }
            } else {
                setGeneratedContent("لم يتمكن الذكاء الاصطناعي من تحليل الطلب.");
                setConversationStep('initial');
            }
        } catch (error) {
            console.error("Error calling Gemini API:", error);
            setGeneratedContent(`حدث خطأ أثناء الاتصال بالذكاء الاصطناعي: ${error.message}`);
            setConversationStep('initial');
        } finally {
            setIsLoading(false);
        }
    };

    const extractQuestions = (text) => {
        const lines = text.split('\n');
        const questions = [];
        
        lines.forEach(line => {
            const match = line.match(/^\d+\.\s*(.+)/);
            if (match) {
                questions.push(match[1].trim());
            }
        });
        
        return questions;
    };

    const handleFinalGenerate = async () => {
        setIsLoading(true);
        setConversationStep('generating');

        const finalPrompt = buildFinalPrompt();
        const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const payload = { contents: [{ role: "user", parts: [{ text: finalPrompt }] }] };

        try {
            const response = await fetch(apiUrl, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(payload) 
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error.message || response.statusText);
            }
            
            const result = await response.json();
            if (result.candidates?.[0]?.content?.parts?.[0]) {
                const aiResponse = result.candidates[0].content.parts[0].text;
                setGeneratedContent(aiResponse);
                setConversationStep('completed');
                
                // حفظ المحادثة في الذاكرة
                const conversationId = memoryManager.saveConversation({
                    userInput: prompt,
                    docType: docType,
                    aiResponse: aiResponse,
                    clarifyingQuestions: clarifyingQuestions,
                    userAnswers: userAnswers,
                    tags: extractTags(prompt, docType)
                });
                setCurrentConversationId(conversationId);
                
            } else {
                setGeneratedContent("لم يتمكن الذكاء الاصطناعي من إنشاء المستند.");
            }
        } catch (error) {
            console.error("Error calling Gemini API:", error);
            setGeneratedContent(`حدث خطأ أثناء الاتصال بالذكاء الاصطناعي: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const extractTags = (text, docType) => {
        const keywords = text.toLowerCase().match(/\b[\u0600-\u06FF]+\b/g) || [];
        const commonTags = keywords.filter(word => word.length > 2).slice(0, 5);
        return [docType, ...commonTags];
    };

    const applySuggestion = (conversation) => {
        setPrompt(conversation.userInput);
        setDocType(conversation.docType);
        setGeneratedContent(conversation.aiResponse);
        setConversationStep('completed');
        setShowSuggestions(false);
    };

    const handleRating = (rating, feedback) => {
        if (currentConversationId) {
            memoryManager.updateConversation(currentConversationId, {
                rating,
                userFeedback: feedback
            });
        }
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head>
                <title>طباعة مستند</title>
                <style>
                    @page { 
                        size: A4; 
                        margin: 1.5cm; 
                    } 
                    body { 
                        direction: rtl; 
                        font-family: "Tajawal", sans-serif; 
                        line-height: 1.6; 
                        font-size: 12pt;
                    } 
                    h1, h2, h3 { 
                        margin-bottom: 0.5rem; 
                        color: #1f2937;
                    } 
                    h1 { font-size: 18pt; }
                    h2 { font-size: 16pt; }
                    h3 { font-size: 14pt; }
                    p { 
                        margin-top: 0; 
                        margin-bottom: 0.5rem;
                    } 
                    ul, ol { 
                        padding-right: 20px; 
                        margin-bottom: 1rem;
                    }
                    .header {
                        text-align: center;
                        border-bottom: 2px solid #e5e7eb;
                        padding-bottom: 1rem;
                        margin-bottom: 2rem;
                    }
                    .signature-section {
                        margin-top: 3rem;
                        display: flex;
                        justify-content: space-between;
                    }
                    .signature-box {
                        text-align: center;
                        width: 45%;
                        border-top: 1px solid #000;
                        padding-top: 0.5rem;
                        margin-top: 2rem;
                    }
                </style>
            </head>
            <body>
                <div class="prose">
                    ${generatedContent.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>')}
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    const resetConversation = () => {
        setConversationStep('initial');
        setClarifyingQuestions([]);
        setUserAnswers({});
        setGeneratedContent('');
        setCurrentConversationId(null);
    };

    const exportData = () => {
        const data = memoryManager.getAllConversations();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `shaheen_ai_memory_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="bg-white p-2 rounded-lg shadow-md mb-6 flex justify-center gap-2">
                <button
                    onClick={() => setActiveTab('generate')}
                    className={`px-4 py-2 rounded-md flex items-center gap-2 ${activeTab === 'generate' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                    <Bot size={16} />
                    إنشاء مستند
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-4 py-2 rounded-md flex items-center gap-2 ${activeTab === 'history' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                    <History size={16} />
                    تاريخ المحادثات
                </button>
                <button
                    onClick={() => setActiveTab('stats')}
                    className={`px-4 py-2 rounded-md flex items-center gap-2 ${activeTab === 'stats' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                    <Star size={16} />
                    الإحصائيات
                </button>
            </div>

            {activeTab === 'generate' && (
                <>
                    {conversationStep === 'initial' && (
                        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 no-print">
                            <div className="flex items-center gap-3 mb-4">
                                <Bot className="w-8 h-8 text-blue-600" />
                                <h2 className="text-2xl font-bold text-gray-800">الوكيل الذكي للمستندات</h2>
                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">مع ذاكرة ذكية</span>
                            </div>
                            
                            <p className="text-gray-600 mb-6">صف للمساعد الذكي المستند الذي تحتاجه. سأطرح عليك أسئلة توضيحية إذا احتجت لمزيد من التفاصيل لإنشاء أفضل مستند ممكن.</p>
                            
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="docType" className="block text-sm font-bold text-gray-700 mb-1">اختر نوع المستند الأساسي:</label>
                                    <select 
                                        id="docType" 
                                        value={docType} 
                                        onChange={(e) => setDocType(e.target.value)} 
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option>عقد</option>
                                        <option>عرض سعر</option>
                                        <option>مطالبة مالية</option>
                                        <option>رسالة رسمية</option>
                                        <option>مستند آخر</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label htmlFor="prompt" className="block text-sm font-bold text-gray-700 mb-1">صف الموضوع والتفاصيل هنا:</label>
                                    <textarea
                                        id="prompt"
                                        rows="4"
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder="مثال: عقد إيجار سقالات لمشروع فيلا في حي الياسمين، يتضمن بنداً لغرامة التأخير وبنداً للمحافظة على المواد..."
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {showSuggestions && (
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <h4 className="font-semibold text-blue-800 mb-2">💡 اقتراحات من تجاربك السابقة:</h4>
                                        <div className="space-y-2">
                                            {similarConversations.map(conv => (
                                                <div key={conv.id} className="bg-white p-3 rounded border cursor-pointer hover:bg-gray-50" onClick={() => applySuggestion(conv)}>
                                                    <p className="text-sm text-gray-700">{conv.userInput.substring(0, 100)}...</p>
                                                    <div className="flex justify-between items-center mt-1">
                                                        <span className="text-xs text-gray-500">{new Date(conv.timestamp).toLocaleDateString('ar-SA')}</span>
                                                        {conv.rating && <span className="text-xs">{'★'.repeat(conv.rating)}</span>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                <button 
                                    onClick={handleInitialGenerate} 
                                    disabled={isLoading} 
                                    className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 shadow-lg flex items-center justify-center gap-2"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" /> : <Bot />}
                                    {isLoading ? 'جاري التحليل...' : 'ابدأ المحادثة'}
                                </button>
                            </div>
                        </div>
                    )}

                    {conversationStep === 'clarifying' && clarifyingQuestions.length > 0 && (
                        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 no-print">
                            <div className="flex items-center gap-3 mb-4">
                                <Bot className="w-8 h-8 text-blue-600" />
                                <h2 className="text-xl font-bold text-gray-800">أسئلة توضيحية لتحسين المستند</h2>
                            </div>
                            
                            <p className="text-gray-600 mb-6">لإنشاء أفضل مستند ممكن، أحتاج بعض التوضيحات الإضافية:</p>
                            
                            <div className="space-y-4">
                                {clarifyingQuestions.map((question, index) => (
                                    <div key={index}>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">
                                            {index + 1}. {question}
                                        </label>
                                        <textarea
                                            rows="2"
                                            value={userAnswers[question] || ''}
                                            onChange={(e) => setUserAnswers(prev => ({...prev, [question]: e.target.value}))}
                                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                            placeholder="اكتب إجابتك هنا..."
                                        />
                                    </div>
                                ))}
                                
                                <div className="flex gap-4">
                                    <button 
                                        onClick={handleFinalGenerate} 
                                        disabled={isLoading} 
                                        className="flex-1 bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-300 shadow-lg flex items-center justify-center gap-2"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin" /> : <Bot />}
                                        {isLoading ? 'جاري إنشاء المستند...' : 'أنشئ المستند الآن'}
                                    </button>
                                    
                                    <button 
                                        onClick={() => handleFinalGenerate()} 
                                        className="bg-gray-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-600"
                                    >
                                        تخطي الأسئلة
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {conversationStep === 'completed' && generatedContent && (
                        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
                            <div className="flex justify-between items-center mb-4 no-print">
                                <h3 className="text-xl font-bold text-gray-800">المستند المجهز:</h3>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={resetConversation} 
                                        className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600"
                                    >
                                        <Bot size={20} />
                                    </button>
                                    <button 
                                        onClick={handlePrint} 
                                        className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700"
                                    >
                                        <Printer size={20} />
                                    </button>
                                </div>
                            </div>
                            
                            <div id="printable-document" className="printable-content">
                                <div className="prose prose-lg max-w-none p-4 bg-gray-50 rounded-md border">
                                    <ReactMarkdown>{generatedContent}</ReactMarkdown>
                                </div>
                            </div>

                            {currentConversationId && (
                                <ConversationRating 
                                    conversationId={currentConversationId}
                                    memoryManager={memoryManager}
                                    onRated={handleRating}
                                />
                            )}
                        </div>
                    )}
                </>
            )}

            {activeTab === 'history' && (
                <ConversationHistory 
                    memoryManager={memoryManager}
                    onSelectConversation={(conv) => {
                        setPrompt(conv.userInput);
                        setDocType(conv.docType);
                        setGeneratedContent(conv.finalVersion || conv.aiResponse);
                        setConversationStep('completed');
                        setActiveTab('generate');
                    }}
                />
            )}

            {activeTab === 'stats' && (
                <div className="space-y-6">
                    <UsageStats memoryManager={memoryManager} />
                    
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h3 className="text-xl font-bold mb-4">إدارة البيانات</h3>
                        <div className="flex gap-4">
                            <button 
                                onClick={exportData}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                            >
                                <Download size={16} />
                                تصدير البيانات
                            </button>
                            <button 
                                onClick={() => {
                                    if (confirm('هل أنت متأكد من حذف جميع البيانات؟')) {
                                        localStorage.removeItem('shaheen_ai_memory');
                                        window.location.reload();
                                    }
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                            >
                                <Trash2 size={16} />
                                مسح جميع البيانات
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// === المكونات الأساسية للمستندات التقليدية ===

const InputField = ({ label, id, value, onChange, readOnly = false, type = "text", placeholder = '' }) => (
    <div className="w-full inline-block">
        {label && <label htmlFor={id} className="block text-sm font-bold text-gray-700 mb-1">{label}</label>}
        <input 
            type={type} 
            id={id} 
            value={value || ''} 
            onChange={(e) => onChange(id, e.target.value)} 
            readOnly={readOnly} 
            placeholder={placeholder}
            className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${readOnly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`} 
        />
    </div>
);

const SignatureBox = ({ title, name }) => (
    <div className="text-center flex-1">
        <h3 className="font-bold text-lg text-gray-800 mb-2">{title}</h3>
        {name && <p className="font-bold text-md text-gray-700 mb-4">{name}</p>}
        <div className="mt-12 pt-2 border-t-2 border-gray-400 w-full mx-auto signature-box"><p className="text-sm">التوقيع</p></div>
    </div>
);

const NavButton = ({ text, icon, onClick, isActive }) => (
    <button onClick={onClick} className={`px-4 py-2 text-sm font-bold rounded-md transition-colors duration-200 flex items-center gap-2 ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
        {icon}
        {text}
    </button>
);

const SubNavButton = ({ text, onClick, isActive }) => (
    <button onClick={onClick} className={`px-4 py-2 text-sm font-bold rounded-md transition-colors duration-200 ${isActive ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
        {text}
    </button>
);

const AppHeader = () => (
    <header className="text-center pb-6 border-b-2 border-gray-200 mb-10">
        <img src="https://i.ibb.co/bx1cZBC/image.png" alt="شعار شركة أعمال الشاهين" className="h-28 mx-auto mb-4" />
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">شركة أعمال الشاهين للمقاولات</h1>
        <p className="text-sm text-gray-500">
            س.ت: 1009148705 | جوال: 0558203077 | المملكة العربية السعودية - الرياض - حي العارض
        </p>
    </header>
);

const MaterialRow = ({ item, index, formData, onChange, readOnly }) => (
    <tr className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
        <td className="p-2 border border-gray-300 text-center align-middle">{item.id}</td>
        <td className="p-2 border border-gray-300 align-middle">{item.type}</td>
        <td className="p-2 border border-gray-300 text-center align-middle">{item.unit}</td>
        <td className="p-2 border border-gray-300"><input type="number" placeholder="0" value={formData[`quantity_${item.id}`] || ''} onChange={(e) => onChange(`quantity_${item.id}`, e.target.value)} readOnly={readOnly} className={`w-full p-2 border-gray-200 border rounded-md text-center ${readOnly ? 'bg-white' : 'bg-gray-100 focus:bg-white'} focus:ring-2 focus:ring-blue-500`} /></td>
        <td className="p-2 border border-gray-300"><input type="text" value={formData[`notes_${item.id}`] || ''} onChange={(e) => onChange(`notes_${item.id}`, e.target.value)} readOnly={readOnly} className={`w-full p-2 border-gray-200 border rounded-md ${readOnly ? 'bg-white' : 'bg-gray-100 focus:bg-white'} focus:ring-2 focus:ring-blue-500`} /></td>
    </tr>
);

const ChecklistItem = ({ label, id, formData, onChange }) => (
    <tr>
        <td className="p-2 border border-gray-200">{label}</td>
        <td className="p-2 border border-gray-200 text-center"><input type="checkbox" checked={formData[id] || false} onChange={(e) => onChange(id, e.target.checked)} className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500" /></td>
    </tr>
);

const PrintStyles = () => (
    <style>{`
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
           .no-print { display: none !important; }
           .printable-area {
                width: 100%;
                height: 297mm;
                padding: 0 !important;
                margin: 0 !important;
                border: none !important;
                box-shadow: none !important;
                border-radius: 0 !important;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
           .printable-area > * { flex-shrink: 0; }
           .printable-area .space-y-4, 
           .printable-area .space-y-6,
           .printable-area .overflow-x-auto {
                flex-shrink: 1;
                flex-grow: 1;
                overflow: hidden;
           }
           .printable-area header img { height: 4.5rem !important; margin-bottom: 0.5rem !important; }
           .printable-area h1 { font-size: 15pt !important; }
           .printable-area h2 { font-size: 12pt !important; margin-bottom: 0.7rem !important; }
           .printable-area h3 { font-size: 10pt !important; }
           .printable-area table { font-size: 8.5pt !important; }
           .printable-area th, .printable-area td { padding: 2px !important; page-break-inside: avoid; }
           .printable-area footer { 
                margin-top: auto !important; 
                padding-top: 0.5rem !important; 
                page-break-before: avoid;
           }
           .printable-area .signature-box { margin-top: 1rem !important; }
           .printable-area .legal-note { margin-top: 0.5rem !important; padding-top: 0.5rem !important; }
        }
    `}</style>
);

// === مكونات المستندات التقليدية ===

const RentalContract = ({ formData, onChange, readOnly = false }) => {
    const materials = [
        { id: 1, type: "سقالات معدنية", unit: "متر مربع" },
        { id: 2, type: "ألواح خشبية", unit: "لوح" },
        { id: 3, type: "أنابيب معدنية", unit: "أنبوب" },
        { id: 4, type: "مشابك ربط", unit: "قطعة" },
        { id: 5, type: "قواعد تثبيت", unit: "قطعة" },
        { id: 6, type: "سلالم متنقلة", unit: "سلم" },
        { id: 7, type: "حبال أمان", unit: "متر" },
        { id: 8, type: "شبكات حماية", unit: "متر مربع" }
    ];

    return (
        <div className="printable-area">
            <AppHeader />
            
            <div className="space-y-6">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">عقد إيجار سقالات ومعدات</h2>
                    <div className="text-sm text-gray-600">
                        <InputField label="رقم العقد" id="contract_number" value={formData.contract_number} onChange={onChange} readOnly={readOnly} placeholder="001/2024" />
                        <InputField label="تاريخ العقد" id="contract_date" value={formData.contract_date} onChange={onChange} readOnly={readOnly} type="date" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h3 className="font-bold text-lg mb-2">بيانات المؤجر (الطرف الأول)</h3>
                        <div className="space-y-2">
                            <InputField label="الاسم" id="lessor_name" value={formData.lessor_name} onChange={onChange} readOnly={readOnly} placeholder="شركة أعمال الشاهين للمقاولات" />
                            <InputField label="رقم السجل التجاري" id="lessor_cr" value={formData.lessor_cr} onChange={onChange} readOnly={readOnly} placeholder="1009148705" />
                            <InputField label="رقم الهاتف" id="lessor_phone" value={formData.lessor_phone} onChange={onChange} readOnly={readOnly} placeholder="0558203077" />
                        </div>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg mb-2">بيانات المستأجر (الطرف الثاني)</h3>
                        <div className="space-y-2">
                            <InputField label="الاسم" id="lessee_name" value={formData.lessee_name} onChange={onChange} readOnly={readOnly} placeholder="اسم المستأجر" />
                            <InputField label="رقم الهوية/السجل التجاري" id="lessee_id" value={formData.lessee_id} onChange={onChange} readOnly={readOnly} placeholder="رقم الهوية" />
                            <InputField label="رقم الهاتف" id="lessee_phone" value={formData.lessee_phone} onChange={onChange} readOnly={readOnly} placeholder="رقم الهاتف" />
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="font-bold text-lg mb-2">تفاصيل المشروع</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="اسم المشروع" id="project_name" value={formData.project_name} onChange={onChange} readOnly={readOnly} placeholder="اسم المشروع" />
                        <InputField label="موقع المشروع" id="project_location" value={formData.project_location} onChange={onChange} readOnly={readOnly} placeholder="العنوان" />
                        <InputField label="تاريخ بداية الإيجار" id="start_date" value={formData.start_date} onChange={onChange} readOnly={readOnly} type="date" />
                        <InputField label="تاريخ نهاية الإيجار" id="end_date" value={formData.end_date} onChange={onChange} readOnly={readOnly} type="date" />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <h3 className="font-bold text-lg mb-2">المواد والمعدات المؤجرة</h3>
                    <table className="w-full text-sm text-right text-gray-600 border-collapse">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                            <tr>
                                <th className="p-3 border border-gray-300">م</th>
                                <th className="p-3 border border-gray-300">نوع المادة</th>
                                <th className="p-3 border border-gray-300">الوحدة</th>
                                <th className="p-3 border border-gray-300">الكمية</th>
                                <th className="p-3 border border-gray-300">ملاحظات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {materials.map((item, index) => (
                                <MaterialRow key={item.id} item={item} index={index} formData={formData} onChange={onChange} readOnly={readOnly} />
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="إجمالي قيمة الإيجار" id="total_rent" value={formData.total_rent} onChange={onChange} readOnly={readOnly} placeholder="0 ريال" />
                    <InputField label="قيمة التأمين" id="security_deposit" value={formData.security_deposit} onChange={onChange} readOnly={readOnly} placeholder="0 ريال" />
                </div>

                <div className="contract-text">
                    <h3 className="font-bold text-lg mb-2">شروط العقد</h3>
                    <div className="text-sm space-y-2">
                        <p><strong>المادة الأولى:</strong> يلتزم الطرف الثاني بدفع قيمة الإيجار المتفق عليها في المواعيد المحددة.</p>
                        <p><strong>المادة الثانية:</strong> يتحمل الطرف الثاني مسؤولية المحافظة على المواد المؤجرة وإعادتها بنفس الحالة.</p>
                        <p><strong>المادة الثالثة:</strong> في حالة التلف أو الفقدان، يتحمل الطرف الثاني قيمة الإصلاح أو الاستبدال.</p>
                        <p><strong>المادة الرابعة:</strong> يحق للطرف الأول استرداد المواد في أي وقت في حالة الإخلال بشروط العقد.</p>
                        <p><strong>المادة الخامسة:</strong> أي نزاع ينشأ عن هذا العقد يحال إلى المحاكم المختصة في المملكة العربية السعودية.</p>
                    </div>
                </div>
            </div>

            <footer className="mt-8">
                <div className="flex justify-between items-center">
                    <SignatureBox title="الطرف الأول (المؤجر)" name="شركة أعمال الشاهين للمقاولات" />
                    <SignatureBox title="الطرف الثاني (المستأجر)" name={formData.lessee_name} />
                </div>
                <div className="text-center mt-4 text-xs text-gray-500 legal-note">
                    <p>هذا العقد محرر من نسختين، لكل طرف نسخة للعمل بموجبها.</p>
                </div>
            </footer>
        </div>
    );
};

const LaborContract = ({ formData, onChange, readOnly = false }) => {
    return (
        <div className="printable-area">
            <AppHeader />
            
            <div className="space-y-6">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">عقد عمالة</h2>
                    <div className="text-sm text-gray-600">
                        <InputField label="رقم العقد" id="contract_number" value={formData.contract_number} onChange={onChange} readOnly={readOnly} placeholder="002/2024" />
                        <InputField label="تاريخ العقد" id="contract_date" value={formData.contract_date} onChange={onChange} readOnly={readOnly} type="date" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h3 className="font-bold text-lg mb-2">بيانات صاحب العمل (الطرف الأول)</h3>
                        <div className="space-y-2">
                            <InputField label="الاسم" id="employer_name" value={formData.employer_name} onChange={onChange} readOnly={readOnly} placeholder="شركة أعمال الشاهين للمقاولات" />
                            <InputField label="رقم السجل التجاري" id="employer_cr" value={formData.employer_cr} onChange={onChange} readOnly={readOnly} placeholder="1009148705" />
                            <InputField label="رقم الهاتف" id="employer_phone" value={formData.employer_phone} onChange={onChange} readOnly={readOnly} placeholder="0558203077" />
                        </div>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg mb-2">بيانات العامل (الطرف الثاني)</h3>
                        <div className="space-y-2">
                            <InputField label="الاسم" id="worker_name" value={formData.worker_name} onChange={onChange} readOnly={readOnly} placeholder="اسم العامل" />
                            <InputField label="رقم الهوية/الإقامة" id="worker_id" value={formData.worker_id} onChange={onChange} readOnly={readOnly} placeholder="رقم الهوية" />
                            <InputField label="رقم الهاتف" id="worker_phone" value={formData.worker_phone} onChange={onChange} readOnly={readOnly} placeholder="رقم الهاتف" />
                            <InputField label="الجنسية" id="worker_nationality" value={formData.worker_nationality} onChange={onChange} readOnly={readOnly} placeholder="الجنسية" />
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="font-bold text-lg mb-2">تفاصيل العمل</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="نوع العمل" id="job_type" value={formData.job_type} onChange={onChange} readOnly={readOnly} placeholder="نوع العمل" />
                        <InputField label="موقع العمل" id="work_location" value={formData.work_location} onChange={onChange} readOnly={readOnly} placeholder="موقع العمل" />
                        <InputField label="تاريخ بداية العمل" id="start_date" value={formData.start_date} onChange={onChange} readOnly={readOnly} type="date" />
                        <InputField label="مدة العقد (بالأشهر)" id="contract_duration" value={formData.contract_duration} onChange={onChange} readOnly={readOnly} placeholder="6" />
                        <InputField label="الراتب الشهري" id="monthly_salary" value={formData.monthly_salary} onChange={onChange} readOnly={readOnly} placeholder="0 ريال" />
                        <InputField label="ساعات العمل اليومية" id="daily_hours" value={formData.daily_hours} onChange={onChange} readOnly={readOnly} placeholder="8" />
                    </div>
                </div>

                <div className="contract-text">
                    <h3 className="font-bold text-lg mb-2">شروط العقد</h3>
                    <div className="text-sm space-y-2">
                        <p><strong>المادة الأولى:</strong> يلتزم الطرف الثاني بأداء العمل المطلوب بإتقان وفي المواعيد المحددة.</p>
                        <p><strong>المادة الثانية:</strong> يلتزم الطرف الأول بدفع الراتب المتفق عليه في نهاية كل شهر.</p>
                        <p><strong>المادة الثالثة:</strong> يحق للطرف الثاني الحصول على إجازة أسبوعية وإجازة سنوية حسب نظام العمل السعودي.</p>
                        <p><strong>المادة الرابعة:</strong> يلتزم الطرف الأول بتوفير بيئة عمل آمنة ومعدات الحماية اللازمة.</p>
                        <p><strong>المادة الخامسة:</strong> يحق لأي من الطرفين إنهاء العقد بإشعار مسبق لمدة شهر.</p>
                        <p><strong>المادة السادسة:</strong> أي نزاع ينشأ عن هذا العقد يحال إلى مكتب العمل المختص.</p>
                    </div>
                </div>
            </div>

            <footer className="mt-8">
                <div className="flex justify-between items-center">
                    <SignatureBox title="الطرف الأول (صاحب العمل)" name="شركة أعمال الشاهين للمقاولات" />
                    <SignatureBox title="الطرف الثاني (العامل)" name={formData.worker_name} />
                </div>
                <div className="text-center mt-4 text-xs text-gray-500 legal-note">
                    <p>هذا العقد محرر من نسختين، لكل طرف نسخة للعمل بموجبها.</p>
                </div>
            </footer>
        </div>
    );
};

const CommencementNote = ({ formData, onChange, readOnly = false }) => {
    const materials = [
        { id: 1, type: "سقالات معدنية", unit: "متر مربع" },
        { id: 2, type: "ألواح خشبية", unit: "لوح" },
        { id: 3, type: "أنابيب معدنية", unit: "أنبوب" },
        { id: 4, type: "مشابك ربط", unit: "قطعة" },
        { id: 5, type: "قواعد تثبيت", unit: "قطعة" },
        { id: 6, type: "سلالم متنقلة", unit: "سلم" },
        { id: 7, type: "حبال أمان", unit: "متر" },
        { id: 8, type: "شبكات حماية", unit: "متر مربع" }
    ];

    return (
        <div className="printable-area">
            <AppHeader />
            
            <div className="space-y-6">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">محضر تسليم واستلام</h2>
                    <div className="text-sm text-gray-600">
                        <InputField label="رقم المحضر" id="note_number" value={formData.note_number} onChange={onChange} readOnly={readOnly} placeholder="001/2024" />
                        <InputField label="التاريخ" id="note_date" value={formData.note_date} onChange={onChange} readOnly={readOnly} type="date" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h3 className="font-bold text-lg mb-2">بيانات المسلم (الطرف الأول)</h3>
                        <div className="space-y-2">
                            <InputField label="الاسم" id="deliverer_name" value={formData.deliverer_name} onChange={onChange} readOnly={readOnly} placeholder="شركة أعمال الشاهين للمقاولات" />
                            <InputField label="الصفة" id="deliverer_position" value={formData.deliverer_position} onChange={onChange} readOnly={readOnly} placeholder="مندوب الشركة" />
                            <InputField label="رقم الهاتف" id="deliverer_phone" value={formData.deliverer_phone} onChange={onChange} readOnly={readOnly} placeholder="0558203077" />
                        </div>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg mb-2">بيانات المستلم (الطرف الثاني)</h3>
                        <div className="space-y-2">
                            <InputField label="الاسم" id="receiver_name" value={formData.receiver_name} onChange={onChange} readOnly={readOnly} placeholder="اسم المستلم" />
                            <InputField label="الصفة" id="receiver_position" value={formData.receiver_position} onChange={onChange} readOnly={readOnly} placeholder="مدير المشروع" />
                            <InputField label="رقم الهاتف" id="receiver_phone" value={formData.receiver_phone} onChange={onChange} readOnly={readOnly} placeholder="رقم الهاتف" />
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="font-bold text-lg mb-2">تفاصيل المشروع</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="اسم المشروع" id="project_name" value={formData.project_name} onChange={onChange} readOnly={readOnly} placeholder="اسم المشروع" />
                        <InputField label="موقع المشروع" id="project_location" value={formData.project_location} onChange={onChange} readOnly={readOnly} placeholder="العنوان" />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <h3 className="font-bold text-lg mb-2">المواد المسلمة</h3>
                    <table className="w-full text-sm text-right text-gray-600 border-collapse">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                            <tr>
                                <th className="p-3 border border-gray-300">م</th>
                                <th className="p-3 border border-gray-300">نوع المادة</th>
                                <th className="p-3 border border-gray-300">الوحدة</th>
                                <th className="p-3 border border-gray-300">الكمية المسلمة</th>
                                <th className="p-3 border border-gray-300">الحالة</th>
                                <th className="p-3 border border-gray-300">ملاحظات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {materials.map((item, index) => (
                                <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="p-2 border border-gray-300 text-center">{item.id}</td>
                                    <td className="p-2 border border-gray-300">{item.type}</td>
                                    <td className="p-2 border border-gray-300 text-center">{item.unit}</td>
                                    <td className="p-2 border border-gray-300">
                                        <input 
                                            type="number" 
                                            value={formData[`quantity_${item.id}`] || ''} 
                                            onChange={(e) => onChange(`quantity_${item.id}`, e.target.value)} 
                                            readOnly={readOnly}
                                            className="w-full p-1 border rounded text-center"
                                        />
                                    </td>
                                    <td className="p-2 border border-gray-300">
                                        <select 
                                            value={formData[`condition_${item.id}`] || ''} 
                                            onChange={(e) => onChange(`condition_${item.id}`, e.target.value)}
                                            disabled={readOnly}
                                            className="w-full p-1 border rounded"
                                        >
                                            <option value="">اختر</option>
                                            <option value="جيد">جيد</option>
                                            <option value="مقبول">مقبول</option>
                                            <option value="يحتاج صيانة">يحتاج صيانة</option>
                                        </select>
                                    </td>
                                    <td className="p-2 border border-gray-300">
                                        <input 
                                            type="text" 
                                            value={formData[`notes_${item.id}`] || ''} 
                                            onChange={(e) => onChange(`notes_${item.id}`, e.target.value)} 
                                            readOnly={readOnly}
                                            className="w-full p-1 border rounded"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="contract-text">
                    <h3 className="font-bold text-lg mb-2">ملاحظات عامة</h3>
                    <textarea 
                        value={formData.general_notes || ''} 
                        onChange={(e) => onChange('general_notes', e.target.value)} 
                        readOnly={readOnly}
                        className="w-full p-3 border rounded-md h-24"
                        placeholder="أي ملاحظات إضافية..."
                    />
                </div>
            </div>

            <footer className="mt-8">
                <div className="flex justify-between items-center">
                    <SignatureBox title="المسلم" name={formData.deliverer_name} />
                    <SignatureBox title="المستلم" name={formData.receiver_name} />
                </div>
                <div className="text-center mt-4 text-xs text-gray-500 legal-note">
                    <p>تم التسليم والاستلام بالحالة المذكورة أعلاه</p>
                </div>
            </footer>
        </div>
    );
};

const ClaimNote = ({ formData, onChange, readOnly = false }) => {
    return (
        <div className="printable-area">
            <AppHeader />
            
            <div className="space-y-6">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">مذكرة مطالبة مالية</h2>
                    <div className="text-sm text-gray-600">
                        <InputField label="رقم المطالبة" id="claim_number" value={formData.claim_number} onChange={onChange} readOnly={readOnly} placeholder="001/2024" />
                        <InputField label="التاريخ" id="claim_date" value={formData.claim_date} onChange={onChange} readOnly={readOnly} type="date" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h3 className="font-bold text-lg mb-2">بيانات الدائن</h3>
                        <div className="space-y-2">
                            <InputField label="الاسم" id="creditor_name" value={formData.creditor_name} onChange={onChange} readOnly={readOnly} placeholder="شركة أعمال الشاهين للمقاولات" />
                            <InputField label="رقم السجل التجاري" id="creditor_cr" value={formData.creditor_cr} onChange={onChange} readOnly={readOnly} placeholder="1009148705" />
                            <InputField label="رقم الهاتف" id="creditor_phone" value={formData.creditor_phone} onChange={onChange} readOnly={readOnly} placeholder="0558203077" />
                        </div>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg mb-2">بيانات المدين</h3>
                        <div className="space-y-2">
                            <InputField label="الاسم" id="debtor_name" value={formData.debtor_name} onChange={onChange} readOnly={readOnly} placeholder="اسم المدين" />
                            <InputField label="رقم الهوية/السجل التجاري" id="debtor_id" value={formData.debtor_id} onChange={onChange} readOnly={readOnly} placeholder="رقم الهوية" />
                            <InputField label="رقم الهاتف" id="debtor_phone" value={formData.debtor_phone} onChange={onChange} readOnly={readOnly} placeholder="رقم الهاتف" />
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="font-bold text-lg mb-2">تفاصيل المطالبة</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="سبب المطالبة" id="claim_reason" value={formData.claim_reason} onChange={onChange} readOnly={readOnly} placeholder="سبب المطالبة" />
                        <InputField label="رقم العقد/الفاتورة" id="reference_number" value={formData.reference_number} onChange={onChange} readOnly={readOnly} placeholder="رقم المرجع" />
                        <InputField label="تاريخ الاستحقاق" id="due_date" value={formData.due_date} onChange={onChange} readOnly={readOnly} type="date" />
                        <InputField label="المبلغ المطالب به" id="claim_amount" value={formData.claim_amount} onChange={onChange} readOnly={readOnly} placeholder="0 ريال" />
                    </div>
                </div>

                <div className="contract-text">
                    <h3 className="font-bold text-lg mb-2">تفاصيل المطالبة</h3>
                    <textarea 
                        value={formData.claim_details || ''} 
                        onChange={(e) => onChange('claim_details', e.target.value)} 
                        readOnly={readOnly}
                        className="w-full p-3 border rounded-md h-32"
                        placeholder="تفاصيل المطالبة والمبررات..."
                    />
                </div>

                <div className="contract-text">
                    <h3 className="font-bold text-lg mb-2">المطالبة</h3>
                    <div className="text-sm space-y-2">
                        <p>بناءً على ما تقدم، نطالب بسداد المبلغ المستحق وقدره <strong>{formData.claim_amount || '______'} ريال</strong> في أقرب وقت ممكن.</p>
                        <p>في حالة عدم السداد خلال <strong>15 يوم</strong> من تاريخ هذه المذكرة، سنضطر لاتخاذ الإجراءات القانونية اللازمة.</p>
                        <p>نأمل تفهمكم وسرعة الاستجابة لتجنب أي إجراءات قانونية.</p>
                    </div>
                </div>
            </div>

            <footer className="mt-8">
                <div className="flex justify-between items-center">
                    <SignatureBox title="الدائن" name={formData.creditor_name} />
                    <div className="text-center">
                        <h3 className="font-bold text-lg text-gray-800 mb-2">إقرار الاستلام</h3>
                        <p className="text-sm mb-4">أقر بأنني استلمت هذه المذكرة</p>
                        <div className="mt-12 pt-2 border-t-2 border-gray-400 w-full mx-auto signature-box">
                            <p className="text-sm">توقيع المدين</p>
                        </div>
                    </div>
                </div>
                <div className="text-center mt-4 text-xs text-gray-500 legal-note">
                    <p>هذه المذكرة محررة في تاريخ {formData.claim_date || '______'}</p>
                </div>
            </footer>
        </div>
    );
};

const DeliveryNote = ({ formData, onChange, readOnly = false }) => {
    const materials = [
        { id: 1, type: "سقالات معدنية", unit: "متر مربع" },
        { id: 2, type: "ألواح خشبية", unit: "لوح" },
        { id: 3, type: "أنابيب معدنية", unit: "أنبوب" },
        { id: 4, type: "مشابك ربط", unit: "قطعة" },
        { id: 5, type: "قواعد تثبيت", unit: "قطعة" },
        { id: 6, type: "سلالم متنقلة", unit: "سلم" },
        { id: 7, type: "حبال أمان", unit: "متر" },
        { id: 8, type: "شبكات حماية", unit: "متر مربع" }
    ];

    return (
        <div className="printable-area">
            <AppHeader />
            
            <div className="space-y-6">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">إشعار تسليم</h2>
                    <div className="text-sm text-gray-600">
                        <InputField label="رقم الإشعار" id="delivery_number" value={formData.delivery_number} onChange={onChange} readOnly={readOnly} placeholder="001/2024" />
                        <InputField label="التاريخ" id="delivery_date" value={formData.delivery_date} onChange={onChange} readOnly={readOnly} type="date" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h3 className="font-bold text-lg mb-2">بيانات المورد</h3>
                        <div className="space-y-2">
                            <InputField label="الاسم" id="supplier_name" value={formData.supplier_name} onChange={onChange} readOnly={readOnly} placeholder="شركة أعمال الشاهين للمقاولات" />
                            <InputField label="رقم الهاتف" id="supplier_phone" value={formData.supplier_phone} onChange={onChange} readOnly={readOnly} placeholder="0558203077" />
                            <InputField label="العنوان" id="supplier_address" value={formData.supplier_address} onChange={onChange} readOnly={readOnly} placeholder="الرياض - حي العارض" />
                        </div>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg mb-2">بيانات العميل</h3>
                        <div className="space-y-2">
                            <InputField label="الاسم" id="client_name" value={formData.client_name} onChange={onChange} readOnly={readOnly} placeholder="اسم العميل" />
                            <InputField label="رقم الهاتف" id="client_phone" value={formData.client_phone} onChange={onChange} readOnly={readOnly} placeholder="رقم الهاتف" />
                            <InputField label="عنوان التسليم" id="delivery_address" value={formData.delivery_address} onChange={onChange} readOnly={readOnly} placeholder="عنوان التسليم" />
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="font-bold text-lg mb-2">تفاصيل التسليم</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="تاريخ التسليم المتوقع" id="expected_delivery_date" value={formData.expected_delivery_date} onChange={onChange} readOnly={readOnly} type="date" />
                        <InputField label="وقت التسليم" id="delivery_time" value={formData.delivery_time} onChange={onChange} readOnly={readOnly} type="time" />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <h3 className="font-bold text-lg mb-2">المواد المراد تسليمها</h3>
                    <table className="w-full text-sm text-right text-gray-600 border-collapse">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                            <tr>
                                <th className="p-3 border border-gray-300">م</th>
                                <th className="p-3 border border-gray-300">نوع المادة</th>
                                <th className="p-3 border border-gray-300">الوحدة</th>
                                <th className="p-3 border border-gray-300">الكمية</th>
                                <th className="p-3 border border-gray-300">ملاحظات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {materials.map((item, index) => (
                                <MaterialRow key={item.id} item={item} index={index} formData={formData} onChange={onChange} readOnly={readOnly} />
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="contract-text">
                    <h3 className="font-bold text-lg mb-2">تعليمات التسليم</h3>
                    <div className="text-sm space-y-2">
                        <p><strong>1.</strong> يرجى التأكد من وجود شخص مخول لاستلام المواد في الموقع.</p>
                        <p><strong>2.</strong> يجب فحص المواد عند الاستلام والتوقيع على محضر الاستلام.</p>
                        <p><strong>3.</strong> في حالة عدم وجود أحد في الموقع، سيتم إعادة جدولة التسليم.</p>
                        <p><strong>4.</strong> يرجى الاتصال على الرقم المذكور أعلاه في حالة الحاجة لتغيير موعد التسليم.</p>
                    </div>
                </div>

                <div className="contract-text">
                    <h3 className="font-bold text-lg mb-2">ملاحظات إضافية</h3>
                    <textarea 
                        value={formData.additional_notes || ''} 
                        onChange={(e) => onChange('additional_notes', e.target.value)} 
                        readOnly={readOnly}
                        className="w-full p-3 border rounded-md h-24"
                        placeholder="أي ملاحظات أو تعليمات خاصة..."
                    />
                </div>
            </div>

            <footer className="mt-8">
                <div className="text-center">
                    <p className="text-sm text-gray-600 mb-4">
                        للاستفسار أو تغيير موعد التسليم، يرجى الاتصال على: <strong>{formData.supplier_phone || '0558203077'}</strong>
                    </p>
                    <div className="text-xs text-gray-500 legal-note">
                        <p>شركة أعمال الشاهين للمقاولات - نقدم خدماتنا بجودة عالية ومواعيد دقيقة</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

const ReturnNote = ({ formData, onChange, readOnly = false }) => {
    const materials = [
        { id: 1, type: "سقالات معدنية", unit: "متر مربع" },
        { id: 2, type: "ألواح خشبية", unit: "لوح" },
        { id: 3, type: "أنابيب معدنية", unit: "أنبوب" },
        { id: 4, type: "مشابك ربط", unit: "قطعة" },
        { id: 5, type: "قواعد تثبيت", unit: "قطعة" },
        { id: 6, type: "سلالم متنقلة", unit: "سلم" },
        { id: 7, type: "حبال أمان", unit: "متر" },
        { id: 8, type: "شبكات حماية", unit: "متر مربع" }
    ];

    return (
        <div className="printable-area">
            <AppHeader />
            
            <div className="space-y-6">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">محضر إرجاع وفحص</h2>
                    <div className="text-sm text-gray-600">
                        <InputField label="رقم المحضر" id="return_number" value={formData.return_number} onChange={onChange} readOnly={readOnly} placeholder="001/2024" />
                        <InputField label="التاريخ" id="return_date" value={formData.return_date} onChange={onChange} readOnly={readOnly} type="date" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h3 className="font-bold text-lg mb-2">بيانات المستلم (الشركة)</h3>
                        <div className="space-y-2">
                            <InputField label="الاسم" id="company_name" value={formData.company_name} onChange={onChange} readOnly={readOnly} placeholder="شركة أعمال الشاهين للمقاولات" />
                            <InputField label="المستلم" id="company_receiver" value={formData.company_receiver} onChange={onChange} readOnly={readOnly} placeholder="اسم المستلم" />
                            <InputField label="رقم الهاتف" id="company_phone" value={formData.company_phone} onChange={onChange} readOnly={readOnly} placeholder="0558203077" />
                        </div>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg mb-2">بيانات المرجع (العميل)</h3>
                        <div className="space-y-2">
                            <InputField label="الاسم" id="client_name" value={formData.client_name} onChange={onChange} readOnly={readOnly} placeholder="اسم العميل" />
                            <InputField label="رقم العقد الأصلي" id="original_contract" value={formData.original_contract} onChange={onChange} readOnly={readOnly} placeholder="رقم العقد" />
                            <InputField label="رقم الهاتف" id="client_phone" value={formData.client_phone} onChange={onChange} readOnly={readOnly} placeholder="رقم الهاتف" />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <h3 className="font-bold text-lg mb-2">المواد المرجعة وحالة الفحص</h3>
                    <table className="w-full text-sm text-right text-gray-600 border-collapse">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                            <tr>
                                <th className="p-3 border border-gray-300">بيان</th>
                                <th className="p-3 border border-gray-300">الكمية المستلمة أساساً</th>
                                <th className="p-3 border border-gray-300">الكمية المرجعة</th>
                                <th className="p-3 border border-gray-300">الكمية المفقودة / التالفة</th>
                                <th className="p-3 border border-gray-300">ملاحظات الفحص</th>
                            </tr>
                        </thead>
                        <tbody>
                            {materials.map((item, index) => (
                                <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="p-2 border border-gray-300">{item.type}</td>
                                    <td className="p-2 border border-gray-300">
                                        <input 
                                            type="number" 
                                            value={formData[`original_quantity_${item.id}`] || ''} 
                                            onChange={(e) => onChange(`original_quantity_${item.id}`, e.target.value)} 
                                            readOnly={readOnly}
                                            className="w-full p-1 border rounded text-center"
                                        />
                                    </td>
                                    <td className="p-2 border border-gray-300">
                                        <input 
                                            type="number" 
                                            value={formData[`returned_quantity_${item.id}`] || ''} 
                                            onChange={(e) => onChange(`returned_quantity_${item.id}`, e.target.value)} 
                                            readOnly={readOnly}
                                            className="w-full p-1 border rounded text-center"
                                        />
                                    </td>
                                    <td className="p-2 border border-gray-300">
                                        <input 
                                            type="number" 
                                            value={formData[`damaged_quantity_${item.id}`] || ''} 
                                            onChange={(e) => onChange(`damaged_quantity_${item.id}`, e.target.value)} 
                                            readOnly={readOnly}
                                            className="w-full p-1 border rounded text-center"
                                        />
                                    </td>
                                    <td className="p-2 border border-gray-300">
                                        <input 
                                            type="text" 
                                            value={formData[`inspection_notes_${item.id}`] || ''} 
                                            onChange={(e) => onChange(`inspection_notes_${item.id}`, e.target.value)} 
                                            readOnly={readOnly}
                                            className="w-full p-1"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h3 className="font-bold text-lg mb-2">ملخص الفحص</h3>
                        <div className="space-y-2">
                            <InputField label="إجمالي المواد المرجعة بحالة جيدة" id="good_condition_total" value={formData.good_condition_total} onChange={onChange} readOnly={readOnly} />
                            <InputField label="إجمالي المواد التالفة" id="damaged_total" value={formData.damaged_total} onChange={onChange} readOnly={readOnly} />
                            <InputField label="إجمالي المواد المفقودة" id="missing_total" value={formData.missing_total} onChange={onChange} readOnly={readOnly} />
                        </div>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg mb-2">التكاليف</h3>
                        <div className="space-y-2">
                            <InputField label="قيمة المواد التالفة" id="damage_cost" value={formData.damage_cost} onChange={onChange} readOnly={readOnly} placeholder="0 ريال" />
                            <InputField label="قيمة المواد المفقودة" id="missing_cost" value={formData.missing_cost} onChange={onChange} readOnly={readOnly} placeholder="0 ريال" />
                            <InputField label="إجمالي المبلغ المستحق" id="total_due" value={formData.total_due} onChange={onChange} readOnly={readOnly} placeholder="0 ريال" />
                        </div>
                    </div>
                </div>

                <div className="contract-text">
                    <h3 className="font-bold text-lg mb-2">ملاحظات الفحص العامة</h3>
                    <textarea 
                        value={formData.general_inspection_notes || ''} 
                        onChange={(e) => onChange('general_inspection_notes', e.target.value)} 
                        readOnly={readOnly}
                        className="w-full p-3 border rounded-md h-24"
                        placeholder="ملاحظات عامة حول حالة المواد المرجعة..."
                    />
                </div>

                <div className="contract-text">
                    <h3 className="font-bold text-lg mb-2">إقرار</h3>
                    <div className="text-sm space-y-2">
                        <p>أقر أنا الموقع أدناه بأنني قمت بإرجاع المواد المذكورة أعلاه، وأن الفحص تم بحضوري، وأوافق على النتائج المدونة.</p>
                        <p>كما أتعهد بسداد قيمة المواد التالفة والمفقودة البالغة <strong>{formData.total_due || '______'} ريال</strong> خلال مدة أقصاها 15 يوم من تاريخ هذا المحضر.</p>
                    </div>
                </div>
            </div>

            <footer className="mt-8">
                <div className="flex justify-between items-center">
                    <SignatureBox title="مستلم المواد (الشركة)" name={formData.company_receiver} />
                    <SignatureBox title="مرجع المواد (العميل)" name={formData.client_name} />
                </div>
                <div className="text-center mt-4 text-xs text-gray-500 legal-note">
                    <p>تم الفحص والإرجاع بحضور الطرفين وبالحالة المذكورة أعلاه</p>
                </div>
            </footer>
        </div>
    );
};

// === مكون منظومة المستندات ===

const DocumentSuite = () => {
    const [activeDocument, setActiveDocument] = useState('rental');
    const [formData, setFormData] = useState({});

    const handleInputChange = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handlePrint = () => {
        window.print();
    };

    const documents = [
        { id: 'rental', name: 'عقد إيجار سقالات', component: RentalContract },
        { id: 'labor', name: 'عقد عمالة', component: LaborContract },
        { id: 'commencement', name: 'محضر تسليم واستلام', component: CommencementNote },
        { id: 'claim', name: 'مذكرة مطالبة مالية', component: ClaimNote },
        { id: 'delivery', name: 'إشعار تسليم', component: DeliveryNote },
        { id: 'return', name: 'محضر إرجاع وفحص', component: ReturnNote }
    ];

    const ActiveDocumentComponent = documents.find(doc => doc.id === activeDocument)?.component;

    return (
        <div className="max-w-6xl mx-auto">
            <div className="bg-white p-4 rounded-lg shadow-md mb-6 no-print">
                <h2 className="text-xl font-bold text-gray-800 mb-4">منظومة المستندات</h2>
                <div className="flex flex-wrap gap-2">
                    {documents.map(doc => (
                        <SubNavButton 
                            key={doc.id}
                            text={doc.name} 
                            onClick={() => setActiveDocument(doc.id)} 
                            isActive={activeDocument === doc.id} 
                        />
                    ))}
                </div>
                <div className="mt-4 flex gap-2">
                    <button 
                        onClick={handlePrint} 
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2"
                    >
                        <Printer size={16} />
                        طباعة
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg">
                {ActiveDocumentComponent && (
                    <ActiveDocumentComponent 
                        formData={formData} 
                        onChange={handleInputChange} 
                    />
                )}
            </div>
        </div>
    );
};

// === المكون الرئيسي ===
export default function App() {
    const [activeView, setActiveView] = useState('aiAgent');

    return (
        <>
            <PrintStyles />
            <div dir="rtl" className="bg-gray-100 min-h-screen p-4 sm:p-8" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                
                <div className="max-w-6xl mx-auto mb-6 no-print">
                    <div className="bg-white p-2 rounded-lg shadow-md flex justify-center flex-wrap gap-2">
                        <NavButton text="منظومة المستندات" icon={<FileText size={16} />} onClick={() => setActiveView('documents')} isActive={activeView === 'documents'} />
                        <NavButton text="الوكيل الذكي" icon={<Bot size={16} />} onClick={() => setActiveView('aiAgent')} isActive={activeView === 'aiAgent'} />
                    </div>
                </div>

                {activeView === 'documents' ? <DocumentSuite /> : <EnhancedAiAgentView />}

            </div>
        </>
    );
}
