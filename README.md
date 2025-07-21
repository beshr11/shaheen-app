# Shaheen App - Document Management System

## 🎯 Overview

Shaheen App is a sophisticated document management system designed for **Shaheen Construction Company**. It features an AI-powered document generator and a comprehensive document suite for construction rental agreements and forms.

## ✨ Features

### 🤖 AI-Powered Document Generator
- **Intelligent Document Creation**: Uses Google Gemini 1.5 Flash API for generating professional documents
- **Multi-Document Support**: Supports 7 different document types including rental agreements, employment contracts, and delivery notices
- **Arabic Language Support**: Fully localized interface and document generation in Arabic
- **Memory System**: Remembers previous conversations and learns from user patterns
- **Input Validation**: Comprehensive security measures against XSS attacks

### 📋 Document Suite
- **Rental Commencement Note**: Detailed metal scaffolding rental documentation
- **Print-Ready Formats**: Professional layouts optimized for printing
- **Form Validation**: Real-time validation and calculations
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### 🔒 Security & Performance
- **Environment Variables**: Secure API key management
- **Error Boundaries**: Graceful error handling and recovery
- **Input Sanitization**: Protection against malicious input
- **Memory Management**: Efficient localStorage usage with cleanup

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- NPM 8+

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/beshr11/shaheen-app.git
   cd shaheen-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here
   REACT_APP_FIREBASE_CONFIG=your_firebase_config_here
   ```

4. **Start development server**
   ```bash
   npm start
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Run tests with coverage:
```bash
npm test -- --coverage --watchAll=false
```

## 📦 Deployment

### Netlify Deployment

The app is configured for seamless Netlify deployment:

1. **Automatic Deployment**: Push to main branch triggers auto-deployment
2. **Environment Variables**: Configure in Netlify dashboard
3. **SPA Routing**: Configured with proper redirects
4. **Performance Optimization**: CSS/JS minification and caching headers

### Manual Deployment

```bash
npm run build
# Upload the 'build' folder to your hosting provider
```

## 🛠️ Technology Stack

- **Frontend Framework**: React 18.2.0
- **Build Tool**: Create React App
- **Styling**: TailwindCSS with typography plugin
- **Icons**: Lucide React
- **Markdown**: React Markdown for document rendering
- **Testing**: Jest + React Testing Library
- **Type Safety**: TypeScript support (partial)
- **API Integration**: Google Gemini 1.5 Flash

## 📁 Project Structure

```
shaheen-app/
├── public/              # Static assets
├── src/
│   ├── App.js          # Main application component
│   ├── App.test.js     # Test suite
│   ├── index.js        # Application entry point
│   ├── index.css       # TailwindCSS imports
│   └── setupTests.js   # Test configuration
├── .eslintrc.json      # ESLint configuration
├── tsconfig.json       # TypeScript configuration
├── netlify.toml        # Netlify deployment config
├── tailwind.config.js  # TailwindCSS configuration
└── package.json        # Dependencies and scripts
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `REACT_APP_GEMINI_API_KEY` | Google Gemini API key for AI features | Yes |
| `REACT_APP_FIREBASE_CONFIG` | Firebase configuration (if using Firebase) | Optional |

### TailwindCSS Configuration

The app uses a custom TailwindCSS configuration with:
- RTL (Right-to-Left) support for Arabic text
- Typography plugin for markdown rendering
- Custom color scheme
- Responsive breakpoints

## 🔐 Security Features

1. **Input Sanitization**: Removes dangerous HTML/JS content
2. **Environment Variables**: Sensitive data not hardcoded
3. **Error Boundaries**: Prevents app crashes from propagating
4. **Content Security**: XSS protection measures
5. **Input Validation**: Length and format validation

## 🎨 Accessibility Features

- **ARIA Labels**: Comprehensive labeling for screen readers
- **Keyboard Navigation**: Full keyboard accessibility
- **Focus Management**: Proper focus indicators
- **Semantic HTML**: Meaningful HTML structure
- **Color Contrast**: WCAG compliant color schemes

## 📊 Performance Optimizations

- **Code Splitting**: Lazy loading of components
- **Bundle Optimization**: Minimized production builds
- **Caching Strategy**: Proper cache headers for static assets
- **Image Optimization**: Optimized images and icons
- **Memory Management**: Efficient state management

## 🌍 Internationalization

- **Arabic Language**: Full Arabic interface
- **RTL Layout**: Right-to-left text direction
- **Cultural Adaptation**: Saudi Arabia specific formatting
- **Date/Time**: Arabic locale formatting

## 🐛 Known Issues & Limitations

1. **API Rate Limits**: Gemini API has usage quotas
2. **Browser Support**: Modern browsers only (ES6+)
3. **Offline Mode**: Currently requires internet connection
4. **Print Scaling**: Some browsers may scale print differently

## 🔄 Recent Improvements (v1.1.0)

### ✅ Critical Fixes
- Fixed syntax error in ReactMarkdown import
- Resolved broken filter chain in getSimilarConversations method
- Fixed build compilation issues
- Removed duplicate and corrupted code sections

### ✅ Security Enhancements
- Moved API key to environment variables
- Added input validation and sanitization
- Implemented XSS protection measures
- Added error boundaries for graceful error handling

### ✅ Performance & Quality
- Added TypeScript configuration
- Set up comprehensive testing framework
- Implemented accessibility improvements (ARIA labels)
- Added ESLint configuration for code quality

### ✅ Deployment Ready
- Created Netlify deployment configuration
- Added production build optimizations
- Set up proper caching strategies
- Added performance monitoring

## 🚧 Future Roadmap

### Phase 2: Enhanced Features
- [ ] Complete TypeScript migration
- [ ] Real-time collaboration features
- [ ] Advanced document templates
- [ ] Document versioning system

### Phase 3: Advanced Integrations
- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] User authentication system
- [ ] Role-based access control
- [ ] API endpoints for external integration

### Phase 4: Mobile & PWA
- [ ] Progressive Web App features
- [ ] Mobile-first responsive design
- [ ] Offline document creation
- [ ] Push notifications

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software owned by **Shaheen Construction Company**.

## 📞 Support

For support and questions:
- **Email**: info@shaheen.com
- **Phone**: +966 XX XXX XXXX
- **Location**: Riyadh, Saudi Arabia

---

## Arabic Summary (الملخص العربي)

### نظام إدارة المستندات - تطبيق شاهين

تطبيق شاهين هو نظام متطور لإدارة المستندات مصمم خصيصاً لشركة أعمال الشاهين للمقاولات. يتميز التطبيق بمولد مستندات ذكي مدعوم بالذكاء الاصطناعي ومجموعة شاملة من النماذج والعقود.

#### الميزات الرئيسية:
- **مولد مستندات ذكي**: يستخدم تقنية Google Gemini لإنشاء مستندات احترافية
- **دعم اللغة العربية**: واجهة مترجمة بالكامل مع دعم الكتابة من اليمين إلى اليسار
- **أمان متقدم**: حماية من الثغرات الأمنية وتشفير البيانات
- **تصميم متجاوب**: يعمل بسلاسة على جميع الأجهزة
- **نظام ذاكرة ذكي**: يتذكر المحادثات السابقة ويتعلم من أنماط المستخدم

#### التحسينات الحديثة:
- إصلاح الأخطاء البرمجية الحرجة
- تحسين الأمان وحماية البيانات
- إضافة اختبارات شاملة
- تحسين الأداء وسرعة التحميل
- دعم النشر الآلي على Netlify

---

Built with ❤️ in Saudi Arabia