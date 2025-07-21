# وكيل مستندات أعمال الشاهين

نظام ذكي متكامل لإدارة المستندات والعقود لشركة أعمال الشاهين للمقاولات، مدعوم بالذكاء الاصطناعي وبتصميم احترافي.

![React](https://img.shields.io/badge/React-18.2.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.3.3-blue)
![Netlify](https://img.shields.io/badge/Netlify-Functions-green)
![Gemini AI](https://img.shields.io/badge/Gemini-AI-orange)

## 📋 نظرة عامة

هذا التطبيق هو نظام شامل لإدارة المستندات والعقود التجارية، مصمم خصيصاً لشركة أعمال الشاهين للمقاولات. يدمج النظام بين الواجهات التفاعلية لتعبئة المستندات والذكاء الاصطناعي لتوليد المحتوى التلقائي، مع دعم كامل للطباعة الاحترافية وحفظ البيانات الآمن.

## ✨ الميزات الرئيسية

### 🤖 الوكيل الذكي للمستندات
- **ذكاء اصطناعي متقدم**: مدعوم بـ Google Gemini AI
- **محادثة تفاعلية**: نظام أسئلة توضيحية ذكي
- **ذاكرة محادثات**: حفظ وبحث في المحادثات السابقة
- **أمان عالي**: API آمن عبر Netlify Functions

### 📄 منظومة المستندات التفاعلية
- **محضر بدء إيجار الشدات المعدنية**: نموذج متكامل مع حساب تلقائي
- **جداول المواد التفاعلية**: 22 نوع من المواد مع كميات قابلة للتعديل
- **حفظ تلقائي**: البيانات تُحفظ فوراً أثناء الكتابة
- **طباعة احترافية**: تنسيق A4 مثالي للطباعة

### 🎨 تصميم متجاوب وجميل
- **TailwindCSS**: تصميم حديث ومتجاوب
- **واجهة عربية**: دعم كامل للغة العربية واتجاه RTL
- **أيقونات احترافية**: Lucide React icons
- **ألوان شركة الشاهين**: هوية بصرية موحدة

### 🔒 أمان وموثوقية
- **متغيرات البيئة**: جميع المفاتيح آمنة
- **TypeScript**: نوع آمن ومحمي من الأخطاء
- **اختبارات شاملة**: Jest unit tests
- **معالجة الأخطاء**: نظام شامل لمعالجة الأخطاء

## 🏗️ المعمارية التقنية

### Frontend Architecture
```
src/
├── components/
│   ├── common/           # مكونات UI قابلة للإعادة
│   ├── documents/        # مكونات المستندات
│   ├── DocumentSuite.tsx # واجهة المستندات الرئيسية
│   └── EnhancedAiAgentView.tsx # الوكيل الذكي
├── utils/
│   ├── MemoryManager.ts  # إدارة ذاكرة المحادثات
│   └── materials.ts     # بيانات المواد
├── types/
│   └── index.ts         # تعريفات TypeScript
└── App.tsx              # المكون الجذر
```

### Backend Architecture
```
netlify/
└── functions/
    └── gemini.ts        # API آمن للذكاء الاصطناعي
```

### Technology Stack

| التقنية | الوصف | الغرض |
|---------|--------|--------|
| **React 18** | مكتبة واجهة المستخدم | بناء الواجهات التفاعلية |
| **TypeScript** | JavaScript مع الأنواع | أمان الكود ومنع الأخطاء |
| **TailwindCSS** | CSS framework | التصميم السريع والمتجاوب |
| **Netlify Functions** | Serverless backend | API آمن للذكاء الاصطناعي |
| **Google Gemini AI** | ذكاء اصطناعي | توليد المستندات |
| **Jest** | Testing framework | اختبار وحدات الكود |
| **Prettier** | Code formatter | تنسيق الكود |

## 🚀 التثبيت والتشغيل

### المتطلبات المسبقة
- Node.js 16+ 
- npm أو yarn
- حساب Netlify
- مفتاح Google Gemini API

### خطوات التثبيت

1. **استنساخ المستودع**
```bash
git clone https://github.com/beshr11/shaheen-app.git
cd shaheen-app
```

2. **تثبيت التبعيات**
```bash
npm install
```

3. **إعداد متغيرات البيئة**
```bash
# إنشاء ملف .env.local
REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here
```

4. **تشغيل التطوير المحلي**
```bash
npm start
```

5. **بناء الإنتاج**
```bash
npm run build
```

### نشر على Netlify

1. **ربط المستودع بـ Netlify**
   - اذهب إلى Netlify Dashboard
   - اختر "New site from Git"
   - اربط مستودع GitHub

2. **إعداد متغيرات البيئة في Netlify**
   - اذهب إلى Site settings > Environment variables
   - أضف `REACT_APP_GEMINI_API_KEY`

3. **إعدادات البناء**
   - Build command: `npm run build`
   - Publish directory: `build`

## 🧪 الاختبارات

### تشغيل الاختبارات
```bash
# تشغيل جميع الاختبارات
npm test

# تشغيل مع تقرير التغطية
npm test -- --coverage --watchAll=false

# تشغيل اختبارات محددة
npm test -- --testNamePattern="MemoryManager"
```

### أنواع الاختبارات
- **اختبارات الوحدة**: MemoryManager, Materials, UI Components
- **اختبارات التكامل**: تفاعل المكونات
- **اختبارات الواجهة**: React Testing Library

## 📁 هيكل المشروع التفصيلي

```
shaheen-app/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── __tests__/                    # اختبارات Jest
│   │   ├── MemoryManager.test.ts
│   │   ├── UIComponents.test.tsx
│   │   └── materials.test.ts
│   ├── components/
│   │   ├── common/                   # مكونات مشتركة
│   │   │   └── UIComponents.tsx
│   │   ├── documents/                # مكونات المستندات
│   │   │   └── RentalCommencementNote.tsx
│   │   ├── DocumentSuite.tsx         # واجهة المستندات
│   │   └── EnhancedAiAgentView.tsx   # الوكيل الذكي
│   ├── utils/                        # الأدوات المساعدة
│   │   ├── MemoryManager.ts          # إدارة الذاكرة
│   │   └── materials.ts              # بيانات المواد
│   ├── types/                        # تعريفات TypeScript
│   │   └── index.ts
│   ├── App.tsx                       # المكون الرئيسي
│   ├── index.tsx                     # نقطة الدخول
│   └── index.css                     # أنماط Tailwind
├── netlify/
│   └── functions/
│       └── gemini.ts                 # API Function
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── README.md
```

## 🔧 التكوين والإعدادات

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "target": "es2015",
    "strict": true,
    "jsx": "react-jsx",
    "downlevelIteration": true
  }
}
```

### TailwindCSS Configuration
```javascript
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        'arabic': ['Tajawal', 'Arial', 'sans-serif']
      }
    }
  }
}
```

## 📚 دليل الاستخدام

### للمستخدمين النهائيين

#### استخدام منظومة المستندات
1. اختر نوع المستند من القائمة العلوية
2. املأ الحقول المطلوبة
3. استخدم الجداول التفاعلية لإدخال الكميات
4. اضغط "طباعة" للحصول على نسخة مطبوعة

#### استخدام الوكيل الذكي
1. اختر نوع المستند
2. اكتب وصفاً لما تريده
3. أجب على الأسئلة التوضيحية
4. احصل على مستند مولد تلقائياً

### للمطورين

#### إضافة مستند جديد
1. أنشئ مكون جديد في `src/components/documents/`
2. أضف التعريفات في `src/types/index.ts`
3. سجل المستند في `DocumentSuite.tsx`
4. اكتب اختبارات في `src/__tests__/`

#### إضافة ميزة جديدة للوكيل الذكي
1. حدث `EnhancedAiAgentView.tsx`
2. أضف معالجة في `netlify/functions/gemini.ts`
3. حدث أنواع TypeScript
4. اكتب اختبارات شاملة

## 🛡️ الأمان والخصوصية

### حماية البيانات
- جميع البيانات تُحفظ محلياً في المتصفح
- لا يتم إرسال بيانات حساسة للخادم
- مفاتيح API محمية بمتغيرات البيئة

### أمان API
- Netlify Functions تحمي مفاتيح API
- التحقق من صحة البيانات المرسلة
- معالجة شاملة للأخطاء

## 📈 الأداء والتحسين

### تحسينات الأداء
- تجميع الكود (Code splitting)
- تحميل الصور المحسن
- ذاكرة تخزين ذكية للمحادثات

### معايير الجودة
- TypeScript للأمان النوعي
- Jest tests بتغطية عالية
- Prettier لتنسيق الكود
- ESLint لفحص الجودة

## 🤝 المساهمة

نرحب بالمساهمات! يرجى اتباع هذه الخطوات:

1. Fork المستودع
2. أنشئ فرع جديد (`git checkout -b feature/amazing-feature`)
3. اكتب كودك مع الاختبارات
4. تأكد من نجاح جميع الاختبارات
5. Commit التغييرات (`git commit -m 'Add amazing feature'`)
6. Push للفرع (`git push origin feature/amazing-feature`)
7. افتح Pull Request

## 📝 الترخيص

هذا المشروع مملوك لشركة أعمال الشاهين للمقاولات. جميع الحقوق محفوظة.

## 📞 التواصل والدعم

- **الشركة**: شركة أعمال الشاهين للمقاولات
- **الموقع**: المملكة العربية السعودية - الرياض
- **الهاتف**: +966 XX XXX XXXX
- **البريد الإلكتروني**: info@shaheen.com

للاستفسارات التقنية، يرجى فتح issue في المستودع.

---

تم تطوير هذا النظام بأعلى معايير الجودة والأمان لخدمة أعمال شركة الشاهين للمقاولات بكفاءة وفعالية.