import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Printer, Bot, Edit, Loader2, History, Star, Search, Trash2, Download, Upload, MessageCircle, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// === قائمة المواد المحدثة ===
const MATERIALS_LIST = [
    { id: 1, type: "قائم 3م", unit: "قطعة", defaultQuantity: 0 },
    { id: 2, type: "قائم 2.5م", unit: "قطعة", defaultQuantity: 0 },
    { id: 3, type: "قائم 2م", unit: "قطعة", defaultQuantity: 0 },
    { id: 4, type: "قائم 1.5م", unit: "قطعة", defaultQuantity: 0 },
    { id: 5, type: "قائم 1م", unit: "قطعة", defaultQuantity: 0 },
    { id: 6, type: "لدجر 1.8م", unit: "قطعة", defaultQuantity: 0 },
    { id: 7, type: "لدجر 1.5م", unit: "قطعة", defaultQuantity: 0 },
    { id: 8, type: "لدجر 1.60م", unit: "قطعة", defaultQuantity: 0 },
    { id: 9, type: "لدجر 1.00م", unit: "قطعة", defaultQuantity: 0 },
    { id: 10, type: "لدجر 1.25م", unit: "قطعة", defaultQuantity: 0 },
    { id: 11, type: "لدجر 0.9م", unit: "قطعة", defaultQuantity: 0 },
    { id: 12, type: "لدجر 1.2م", unit: "قطعة", defaultQuantity: 0 },
    { id: 13, type: "لدجر 0.8م", unit: "قطعة", defaultQuantity: 0 },
    { id: 14, type: "لدجر 0.6م", unit: "قطعة", defaultQuantity: 0 },
    { id: 15, type: "يوهد", unit: "قطعة", defaultQuantity: 0 },
    { id: 16, type: "ميزانيه", unit: "قطعة", defaultQuantity: 0 },
    { id: 17, type: "دوكا المنيوم", unit: "قطعة", defaultQuantity: 0 },
    { id: 18, type: "وصلات", unit: "قطعة", defaultQuantity: 0 },
    { id: 19, type: "ماسورة", unit: "قطعة", defaultQuantity: 0 },
    { id: 20, type: "كلامب", unit: "قطعة", defaultQuantity: 0 },
    { id: 21, type: "بليتة تثبيت", unit: "قطعة", defaultQuantity: 0 },
    { id: 22, type: "لوح بوندي 4م", unit: "قطعة", defaultQuantity: 0 }
];

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
        if (!text) return [];
        const stopWords = ['في', 'من', 'إلى', 'على', 'عن', 'مع', 'هذا', 'هذه', 'التي', 'الذي'];
        return text.toLowerCase()
            .split(/\s+/)
            .filter(word => word.length > 2 && !stopWords.includes(word));
    }

    calculateSimilarity(keywords1, text2) {
        if (!text2) return 0;
        const keywords2 = this.extractKeywords(text2);
        if (keywords1.length === 0 || keywords2.length === 0) return 0;
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

        const mostUsedDocType = Object.keys(docTypes).length > 0 
            ? Object.keys(docTypes).reduce((a, b) => docTypes[a] > docTypes[b] ? a : b)
            : '';

        return {
            totalConversations: conversations.length,
            docTypeDistribution: docTypes,
            averageRating: ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0,
            mostUsedDocType: mostUsedDocType
        };
    }
}

// === مكونات واجهة المستخدم ===

const InputField = ({ label, value, onChange, type = "text", placeholder = "", required = false }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
    </div>
);

