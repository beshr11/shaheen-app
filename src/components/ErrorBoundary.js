import React from 'react';

/**
 * مكون معالجة الأخطاء - يلتقط الأخطاء في React ويعرض واجهة مستخدم بديلة
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    /**
     * التقاط الأخطاء وتحديث حالة المكون
     * @param {Error} error - الخطأ المرفوع
     * @param {Object} errorInfo - معلومات إضافية عن الخطأ
     */
    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    /**
     * معالجة الأخطاء وتسجيلها
     * @param {Error} error - الخطأ المرفوع
     * @param {Object} errorInfo - معلومات إضافية عن الخطأ
     */
    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
        
        // تسجيل الخطأ في وحدة التحكم
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    /**
     * إعادة تعيين حالة الخطأ
     */
    resetError = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4" dir="rtl">
                    <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
                        <div className="text-center mb-6">
                            <div className="text-6xl mb-4">⚠️</div>
                            <h1 className="text-2xl font-bold text-gray-800 mb-2">
                                عذراً، حدث خطأ غير متوقع
                            </h1>
                            <p className="text-gray-600">
                                نعتذر للإزعاج. حدث خطأ أثناء تشغيل التطبيق.
                            </p>
                        </div>

                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                            <h3 className="font-semibold text-red-800 mb-2">تفاصيل الخطأ:</h3>
                            <div className="text-sm text-red-700 font-mono bg-white p-3 rounded border overflow-auto max-h-32">
                                {this.state.error && this.state.error.toString()}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={this.resetError}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                المحاولة مرة أخرى
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                إعادة تحميل الصفحة
                            </button>
                        </div>

                        <div className="mt-6 text-center text-sm text-gray-500">
                            <p>إذا استمر الخطأ، يرجى التواصل مع الدعم التقني.</p>
                            <p className="mt-2">
                                <strong>رقم الخطأ:</strong> {Date.now()}
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;