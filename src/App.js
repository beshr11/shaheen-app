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
    const [activeDocument, setActiveDocument] = useState('deliveryNote'); // 'deliveryNote', 'contract', 'commencement', 'returnNote'
    const [isInvoiceView, setIsInvoiceView] = useState(false);

    // This variable is provided by the environment
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    // --- Data Structure ---
    const ALL_MATERIALS = [
        { id: 1, type: 'قائم 3م', unit: 'قطعة' }, { id: 2, type: 'قائم 2.5م', unit: 'قطعة' }, { id: 3, type: 'قائم 2م', unit: 'قطعة' }, { id: 4, type: 'قائم 1.5م', unit: 'قطعة' }, { id: 5, type: 'قائم 1م', unit: 'قطعة' }, { id: 6, type: 'لدجر 1.8م', unit: 'قطعة' }, { id: 7, type: 'لدجر 1.5م', unit: 'قطعة' }, { id: 8, type: 'لدجر 1.60م', unit: 'قطعة' }, { id: 9, type: 'لدجر 1.00م', unit: 'قطعة' }, { id: 10, type: 'لدجر 1.25م', unit: 'قطعة' }, { id: 11, type: 'لدجر 0.9م', unit: 'قطعة' }, { id: 12, type: 'لدجر 1.2م', unit: 'قطعة' }, { id: 13, type: 'لدجر 0.8م', unit: 'قطعة' }, { id: 14, type: 'لدجر 0.6م', unit: 'قطعة' }, { id: 15, type: 'يوهد', unit: 'قطعة' }, { id: 16, type: 'ميزانيه', unit: 'قطعة' }, { id: 17, type: 'دوكا المنيوم', unit: 'قطعة' }, { id: 18, type: 'وصلات', unit: 'قطعة' }, { id: 19, type: 'ماسورة', unit: 'قطعة' }, { id: 20, type: 'كلامب', unit: 'قطعة' }, { id: 21, type: 'بليتة تثبيت', unit: 'قطعة' }, { id: 22, type: 'لوح بوندي 4م', unit: 'قطعة' }
    ];
    
    // --- Firebase Initialization and Auth ---
    useEffect(() => {
        let firebaseConfigString = null;
        if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_FIREBASE_CONFIG) {
            firebaseConfigString = process.env.REACT_APP_FIREBASE_CONFIG;
        } else if (typeof __firebase_config !== 'undefined') {
            firebaseConfigString = __firebase_config;
        }

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

        const docRef = doc(db, 'artifacts', appId, 'users', userId, 'scaffoldingDocs', 'main');
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

    // --- Handlers ---
    const handleInputChange = useCallback(async (key, value) => {
        const newFormData = { ...formData, [key]: value };
        setFormData(newFormData);
        if (db && userId) {
            const docRef = doc(db, 'artifacts', appId, 'users', userId, 'scaffoldingDocs', 'main');
            await setDoc(docRef, newFormData, { merge: true });
        }
    }, [formData, db, userId, appId]);

    const clearForm = async () => {
        if (window.confirm("هل أنت متأكد أنك تريد مسح جميع البيانات؟")) {
            setFormData({});
            setIsInvoiceView(false);
            if (db && userId) {
                const docRef = doc(db, 'artifacts', appId, 'users', userId, 'scaffoldingDocs', 'main');
                await setDoc(docRef, {});
            }
        }
    };
    
    const renderActiveDocument = () => {
        switch (activeDocument) {
            case 'contract':
                return <RentalContract formData={formData} handleInputChange={handleInputChange} />;
            case 'commencement':
                return <CommencementNote formData={formData} handleInputChange={handleInputChange} />;
            case 'returnNote':
                return <ReturnNote formData={formData} handleInputChange={handleInputChange} materials={ALL_MATERIALS} />;
            case 'deliveryNote':
            default:
                return <DeliveryNote formData={formData} handleInputChange={handleInputChange} materials={ALL_MATERIALS} isInvoiceView={isInvoiceView} />;
        }
    };

    return (
        <>
        <PrintStyles />
        <div dir="rtl" className="bg-gray-100 p-4 sm:p-8" style={{ fontFamily: "'Tajawal', sans-serif" }}>
            
            <div className="max-w-5xl mx-auto mb-6 no-print">
                <div className="bg-white p-2 rounded-lg shadow-md flex justify-center gap-2">
                    <NavButton text="عقد الإيجار" onClick={() => setActiveDocument('contract')} isActive={activeDocument === 'contract'} />
                    <NavButton text="محضر بدء أعمال" onClick={() => setActiveDocument('commencement')} isActive={activeDocument === 'commencement'} />
                    <NavButton text="سند تسليم" onClick={() => setActiveDocument('deliveryNote')} isActive={activeDocument === 'deliveryNote'} />
                    <NavButton text="محضر إعادة استلام" onClick={() => setActiveDocument('returnNote')} isActive={activeDocument === 'returnNote'} />
                </div>
            </div>

            <div className="max-w-5xl mx-auto bg-white p-6 sm:p-10 rounded-lg shadow-2xl printable-area border border-gray-200">
                {renderActiveDocument()}
            </div>

            <div className="max-w-5xl mx-auto text-center mt-6 no-print flex flex-wrap justify-center gap-4">
                {activeDocument === 'deliveryNote' && (
                    <button onClick={() => setIsInvoiceView(!isInvoiceView)} className="bg-orange-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-orange-600 focus:ring-4 focus:ring-orange-300 shadow-lg">
                        {isInvoiceView ? 'العودة للتعديل' : 'إصدار فاتورة للطباعة'}
                    </button>
                )}
                <button onClick={clearForm} className="bg-red-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-red-700 focus:ring-4 focus:ring-red-300 shadow-lg">مستند جديد</button>
                <button onClick={() => window.print()} className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 shadow-lg">طباعة</button>
            </div>
        </div>
        </>
    );
}

