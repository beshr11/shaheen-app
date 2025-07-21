/**
 * RentalCommencementNote Component
 * 
 * This component renders the "محضر بدء إيجار الشدات المعدنية" (Rental Commencement Note)
 * document with interactive form fields and professional formatting for A4 printing.
 */

import React, { useState } from 'react';
import { RentalFormData } from '../../types';
import { MATERIALS_LIST } from '../../utils/materials';
import { InputField, CompanyHeader } from '../common/UIComponents';

/**
 * RentalCommencementNote Component
 * Interactive document for metal scaffolding rental commencement
 */
export const RentalCommencementNote: React.FC = () => {
  // Initialize form data with default values
  const [formData, setFormData] = useState<RentalFormData>({
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
    // Initialize material quantities
    ...MATERIALS_LIST.reduce((acc, item) => {
      acc[`quantity_${item.id}`] = item.defaultQuantity;
      acc[`installed_${item.id}`] = item.defaultQuantity;
      return acc;
    }, {} as Record<string, number>)
  });

  /**
   * Handle input field changes with automatic calculations
   * @param field - The field name to update
   * @param value - The new value
   */
  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Auto-calculate daily rate when monthly rate changes
      if (field === 'monthlyRate' && typeof value === 'string' && value) {
        const monthlyValue = parseFloat(value);
        if (!isNaN(monthlyValue)) {
          newData.dailyRate = (monthlyValue / 30).toFixed(2);
        }
      }
      
      return newData;
    });
  };

  return (
    <div className="printable-area bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
      {/* Company Header */}
      <CompanyHeader />
      
      <div className="contract-text space-y-6">
        {/* Document Title */}
        <h2 className="text-xl font-bold text-center text-gray-800 mb-6">
          محضر بدء إيجار الشدات المعدنية
        </h2>
        
        {/* Basic Information Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <InputField 
            label="المؤجر" 
            value={formData.lessor} 
            onChange={(value) => handleInputChange('lessor', value)} 
          />
          <InputField 
            label="المستأجر" 
            value={formData.lessee} 
            onChange={(value) => handleInputChange('lessee', value)} 
            required 
          />
          <InputField 
            label="اسم المشروع" 
            value={formData.project} 
            onChange={(value) => handleInputChange('project', value)} 
            required 
          />
          <InputField 
            label="موقع المشروع" 
            value={formData.location} 
            onChange={(value) => handleInputChange('location', value)} 
            required 
          />
          <InputField 
            label="رقم العقد" 
            value={formData.contractNumber} 
            onChange={(value) => handleInputChange('contractNumber', value)} 
            required 
          />
          <InputField 
            label="تاريخ العقد" 
            type="date" 
            value={formData.contractDate} 
            onChange={(value) => handleInputChange('contractDate', value)} 
          />
          <InputField 
            label="تاريخ التركيب" 
            type="date" 
            value={formData.installationDate} 
            onChange={(value) => handleInputChange('installationDate', value)} 
          />
          <InputField 
            label="تاريخ بدء الإيجار" 
            type="date" 
            value={formData.rentalStartDate} 
            onChange={(value) => handleInputChange('rentalStartDate', value)} 
            required 
          />
          <InputField 
            label="سعر الإيجار الشهري (ريال)" 
            value={formData.monthlyRate} 
            onChange={(value) => handleInputChange('monthlyRate', value)} 
            placeholder="أدخل السعر الشهري" 
          />
          <InputField 
            label="السعر اليومي (ريال)" 
            value={formData.dailyRate} 
            onChange={(value) => handleInputChange('dailyRate', value)} 
            placeholder="يتم حسابه تلقائياً" 
          />
          <InputField 
            label="اسم المهندس المشرف" 
            value={formData.engineerName} 
            onChange={(value) => handleInputChange('engineerName', value)} 
            required 
          />
        </div>

        {/* Installation Included Checkbox */}
        <div className="mb-4">
          <label className="flex items-center space-x-2 space-x-reverse">
            <input
              type="checkbox"
              checked={formData.installationIncluded}
              onChange={(e) => handleInputChange('installationIncluded', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">الإيجار يشمل التركيب</span>
          </label>
        </div>

        {/* Information Summary Panel */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
          <h3 className="font-bold text-blue-800 mb-2">📋 معلومات المحضر:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
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

        {/* Materials Table */}
        <h3 className="text-lg font-bold text-gray-800 mt-6 mb-4">
          جدول الشدات المعدنية المؤجرة:
        </h3>
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
                  <td className="p-2 border border-gray-300 font-medium">{item.id}</td>
                  <td className="p-2 border border-gray-300">{item.type}</td>
                  <td className="p-2 border border-gray-300">{item.unit}</td>
                  <td className="p-2 border border-gray-300">
                    <input
                      type="number"
                      min="0"
                      value={String(formData[`quantity_${item.id}`] || 0)}
                      onChange={(e) => handleInputChange(`quantity_${item.id}`, parseInt(e.target.value) || 0)}
                      className="w-full p-1 text-center border-none bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                    />
                  </td>
                  <td className="p-2 border border-gray-300">
                    <input
                      type="number"
                      min="0"
                      value={String(formData[`installed_${item.id}`] || 0)}
                      onChange={(e) => handleInputChange(`installed_${item.id}`, parseInt(e.target.value) || 0)}
                      className="w-full p-1 text-center border-none bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                    />
                  </td>
                  <td className="p-2 border border-gray-300">
                    <input
                      type="text"
                      placeholder="ملاحظات..."
                      className="w-full p-1 border-none bg-transparent text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Important Terms Section */}
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mt-6">
          <h3 className="font-bold text-yellow-800 mb-3">⚠️ شروط بدء الإيجار المهمة:</h3>
          <div className="space-y-2 text-sm text-yellow-900">
            <p>
              <strong>1. بدء الإيجار:</strong> {
                formData.installationIncluded 
                  ? 'يبدأ الإيجار بعد اكتمال التركيب' 
                  : 'يبدأ الإيجار من تاريخ التسليم'
              }
            </p>
            <p><strong>2. انتهاء الإيجار:</strong> ينتهي الإيجار عند إشعار المؤجر بالإرجاع</p>
            <p><strong>3. الشهر الثاني:</strong> يبدأ إيجار الشهر الثاني بعد 10 أيام من انتهاء الشهر الأول</p>
            <p><strong>4. الفترات الأقل من 10 أيام:</strong> تحسب باليوم (نسبة وتناسب) بنفس سعر إيجار الشهر الأول</p>
            <p><strong>5. طريقة الحساب:</strong> السعر اليومي = السعر الشهري ÷ 30 يوم</p>
            <p><strong>6. المسؤولية:</strong> المستأجر مسؤول عن المحافظة على الشدات من تاريخ بدء الإيجار</p>
          </div>
        </div>

        {/* Additional Notes */}
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

        {/* Confirmation Section */}
        <div className="bg-green-50 p-4 rounded-lg border border-green-200 mt-6">
          <h3 className="font-bold text-green-800 mb-2">✅ إقرار بدء الإيجار:</h3>
          <p className="text-sm text-green-900">
            نحن الموقعون أدناه نقر بأن إيجار الشدات المعدنية المذكورة أعلاه قد بدأ رسمياً 
            {formData.installationIncluded ? ' بعد اكتمال التركيب' : ''} 
            في تاريخ <strong>{formData.rentalStartDate || '__________'}</strong> وفقاً للشروط المتفق عليها في العقد رقم <strong>{formData.contractNumber || '__________'}</strong>.
          </p>
        </div>
      </div>

      {/* Signature Section */}
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
              <p className="text-sm text-gray-600">{formData.lessee || '___________'}</p>
              <p className="text-xs text-gray-500 mt-1">التاريخ: ___________</p>
            </div>
          </div>
          <div className="signature-box">
            <div className="text-center">
              <div className="border-b border-gray-400 mb-2 pb-8"></div>
              <p className="font-medium">توقيع المهندس المشرف</p>
              <p className="text-sm text-gray-600">{formData.engineerName || '___________'}</p>
              <p className="text-xs text-gray-500 mt-1">التاريخ: ___________</p>
            </div>
          </div>
        </div>
        
        {/* Legal Notice */}
        <div className="legal-note text-center text-xs text-gray-500 mt-4 pt-4 border-t border-gray-200">
          <p>هذا المحضر محرر في ثلاث نسخ أصلية، نسخة للمؤجر ونسخة للمستأجر ونسخة للمهندس المشرف</p>
          <p>
            تاريخ المحضر: {new Date().toLocaleDateString('ar-SA')} | 
            رقم المحضر: RC-{formData.contractNumber || 'XXXX'}-{new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
};