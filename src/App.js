import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { FileText, Printer, Bot, Edit, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// --- Reusable Components ---

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

// --- Document Components ---

const RentalContract = ({ formData, handleInputChange }) => (
    <>
        <AppHeader />
        <h2 className="text-2xl font-bold text-center mb-6">عقد اتفاقية تأجير معدات (سقالات)</h2>
        <div className="space-y-4 text-sm leading-relaxed contract-text">
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <InputField label="رقم العقد:" id="equipment_contract_id" value={formData.equipment_contract_id} onChange={handleInputChange} />
                <InputField label="التاريخ:" id="equipment_contract_date" type="date" value={formData.equipment_contract_date} onChange={handleInputChange} />
            </div>
            <p className="pt-4"><strong>الطرف الأول (المؤجر):</strong> شركة أعمال الشاهين للمقاولات، سجل تجاري رقم: 1009148705.</p>
            <InputField label="الطرف الثاني (المستأجر):" id="client_name" value={formData.client_name} onChange={handleInputChange} placeholder="اسم الشركة أو الفرد" />
            <InputField label="رقم السجل التجاري/الهوية:" id="client_cr" value={formData.client_cr} onChange={handleInputChange} />
            <h3 className="font-bold pt-4">تمهيد:</h3>
            <div className="mb-3">حيث إن المؤجر يمتلك الخبرة والمعدات اللازمة لتأجير الشدات والسقالات المعدنية، وحيث إن المستأجر يرغب في استئجار هذه المعدات لاستخدامها في مشروعه الكائن في <InputField id="project_location" value={formData.project_location} onChange={handleInputChange} placeholder="مدينة - حي - وصف الموقع"/>، فقد اتفق الطرفان على ما يلي:</div>
            <h3 className="font-bold pt-2">المادة (3): فترة الإيجار وآلية احتساب القيمة الإيجارية</h3>
            <p>3.1 **بدء فترة الإيجار:** تبدأ فترة الإيجار رسمياً من التاريخ المثبت في "محضر بدء أعمال".</p>
            <div className="flex items-center gap-2 mb-3">3.2 **القيمة الإيجارية الشهرية:** اتفق الطرفان على أن القيمة الإيجارية الشهرية للمعدات هي (<InputField id="monthly_rent_value" value={formData.monthly_rent_value} onChange={handleInputChange} placeholder="0.00" type="number" /> ريال سعودي)، غير شاملة لضريبة القيمة المضافة.</div>
            <p>3.3 **تمديد فترة الإيجار:** في حال امتدت فترة الإيجار إلى ما بعد الشهر الأول، إذا كانت مدة التمديد من يوم واحد (1) إلى سبعة (7) أيام تقويمية، يتم احتساب الإيجار لهذه الفترة على أساس تناسبي. إذا تجاوزت مدة التمديد سبعة (7) أيام تقويمية، يستحق على المستأجر سداد قيمة إيجار شهر ثانٍ كامل.</p>
            <h3 className="font-bold pt-2">المادة (5): الملكية، المسؤولية، والتعويض</h3>
            <p>5.1 **الملكية:** تظل ملكية المعدات خالصة للمؤجر ولا يجوز للمستأجر التصرف فيها بالبيع أو الرهن أو الإيجار من الباطن.</p>
            <p>5.2 **مسؤولية المستأجر:** المستأجر هو المسؤول الوحيد عن سلامة الموقع، والحصول على كافة التصاريح اللازمة، وتوفير ممرات آمنة للعمال والمعدات. أي تأخير أو تكاليف ناتجة عن عدم جاهزية الموقع أو تعليمات فريق السلامة الخاص بالمستأجر يتحملها المستأجر وحده.</p>
            <p>5.3 **حظر التعديل والنقل:** يُحظر على المستأجر إجراء أي تعديل أو إصلاح أو طلاء للمعدات. كما لا يحق له نقلها من الموقع المتفق عليه إلى أي موقع آخر دون موافقة خطية مسبقة من المؤجر.</p>
            <p>5.4 **الفقد والتلف:** يتحمل المستأجر المسؤولية الكاملة عن أي فقدان أو سرقة أو تلف يلحق بالمعدات من لحظة استلامها وحتى إعادتها. في حال حدوث أي نقص أو تلف، يلتزم المستأجر بتعويض المؤجر بقيمة استبدال المعدات بسعر السوق الجديد للحديد والمواد وقت اكتشاف النقص أو التلف.</p>
            <p>5.5 **حق المعاينة:** يحتفظ المؤجر بالحق في دخول الموقع في أي وقت خلال ساعات العمل لمعاينة المعدات والتأكد من سلامتها وحسن استخدامها.</p>
        </div>
        <footer className="mt-24 pt-8">
            <div className="flex flex-col md:flex-row justify-around items-stretch gap-12 mb-12 signature-container">
                <SignatureBox title="الطرف الأول (المؤجر)" name="بِشر شاهين - الرئيس التنفيذي" />
                <SignatureBox title="الطرف الثاني (المستأجر)" />
            </div>
        </footer>
    </>
);

// ... (The rest of the document components like LaborContract, CommencementNote, etc. remain the same)
// ... I will skip them here for brevity but they should be in your final file.

const AiAgentView = () => {
    const [prompt, setPrompt] = useState('');
    const [docType, setDocType] = useState('عقد');
    const [generatedContent, setGeneratedContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            alert("يرجى إدخال وصف للمستند المطلوب.");
            return;
        }
        setIsLoading(true);
        setGeneratedContent('');

        const fullPrompt = `
            مهمتك هي العمل كمستشار قانوني وتجاري خبير ومتخصص في الأنظمة السعودية لـ "شركة أعمال الشاهين للمقاولات".
            
            **المهمة الأساسية:** إنشاء مسودة احترافية للمستند المطلوب بناءً على التفاصيل التالية.
            
            **نوع المستند المطلوب:** ${docType}
            
            **تفاصيل الطلب من المستخدم:** "${prompt}"
            
            **تعليمات صارمة يجب اتباعها:**
            1.  **التحليل والتفكير:** قبل الكتابة، فكر في جميع الجوانب التي يجب أن يغطيها هذا النوع من المستندات في السعودية. ما هي البنود الأساسية؟ ما هي المخاطر التي يجب حماية الشركة منها؟ ما هي المعلومات التي قد تكون ناقصة في طلب المستخدم؟
            2.  **إكمال النواقص:** إذا كان طلب المستخدم عاماً أو ناقصاً (مثال: "عقد إيجار سقالات")، فيجب عليك **تلقائياً** إضافة جميع البنود القياسية والضرورية التي تجعل المستند قوياً ومكتملاً. على سبيل المثال، في عقد الإيجار، يجب أن تضيف بنوداً عن (قيمة الإيجار، مدة العقد، مسؤولية الأطراف، التأمين، شرط التحكيم، القانون الواجب التطبيق، تعويضات التلف والفقدان، آلية التسليم والاستلام).
            3.  **الصياغة:**
                *   استخدم لغة عربية رسمية وقانونية واضحة.
                *   ابدأ دائماً بعنوان رئيسي واضح للمستند (مثال: # عقد اتفاقية تأجير معدات).
                *   نسّق المستند باستخدام Markdown (عناوين، قوائم نقطية ورقمية، نص عريض).
                *   قسّم المستند إلى "مواد" أو "بنود" مرقمة وواضحة.
                *   في النهاية، قم بتضمين قسم واضح لتواقيع الطرفين المعنيين (مثال: الطرف الأول، الطرف الثاني) مع ترك مساحة كافية للتوقيع.
            4.  **الهدف النهائي:** إنشاء مستند جاهز للاستخدام مباشرة، يحمي مصالح "شركة أعمال الشاهين" إلى أقصى درجة ممكنة قانونياً. لا تقم بطرح أسئلة، بل قم بإنشاء أفضل مستند ممكن بناءً على خبرتك.
        `;

        const apiKey = process.env.REACT_APP_GEMINI_API_KEY;

        if (!apiKey) {
            const errorMsg = "مفتاح Gemini API غير موجود. يرجى التأكد من إعداده بشكل صحيح.";
            console.error(errorMsg);
            setGeneratedContent(errorMsg);
            setIsLoading(false);
            return;
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const payload = { contents: [{ role: "user", parts: [{ text: fullPrompt }] }] };

        try {
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload ) });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error.message || response.statusText);
            }
            const result = await response.json();
            if (result.candidates?.[0]?.content?.parts?.[0]) {
                setGeneratedContent(result.candidates[0].content.parts[0].text);
                setIsEditing(true);
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

    return (
        <div className="max-w-5xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 no-print">
                <div className="flex items-center gap-3 mb-4">
                    <Bot className="w-8 h-8 text-blue-600" />
                    <h2 className="text-2xl font-bold text-gray-800">الوكيل الذكي للمستندات</h2>
                </div>
                <p className="text-gray-600 mb-6">صف للمساعد الذكي المستند الذي تحتاجه (عقد، مطالبة، عرض سعر، إلخ) مع ذكر أي تفاصيل هامة، وسيقوم بإنشاء مسودة احترافية لك.</p>
                
                <div className="space-y-4">
                    <div>
                        <label htmlFor="docType" className="block text-sm font-bold text-gray-700 mb-1">اختر نوع المستند الأساسي:</label>
                        <select id="docType" value={docType} onChange={(e) => setDocType(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
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
                    <button onClick={handleGenerate} disabled={isLoading} className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 shadow-lg flex items-center justify-center gap-2">
                        {isLoading ? <Loader2 className="animate-spin" /> : <Bot />}
                        {isLoading ? 'جاري إنشاء المستند...' : 'أنشئ المستند الآن'}
                    </button>
                </div>
            </div>

            {generatedContent && (
                <div className="mt-8 bg-white p-6 rounded-lg shadow-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-4 no-print">
                         <h3 className="text-xl font-bold text-gray-800">المستند المجهز:</h3>
                         <div>
                            <button onClick={() => setIsEditing(!isEditing)} className="bg-yellow-500 text-white p-2 rounded-lg hover:bg-yellow-600 mr-2">
                                <Edit size={20} />
                            </button>
                             <button onClick={handlePrint} className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700">
                                 <Printer size={20} />
                             </button>
                         </div>
                    </div>
                    <div id="printable-document" className="printable-content">
                        {isEditing ? (
                            <textarea 
                                value={generatedContent}
                                onChange={(e) => setGeneratedContent(e.target.value)}
                                className="w-full h-[60vh] p-4 border rounded-md font-mono text-sm leading-relaxed"
                            />
                        ) : (
                            <div className="prose prose-lg max-w-none p-4 bg-gray-50 rounded-md border">
                                <ReactMarkdown>{generatedContent}</ReactMarkdown>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};


// --- Main App Component ---
export default function App() {
    const [activeView, setActiveView] = useState('documents'); // 'documents' or 'aiAgent'

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

                {activeView === 'documents' ? <DocumentSuite /> : <AiAgentView />}

            </div>
        </>
    );
}