// --- Reusable Components ---
const InputField = ({ label, id, value, onChange, readOnly = false, type = "text" }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-bold text-gray-700 mb-1">{label}</label>
        <input type={type} id={id} value={value || ''} onChange={(e) => onChange(id, e.target.value)} readOnly={readOnly} className={`w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${readOnly ? 'bg-gray-100' : ''}`} />
    </div>
);

const SignatureBox = ({ title, name }) => (
    <div className="text-center flex-1">
        <h3 className="font-bold text-lg text-gray-800 mb-2">{title}</h3>
        {name && <p className="font-bold text-md text-gray-700 mb-4">{name}</p>}
        <div className="mt-12 pt-2 border-t-2 border-gray-400 w-full mx-auto signature-box"><p className="text-sm">التوقيع</p></div>
    </div>
);

const NavButton = ({ text, onClick, isActive }) => (
    <button onClick={onClick} className={`px-4 py-2 text-sm font-bold rounded-md transition-colors duration-200 ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
        {text}
    </button>
);

const AppHeader = () => (
    <header className="text-center pb-6 border-b-2 border-gray-200 mb-10">
        <img src="https://i.ibb.co/bx1cZBC/image.png" alt="شعار شركة أعمال الشاهين" className="h-28 mx-auto mb-4" />
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">أعمال الشاهين</h1>
        <p className="text-lg text-gray-500">AL Shaheen Business</p>
    </header>
);

// --- Document Components ---

const RentalContract = ({ formData, handleInputChange }) => (
    <>
        <AppHeader />
        <h2 className="text-2xl font-bold text-center mb-6">عقد إيجار شدات وسقالات معدنية</h2>
        <div className="space-y-4 text-sm leading-relaxed contract-text">
            <p><strong>رقم العقد:</strong> <input type="text" value={formData.contract_id || ''} onChange={(e) => handleInputChange('contract_id', e.target.value)} className="inline-input" /></p>
            <p><strong>التاريخ:</strong> <input type="text" value={formData.contract_date || ''} onChange={(e) => handleInputChange('contract_date', e.target.value)} className="inline-input" /></p>
            <p><strong>الطرف الأول (المؤجر):</strong> شركة أعمال الشاهين للمقاولات، سجل تجاري رقم: 1009148705.</p>
            <p><strong>الطرف الثاني (المستأجر):</strong> <input type="text" value={formData.client_name || ''} onChange={(e) => handleInputChange('client_name', e.target.value)} className="inline-input" />, سجل تجاري رقم: <input type="text" value={formData.client_cr || ''} onChange={(e) => handleInputChange('client_cr', e.target.value)} className="inline-input" />.</p>
            <h3 className="font-bold pt-4">تمهيد:</h3>
            <p>حيث إن المؤجر يمتلك الخبرة والمعدات اللازمة لتأجير الشدات والسقالات المعدنية، وحيث إن المستأجر يرغب في استئجار هذه المعدات لاستخدامها في مشروعه الكائن في <input type="text" value={formData.project_location || ''} onChange={(e) => handleInputChange('project_location', e.target.value)} className="inline-input" />، فقد اتفق الطرفان على ما يلي:</p>
            
            <h3 className="font-bold pt-2">المادة (3): فترة الإيجار وآلية احتساب القيمة الإيجارية</h3>
            <p>3.1 **بدء فترة الإيجار:** تبدأ فترة الإيجار رسمياً من التاريخ المثبت في "محضر بدء أعمال".</p>
            <p>3.2 **القيمة الإيجارية الشهرية:** اتفق الطرفان على أن القيمة الإيجارية الشهرية للمعدات هي (<input type="text" value={formData.monthly_rent_value || ''} onChange={(e) => handleInputChange('monthly_rent_value', e.target.value)} className="inline-input" /> ريال سعودي)، غير شاملة لضريبة القيمة المضافة.</p>
            <p>3.3 **تمديد فترة الإيجار:** في حال امتدت فترة الإيجار إلى ما بعد الشهر الأول، إذا كانت مدة التمديد من يوم واحد (1) إلى سبعة (7) أيام، يتم احتساب الإيجار لهذه الفترة على أساس تناسبي. إذا تجاوزت مدة التمديد سبعة (7) أيام، يستحق على المستأجر سداد قيمة إيجار شهر ثانٍ كامل.</p>
            
            <h3 className="font-bold pt-2">المادة (5): الملكية، مخاطر الفقد والتلف، والتأمين</h3>
            <p>5.1 **الملكية:** تظل ملكية المعدات خالصة للمؤجر.</p>
            <p>5.2 **مخاطر الفقد والتلف:** يتحمل المستأجر كامل المسؤولية عن أي فقدان أو تلف يلحق بالمعدات.</p>
            <p>5.3 **التزام التأمين:** يتعهد المستأجر بالحصول على بوليصة تأمين "مسؤولية مدنية عامة" سارية المفعول.</p>

        </div>
        <footer className="mt-24 pt-8">
            <div className="flex flex-col md:flex-row justify-around items-stretch gap-12 mb-12 signature-container">
                <SignatureBox title="الطرف الأول (المؤجر)" name="بِشر شاهين - الرئيس التنفيذي" />
                <SignatureBox title="الطرف الثاني (المستأجر)" />
            </div>
        </footer>
    </>
);

const CommencementNote = ({ formData, handleInputChange }) => (
    <>
        <AppHeader />
        <h2 className="text-2xl font-bold text-center mb-6">محضر بدء أعمال</h2>
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <p><strong>اسم المشروع:</strong> {formData.project_name || '.....................'}</p>
                <p><strong>العميل (المستأجر):</strong> {formData.client_name || '.....................'}</p>
                <p><strong>موقع العمل:</strong> {formData.project_location || '.....................'}</p>
                <p><strong>رقم العقد المرجعي:</strong> {formData.contract_id || '.....................'}</p>
            </div>
            <p className="pt-8">بناءً على العقد المبرم بين الطرفين والمشار إليه أعلاه، نقر نحن الموقعين أدناه، ممثلي كل من المؤجر والمستأجر، بأنه قد تم استيفاء كافة الشروط المسبقة، وأن الأعمال المتعلقة بالسقالات قد بدأت رسمياً في الموقع. وعليه، يعتبر تاريخ اليوم هو تاريخ البدء الفعلي لفترة الإيجار.</p>
            <p><strong>تاريخ بدء الأعمال:</strong> <input type="date" value={formData.commencement_date || ''} onChange={(e) => handleInputChange('commencement_date', e.target.value)} className="inline-input" /></p>
        </div>
        <footer className="mt-24 pt-8">
            <div className="flex flex-col md:flex-row justify-around items-stretch gap-12 mb-12 signature-container">
                <SignatureBox title="ممثل المؤجر" />
                <SignatureBox title="ممثل المستأجر" />
            </div>
        </footer>
    </>
);

const DeliveryNote = ({ formData, handleInputChange, materials, isInvoiceView }) => {
    const displayedMaterials = isInvoiceView
       ? materials.filter(item => formData[`quantity_${item.id}`] && Number(formData[`quantity_${item.id}`]) > 0)
        : materials;

    return (
        <>
            <AppHeader />
            <h2 className="text-xl sm:text-2xl font-bold text-blue-600 text-center mb-6">سند تسليم الشدات المعدنية وملحقاتها</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <InputField label="الرقم:" id="doc-ref" value={formData['doc-ref']} onChange={handleInputChange} readOnly={isInvoiceView} />
                <InputField label="التاريخ:" id="delivery-date" type="date" value={formData['delivery-date']} onChange={handleInputChange} readOnly={isInvoiceView} />
                <InputField label="اسم المسلِّم:" id="deliverer-name" value={formData['deliverer-name']} onChange={handleInputChange} readOnly={isInvoiceView} />
                <InputField label="اسم المستلم:" id="recipient-name" value={formData['recipient-name']} onChange={handleInputChange} readOnly={isInvoiceView} />
                <InputField label="اسم المشروع:" id="project-name" value={formData['project-name']} onChange={handleInputChange} readOnly={isInvoiceView} />
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
                        {displayedMaterials.map((item, index) => (
                            <MaterialRow key={item.id} item={item} index={index} formData={formData} onChange={handleInputChange} readOnly={isInvoiceView} />
                        ))}
                    </tbody>
                </table>
            </div>
            <footer className="mt-24 pt-8">
                <div className="flex flex-col md:flex-row justify-around items-stretch gap-12 mb-12 signature-container">
                    <SignatureBox title="المسلِّم" />
                    <SignatureBox title="المستلم" />
                </div>
                <div className="text-center mt-8 pt-8 border-t-2 border-dashed ceo-signature">
                    <h3 className="font-bold text-lg text-gray-800 mb-4">الرئيس التنفيذي: بِشر شاهين</h3>
                    <div className="mt-12 pt-2 border-t-2 border-gray-400 w-1/2 mx-auto signature-box">
                       <p className="text-sm">التوقيع</p>
                   </div>
               </div>
               <div className="text-center mt-8 pt-4 border-t border-gray-200 legal-note">
                    <p className="text-xs text-gray-500">هذه الورقة من حق شركة أعمال الشاهين الإحتفاظ بها والمطالبة بالعدة كاملة بالعدد كامل, وفي حال النقص أو التلف يتم التعويض بسعر السوق الجديد للحديد.</p>
                </div>
            </footer>
        </>
    );
};

const ReturnNote = ({ formData, handleInputChange, materials }) => (
    <>
        <AppHeader />
        <h2 className="text-2xl font-bold text-center mb-6">محضر إعادة استلام وفحص المعدات</h2>
        <div className="grid grid-cols-2 gap-4 mb-8">
            <p><strong>اسم المشروع:</strong> {formData.project_name || '.....................'}</p>
            <p><strong>العميل (المستأجر):</strong> {formData.client_name || '.....................'}</p>
            <p><strong>تاريخ الإعادة:</strong> <input type="date" value={formData.return_date || ''} onChange={(e) => handleInputChange('return_date', e.target.value)} className="inline-input" /></p>
            <p><strong>رقم العقد المرجعي:</strong> {formData.contract_id || '.....................'}</p>
        </div>
        <p className="mb-4">بموجبه، يتم إثبات إعادة استلام المعدات الموضحة أدناه من المستأجر. يقر الطرفان بالكميات والحالة المذكورة، والتي ستكون أساس المحاسبة النهائية لأي نقص أو تلف.</p>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-right text-gray-600 border-collapse">
                <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                    <tr>
                        <th className="p-3 border border-gray-300">بيان</th>
                        <th className="p-3 border border-gray-300">الكمية المستلمة أساساً</th>
                        <th className="p-3 border border-gray-300">الكمية المرتجعة</th>
                        <th className="p-3 border border-gray-300">النقص / التالف</th>
                        <th className="p-3 border border-gray-300">ملاحظات الفحص</th>
                    </tr>
                </thead>
                <tbody>
                    {materials.map((item, index) => (
                        <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="p-2 border border-gray-300">{item.type}</td>
                            <td className="p-2 border border-gray-300"><input type="number" value={formData[`quantity_${item.id}`] || ''} readOnly className="w-full p-1 bg-gray-100 text-center" /></td>
                            <td className="p-2 border border-gray-300"><input type="number" value={formData[`returned_${item.id}`] || ''} onChange={(e) => handleInputChange(`returned_${item.id}`, e.target.value)} className="w-full p-1 text-center" /></td>
                            <td className="p-2 border border-gray-300"><input type="number" value={formData[`damaged_${item.id}`] || ''} onChange={(e) => handleInputChange(`damaged_${item.id}`, e.target.value)} className="w-full p-1 text-center" /></td>
                            <td className="p-2 border border-gray-300"><input type="text" value={formData[`inspection_notes_${item.id}`] || ''} onChange={(e) => handleInputChange(`inspection_notes_${item.id}`, e.target.value)} className="w-full p-1" /></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        <footer className="mt-24 pt-8">
            <div className="flex flex-col md:flex-row justify-around items-stretch gap-12 mb-12 signature-container">
                <SignatureBox title="ممثل المؤجر (المُستلِم)" />
                <SignatureBox title="ممثل المستأجر (المُسلِّم)" />
            </div>
        </footer>
    </>
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

const PrintStyles = () => (
    <style>{`
        /* General Styles */
        body { font-family: 'Tajawal', sans-serif; }
       .inline-input { border: none; border-bottom: 1px dotted #999; padding: 0 2px; text-align: center; }
       .contract-text p { margin-bottom: 0.75rem; }

        /* Print-specific Styles - FORCED SINGLE A4 PAGE */
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

           .no-print { display: none !important; }

           .printable-area {
                width: 100%;
                height: 100%;
                padding: 0 !important;
                margin: 0 !important;
                border: none !important;
                box-shadow: none !important;
                border-radius: 0 !important;
                display: flex;
                flex-direction: column;
            }

           .printable-area > * { flex-shrink: 0; }
           .printable-area .overflow-x-auto, .printable-area .space-y-4 { flex-grow: 1; }
            
           .printable-area header img { height: 5rem !important; margin-bottom: 0.5rem !important; }
           .printable-area h1 { font-size: 16pt !important; font-weight: bold; }
           .printable-area h2 { font-size: 13pt !important; font-weight: bold; margin-bottom: 0.8rem !important; }
           .printable-area h3 { font-size: 11pt !important; font-weight: bold; }
            
           .printable-area table { font-size: 9pt !important; }
           .printable-area th, .printable-area td { padding: 3px !important; page-break-inside: avoid; }

           .printable-area footer { margin-top: auto !important; padding-top: 0.5rem !important; page-break-before: avoid; }
           .printable-area .signature-box { margin-top: 1.5rem !important; }
           .printable-area .legal-note { margin-top: 1rem !important; padding-top: 0.5rem !important; }
        }
    `}</style>
);
