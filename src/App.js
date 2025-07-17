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

    const handleSubmit = () => {
        memoryManager.updateConversation(conversationId, {
            rating,
            userFeedback: feedback,
            ratedAt: new Date().toISOString()
        });
        onRated && onRated(rating, feedback);
    };

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
    const [isEditing, setIsEditing] = useState(false);
    const [currentConversationId, setCurrentConversationId] = useState(null);
    
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

    const buildEnhancedPrompt = () => {
        const memoryContext = buildContextFromMemory();
        const stats = memoryManager.getStats();
        
        return `
            مهمتك هي العمل كمستشار قانوني وتجاري خبير ومتخصص في الأنظمة السعودية لـ "شركة أعمال الشاهين للمقاولات".
            
            **المهمة الأساسية:** إنشاء مسودة احترافية للمستند المطلوب بناءً على التفاصيل التالية.
            
            **نوع المستند المطلوب:** ${docType}
            
            **تفاصيل الطلب من المستخدم:** "${prompt}"
            
            **معلومات من ذاكرة النظام:**
            - إجمالي المستندات المنشأة سابقاً: ${stats.totalConversations}
            - متوسط تقييم المستخدم: ${stats.averageRating.toFixed(1)}/5
            - أكثر نوع مستند استخداماً: ${stats.mostUsedDocType}
            ${memoryContext}
            
            **تعليمات صارمة محسّنة بناءً على التجربة:**
            1.  **التحليل والتفكير:** استفد من السياق أعلاه لفهم تفضيلات المستخدم وتجنب الأخطاء السابقة.
            2.  **إكمال النواقص:** أضف جميع البنود القياسية والضرورية، مع التركيز على النقاط التي أشار إليها المستخدم في التجارب السابقة.
            3.  **الصياغة المحسّنة:**
                *   استخدم لغة عربية رسمية وقانونية واضحة.
                *   ابدأ بعنوان رئيسي واضح للمستند.
                *   نسّق باستخدام Markdown مع عناوين وقوائم منظمة.
                *   قسّم إلى مواد مرقمة وواضحة.
                *   أضف قسم التواقيع في النهاية.
            4.  **التحسين المستمر:** اجعل المستند أفضل من المحاولات السابقة بناءً على التغذية الراجعة.
            5.  **الهدف النهائي:** إنشاء مستند جاهز للاستخدام يحمي مصالح الشركة ويلبي توقعات المستخدم.
        `;
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            alert("يرجى إدخال وصف للمستند المطلوب.");
            return;
        }
        
        setIsLoading(true);
        setGeneratedContent('');

        const enhancedPrompt = buildEnhancedPrompt();
        const apiKey = process.env.REACT_APP_GEMINI_API_KEY;

        if (!apiKey) {
            const errorMsg = "مفتاح Gemini API غير موجود. يرجى التأكد من إعداده بشكل صحيح.";
            console.error(errorMsg);
            setGeneratedContent(errorMsg);
            setIsLoading(false);
            return;
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const payload = { contents: [{ role: "user", parts: [{ text: enhancedPrompt }] }] };

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
                setIsEditing(true);
                
                const conversationId = memoryManager.saveConversation({
                    userInput: prompt,
                    docType: docType,
                    aiResponse: aiResponse,
                    tags: extractTags(prompt, docType)
                });
                setCurrentConversationId(conversationId);
                
            } else {
                setGeneratedContent("لم يتمكن الذكاء الاصطناعي من إنشاء رد.");
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
        setGeneratedContent(conversation.aiResponse);
        setIsEditing(true);
        setShowSuggestions(false);
    };

    const handleContentChange = (newContent) => {
        setGeneratedContent(newContent);
        if (currentConversationId) {
            memoryManager.updateConversation(currentConversationId, {
                finalVersion: newContent,
                lastModified: new Date().toISOString()
            });
        }
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
        printWindow.document.write('<html><head><title>طباعة مستند</title>');
        printWindow.document.write('<style>@page { size: A4; margin: 1.5cm; } body { direction: rtl; font-family: "Tajawal", sans-serif; line-height: 1.6; } h1, h2, h3 { margin-bottom: 0.5rem; } p { margin-top: 0; } ul, ol { padding-right: 20px; } </style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write('<div class="prose">' + generatedContent.replace(/\n/g, '<br>') + '</div>');
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
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
                    <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 no-print">
                        <div className="flex items-center gap-3 mb-4">
                            <Bot className="w-8 h-8 text-blue-600" />
                            <h2 className="text-2xl font-bold text-gray-800">الوكيل الذكي للمستندات</h2>
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">مع ذاكرة ذكية</span>
                        </div>
                        
                        <p className="text-gray-600 mb-6">صف للمساعد الذكي المستند الذي تحتاجه. النظام يتذكر تفضيلاتك ويتعلم من تجاربك السابقة لتحسين النتائج.</p>
                        
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
                                onClick={handleGenerate} 
                                disabled={isLoading} 
                                className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 shadow-lg flex items-center justify-center gap-2"
                            >
                                {isLoading ? <Loader2 className="animate-spin" /> : <Bot />}
                                {isLoading ? 'جاري إنشاء المستند...' : 'أنشئ المستند الآن'}
                            </button>
                        </div>
                    </div>

                    {generatedContent && (
                        <div className="mt-8 bg-white p-6 rounded-lg shadow-lg border border-gray-200">
                            <div className="flex justify-between items-center mb-4 no-print">
                                <h3 className="text-xl font-bold text-gray-800">المستند المجهز:</h3>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setIsEditing(!isEditing)} 
                                        className="bg-yellow-500 text-white p-2 rounded-lg hover:bg-yellow-600"
                                    >
                                        <Edit size={20} />
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
                                {isEditing ? (
                                    <textarea 
                                        value={generatedContent}
                                        onChange={(e) => handleContentChange(e.target.value)}
                                        className="w-full h-[60vh] p-4 border rounded-md font-mono text-sm leading-relaxed"
                                    />
                                ) : (
                                    <div className="prose prose-lg max-w-none p-4 bg-gray-50 rounded-md border">
                                        <ReactMarkdown>{generatedContent}</ReactMarkdown>
                                    </div>
                                )}
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

// === باقي مكونات التطبيق (المستندات التقليدية) ===

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

// مكون بسيط للمستندات التقليدية (يمكن إضافة باقي المكونات هنا)
const DocumentSuite = () => {
    return (
        <div className="text-center p-8">
            <h2 className="text-2xl font-bold mb-4">منظومة المستندات التقليدية</h2>
            <p className="text-gray-600">هذا القسم يحتوي على المستندات التقليدية (عقود الإيجار، العمالة، إلخ)</p>
            <p className="text-sm text-gray-500 mt-2">يمكن إضافة باقي مكونات المستندات هنا حسب الحاجة</p>
        </div>
    );
};

// === المكون الرئيسي ===
export default function App() {
    const [activeView, setActiveView] = useState('aiAgent'); // البدء بالوكيل الذكي

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
