/**
 * Netlify Function: Gemini AI Integration
 * 
 * This serverless function provides secure access to Google's Gemini API
 * without exposing the API key in client-side code. It includes proper
 * error handling, request validation, and response formatting.
 */

import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
  error?: {
    message: string;
    code: number;
  };
}

/**
 * Validate the incoming request body
 * @param body - The request body to validate
 * @returns True if valid, false otherwise
 */
const validateRequest = (body: any): body is { prompt: string; docType: string } => {
  return (
    typeof body === 'object' &&
    typeof body.prompt === 'string' &&
    typeof body.docType === 'string' &&
    body.prompt.trim().length > 0
  );
};

/**
 * Create a structured prompt for Gemini API
 * @param userPrompt - The user's prompt
 * @param docType - The document type
 * @returns Formatted prompt for AI
 */
const createStructuredPrompt = (userPrompt: string, docType: string): string => {
  return `
    مهمتك هي العمل كمستشار قانوني وتجاري خبير ومتخصص في الأنظمة السعودية لـ "شركة أعمال الشاهين للمقاولات".
    
    **المهمة الأساسية:** إنشاء مسودة احترافية للمستند المطلوب بناءً على التفاصيل التالية.
    
    **نوع المستند المطلوب:** ${docType}
    **طلب المستخدم:** ${userPrompt}
    
    **تعليمات صارمة:**
    1. ابدأ دائماً بترويسة الشركة: "# شركة أعمال الشاهين للمقاولات"
    2. استخدم تنسيق Markdown مع عناوين واضحة ومنظمة
    3. أضف البنود القانونية الضرورية حتى لو لم يذكرها المستخدم
    4. اجعل المستند جاهزاً للطباعة بتنسيق مناسب
    5. أضف قسم التواقيع في النهاية
    6. استخدم اللغة العربية الفصحى والمصطلحات القانونية الصحيحة
    7. تأكد من تضمين تاريخ اليوم والمعلومات القانونية المناسبة
    8. اجعل المستند متوافقاً مع الأنظمة السعودية
    
    أنشئ المستند كاملاً الآن:
  `.trim();
};

/**
 * Main Netlify function handler
 */
export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  try {
    // Get API key from environment variables
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY not found in environment variables');
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: 'Server configuration error', 
          details: 'API key not configured' 
        }),
      };
    }

    // Parse and validate request body
    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    let requestBody;
    try {
      requestBody = JSON.parse(event.body);
    } catch (parseError) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Invalid JSON in request body' }),
      };
    }

    if (!validateRequest(requestBody)) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: 'Invalid request format', 
          details: 'Required fields: prompt (string), docType (string)' 
        }),
      };
    }

    // Create the structured prompt
    const structuredPrompt = createStructuredPrompt(requestBody.prompt, requestBody.docType);

    // Prepare Gemini API request
    const geminiRequest: GeminiRequest = {
      contents: [{
        parts: [{
          text: structuredPrompt
        }]
      }]
    };

    // Call Gemini API
    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
    
    console.log('Calling Gemini API...');
    const response = await fetch(geminiApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(geminiRequest),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown API error' }));
      console.error('Gemini API error:', errorData);
      
      return {
        statusCode: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'AI service error',
          details: errorData.error?.message || 'Unknown error from AI service',
          status: response.status
        }),
      };
    }

    const geminiData: GeminiResponse = await response.json();

    // Validate Gemini response
    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      console.error('Invalid Gemini response:', geminiData);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'AI service returned invalid response',
          details: 'No content generated'
        }),
      };
    }

    const generatedContent = geminiData.candidates[0].content.parts[0].text;

    // Return successful response
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        content: generatedContent,
        docType: requestBody.docType,
        timestamp: new Date().toISOString()
      }),
    };

  } catch (error) {
    console.error('Function error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
    };
  }
};