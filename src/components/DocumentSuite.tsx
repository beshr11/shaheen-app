/**
 * DocumentSuite Component
 * 
 * This component provides a unified interface for all document types
 * with navigation between different document forms and professional
 * printing capabilities.
 */

import React, { useState } from 'react';
import { FileText, Printer, Edit } from 'lucide-react';
import { DocumentInfo } from '../types';
import { RentalCommencementNote } from './documents/RentalCommencementNote';

/**
 * Available documents with their components and metadata
 */
const AVAILABLE_DOCUMENTS: Record<string, DocumentInfo> = {
  rentalCommencement: {
    component: RentalCommencementNote,
    title: 'محضر بدء إيجار الشدات المعدنية',
    icon: <FileText size={16} />
  },
  // Future documents can be added here:
  // rentalContract: {
  //   component: RentalContract,
  //   title: 'عقد إيجار سقالات',
  //   icon: <FileText size={16} />
  // },
  // employmentContract: {
  //   component: EmploymentContract,
  //   title: 'عقد عمالة',
  //   icon: <FileText size={16} />
  // },
  // deliveryNote: {
  //   component: DeliveryNote,
  //   title: 'محضر تسليم واستلام',
  //   icon: <FileText size={16} />
  // },
  // financialClaim: {
  //   component: FinancialClaim,
  //   title: 'مذكرة مطالبة مالية',
  //   icon: <FileText size={16} />
  // },
  // deliveryNotice: {
  //   component: DeliveryNotice,
  //   title: 'إشعار تسليم',
  //   icon: <FileText size={16} />
  // },
  // returnInspection: {
  //   component: ReturnInspection,
  //   title: 'محضر إرجاع وفحص',
  //   icon: <FileText size={16} />
  // }
};

/**
 * DocumentSuite Component
 * Main interface for document management and generation
 */
export const DocumentSuite: React.FC = () => {
  const [activeDocument, setActiveDocument] = useState<string>('rentalCommencement');

  // Get the active document information
  const currentDocument = AVAILABLE_DOCUMENTS[activeDocument];
  const ActiveComponent = currentDocument.component;

  /**
   * Handle document navigation
   */
  const handleDocumentChange = (documentKey: string) => {
    setActiveDocument(documentKey);
  };

  /**
   * Handle print functionality
   */
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center justify-center">
          <FileText size={28} className="ml-3" />
          منظومة المستندات التفاعلية
        </h2>
        <p className="text-gray-600 mb-6">
          مجموعة شاملة من المستندات القانونية والتجارية لشركة أعمال الشاهين للمقاولات
        </p>
      </div>

      {/* Document Navigation */}
      <div className="bg-white p-4 rounded-lg shadow-md no-print">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">اختر نوع المستند:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(AVAILABLE_DOCUMENTS).map(([key, doc]) => (
            <button
              key={key}
              onClick={() => handleDocumentChange(key)}
              className={`flex items-center p-3 rounded-lg border transition-all duration-200 ${
                activeDocument === key
                  ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
              }`}
            >
              <span className="ml-3">{doc.icon}</span>
              <span className="text-sm font-medium">{doc.title}</span>
            </button>
          ))}
        </div>
        
        {/* Coming Soon Notice for Future Documents */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            📋 <strong>قريباً:</strong> المزيد من المستندات (عقود الإيجار، عقود العمالة، محاضر التسليم، وغيرها)
          </p>
        </div>
      </div>

      {/* Document Display Area */}
      <div className="bg-gray-50 p-6 rounded-lg">
        {/* Document Header with Actions */}
        <div className="flex items-center justify-between mb-6 no-print">
          <div className="flex items-center">
            {currentDocument.icon}
            <h3 className="text-xl font-bold text-gray-800 mr-3">
              {currentDocument.title}
            </h3>
          </div>
          
          <div className="flex items-center space-x-2 space-x-reverse">
            <button 
              onClick={handlePrint} 
              className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              title="طباعة المستند"
            >
              <Printer size={16} />
              <span>طباعة</span>
            </button>
            
            <button 
              className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              title="تحرير المستند"
            >
              <Edit size={16} />
              <span>تحرير</span>
            </button>
          </div>
        </div>

        {/* Document Instructions */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg no-print">
          <h4 className="font-bold text-blue-800 mb-2">📝 تعليمات الاستخدام:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• املأ جميع الحقول المطلوبة بدقة</li>
            <li>• استخدم زر "طباعة" للحصول على نسخة مطبوعة بتنسيق A4</li>
            <li>• يتم حفظ البيانات تلقائياً أثناء التعبئة</li>
            <li>• يمكنك استخدام الوكيل الذكي لإنشاء مستندات تلقائياً</li>
          </ul>
        </div>

        {/* Document Component */}
        <div className="document-container">
          <ActiveComponent />
        </div>
      </div>

      {/* Footer Information */}
      <div className="text-center text-sm text-gray-500 mt-8 no-print">
        <p>
          جميع المستندات مصممة وفقاً للأنظمة السعودية ومعايير شركة أعمال الشاهين للمقاولات
        </p>
        <p className="mt-1">
          للاستفسارات التقنية أو القانونية، يرجى التواصل مع الإدارة
        </p>
      </div>
    </div>
  );
};

/**
 * Print-specific styles for the DocumentSuite
 */
export const DocumentSuitePrintStyles: React.FC = () => (
  <style>{`
    @media print {
      .document-container {
        width: 100%;
        margin: 0;
        padding: 0;
      }
      
      .document-container > * {
        margin: 0 !important;
        padding: 20px !important;
      }
    }
  `}</style>
);