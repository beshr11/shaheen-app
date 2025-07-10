import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';

// --- Main App Component ---
export default function App() {
    // --- State Management ---
    const [db, setDb] = useState(null);
    const [userId, setUserId] = useState(null);
    const [formData, setFormData] = useState({});
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalContent, setModalContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);


    // This variable is provided by the environment
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    // --- Data Structure ---
    const ALL_MATERIALS = [
        { id: 1, type: 'قائم 3م', unit: 'قطعة' }, { id: 2, type: 'قائم 2.5م', unit: 'قطعة' }, { id: 3, type: 'قائم 2م', unit: 'قطعة' }, { id: 4, type: 'قائم 1.5م', unit: 'قطعة' }, { id: 5, type: 'قائم 1م', unit: 'قطعة' }, { id: 6, type: 'لدجر 1.8م', unit: 'قطعة' }, { id: 7, type: 'لدجر 1.5م', unit: 'قطعة' }, { id: 8, type: 'لدجر 1.60م', unit: 'قطعة' }, { id: 9, type: 'لدجر 1.00م', unit: 'قطعة' }, { id: 10, type: 'لدجر 1.25م', unit: 'قطعة' }, { id: 11, type: 'لدجر 0.9م', unit: 'قطعة' }, { id: 12, type: 'لدجر 1.2م', unit: 'قطعة' }, { id: 13, type: 'لدجر 0.8م', unit: 'قطعة' }, { id: 14, type: 'لدجر 0.6م', unit: 'قطعة' }, { id: 15, type: 'يوهد', unit: 'قطعة' }, { id: 16, type: 'ميزانيه', unit: 'قطعة' }, { id: 17, type: 'دوكا المنيوم', unit: 'قطعة' }, { id: 18, type: 'وصلات', unit: 'قطعة' }, { id: 19, type: 'ماسورة', unit: 'قطعة' }, { id: 20, type: 'كلامب', unit: 'قطعة' }, { id: 21, type: 'بليتة تثبيت', unit: 'قطعة' }, { id: 22, type: 'لوح بوندي 4م', unit: 'قطعة' }
    ];
    
    // --- Firebase Initialization and Auth ---
    useEffect(() => {
        const firebaseConfigString = typeof __firebase_config !== 'undefined' ? __firebase_config : null;
        const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

        if (!firebaseConfigString) {
            console.error("Firebase configuration is missing.");
            return;
        }

        try {
            const firebaseConfig = JSON.parse(firebaseConfigString);
            const app = initializeApp(firebaseConfig);
            const firestoreDb = getFirestore(app);
            const auth = getAuth(app);
            setDb(firestoreDb);

            onAuthStateChanged(auth, (user) => {
                if (user) {
                    setUserId(user.uid);
                    setIsAuthReady(true);
                } else {
                    const authenticate = async () => {
                        try {
                            if (initialAuthToken) {
                                await signInWithCustomToken(auth, initialAuthToken);
                            } else {
                                await signInAnonymously(auth);
                            }
                        } catch (error) {
                            console.error("Authentication failed:", error);
                        }
                    };
                    authenticate();
                }
            });
        } catch (error) {
            console.error("Error initializing Firebase:", error);
        }
    }, []);

    // --- Data Fetching and Real-time Sync ---
    useEffect(() => {
        if (!isAuthReady || !db || !userId) return;

        const docRef = doc(db, 'artifacts', appId, 'users', userId, 'voucher', 'currentVoucher');
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                setFormData(docSnap.data());
            } else {
                console.log("No such document! Creating a new one.");
                setDoc(docRef, {});
            }
        }, (error) => {
            console.error("Firestore snapshot error:", error);
        });
        return () => unsubscribe();
    }, [isAuthReady, db, userId, appId]);

    // --- Gemini API Call ---
    const callGemini = async (prompt) => {
        setIsLoading(true);
        setModalContent('');
        const apiKey = ""; // Handled by environment
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };

        try {
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
            const result = await response.json();
            if (result.candidates?.[0]?.content?.parts?.[0]) {
                setModalContent(result.candidates[0].content.parts[0].text);
            } else {
                setModalContent("لم يتمكن الذكاء الاصطناعي من إنشاء رد.");
            }
        } catch (error) {
            console.error("Error calling Gemini API:", error);
            setModalContent(`حدث خطأ أثناء الاتصال بالذكاء الاصطناعي: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Handlers ---
    const handleInputChange = useCallback(async (key, value) => {
        const newFormData = { ...formData, [key]: value };
        setFormData(newFormData);
        if (db && userId) {
            const docRef = doc(db, 'artifacts', appId, 'users', userId, 'voucher', 'currentVoucher');
            await setDoc(docRef, newFormData, { merge: true });
        }
    }, [formData, db, userId, appId]);

    const clearForm = async () => {
        if (window.confirm("هل أنت متأكد أنك تريد مسح جميع البيانات وبدء سند جديد؟")) {
            setFormData({});
            if (db && userId) {
                const docRef = doc(db, 'artifacts', appId, 'users', userId, 'voucher', 'currentVoucher');
                await setDoc(docRef, {});
            }
        }
    };
    
    const generateReport = () => {
        const projectName = formData['project-name'] || 'غير محدد';
        const recipientName = formData['recipient-name'] || 'غير محدد';
        let itemsList = ALL_MATERIALS
            .filter(item => formData[`quantity_${item.id}`] > 0)
            .map(item => `- ${item.type}: ${formData[`quantity_${item.id}`]} ${item.unit} (ملاحظات: ${formData[`notes_${item.id}`] || 'لا يوجد'})`)
            .join('\n');

        if (!itemsList) {
            alert("الرجاء إدخال كميات المواد أولاً.");
            return;
        }

        const prompt = `
            Generate a concise daily report in Arabic for a project manager. The report should be easy to copy and paste into WhatsApp.
            Use the following details:
            - Project Name: ${projectName}
            - Recipient: ${recipientName}
            - Disbursed Items:
            ${itemsList}

            Structure the report with a clear title, a brief introduction, the list of items, and a closing statement.
        `;
        setModalTitle("✨ تقرير صرف موجز");
        setIsModalOpen(true);
        callGemini(prompt);
    };

    const generateHandlingNotes = () => {
        let itemsList = ALL_MATERIALS
            .filter(item => formData[`quantity_${item.id}`] > 0)
            .map(item => item.type)
            .join(', ');

        if (!itemsList) {
            alert("الرجاء إدخال كميات المواد أولاً.");
            return;
        }

        const prompt = `
            Based on the following list of construction scaffolding materials, generate 3-4 important handling and storage recommendations in Arabic for the warehouse keeper and the recipient.
            The materials are: ${itemsList}.
            The recommendations should be practical and focus on safety and preventing damage. Format as a bulleted list.
        `;
        setModalTitle("✨ ملاحظات هامة للمناولة والتخزين");
        setIsModalOpen(true);
        callGemini(prompt);
    };


    // --- Render ---
    return (
        <>
        <style>{`
            @page {
                size: A4;
                margin: 1.2cm; /* Adjusted margin */
            }
            @media print {
                html, body {
                    width: 210mm;
                    height: 297mm;
                    margin: 0;
                    padding: 0;
                }
                body { 
                    background-color: #fff !important; 
                    font-size: 10pt;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                .no-print { display: none !important; }
                .printable-area {
                    width: 100%;
                    height: 100%;
                    box-shadow: none !important;
                    margin: 0 !important;
                    border: none !important;
                    padding: 1cm !important; /* Use padding instead of margin */
                    border-radius: 0 !important;
                    display: flex;
                    flex-direction: column;
                }
                .printable-area > header, .printable-area > div, .printable-area > footer {
                    flex-shrink: 0; /* Prevent sections from shrinking */
                }
                .printable-area > .overflow-x-auto {
                    flex-grow: 1; /* Allow table to take up available space */
                }
                header, .mb-8, .overflow-x-auto { margin-bottom: 0.5rem !important; }
                footer { margin-top: auto !important; padding-top: 1rem; page-break-inside: avoid; }
                tr, td, th { page-break-inside: avoid; padding: 4px !important; }
                h1 { font-size: 18pt !important; font-weight: bold; }
                h2 { font-size: 15pt !important; font-weight: bold; }
                h3 { font-size: 12pt !important; font-weight: bold; }
                thead th { font-weight: bold; }
            }
        `}</style>
        <div dir="rtl" className="bg-gray-100 p-4 sm:p-8" style={{ fontFamily: "'Tajawal', sans-serif" }}>
            <div className="max-w-4xl mx-auto bg-white p-6 sm:p-10 rounded-lg shadow-2xl printable-area border border-gray-200">
                <header className="text-center pb-6 border-b-2 border-gray-200 mb-10">
                    <img src="https://i.ibb.co/bx1cZBC/image.png" alt="شعار شركة أعمال الشاهين" className="h-28 mx-auto mb-4" />
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">أعمال الشاهين</h1>
                    <p className="text-lg text-gray-500">AL Shaheen Business</p>
                </header>

                <div className="mb-8">
                    <h2 className="text-xl sm:text-2xl font-bold text-blue-600 text-center mb-6">سند صرف بضاعة</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField label="الرقم:" id="doc-ref" value={formData['doc-ref'] || ''} onChange={handleInputChange} />
                        <InputField label="التاريخ:" id="delivery-date" type="date" value={formData['delivery-date'] || ''} onChange={handleInputChange} />
                        <InputField label="اسم المستلم:" id="recipient-name" value={formData['recipient-name'] || ''} onChange={handleInputChange} />
                        <InputField label="اسم المشروع:" id="project-name" value={formData['project-name'] || ''} onChange={handleInputChange} />
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right text-gray-600 border-collapse">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                            <tr>
                                <th className="p-3 border border-gray-300 w-12">م</th>
                                <th className="p-3 border border-gray-300">بيان</th>
                                <th className="p-3 border border-gray-300">الوحدة</th>
                                <th className="p-3 border border-gray-300 w-24">الكمية</th>
                                <th className="p-3 border border-gray-300">ملاحظات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ALL_MATERIALS.map((item, index) => (
                                <MaterialRow key={item.id} item={item} index={index} formData={formData} onChange={handleInputChange} />
                            ))}
                        </tbody>
                    </table>
                </div>

                <footer className="mt-24 pt-8">
                    <div className="flex flex-col md:flex-row justify-around items-stretch gap-12 mb-12">
                        <SignatureBox title="المسلِّم" />
                        <SignatureBox title="المستلم" />
                    </div>
                    <div className="text-center mt-8 pt-8 border-t-2 border-dashed">
                        <h3 className="font-bold text-lg text-gray-800 mb-2">إقرار الرئيس التنفيذي</h3>
                        <p className="text-md text-gray-600 mb-4">أقر بصحة وكمال العدد المذكور أعلاه بعد المعاينة.</p>
                        <p className="font-bold text-lg">بِشر شاهين</p>
                        <div className="mt-12 pt-2 border-t-2 border-gray-400 w-1/2 mx-auto">
                           <p className="text-sm">التوقيع</p>
                       </div>
                   </div>
                   <div className="text-center mt-8 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500">هذه الورقة من حق الشركة الإحتفاظ بها والمطالبة بالعدة كاملة بالعدد كامل في حال النقص أو التلف.</p>
                    </div>
                </footer>
            </div>

            <div className="max-w-4xl mx-auto text-center mt-6 no-print flex flex-wrap justify-center gap-4">
                <button onClick={generateReport} className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-300 shadow-lg">إنشاء تقرير موجز</button>
                <button onClick={generateHandlingNotes} className="bg-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-purple-700 focus:ring-4 focus:ring-purple-300 shadow-lg">توليد ملاحظات هامة</button>
                <button onClick={clearForm} className="bg-red-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-red-700 focus:ring-4 focus:ring-red-300 shadow-lg">سند جديد</button>
                <button onClick={() => window.print()} className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 shadow-lg">طباعة السند</button>
            </div>
            {isModalOpen && <GeminiModal title={modalTitle} content={modalContent} isLoading={isLoading} onClose={() => setIsModalOpen(false)} />}
        </div>
        </>
    );
}

// --- Sub-components ---
const InputField = ({ label, id, type = 'text', value, onChange }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-bold text-gray-700 mb-1">{label}</label>
        <input type={type} id={id} value={value} onChange={(e) => onChange(id, e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
    </div>
);

const MaterialRow = ({ item, index, formData, onChange }) => (
    <tr className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
        <td className="p-2 border border-gray-300 text-center align-middle">{item.id}</td>
        <td className="p-2 border border-gray-300 align-middle">{item.type}</td>
        <td className="p-2 border border-gray-300 text-center align-middle">{item.unit}</td>
        <td className="p-2 border border-gray-300"><input type="number" placeholder="0" value={formData[`quantity_${item.id}`] || ''} onChange={(e) => onChange(`quantity_${item.id}`, e.target.value)} className="w-full p-2 border-gray-200 border rounded-md text-center bg-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-500" /></td>
        <td className="p-2 border border-gray-300"><input type="text" value={formData[`notes_${item.id}`] || ''} onChange={(e) => onChange(`notes_${item.id}`, e.target.value)} className="w-full p-2 border-gray-200 border rounded-md bg-gray-100 focus:bg-white" /></td>
    </tr>
);

const SignatureBox = ({ title }) => (
    <div className="text-center flex-1">
        <h3 className="font-bold text-lg text-gray-800 mb-2">{title}</h3>
        <div className="mt-12 pt-2 border-t-2 border-gray-400 w-full mx-auto"><p className="text-sm">التوقيع</p></div>
    </div>
);

const GeminiModal = ({ title, content, isLoading, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 no-print">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl p-6">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
                <h3 className="text-xl font-bold text-gray-800">{title}</h3>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl">&times;</button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
                {isLoading ? (
                    <div className="flex justify-center items-center h-48">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
                    </div>
                ) : (
                    <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">{content}</div>
                )}
            </div>
            <div className="border-t pt-4 mt-4 flex justify-end">
                <button onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-300">إغلاق</button>
            </div>
        </div>
    </div>
);
