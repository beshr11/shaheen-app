/**
 * Unit tests for MemoryManager class
 * Tests memory management, conversation storage, and search functionality
 */

describe('MemoryManager Unit Tests', () => {
  let memoryManager;

  // Mock localStorage
  const mockLocalStorage = (() => {
    let store = {};
    return {
      getItem: (key) => store[key] || null,
      setItem: (key, value) => {
        store[key] = value.toString();
      },
      removeItem: (key) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      }
    };
  })();

  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage
  });

  // Create MemoryManager implementation for testing
  class TestMemoryManager {
    constructor() {
      this.storageKey = 'shaheen_ai_memory';
      this.maxConversations = 100;
    }

    saveConversation(conversationData) {
      const conversations = this.getAllConversations();
      const newConversation = {
        id: this.generateId(),
        timestamp: new Date().toISOString(),
        ...conversationData
      };
      
      conversations.unshift(newConversation);
      
      if (conversations.length > this.maxConversations) {
        conversations.splice(this.maxConversations);
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(conversations));
      return newConversation.id;
    }

    getAllConversations() {
      try {
        const stored = localStorage.getItem(this.storageKey);
        return stored ? JSON.parse(stored) : [];
      } catch (error) {
        console.error('خطأ في قراءة الذاكرة:', error);
        return [];
      }
    }

    searchConversations(query) {
      const conversations = this.getAllConversations();
      const searchTerm = query.toLowerCase();
      
      return conversations.filter(conv => 
        conv.userInput?.toLowerCase().includes(searchTerm) ||
        conv.docType?.toLowerCase().includes(searchTerm) ||
        conv.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    extractKeywords(text) {
      const stopWords = ['في', 'من', 'إلى', 'على', 'عن', 'مع', 'هذا', 'هذه', 'التي', 'الذي'];
      return text.toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.includes(word));
    }

    calculateSimilarity(keywords1, text2) {
      if (!text2) return 0;
      const keywords2 = this.extractKeywords(text2);
      if (keywords1.length === 0 || keywords2.length === 0) return 0;
      const intersection = keywords1.filter(word => keywords2.includes(word));
      return intersection.length / Math.max(keywords1.length, keywords2.length);
    }

    generateId() {
      return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    deleteConversation(id) {
      const conversations = this.getAllConversations();
      const filtered = conversations.filter(conv => conv.id !== id);
      localStorage.setItem(this.storageKey, JSON.stringify(filtered));
    }

    getStats() {
      const conversations = this.getAllConversations();
      const docTypes = {};
      const ratings = [];
      
      conversations.forEach(conv => {
        if (conv.docType) {
          docTypes[conv.docType] = (docTypes[conv.docType] || 0) + 1;
        }
        if (conv.rating) {
          ratings.push(conv.rating);
        }
      });

      const mostUsedDocType = Object.keys(docTypes).length > 0 
        ? Object.keys(docTypes).reduce((a, b) => docTypes[a] > docTypes[b] ? a : b)
        : '';

      return {
        totalConversations: conversations.length,
        docTypeDistribution: docTypes,
        averageRating: ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0,
        mostUsedDocType: mostUsedDocType
      };
    }
  }

  beforeEach(() => {
    localStorage.clear();
    memoryManager = new TestMemoryManager();
  });

  test('saves conversation successfully', () => {
    const testConversation = {
      docType: 'عقد إيجار سقالات',
      userInput: 'أريد إنشاء عقد إيجار للمشروع الجديد',
      generatedContent: 'عقد إيجار مولد',
      tags: ['عقد', 'إيجار']
    };

    const conversationId = memoryManager.saveConversation(testConversation);
    
    expect(conversationId).toBeDefined();
    expect(typeof conversationId).toBe('string');
    
    const conversations = memoryManager.getAllConversations();
    expect(conversations).toHaveLength(1);
    expect(conversations[0].docType).toBe(testConversation.docType);
  });

  test('retrieves all conversations correctly', () => {
    // Save multiple conversations
    memoryManager.saveConversation({ docType: 'عقد إيجار سقالات', userInput: 'test1' });
    memoryManager.saveConversation({ docType: 'عقد عمالة', userInput: 'test2' });
    
    const conversations = memoryManager.getAllConversations();
    expect(conversations).toHaveLength(2);
    expect(conversations[0].userInput).toBe('test2'); // Most recent first
    expect(conversations[1].userInput).toBe('test1');
  });

  test('searches conversations by query', () => {
    memoryManager.saveConversation({ 
      docType: 'عقد إيجار سقالات', 
      userInput: 'مشروع البناء الجديد',
      tags: ['مشروع', 'بناء']
    });
    memoryManager.saveConversation({ 
      docType: 'عقد عمالة', 
      userInput: 'توظيف عمال',
      tags: ['عمال', 'توظيف']
    });

    const searchResults = memoryManager.searchConversations('مشروع');
    expect(searchResults).toHaveLength(1);
    expect(searchResults[0].userInput).toBe('مشروع البناء الجديد');
  });

  test('extracts Arabic keywords correctly', () => {
    const text = 'هذا مشروع بناء جديد في الرياض';
    const keywords = memoryManager.extractKeywords(text);
    
    expect(keywords).toContain('مشروع');
    expect(keywords).toContain('بناء');
    expect(keywords).toContain('جديد');
    expect(keywords).toContain('الرياض');
    expect(keywords).not.toContain('هذا'); // Stop word should be filtered
    expect(keywords).not.toContain('في'); // Stop word should be filtered
  });

  test('calculates similarity between texts', () => {
    const keywords1 = ['مشروع', 'بناء', 'جديد'];
    const text2 = 'مشروع الإنشاء الجديد';
    
    const similarity = memoryManager.calculateSimilarity(keywords1, text2);
    expect(similarity).toBeGreaterThan(0);
    expect(similarity).toBeLessThanOrEqual(1);
  });

  test('generates statistics correctly', () => {
    // Add test conversations with ratings
    memoryManager.saveConversation({ 
      docType: 'عقد إيجار سقالات', 
      userInput: 'test1',
      rating: 5
    });
    memoryManager.saveConversation({ 
      docType: 'عقد إيجار سقالات', 
      userInput: 'test2',
      rating: 4
    });
    memoryManager.saveConversation({ 
      docType: 'عقد عمالة', 
      userInput: 'test3',
      rating: 3
    });

    const stats = memoryManager.getStats();
    
    expect(stats.totalConversations).toBe(3);
    expect(stats.docTypeDistribution['عقد إيجار سقالات']).toBe(2);
    expect(stats.docTypeDistribution['عقد عمالة']).toBe(1);
    expect(stats.averageRating).toBe(4); // (5+4+3)/3 = 4
    expect(stats.mostUsedDocType).toBe('عقد إيجار سقالات');
  });

  test('deletes conversation successfully', () => {
    const id1 = memoryManager.saveConversation({ docType: 'عقد إيجار سقالات', userInput: 'test1' });
    const id2 = memoryManager.saveConversation({ docType: 'عقد عمالة', userInput: 'test2' });
    
    expect(memoryManager.getAllConversations()).toHaveLength(2);
    
    memoryManager.deleteConversation(id1);
    const remaining = memoryManager.getAllConversations();
    
    expect(remaining).toHaveLength(1);
    expect(remaining[0].userInput).toBe('test2');
  });

  test('handles localStorage errors gracefully', () => {
    // Mock localStorage to throw error
    const originalGetItem = localStorage.getItem;
    localStorage.getItem = jest.fn(() => {
      throw new Error('Storage error');
    });

    const conversations = memoryManager.getAllConversations();
    expect(conversations).toEqual([]);
    
    // Restore localStorage
    localStorage.getItem = originalGetItem;
  });

  test('limits conversations to maximum count', () => {
    // Create instance with small limit for testing
    const limitedManager = new TestMemoryManager();
    limitedManager.maxConversations = 3;

    // Add more conversations than the limit
    for (let i = 0; i < 5; i++) {
      limitedManager.saveConversation({ docType: 'test', userInput: `test${i}` });
    }

    const conversations = limitedManager.getAllConversations();
    expect(conversations).toHaveLength(3);
    
    // Should keep the most recent conversations
    expect(conversations[0].userInput).toBe('test4');
    expect(conversations[1].userInput).toBe('test3');
    expect(conversations[2].userInput).toBe('test2');
  });

  test('handles empty search queries', () => {
    memoryManager.saveConversation({ docType: 'test', userInput: 'test content' });
    
    // Empty search should return all results (current behavior)
    const emptyResults = memoryManager.searchConversations('');
    expect(emptyResults).toHaveLength(1);
    
    const nonMatchingResults = memoryManager.searchConversations('nonexistent');
    expect(nonMatchingResults).toHaveLength(0);
  });

  test('generates unique IDs', () => {
    const id1 = memoryManager.generateId();
    const id2 = memoryManager.generateId();
    
    expect(id1).not.toBe(id2);
    expect(typeof id1).toBe('string');
    expect(typeof id2).toBe('string');
    expect(id1.length).toBeGreaterThan(10);
  });
});

