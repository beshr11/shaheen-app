import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { FileText, Printer, FilePlus, RefreshCw, FileOutput } from 'lucide-react';

// --- Reusable Components (Defined first to avoid reference errors) ---

const InputField = ({ label, id, value, onChange, readOnly = false, type = "text", placeholder = '' }) => (
    <div className="w-full">
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

const NavButton = ({ text, onClick, isActive }) => (
    <button onClick={onClick} className={`px-3 py-2 text-xs sm:text-sm font-bold rounded-md transition-colors duration-200 flex items-center gap-2 ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
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
        <td className="p-2 border border-gray-300"><input type="number" placeholder="0" value={formData[`quantity_${item.id}`] || ''} onChange={(e) => onChange(`quantity_${item.id}`, e.target.value)} readOnly={readOnly} className={`w-full p-2 border-gray-200 border rounded-md text-center ${readOnly ? 'bg-white cursor-not-allowed' : 'bg-gray-100 focus:bg-white'} focus:ring-2 focus:ring-blue-500`} /></td>
        <td className="p-2 border border-gray-300"><input type="text" value={formData[`notes_${item.id}`] || ''} onChange={(e) => onChange(`notes_${item.id}`, e.target.value)} readOnly={readOnly} className={`w-full p-2 border-gray-200 border rounded-md ${readOnly ? 'bg-white cursor-not-allowed' : 'bg-gray-100 focus:bg-white'} focus:ring-2 focus:ring-blue-500`} /></td>
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
        body { font-family: 'Tajawal', sans-serif; }
       .inline-input { border: none; border-bottom: 1px dotted #999; padding: 0 2px; text-align: center; width: 200px; background-color: #f8f9fa; }
       .contract-text p { margin-bottom: 0.75rem; }
        @page { size: A4; margin: 1.5cm; }
        @media print {
            html, body { width: 210mm; height: 297mm; margin: 0; padding: 0; font-size: 9.5pt; background-color: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
           .no-print { display: none !important; }
           .printable-area { width: 100%; height: 100%; padding: 0 !important; margin: 0 !important; border: none !important; box-shadow: none !important; border-radius: 0 !important; display: flex; flex-direction: column; }
           .printable-area > * { flex-shrink: 0; }
           .printable-area .overflow-x-auto, .printable-area .space-y-4, .printable-area .space-y-6 { flex-grow: 1; }
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
            <p>حيث إن المؤجر يمتلك الخبرة والمعدات اللازمة لتأجير الشدات والسقالات المعدنية، وحيث إن المستأجر يرغب في استئجار هذه المعدات لاستخدامها في مشروعه الكائن في <InputField id="project_location" value={formData.project_location} onChange={handleInputChange} placeholder="مدينة - حي - وصف الموقع"/>، فقد اتفق الطرفان على ما يلي:</p>
            <h3 className="font-bold pt-2">المادة (3): فترة الإيجار وآلية احتساب القيمة الإيجارية</h3>
            <p>3.1 **بدء فترة الإيجار:** تبدأ فترة الإيجار رسمياً من التاريخ المثبت في "محضر بدء أعمال".</p>
            <div className="flex items-center gap-2">3.2 **القيمة الإيجارية الشهرية:** اتفق الطرفان على أن القيمة الإيجارية الشهرية للمعدات هي (<InputField id="monthly_rent_value" value={formData.monthly_rent_value} onChange={handleInputChange} placeholder="0.00" type="number" /> ريال سعودي)، غير شاملة لضريبة القيمة المضافة.</div>
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

const LaborContract = ({ formData, handleInputChange }) => (
    <>
        <AppHeader />
        <h2 className="text-2xl font-bold text-center mb-6">عقد اتفاقية توفير عمالة فنية</h2>
        <div className="space-y-4 text-sm leading-relaxed contract-text">
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <InputField label="رقم العقد:" id="labor_contract_id" value={formData.labor_contract_id} onChange={handleInputChange} />
                <InputField label="التاريخ:" id="labor_contract_date" type="date" value={formData.labor_contract_date} onChange={handleInputChange} />
            </div>
            <p className="pt-4"><strong>الطرف الأول (مقدم الخدمة):</strong> شركة أعمال الشاهين للمقاولات، سجل تجاري رقم: 1009148705.</p>
            <InputField label="الطرف الثاني (العميل):" id="client_name" value={formData.client_name} onChange={handleInputChange} />
            <h3 className="font-bold pt-4">المادة (1): نطاق العمل</h3>
            <p>يقوم الطرف الأول بتوفير العمالة الفنية اللازمة لتركيب وفك الشدات والسقالات المعدنية الخاصة بالطرف الثاني في مشروعه الكائن في <InputField id="project_location" value={formData.project_location} onChange={handleInputChange} />.</p>
            <h3 className="font-bold pt-2">المادة (2): أجر العمالة (باليومية)</h3>
            <p>اتفق الطرفان على أن أجر العمالة يتم احتسابه باليومية، وجميع العمال يحملون شهادات TUV المعتمدة:</p>
            <div className="grid grid-cols-3 gap-4 p-4 border rounded-md">
                <InputField label="عدد المعلمين" id="foreman_count" type="number" value={formData.foreman_count} onChange={handleInputChange} />
                <p className="self-end">× 350 ريال/يوم</p>
                <p className="self-end font-bold">= {(parseFloat(formData.foreman_count || 0) * 350).toLocaleString()} ريال/يوم</p>
                <InputField label="عدد العمال المساعدين" id="helper_count" type="number" value={formData.helper_count} onChange={handleInputChange} />
                <p className="self-end">× 300 ريال/يوم</p>
                <p className="self-end font-bold">= {(parseFloat(formData.helper_count || 0) * 300).toLocaleString()} ريال/يوم</p>
            </div>
            <h3 className="font-bold pt-2">المادة (3): مسؤوليات الطرف الثاني (العميل)</h3>
            <p>يلتزم الطرف الثاني بتوفير موقع عمل آمن وجاهز، وتوفير كافة المواد والمعدات اللازمة في منطقة العمل، وتسهيل مهام عمال الطرف الأول دون عوائق. أي تأخير ينتج عن عدم جاهزية الموقع أو توفر المواد يتحمله الطرف الثاني.</p>
        </div>
        <footer className="mt-24 pt-8">
            <div className="flex flex-col md:flex-row justify-around items-stretch gap-12 mb-12 signature-container">
                <SignatureBox title="الطرف الأول (مقدم الخدمة)" name="بِشر شاهين - الرئيس التنفيذي" />
                <SignatureBox title="الطرف الثاني (العميل)" />
            </div>
        </footer>
    </>
);

const CommencementNote = ({ formData, handleInputChange }) => (
    <>
        <AppHeader />
        <h2 className="text-2xl font-bold text-center mb-10">محضر بدء أعمال رسمي</h2>
        <table className="w-full mb-8 border-collapse text-sm">
            <tbody>
                <tr><td className="font-bold p-2 border border-gray-200 bg-gray-50 w-1/4">اسم المشروع:</td><td className="p-2 border border-gray-200 w-3/4"><InputField id="project_name" value={formData.project_name} onChange={handleInputChange} /></td></tr>
                <tr><td className="font-bold p-2 border border-gray-200 bg-gray-50">العميل (المستأجر):</td><td className="p-2 border border-gray-200"><InputField id="client_name" value={formData.client_name} onChange={handleInputChange} /></td></tr>
                <tr><td className="font-bold p-2 border border-gray-200 bg-gray-50">موقع العمل:</td><td className="p-2 border border-gray-200"><InputField id="project_location" value={formData.project_location} onChange={handleInputChange} /></td></tr>
                <tr><td className="font-bold p-2 border border-gray-200 bg-gray-50">رقم عقد المعدات:</td><td className="p-2 border border-gray-200"><InputField id="equipment_contract_id" value={formData.equipment_contract_id} onChange={handleInputChange} /></td></tr>
                <tr><td className="font-bold p-2 border border-gray-200 bg-gray-50">رقم عقد العمالة:</td><td className="p-2 border border-gray-200"><InputField id="labor_contract_id" value={formData.labor_contract_id} onChange={handleInputChange} /></td></tr>
            </tbody>
        </table>
        <h3 className="font-bold text-lg mb-4">قائمة التحقق من المتطلبات المسبقة:</h3>
        <p>يقر ممثل الطرف الثاني (المستأجر) بصحة البنود التالية وجاهزيتها قبل بدء الأعمال:</p>
        <table className="w-full my-4 border-collapse text-sm">
             <thead className="bg-gray-50"><tr><th className="p-2 border border-gray-200 text-right">البند</th><th className="p-2 border border-gray-200 w-24">تم التحقق</th></tr></thead>
             <tbody>
                <ChecklistItem label="تم توفير مسار آمن وواضح لوصول وتفريغ المعدات." id="check_site_access" formData={formData} onChange={handleInputChange} />
                <ChecklistItem label="تم الحصول على جميع التصاريح اللازمة للعمل من الجهات المختصة." id="check_permits" formData={formData} onChange={handleInputChange} />
                <ChecklistItem label="تم سداد الدفعة الأولى المستحقة من قيمة الإيجار حسب العقد." id="check_payment" formData={formData} onChange={handleInputChange} />
                <ChecklistItem label="الموقع آمن وخالٍ من أي عوائق قد تعرض العمال أو المعدات للخطر." id="check_safety" formData={formData} onChange={handleInputChange} />
             </tbody>
        </table>
        <p className="pt-6 font-semibold">بناءً على ما سبق، وبناءً على العقود المبرمة بين الطرفين، نقر نحن الموقعين أدناه باستيفاء كافة المتطلبات المسبقة، وعليه يعتبر تاريخ اليوم هو تاريخ البدء الفعلي للأعمال وفترة الإيجار.</p>
        <div className="font-bold mt-4">تاريخ بدء الأعمال: <InputField id="commencement_date" type="date" value={formData.commencement_date} onChange={handleInputChange} /></div>
        <footer className="mt-24 pt-8"><div className="flex flex-col md:flex-row justify-around items-stretch gap-12 mb-12 signature-container"><SignatureBox title="ممثل المؤجر" /><SignatureBox title="ممثل المستأجر" /></div></footer>
    </>
);

const ClaimNote = ({ formData, handleInputChange, materials }) => {
    const equipmentCost = parseFloat(formData.claim_equipment_cost || 0);
    const laborCost = parseFloat(formData.claim_labor_cost || 0);
    const damageCost = parseFloat(formData.claim_damage_cost || 0);

    const subtotal = equipmentCost + laborCost + damageCost;
    const vat = subtotal * 0.15;
    const total = subtotal + vat;

    return (
        <>
            <AppHeader />
            <h2 className="text-2xl font-bold text-center mb-10">مطالبة مالية / مستخلص أعمال</h2>
            <table className="w-full mb-8 border-collapse text-sm">
                <tbody>
                    <tr>
                        <td className="font-bold p-2 border border-gray-200 bg-gray-50 w-1/4">إلى السيد/ة:</td>
                        <td className="p-2 border border-gray-200 w-3/4">{formData.client_name || '.....................'}</td>
                    </tr>
                    <tr>
                        <td className="font-bold p-2 border border-gray-200 bg-gray-50">المشروع:</td>
                        <td className="p-2 border border-gray-200">{formData.project_name || '.....................'}</td>
                    </tr>
                    <tr>
                        <td className="font-bold p-2 border border-gray-200 bg-gray-50">رقم المطالبة:</td>
                        <td className="p-2 border border-gray-200"><InputField id="claim_id" value={formData.claim_id} onChange={handleInputChange} /></td>
                    </tr>
                    <tr>
                        <td className="font-bold p-2 border border-gray-200 bg-gray-50">تاريخ المطالبة:</td>
                        <td className="p-2 border border-gray-200"><InputField id="claim_date" type="date" value={formData.claim_date} onChange={handleInputChange} /></td>
                    </tr>
                </tbody>
            </table>
            <h3 className="font-bold text-lg mb-4">تفاصيل المستخلص:</h3>
            <table className="w-full mb-8 border-collapse text-sm">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="p-2 border border-gray-200 text-right">البند</th>
                        <th className="p-2 border border-gray-200 text-left">المبلغ (ر.س)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td className="p-2 border border-gray-200 text-right">قيمة إيجار المعدات (شهري)</td><td className="p-2 border border-gray-200 text-left"><InputField id="claim_equipment_cost" type="number" value={formData.claim_equipment_cost} onChange={handleInputChange} /></td></tr>
                    <tr><td className="p-2 border border-gray-200 text-right">قيمة أعمال العمالة (تركيب وفك)</td><td className="p-2 border border-gray-200 text-left"><InputField id="claim_labor_cost" type="number" value={formData.claim_labor_cost} onChange={handleInputChange} /></td></tr>
                    <tr><td className="p-2 border border-gray-200 text-right">قيمة تعويض النواقص والتلفيات</td><td className="p-2 border border-gray-200 text-left"><InputField id="claim_damage_cost" type="number" value={formData.claim_damage_cost} onChange={handleInputChange} /></td></tr>
                    <tr className="font-bold bg-gray-100">
                        <td className="p-2 border border-gray-200 text-right">المجموع الفرعي</td>
                        <td className="p-2 border border-gray-200 text-left">{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                        <td className="p-2 border border-gray-200 text-right">ضريبة القيمة المضافة (15%)</td>
                        <td className="p-2 border border-gray-200 text-left">{vat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                    <tr className="font-bold text-lg bg-blue-100">
                        <td className="p-3 border border-gray-200 text-right">الإجمالي المستحق للدفع</td>
                        <td className="p-3 border border-gray-200 text-left">{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                </tbody>
            </table>
             <h3 className="font-bold text-lg mb-4">معلومات الدفع:</h3>
             <div className="flex items-center"><strong>اسم البنك:</strong> <InputField id="bank_name" value={formData.bank_name} onChange={handleInputChange} /></div>
             <p><strong>صاحب الحساب:</strong> شركة أعمال الشاهين للمقاولات</p>
             <div className="flex items-center"><strong>رقم الآيبان:</strong> <InputField id="iban" value={formData.iban} onChange={handleInputChange} /></div>
            <footer className="mt-24 pt-8"><div className="flex flex-col md:flex-row justify-around items-stretch gap-12 mb-12 signature-container"><SignatureBox title="إعداد: شركة أعمال الشاهين" /><SignatureBox title="اعتماد: العميل / الاستشاري" /></div></footer>
        </>
    );
};

const DeliveryNote = ({ formData, handleInputChange, materials, isInvoiceView }) => {
    const displayedMaterials = isInvoiceView ? materials.filter(item => formData[`quantity_${item.id}`] && Number(formData[`quantity_${item.id}`]) > 0) : materials;
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
            <div className="overflow-x-auto"><table className="w-full text-sm text-right text-gray-600 border-collapse"><thead className="text-xs text-gray-700 uppercase bg-gray-100"><tr><th className="p-3 border border-gray-300 w-12">م</th><th className="p-3 border border-gray-300">بيان</th><th className="p-3 border border-gray-300">الوحدة</th><th className="p-3 border border-gray-300 w-24">الكمية</th><th className="p-3 border border-gray-300">ملاحظات</th></tr></thead><tbody>{displayedMaterials.map((item, index) => (<MaterialRow key={item.id} item={item} index={index} formData={formData} onChange={handleInputChange} readOnly={isInvoiceView} />))}</tbody></table></div>
            <footer className="mt-24 pt-8"><div className="flex flex-col md:flex-row justify-around items-stretch gap-12 mb-12 signature-container"><SignatureBox title="المسلِّم (الرئيس التنفيذي)" name="بِشر شاهين" /><SignatureBox title="المستلم" /></div><div className="text-center mt-8 pt-4 border-t border-gray-200 legal-note"><p className="text-xs text-gray-500">هذه الورقة من حق شركة أعمال الشاهين الإحتفاظ بها والمطالبة بالعدة كاملة بالعدد كامل, وفي حال النقص أو التلف يتم التعويض بسعر السوق الجديد للحديد.</p></div></footer>
        </>
    );
};

const ReturnNote = ({ formData, handleInputChange, materials }) => (
    <>
        <AppHeader />
        <h2 className="text-2xl font-bold text-center mb-6">محضر إعادة استلام وفحص المعدات</h2>
        <div className="grid grid-cols-2 gap-4 mb-8">
             <div><strong>اسم المشروع:</strong> <InputField id="project_name" value={formData.project_name} onChange={handleInputChange} /></div>
            <div><strong>العميل (المستأجر):</strong> <InputField id="client_name" value={formData.client_name} onChange={handleInputChange} /></div>
            <div><strong>تاريخ الإعادة:</strong> <InputField id="return_date" type="date" value={formData.return_date} onChange={handleInputChange} /></div>
            <div><strong>رقم العقد المرجعي:</strong> <InputField id="equipment_contract_id" value={formData.equipment_contract_id} onChange={handleInputChange} /></div>
        </div>
        <p className="mb-4">بموجبه، يتم إثبات إعادة استلام المعدات الموضحة أدناه من المستأجر. يقر الطرفان بالكميات والحالة المذكورة، والتي ستكون أساس المحاسبة النهائية لأي نقص أو تلف.</p>
        <div className="overflow-x-auto"><table className="w-full text-sm text-right text-gray-600 border-collapse"><thead className="text-xs text-gray-700 uppercase bg-gray-100"><tr><th className="p-3 border border-gray-300">بيان</th><th className="p-3 border border-gray-300">الكمية المستلمة أساساً</th><th className="p-3 border border-gray-300">الكمية المرتجعة</th><th className="p-3 border border-gray-300">النقص / التالف</th><th className="p-3 border border-gray-300">ملاحظات الفحص</th></tr></thead><tbody>{materials.map((item, index) => (<tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}><td className="p-2 border border-gray-300">{item.type}</td><td className="p-2 border border-gray-300"><input type="number" value={formData[`quantity_${item.id}`] || ''} readOnly className="w-full p-1 bg-gray-100 text-center" /></td><td className="p-2 border border-gray-300"><input type="number" value={formData[`returned_${item.id}`] || ''} onChange={(e) => handleInputChange(`returned_${item.id}`, e.target.value)} className="w-full p-1 text-center" /></td><td className="p-2 border border-gray-300"><input type="number" value={formData[`damaged_${item.id}`] || ''} onChange={(e) => handleInputChange(`damaged_${item.id}`, e.target.value)} className="w-full p-1 text-center" /></td><td className="p-2 border border-gray-300"><input type="text" value={formData[`inspection_notes_${item.id}`] || ''} onChange={(e) => handleInputChange(`inspection_notes_${item.id}`, e.target.value)} className="w-full p-1" /></td></tr>))}</tbody></table></div>
        <footer className="mt-24 pt-8"><div className="flex flex-col md:flex-row justify-around items-stretch gap-12 mb-12 signature-container"><SignatureBox title="ممثل المؤجر (المُستلِم)" /><SignatureBox title="ممثل المستأجر (المُسلِّم)" /></div></footer>
    </>
);

const DocumentSuite = () => {
    const [db, setDb] = useState(null);
    const [userId, setUserId] = useState(null);
    const [formData, setFormData] = useState({});
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [activeDocument, setActiveDocument] = useState('equipmentContract');
    const [isInvoiceView, setIsInvoiceView] = useState(false);
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    const ALL_MATERIALS = [
        { id: 1, type: 'قائم 3م', unit: 'قطعة', price: 50 }, { id: 2, type: 'قائم 2.5م', unit: 'قطعة', price: 45 }, { id: 3, type: 'قائم 2م', unit: 'قطعة', price: 40 }, { id: 4, type: 'قائم 1.5م', unit: 'قطعة', price: 35 }, { id: 5, type: 'قائم 1م', unit: 'قطعة', price: 30 }, { id: 6, type: 'لدجر 1.8م', unit: 'قطعة', price: 25 }, { id: 7, type: 'لدجر 1.5م', unit: 'قطعة', price: 22 }, { id: 8, type: 'لدجر 1.60م', unit: 'قطعة', price: 23 }, { id: 9, type: 'لدجر 1.00م', unit: 'قطعة', price: 20 }, { id: 10, type: 'لدجر 1.25م', unit: 'قطعة', price: 21 }, { id: 11, type: 'لدجر 0.9م', unit: 'قطعة', price: 18 }, { id: 12, type: 'لدجر 1.2م', unit: 'قطعة', price: 20 }, { id: 13, type: 'لدجر 0.8م', unit: 'قطعة', price: 17 }, { id: 14, type: 'لدجر 0.6م', unit: 'قطعة', price: 15 }, { id: 15, type: 'يوهد', unit: 'قطعة', price: 30 }, { id: 16, type: 'ميزانيه', unit: 'قطعة', price: 35 }, { id: 17, type: 'دوكا المنيوم', unit: 'قطعة', price: 150 }, { id: 18, type: 'وصلات', unit: 'قطعة', price: 10 }, { id: 19, type: 'ماسورة', unit: 'قطعة', price: 20 }, { id: 20, type: 'كلامب', unit: 'قطعة', price: 12 }, { id: 21, type: 'بليتة تثبيت', unit: 'قطعة', price: 15 }, { id: 22, type: 'لوح بوندي 4م', unit: 'قطعة', price: 80 }
    ];

    useEffect(() => {
        let firebaseConfigString = null;
        if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_FIREBASE_CONFIG) {
            firebaseConfigString = process.env.REACT_APP_FIREBASE_CONFIG;
        } else if (typeof __firebase_config !== 'undefined') {
            firebaseConfigString = __firebase_config;
        }
        const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
        if (!firebaseConfigString) { console.error("Firebase config missing."); return; }
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
                            if (initialAuthToken) await signInWithCustomToken(auth, initialAuthToken);
                            else await signInAnonymously(auth);
                        } catch (error) { console.error("Auth failed:", error); }
                    };
                    authenticate();
                }
            });
        } catch (error) { console.error("Firebase init error:", error); }
    }, []);

    useEffect(() => {
        if (!isAuthReady || !db || !userId) return;
        const docRef = doc(db, 'artifacts', appId, 'users', userId, 'scaffoldingDocs', 'main');
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) setFormData(docSnap.data());
            else setDoc(docRef, {});
        }, (error) => console.error("Snapshot error:", error));
        return () => unsubscribe();
    }, [isAuthReady, db, userId, appId]);

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
            case 'equipmentContract': return <RentalContract formData={formData} handleInputChange={handleInputChange} />;
            case 'laborContract': return <LaborContract formData={formData} handleInputChange={handleInputChange} />;
            case 'commencement': return <CommencementNote formData={formData} handleInputChange={handleInputChange} />;
            case 'returnNote': return <ReturnNote formData={formData} handleInputChange={handleInputChange} materials={ALL_MATERIALS} />;
            case 'claimNote': return <ClaimNote formData={formData} handleInputChange={handleInputChange} materials={ALL_MATERIALS} />;
            case 'deliveryNote': default: return <DeliveryNote formData={formData} handleInputChange={handleInputChange} materials={ALL_MATERIALS} isInvoiceView={isInvoiceView} />;
        }
    };

    return (
        <>
            <div className="max-w-5xl mx-auto mb-6 no-print">
                <div className="bg-white p-2 rounded-lg shadow-md flex justify-center flex-wrap gap-2">
                    <SubNavButton text="عقد المعدات" onClick={() => setActiveDocument('equipmentContract')} isActive={activeDocument === 'equipmentContract'} />
                    <SubNavButton text="عقد العمالة" onClick={() => setActiveDocument('laborContract')} isActive={activeDocument === 'laborContract'} />
                    <SubNavButton text="محضر بدء أعمال" onClick={() => setActiveDocument('commencement')} isActive={activeDocument === 'commencement'} />
                    <SubNavButton text="سند تسليم" onClick={() => setActiveDocument('deliveryNote')} isActive={activeDocument === 'deliveryNote'} />
                    <SubNavButton text="محضر إعادة استلام" onClick={() => setActiveDocument('returnNote')} isActive={activeDocument === 'returnNote'} />
                    <SubNavButton text="مطالبة مالية" onClick={() => setActiveDocument('claimNote')} isActive={activeDocument === 'claimNote'} />
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
        </>
    );
};

const AdvancedScaffoldingCalculator = () => {
    const [formData, setFormData] = useState({ projectName: "", clientName: "", clientPhone: "", clientEmail: "", projectType: "", area: "", height: "", floors: "", scaffoldingType: "", duration: "", installation: false, tuvRequired: false, inspection: false, maintenance: false, transport: false });
    const [result, setResult] = useState(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [errors, setErrors] = useState({});

    const projectTypes = [{ value: "residential", label: "مشروع سكني", multiplier: 1.0 }, { value: "commercial", label: "مشروع تجاري", multiplier: 1.2 }, { value: "industrial", label: "مشروع صناعي", multiplier: 1.4 }, { value: "infrastructure", label: "مشروع بنية تحتية", multiplier: 1.6 }];
    const scaffoldingTypes = [{ value: "cuplock", label: "Cup Lock", pricePerSqm: 25 }, { value: "frame", label: "Frame System", pricePerSqm: 22 }, { value: "ringlock", label: "Ring Lock", pricePerSqm: 28 }, { value: "kwikstage", label: "Kwikstage", pricePerSqm: 30 }];

    const validateForm = () => {
        const newErrors = {};
        if (!formData.projectName.trim()) newErrors.projectName = "اسم المشروع مطلوب";
        if (!formData.clientName.trim()) newErrors.clientName = "اسم العميل مطلوب";
        if (!formData.clientPhone.trim()) newErrors.clientPhone = "رقم الهاتف مطلوب";
        if (!formData.area || Number(formData.area) <= 0) newErrors.area = "المساحة يجب أن تكون أكبر من صفر";
        if (!formData.height || Number(formData.height) <= 0) newErrors.height = "الارتفاع يجب أن يكون أكبر من صفر";
        if (!formData.projectType) newErrors.projectType = "نوع المشروع مطلوب";
        if (!formData.scaffoldingType) newErrors.scaffoldingType = "نوع الشدة مطلوب";
        if (!formData.duration || Number(formData.duration) <= 0) newErrors.duration = "مدة الاستخدام مطلوبة";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const calculateCost = () => {
        if (!validateForm()) return;
        setIsCalculating(true);
        setTimeout(() => {
            const area = Number(formData.area);
            const height = Number(formData.height);
            const duration = Number(formData.duration);
            const projectType = projectTypes.find(p => p.value === formData.projectType);
            const scaffoldingType = scaffoldingTypes.find(s => s.value === formData.scaffoldingType);
            if (!projectType || !scaffoldingType) return;
            let basePrice = area * scaffoldingType.pricePerSqm * projectType.multiplier;
            if (height > 10) basePrice *= (1 + (height - 10) * 0.05);
            const installationCost = formData.installation ? basePrice * 0.3 : 0;
            const tuvCertification = formData.tuvRequired ? 5000 : 0;
            let additionalServices = 0;
            if (formData.inspection) additionalServices += 2000;
            if (formData.maintenance) additionalServices += basePrice * 0.1;
            if (formData.transport) additionalServices += 1500;
            const subtotal = basePrice + installationCost + tuvCertification + additionalServices;
            const vat = subtotal * 0.15;
            const total = subtotal + vat;
            setResult({ totalArea: area, scaffoldingType: scaffoldingType.label, basePrice, installationCost, tuvCertification, additionalServices, subtotal, vat, total, duration });
            setIsCalculating(false);
        }, 1000);
    };

    const handleSendWhatsApp = () => {
        if (!result) return;
        const message = `
🏗️ عرض سعر الشدات المعدنية
📋 بيانات المشروع:
• اسم المشروع: ${formData.projectName}
• العميل: ${formData.clientName}
• الهاتف: ${formData.clientPhone}
• نوع المشروع: ${projectTypes.find(p => p.value === formData.projectType)?.label}
📐 المواصفات:
• المساحة: ${result.totalArea} م²
• الارتفاع: ${formData.height} متر
• نوع الشدة: ${result.scaffoldingType}
• مدة الاستخدام: ${result.duration} شهر
💰 تفاصيل التكلفة:
• التكلفة الأساسية: ${result.basePrice.toLocaleString()} ر.س
• تكلفة التركيب: ${result.installationCost.toLocaleString()} ر.س
• شهادة TUV: ${result.tuvCertification.toLocaleString()} ر.س
• خدمات إضافية: ${result.additionalServices.toLocaleString()} ر.س
• المجموع قبل الضريبة: ${result.subtotal.toLocaleString()} ر.س
• ضريبة القيمة المضافة: ${result.vat.toLocaleString()} ر.س
• المجموع النهائي: ${result.total.toLocaleString()} ر.س
📞 للمتابعة والحجز، نرجو التواصل معنا`.trim();
        const phoneNumber = "966558203077";
        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }));
    };

    return (
        <div className="container mx-auto px-4">
            <div className="text-center mb-16">
                <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">حاسبة الشدات المعدنية المتقدمة</h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">احصل على عرض سعر دقيق ومفصل لمشروعك مع جميع التكاليف والخدمات الإضافية</p>
            </div>
            <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8">
                <div className="bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-lg">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg p-4"><h3 className="font-bold text-lg flex items-center gap-2"><Calculator size={20}/> بيانات المشروع</h3></div>
                    <div className="p-6 space-y-6">
                        <div className="grid md:grid-cols-2 gap-4">
                            <InputField label="اسم المشروع *" id="projectName" placeholder="مثال: برج الأعمال التجاري" value={formData.projectName} onChange={(id, val) => handleInputChange(id, val)} error={errors.projectName} />
                            <InputField label="اسم العميل *" id="clientName" placeholder="الاسم الكامل" value={formData.clientName} onChange={(id, val) => handleInputChange(id, val)} error={errors.clientName} />
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <InputField label="رقم الهاتف *" id="clientPhone" placeholder="05xxxxxxxx" value={formData.clientPhone} onChange={(id, val) => handleInputChange(id, val)} error={errors.clientPhone} />
                            <InputField label="البريد الإلكتروني" id="clientEmail" type="email" placeholder="example@email.com" value={formData.clientEmail} onChange={(id, val) => handleInputChange(id, val)} />
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <SelectField label="نوع المشروع *" id="projectType" value={formData.projectType} onValueChange={(val) => handleInputChange("projectType", val)} options={projectTypes} placeholder="اختر نوع المشروع" error={errors.projectType} />
                            <SelectField label="نوع الشدة *" id="scaffoldingType" value={formData.scaffoldingType} onValueChange={(val) => handleInputChange("scaffoldingType", val)} options={scaffoldingTypes.map(s => ({ ...s, label: `${s.label} - ${s.pricePerSqm} ر.س/م²` }))} placeholder="اختر نوع الشدة" error={errors.scaffoldingType} />
                        </div>
                        <div className="grid md:grid-cols-3 gap-4">
                            <InputField label="المساحة (م²) *" id="area" type="number" placeholder="500" value={formData.area} onChange={(id, val) => handleInputChange(id, val)} error={errors.area} />
                            <InputField label="الارتفاع (متر) *" id="height" type="number" placeholder="15" value={formData.height} onChange={(id, val) => handleInputChange(id, val)} error={errors.height} />
                            <InputField label="مدة الاستخدام (شهر) *" id="duration" type="number" placeholder="6" value={formData.duration} onChange={(id, val) => handleInputChange(id, val)} error={errors.duration} />
                        </div>
                        <div>
                            <label className="text-base font-semibold mb-4 block">الخدمات الإضافية</label>
                            <div className="grid md:grid-cols-2 gap-4">
                                <CheckboxField label="تركيب الشدات" id="installation" checked={formData.installation} onCheckedChange={(val) => handleInputChange("installation", val)} />
                                <CheckboxField label="شهادة TUV" id="tuvRequired" checked={formData.tuvRequired} onCheckedChange={(val) => handleInputChange("tuvRequired", val)} />
                                <CheckboxField label="فحص دوري" id="inspection" checked={formData.inspection} onCheckedChange={(val) => handleInputChange("inspection", val)} />
                                <CheckboxField label="صيانة دورية" id="maintenance" checked={formData.maintenance} onCheckedChange={(val) => handleInputChange("maintenance", val)} />
                                <CheckboxField label="النقل والتوصيل" id="transport" checked={formData.transport} onCheckedChange={(val) => handleInputChange("transport", val)} />
                            </div>
                        </div>
                        <button onClick={calculateCost} disabled={isCalculating} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg py-3 rounded-lg flex items-center justify-center">
                            {isCalculating ? 'جاري الحساب...' : 'احسب التكلفة'}
                        </button>
                    </div>
                </div>
                {result ? (
                    <div className="bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-lg">
                        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg p-4"><h3 className="font-bold text-lg flex items-center gap-2"><CheckCircle size={20}/> عرض السعر المفصل</h3></div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-2">
                                <ResultRow label="التكلفة الأساسية" value={result.basePrice} />
                                {result.installationCost > 0 && <ResultRow label="تكلفة التركيب" value={result.installationCost} />}
                                {result.tuvCertification > 0 && <ResultRow label="شهادة TUV" value={result.tuvCertification} />}
                                {result.additionalServices > 0 && <ResultRow label="خدمات إضافية" value={result.additionalServices} />}
                                <ResultRow label="المجموع قبل الضريبة" value={result.subtotal} isSubtotal />
                                <ResultRow label="ضريبة القيمة المضافة (15%)" value={result.vat} />
                            </div>
                            <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl p-4 flex justify-between items-center">
                                <span className="text-xl font-bold">المجموع النهائي</span>
                                <span className="text-2xl font-bold text-green-600">{result.total.toLocaleString()} ر.س</span>
                            </div>
                            <div className="space-y-3 pt-4">
                                <button onClick={handleSendWhatsApp} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg flex items-center justify-center"><Send className="w-4 h-4 ml-2" />إرسال عبر واتساب</button>
                                <button onClick={() => window.print()} className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg flex items-center justify-center"><Printer className="w-4 h-4 ml-2" />طباعة</button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-lg flex items-center justify-center p-12 text-center">
                        <div>
                            <Calculator className="w-24 h-24 text-gray-300 mx-auto mb-6" />
                            <h3 className="text-xl font-bold text-gray-600 mb-2">ادخل بيانات المشروع</h3>
                            <p className="text-gray-500">املأ النموذج على اليمين للحصول على عرض سعر مفصل</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Main App Component ---
export default function App() {
    // --- State Management ---
    const [activeView, setActiveView] = useState('documents'); // 'documents' or 'calculator'

    return (
        <>
            <PrintStyles />
            <div dir="rtl" className="bg-gray-100 min-h-screen p-4 sm:p-8" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                
                <div className="max-w-6xl mx-auto mb-6 no-print">
                    <div className="bg-white p-2 rounded-lg shadow-md flex justify-center flex-wrap gap-2">
                        <NavButton text="منظومة المستندات" icon={<FileText size={16} />} onClick={() => setActiveView('documents')} isActive={activeView === 'documents'} />
                        <NavButton text="حاسبة التسعير" icon={<Calculator size={16} />} onClick={() => setActiveView('calculator')} isActive={activeView === 'calculator'} />
                    </div>
                </div>

                {activeView === 'documents' ? <DocumentSuite /> : <AdvancedScaffoldingCalculator />}

            </div>
        </>
    );
}
