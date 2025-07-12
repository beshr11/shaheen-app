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
    const [isInvoiceView, setIsInvoiceView] = useState(false); // New state for invoice view

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
            setIsInvoiceView(false); // Reset view on new form
            if (db && userId) {
                const docRef = doc(db, 'artifacts', appId, 'users', userId, 'voucher', 'currentVoucher');
                await setDoc(docRef, {});
            }
        }
    };

    // --- Filtered materials for invoice view ---
    const displayedMaterials = isInvoiceView
        ? ALL_MATERIALS.filter(item => formData[`quantity_${item.id}`] && Number(formData[`quantity_${item.id}`]) > 0)
        : ALL_MATERIALS;
    
    // --- Render ---
    return (
        <>
        <style>{`
            /* General Styles */
            body {
                font-family: 'Tajawal', sans-serif;
            }

            /* Print-specific Styles - FORCED SINGLE A4 PAGE */
            @page {
                size: A4;
                margin: 1cm;
            }

            @media print {
                html, body {
                    width: 210mm;
                    height: 297mm;
                    margin: 0;
                    padding: 0;
                    font-size: 9.5pt; /* Slightly smaller base font for print */
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
                    padding: 0 !important; /* Padding is handled by @page margin */
                    margin: 0 !important;
                    border: none !important;
                    box-shadow: none !important;
                    border-radius: 0 !important;
                    display: flex;
                    flex-direction: column;
                }

                .printable-area > * {
                    flex-shrink: 0; /* Prevent sections from shrinking too much */
                }

                .printable-area .overflow-x-auto {
                    flex-grow: 1; /* Allow table to fill remaining space */
                }
                
                .printable-area header img {
                     height: 5.5rem !important; /* Smaller logo for print */
                     margin-bottom: 0.5rem !important;
                }

                .printable-area h1 { font-size: 18pt !important; font-weight: bold; margin-bottom: 0.1rem !important; }
                .printable-area h2 { font-size: 14pt !important; font-weight: bold; margin-bottom: 0.5rem !important; }
                .printable-area h3 { font-size: 11pt !important; font-weight: bold; }
                
                .printable-area .mb-8 {
                     margin-bottom: 0.8rem !important;
                }

                .printable-area table {
                    font-size: 9pt !important; /* Smaller table font */
                }

                .printable-area th, .printable-area td {
                    padding: 3px !important; /* Tighter cell padding */
                    page-break-inside: avoid;
                }

                .printable-area footer {
                    margin-top: auto !important; /* Push footer to the bottom */
                    padding-top: 0.5rem !important;
                    page-break-before: avoid;
                }
                
                .printable-area .signature-container {
                    margin-bottom: 1rem !important;
                }

                .printable-area .signature-box {
                     margin-top: 2rem !important; /* Reduced margin for signatures */
                }
                                
                .printable-area .legal-note {
                    margin-top: 1rem !important;
                    padding-top: 0.5rem !important;
                }
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
                    <h2 className="text-xl sm:text-2xl font-bold text-blue-600 text-center mb-6">سند تسليم الشدات المعدنية وملحقاتها</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField label="الرقم:" id="doc-ref" value={formData['doc-ref'] || ''} onChange={handleInputChange} readOnly={isInvoiceView} />
                        <InputField label="التاريخ:" id="delivery-date" type="date" value={formData['delivery-date'] || ''} onChange={handleInputChange} readOnly={isInvoiceView} />
                        <InputField label="اسم المسلِّم:" id="deliverer-name" value={formData['deliverer-name'] || ''} onChange={handleInputChange} readOnly={isInvoiceView} />
                        <InputField label="اسم المستلم:" id="recipient-name" value={formData['recipient-name'] || ''} onChange={handleInputChange} readOnly={isInvoiceView} />
                        <InputField label="اسم المشروع:" id="project-name" value={formData['project-name'] || ''} onChange={handleInputChange} readOnly={isInvoiceView} />
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
            </div>

            <div className="max-w-4xl mx-auto text-center mt-6 no-print flex flex-wrap justify-center gap-4">
                <button onClick={() => setIsInvoiceView(!isInvoiceView)} className="bg-orange-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-orange-600 focus:ring-4 focus:ring-orange-300 shadow-lg">
                    {isInvoiceView ? 'العودة للتعديل' : 'إصدار فاتورة للطباعة'}
                </button>
                <button onClick={clearForm} className="bg-red-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-red-700 focus:ring-4 focus:ring-red-300 shadow-lg">سند جديد</button>
                <button onClick={() => window.print()} className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 shadow-lg">طباعة السند</button>
            </div>
        </div>
        </>
    );
}

// --- Sub-components ---
const InputField = ({ label, id, type = 'text', value, onChange, readOnly }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-bold text-gray-700 mb-1">{label}</label>
        <input type={type} id={id} value={value} onChange={(e) => onChange(id, e.target.value)} readOnly={readOnly} className={`w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${readOnly ? 'bg-gray-100' : ''}`} />
    </div>
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

const SignatureBox = ({ title }) => (
    <div className="text-center flex-1">
        <h3 className="font-bold text-lg text-gray-800 mb-2">{title}</h3>
        <div className="mt-12 pt-2 border-t-2 border-gray-400 w-full mx-auto signature-box"><p className="text-sm">التوقيع</p></div>
    </div>
);