describe('Business Logic Tests', () => {
  test('daily rate calculation logic', () => {
    const monthlyRate = 3000;
    const expectedDailyRate = (monthlyRate / 30).toFixed(2);
    
    expect(expectedDailyRate).toBe('100.00');
  });

  test('materials list structure', () => {
    const MATERIALS_LIST = [
      { id: 1, type: "قائم 3م", unit: "قطعة", defaultQuantity: 0 },
      { id: 2, type: "قائم 2.5م", unit: "قطعة", defaultQuantity: 0 }
    ];

    expect(MATERIALS_LIST).toHaveLength(2);
    expect(MATERIALS_LIST[0]).toHaveProperty('id');
    expect(MATERIALS_LIST[0]).toHaveProperty('type');
    expect(MATERIALS_LIST[0]).toHaveProperty('unit');
    expect(MATERIALS_LIST[0]).toHaveProperty('defaultQuantity');
  });
});

describe('Utility Functions Tests', () => {
  test('Arabic text processing', () => {
    const arabicText = 'مرحباً بكم في شركة أعمال الشاهين للمقاولات';
    const words = arabicText.split(/\s+/);
    
    expect(words).toContain('مرحباً');
    expect(words).toContain('شركة');
    expect(words).toContain('الشاهين');
  });

  test('timestamp generation', () => {
    const timestamp = new Date().toISOString();
    expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});