const NavButton = ({ text, icon, onClick, isActive }) => (
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

// === أنماط الطباعة ===
const PrintStyles = () => (
    <style>{`
        body { font-family: 'Tajawal', sans-serif; }
        @page { size: A4; margin: 1.5cm; }
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
                height: 100%; 
                padding: 0 !important; 
                margin: 0 !important; 
                border: none !important; 
                box-shadow: none !important; 
                border-radius: 0 !important; 
            }
            .printable-area header img { height: 5rem !important; }
            .printable-area h1 { font-size: 16pt !important; }
            .printable-area h2 { font-size: 13pt !important; }
            .printable-area h3 { font-size: 11pt !important; }
            .printable-area table { font-size: 9pt !important; }
            .printable-area th, .printable-area td { padding: 3px !important; }
            .printable-area footer { 
                margin-top: auto !important; 
                padding-top: 0.5rem !important; 
                page-break-before: avoid; 
            }
        }
    `}</style>
);

// === مكونات المستندات ===

const RentalCommencementNote = () => {
    const [formData, setFormData] = useState({
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
        ...MATERIALS_LIST.reduce((acc, item) => {
            acc[`quantity_${item.id}`] = item.defaultQuantity;
            acc[`installed_${item.id}`] = item.defaultQuantity;
            return acc;
        }, {})
    });

    const handleInputChange = (field, value) => {
        setFormData(prev => {
            const newData = { ...prev, [field]: value };
            if (field === 'monthlyRate' && value) {
                newData.dailyRate = (parseFloat(value) / 30).toFixed(2);
            }
            return newData;
        });
    };

    return (
        <div className="printable-area bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
            <header className="text-center pb-6 border-b-2 border-gray-200 mb-6">
                <img src="https://i.ibb.co/bx1cZBC/image.png" alt="شعار شركة أعمال الشاهين" className="h-20 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-800 mb-2">شركة أعمال الشاهين للمقاولات</h1>
                <div className="text-sm text-gray-600">
                    <p>المملكة العربية السعودية - الرياض</p>
                    <p>هاتف: +966 XX XXX XXXX | البريد الإلكتروني: info@shaheen.com</p>
                </div>
            </header>
            <div className="contract-text space-y-6">
                <h2 className="text-xl font-bold text-center text-gray-800 mb-6">محضر بدء إيجار الشدات المعدنية</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <InputField label="المؤجر" value={formData.lessor} onChange={(value) => handleInputChange('lessor', value)} />
                    <InputField label="المستأجر" value={formData.lessee} onChange={(value) => handleInputChange('lessee', value)} />
                    <InputField label="اسم المشروع" value={formData.project} onChange={(value) => handleInputChange('project', value)} />
                    <InputField label="موقع المشروع" value={formData.location} onChange={(value) => handleInputChange('location', value)} />
                    <InputField label="رقم العقد" value={formData.contractNumber} onChange={(value) => handleInputChange('contractNumber', value)} />
                    <InputField label="تاريخ العقد" type="date" value={formData.contractDate} onChange={(value) => handleInputChange('contractDate', value)} />
                    <InputField label="تاريخ التركيب" type="date" value={formData.installationDate} onChange={(value) => handleInputChange('installationDate', value)} />
                    <InputField label="تاريخ بدء الإيجار" type="date" value={formData.rentalStartDate} onChange={(value) => handleInputChange('rentalStartDate', value)} />
                    <InputField label="سعر الإيجار الشهري (ريال)" value={formData.monthlyRate} onChange={(value) => handleInputChange('monthlyRate', value)} />
                    <InputField label="السعر اليومي (ريال)" value={formData.dailyRate} onChange={(value) => handleInputChange('dailyRate', value)} />
                    <InputField label="اسم المهندس المشرف" value={formData.engineerName} onChange={(value) => handleInputChange('engineerName', value)} />
                </div>

                <div className="mb-4">
                    <label className="flex items-center space-x-2 space-x-reverse">
                        <input
                            type="checkbox"
                            checked={formData.installationIncluded}
                            onChange={(e) => handleInputChange('installationIncluded', e.target.checked)}
                            className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm font-medium text-gray-700">الإيجار يشمل التركيب</span>
                    </label>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
                    <h3 className="font-bold text-blue-800 mb-2">📋 معلومات المحضر:</h3>
                    <div className="space-y-2 text-sm">
                        <div><strong>المؤجر:</strong> {formData.lessor}</div>
                        <div><strong>المستأجر:</strong> {formData.lessee}</div>
                        <div><strong>المشروع:</strong> {formData.project}</div>
                        <div><strong>الموقع:</strong> {formData.location}</div>
                        <div><strong>رقم العقد:</strong> {formData.contractNumber}</div>
                        <div><strong>تاريخ العقد:</strong> {formData.contractDate}</div>
                        <div><strong>تاريخ التركيب:</strong> {formData.installationDate}</div>
                        <div><strong>تاريخ بدء الإيجار:</strong> {formData.rentalStartDate}</div>
                        <div><strong>سعر الإيجار الشهري:</strong> {formData.monthlyRate} ريال سعودي</div>
                        <div><strong>السعر اليومي:</strong> {formData.dailyRate} ريال سعودي</div>
                        <div><strong>المهندس المشرف:</strong> {formData.engineerName}</div>
                        <div><strong>يشمل التركيب:</strong> {formData.installationIncluded ? 'نعم' : 'لا'}</div>
                    </div>
                </div>

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
                            {MATERIALS_LIST.map((item, index) => (
                                <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="p-2 border border-gray-300">{item.id}</td>
                                    <td className="p-2 border border-gray-300">{item.type}</td>
                                    <td className="p-2 border border-gray-300">{item.unit}</td>
                                    <td className="p-2 border border-gray-300">
                                        <input
                                            type="number"
                                            value={formData[`quantity_${item.id}`] || 0}
                                            onChange={(e) => handleInputChange(`quantity_${item.id}`, e.target.value)}
                                            className="w-full p-1 text-center border-none bg-transparent"
                                        />
                                    </td>
                                    <td className="p-2 border border-gray-300">
                                        <input
                                            type="number"
                                            value={formData[`installed_${item.id}`] || 0}
                                            onChange={(e) => handleInputChange(`installed_${item.id}`, e.target.value)}
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

                <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات إضافية:</label>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        rows={3}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="أي ملاحظات إضافية حول بدء الإيجار..."
                    />
                </div>
            </div>

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
                    <p>تاريخ المحضر: {new Date().toLocaleDateString('ar-SA')} | رقم المحضر: RC-{formData.contractNumber}-{new Date().getFullYear()}</p>
                </div>
            </footer>
        </div>
    );
};

const DocumentSuite = () => {
    const [activeDocument, setActiveDocument] = useState('rentalCommencement');
    const documents = {
        rentalCommencement: { 
            component: RentalCommencementNote, 
            title: 'محضر بدء إيجار الشدات المعدنية', 
            icon: <FileText size={16} /> 
        }
    };
    
    const ActiveComponent = documents[activeDocument].component;

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">منظومة المستندات</h2>
                <p className="text-gray-600 mb-6">محضر بدء إيجار الشدات المعدنية مع الشروط المتقدمة</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-6 no-print">
                    <h3 className="text-xl font-bold text-gray-800">{documents[activeDocument].title}</h3>
                    <button 
                        onClick={() => window.print()} 
                        className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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

// === الوكيل الذكي ===
const EnhancedAiAgentView = () => {
    const [messages, setMessages] = useState([]);
    const [currentInput, setCurrentInput] = useState('');
    const [docType, setDocType] = useState('عقد إيجار سقالات');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedContent, setGeneratedContent] = useState('');
    const [conversationStage, setConversationStage] = useState('initial');
    const [clarificationQuestions, setClarificationQuestions] = useState([]);
    const [userAnswers, setUserAnswers] = useState({});
    const [showMemoryPanel, setShowMemoryPanel] = useState(false);
    
    const memoryManager = new MemoryManager();

    const docTypes = [
        'عقد إيجار سقالات', 
        'محضر بدء إيجار الشدات المعدنية', 
        'عقد عمالة', 
        'محضر تسليم واستلام', 
        'مذكرة مطالبة مالية', 
        'إشعار تسليم', 
        'محضر إرجاع وفحص'
    ];

    const addMessage = (content, isUser = false, type = 'text') => {
        const newMessage = { 
            id: Date.now(), 
            content, 
            isUser, 
            type, 
            timestamp: new Date().toLocaleTimeString('ar-SA') 
        };
        setMessages(prev => [...prev, newMessage]);
    };

    const startNewConversation = useCallback(() => {
        setMessages([]);
        setCurrentInput('');
        setConversationStage('initial');
        setClarificationQuestions([]);
        setUserAnswers({});
        setGeneratedContent('');
        
        let welcomeMessage = `مرحباً! أنا مساعدك الذكي لإنشاء ${docType}. يرجى وصف ما تحتاجه بالتفصيل.`;
        addMessage(welcomeMessage, false);
    }, [docType]);

    const handleSendMessage = async () => {
        if (!currentInput.trim()) return;
        
        const userText = currentInput;
        addMessage(userText, true);
        setCurrentInput('');
        
        if (conversationStage === 'initial') {
            await handleInitialInput(userText);
        } else if (conversationStage === 'clarifying') {
            await handleClarificationAnswer(userText);
        }
    };

    const handleInitialInput = async (userText) => {
        setIsLoading(true);
        addMessage('جاري تحليل طلبك...', false);
        
        // Generate basic clarification questions
        const questions = [
            'ما هو اسم المستأجر؟', 
            'ما هو اسم المشروع وموقعه؟', 
            'ما هي مدة الإيجار؟', 
            'ما هو المبلغ المتفق عليه؟'
        ];
        
        setClarificationQuestions(questions);
        setConversationStage('clarifying');
        addMessage('ممتاز! للإكمال، أحتاج لبعض التوضيحات:', false);
        
        questions.forEach((q, i) => {
            setTimeout(() => addMessage(`${i + 1}. ${q}`, false), (i + 1) * 500);
        });
        
        setIsLoading(false);
    };

    const handleClarificationAnswer = async (userText) => {
        const currentAnswers = { ...userAnswers, [clarificationQuestions.length]: userText };
        setUserAnswers(currentAnswers);
        
        if (Object.keys(currentAnswers).length >= clarificationQuestions.length) {
            addMessage('شكراً لك! جاري إنشاء المستند...', false);
            await generateDocument(currentAnswers);
        } else {
            addMessage('شكراً لك! يرجى الإجابة على السؤال التالي.', false);
        }
    };

    const generateDocument = async (answers) => {
        setIsLoading(true);
        setConversationStage('generating');
        
        // Use environment variable for API key - this should be moved to Netlify Function
        const apiKey = process.env.REACT_APP_GEMINI_API_KEY;

        if (!apiKey) {
            addMessage("خطأ: مفتاح Gemini API غير موجود.", false);
            setIsLoading(false);
            setConversationStage('initial');
            return;
        }

        const fullPrompt = `
            مهمتك هي العمل كمستشار قانوني خبير لـ "شركة أعمال الشاهين للمقاولات".
            أنشئ مسودة احترافية للمستند التالي:
            - نوع المستند: ${docType}
            - تفاصيل من المستخدم: ${Object.values(answers).join(' - ')}
            - تعليمات: استخدم تنسيق Markdown، أضف البنود القانونية الضرورية، واجعل المستند جاهزاً للطباعة مع قسم للتواقيع.
        `;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    contents: [{ 
                        parts: [{ text: fullPrompt }] 
                    }] 
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'API Error');
            }

            const data = await response.json();
            const content = data.candidates[0].content.parts[0].text;
            
            setGeneratedContent(content);
            setConversationStage('completed');
            addMessage('تم إنشاء المستند بنجاح!', false);
            addMessage(content, false, 'document');
            
            memoryManager.saveConversation({ 
                docType, 
                userInput: Object.values(answers).join(' '), 
                generatedContent: content 
            });

        } catch (error) {
            console.error('Error:', error);
            addMessage(`حدث خطأ: ${error.message}`, false);
            setConversationStage('initial');
        }
        
        setIsLoading(false);
    };

    useEffect(() => {
        startNewConversation();
    }, [docType, startNewConversation]);

    return (
        <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
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
                                onClick={() => setShowMemoryPanel(!showMemoryPanel)} 
                                className="p-2 bg-blue-700 hover:bg-blue-800 rounded-lg"
                            >
                                <History size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex">
                    <div className="flex-1 flex flex-col">
                        <div className="p-4 border-b bg-gray-50">
                            <label className="block text-sm font-medium text-gray-700 mb-2">اختر نوع المستند:</label>
                            <select 
                                value={docType} 
                                onChange={(e) => setDocType(e.target.value)} 
                                className="w-full p-3 border rounded-lg"
                            >
                                {docTypes.map(type => 
                                    <option key={type} value={type}>{type}</option>
                                )}
                            </select>
                        </div>
                        
                        <div className="flex-1 p-4 space-y-4 max-h-96 overflow-y-auto">
                            {messages.map(msg => (
                                <div key={msg.id} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                        msg.isUser ? 'bg-blue-600 text-white' : 'bg-gray-100'
                                    }`}>
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
                                        <Loader2 size={16} className="animate-spin" />
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="p-4 border-t">
                            <div className="flex space-x-2 space-x-reverse">
                                <input 
                                    type="text" 
                                    value={currentInput} 
                                    onChange={(e) => setCurrentInput(e.target.value)} 
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} 
                                    placeholder="اكتب رسالتك هنا..." 
                                    className="flex-1 p-3 border rounded-lg" 
                                    disabled={isLoading} 
                                />
                                <button 
                                    onClick={handleSendMessage} 
                                    disabled={isLoading || !currentInput.trim()} 
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    <Send size={20} />
                                </button>
                                <button 
                                    onClick={startNewConversation} 
                                    className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                                >
                                    محادثة جديدة
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                {generatedContent && (
                    <div className="border-t p-6 bg-gray-50">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold">📄 المستند المولد</h3>
                            <button 
                                onClick={() => window.print()} 
                                className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
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

// === المكون الرئيسي للتطبيق ===
export default function App() {
    const [activeView, setActiveView] = useState('aiAgent');

    return (
        <>
            <PrintStyles />
            <div 
                dir="rtl" 
                className="bg-gray-100 min-h-screen p-4 sm:p-8" 
                style={{ fontFamily: "'Tajawal', sans-serif" }}
            >
                {/* Header with company info */}
                <header className="text-center mb-8 no-print">
                    <img 
                        src="https://i.ibb.co/bx1cZBC/image.png" 
                        alt="شعار شركة أعمال الشاهين" 
                        className="h-16 mx-auto mb-4" 
                    />
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        وكيل مستندات أعمال الشاهين
                    </h1>
                    <p className="text-gray-600">
                        نظام ذكي متكامل لإدارة المستندات والعقود
                    </p>
                </header>
                
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
}