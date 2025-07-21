# Shaheen App - تطبيق الشاهين

تطبيق ويب ذكي لإدارة المستندات وإنشاء العقود للشدات المعدنية بواسطة الذكاء الاصطناعي.

## المميزات الرئيسية

- ✅ واجهة مستخدم عربية متجاوبة
- ✅ الوكيل الذكي لإنشاء المستندات (Gemini AI)
- ✅ منظومة إدارة الذاكرة والمحادثات
- ✅ محضر بدء إيجار الشدات المعدنية
- ✅ أمان محسن للمدخلات والبيانات
- ✅ تصميم قابل للطباعة

## الإعداد والتشغيل

### 1. تثبيت المتطلبات
```bash
npm install
```

### 2. إعداد متغيرات البيئة
إنشاء ملف `.env` في المجلد الرئيسي وإضافة:
```
REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. تشغيل التطبيق
```bash
# التطوير
npm start

# البناء للإنتاج
npm run build
```

## الأمان

- 🔒 جميع المدخلات يتم تنظيفها وتعقيمها
- 🔒 مفاتيح API محمية في متغيرات البيئة
- 🔒 حماية من XSS وHTML injection
- 🔒 تحديد طول النصوص المدخلة

## الإصلاحات المنجزة

### إصلاحات بناء الكود (Critical)
- ✅ إصلاح خطأ استيراد ReactMarkdown (Line 3)
- ✅ إصلاح return statement في getSimilarConversations (Lines 81-88)  
- ✅ إزالة المحتوى المتكرر والمعطوب من الملف
- ✅ إصلاح مشاكل browserslist في package.json

### إصلاحات الأمان
- ✅ نقل API key إلى متغيرات البيئة
- ✅ إضافة تنظيف وتعقيم للمدخلات
- ✅ حماية من XSS والHTML injection
- ✅ إنشاء ملف .env.example

### إصلاحات المنطق
- ✅ إضافة null/undefined checks في calculateSimilarity
- ✅ تحسين معالجة الأخطاء في handleSendMessage
- ✅ إضافة validation للحقول
- ✅ تحسين إدارة الذاكرة والمحادثات

## البيانات الفنية

- **Framework**: React 18.2.0
- **AI**: Google Gemini 1.5 Flash
- **Styling**: Tailwind CSS + Custom RTL
- **Icons**: Lucide React
- **Build**: Create React App

## المطور

شركة أعمال الشاهين للمقاولات