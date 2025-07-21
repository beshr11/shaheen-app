/**
 * Main App Component
 * 
 * This is the root component of the Shaheen Contracting Business Documents System.
 * It provides a unified interface for both document management and AI-powered
 * document generation, with responsive design and professional styling.
 */

import React, { useState } from 'react';
import { FileText, Bot } from 'lucide-react';
import { ViewType } from './types';
import { NavButton, PrintStyles } from './components/common/UIComponents';
import { DocumentSuite } from './components/DocumentSuite';
import { EnhancedAiAgentView } from './components/EnhancedAiAgentView';

/**
 * Main Application Component
 */
const App: React.FC = () => {
  // State for current active view
  const [activeView, setActiveView] = useState<ViewType>('aiAgent');

  return (
    <>
      {/* Global Print Styles */}
      <PrintStyles />
      
      <div 
        dir="rtl" 
        className="bg-gray-100 min-h-screen p-4 sm:p-8" 
        style={{ fontFamily: "'Tajawal', sans-serif" }}
      >
        {/* Application Header */}
        <header className="text-center mb-8 no-print">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <img 
              src="https://i.ibb.co/bx1cZBC/image.png" 
              alt="شعار شركة أعمال الشاهين" 
              className="h-16 mx-auto mb-4" 
            />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              وكيل مستندات أعمال الشاهين
            </h1>
            <p className="text-gray-600 text-lg">
              نظام ذكي متكامل لإدارة المستندات والعقود
            </p>
            <p className="text-sm text-gray-500 mt-2">
              مدعوم بالذكاء الاصطناعي • تصميم احترافي • طباعة A4 • آمن ومحمي
            </p>
          </div>
        </header>

        {/* Navigation Menu */}
        <nav className="max-w-6xl mx-auto mb-6 no-print">
          <div className="bg-white p-2 rounded-lg shadow-md">
            <div className="flex justify-center flex-wrap gap-2">
              <NavButton 
                text="منظومة المستندات التفاعلية" 
                icon={<FileText size={16} />} 
                onClick={() => setActiveView('documents')} 
                isActive={activeView === 'documents'} 
              />
              <NavButton 
                text="الوكيل الذكي للمستندات" 
                icon={<Bot size={16} />} 
                onClick={() => setActiveView('aiAgent')} 
                isActive={activeView === 'aiAgent'} 
              />
            </div>
            
            {/* Quick Info Panel */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex flex-wrap justify-center gap-4 text-sm text-blue-700">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full ml-2"></span>
                  نظام آمن مع حفظ تلقائي
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full ml-2"></span>
                  طباعة احترافية A4
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full ml-2"></span>
                  ذكاء اصطناعي متقدم
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-orange-500 rounded-full ml-2"></span>
                  واجهة متجاوبة
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto">
          {activeView === 'documents' ? (
            <DocumentSuite />
          ) : (
            <EnhancedAiAgentView />
          )}
        </main>

        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-gray-500 no-print">
          <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-bold text-gray-700 mb-2">شركة أعمال الشاهين للمقاولات</h3>
                <p>المملكة العربية السعودية - الرياض</p>
                <p>هاتف: +966 XX XXX XXXX</p>
                <p>البريد الإلكتروني: info@shaheen.com</p>
              </div>
              
              <div>
                <h3 className="font-bold text-gray-700 mb-2">خدماتنا</h3>
                <ul className="space-y-1">
                  <li>تأجير السقالات والشدات المعدنية</li>
                  <li>توفير العمالة الفنية المتخصصة</li>
                  <li>خدمات التركيب والصيانة</li>
                  <li>استشارات تقنية وهندسية</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold text-gray-700 mb-2">النظام التقني</h3>
                <ul className="space-y-1">
                  <li>تطوير: React + TypeScript</li>
                  <li>استضافة: Netlify</li>
                  <li>الذكاء الاصطناعي: Google Gemini</li>
                  <li>التصميم: TailwindCSS</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p>
                © {new Date().getFullYear()} شركة أعمال الشاهين للمقاولات. جميع الحقوق محفوظة.
              </p>
              <p className="mt-1">
                تم تطوير هذا النظام بأعلى معايير الأمان والجودة لخدمة عملائنا الكرام
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default App;