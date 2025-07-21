# Shaheen App - Document Management System

A professional React TypeScript application for Shaheen Construction Works Company that provides document generation and management capabilities for construction contracts and rental agreements.

## 🌟 Features

- **Document Suite**: Interactive forms for creating metal scaffolding rental commencement notes
- **AI-Powered Agent**: Intelligent document generation using Google Gemini API
- **Memory Management**: Conversation history and learning system
- **Responsive Design**: TailwindCSS-based responsive interface
- **Print Support**: Professional print layouts for documents
- **TypeScript**: Full type safety and enhanced development experience
- **Testing**: Comprehensive Jest test suite
- **Security**: Input validation and sanitization utilities

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/beshr11/shaheen-app.git
cd shaheen-app
```

2. Install dependencies:
```bash
npm install --legacy-peer-deps
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure environment variables:
```env
REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here
REACT_APP_FIREBASE_CONFIG=your_firebase_config_here
```

### Development

Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`

## 🛠 Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run test suite
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
├── types/              # TypeScript type definitions
├── utils/              # Utility functions and helpers
├── __tests__/          # Test files
├── App.tsx             # Main application component
├── index.tsx           # Application entry point
└── index.css           # Global styles
```

## 🧪 Testing

The project includes comprehensive testing with Jest and Testing Library:

- Unit tests for utility functions
- Type definition tests
- Memory management tests
- Component integration tests

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm test -- --coverage --watchAll=false
```

## 🔒 Security Features

- Input sanitization and validation
- Rate limiting for API calls
- Secure local storage wrapper
- XSS prevention measures
- API key validation

## 📱 Components

### Document Suite
- **Rental Commencement Note**: Interactive form for creating metal scaffolding rental documents
- **Print Support**: Professional print layouts
- **Form Validation**: Comprehensive input validation

### AI Agent
- **Intelligent Conversations**: Context-aware document generation
- **Memory System**: Conversation history and learning
- **Multiple Document Types**: Support for various contract types
- **Real-time Processing**: Live document generation

## 🎨 Styling

The application uses TailwindCSS for styling with:
- Responsive design principles
- RTL (Right-to-Left) support for Arabic content
- Professional print styles
- Consistent design system

## 🔧 Configuration

### Environment Variables

- `REACT_APP_GEMINI_API_KEY`: Google Gemini API key for AI features
- `REACT_APP_FIREBASE_CONFIG`: Firebase configuration (optional)

### TypeScript Configuration

The project uses strict TypeScript configuration with:
- Strict type checking
- Path mapping for imports
- Enhanced IDE support

### ESLint & Prettier

Code quality is maintained with:
- ESLint for code linting
- Prettier for code formatting
- Consistent code style enforcement

## 📈 Performance

- Optimized bundle size
- Lazy loading where appropriate
- Efficient memory management
- Rate limiting for API calls

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

The build artifacts will be in the `build/` directory.

### CI/CD

The project includes GitHub Actions workflow for:
- Automated testing
- Code quality checks
- Build verification
- Deployment automation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is proprietary software for Shaheen Construction Works Company.

## 📞 Support

For support and questions, please contact the development team.

## 🔄 Changelog

### v1.0.0 (Current)
- Initial TypeScript conversion
- Enhanced security features
- Comprehensive testing suite
- Modern development practices
- AI-powered document generation
- Responsive design implementation

---

Built with ❤️ for Shaheen Construction Works Company