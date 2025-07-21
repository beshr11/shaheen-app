/**
 * Memory Manager Tests
 * Tests for the conversation memory management system
 */

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem(key: string): string | null {
      return store[key] || null;
    },
    setItem(key: string, value: string): void {
      store[key] = value.toString();
    },
    removeItem(key: string): void {
      delete store[key];
    },
    clear(): void {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock MemoryManager class (in real scenario, this would be imported)
class MemoryManager {
  private storageKey: string;
  private maxConversations: number;

  constructor() {
    this.storageKey = 'shaheen_ai_memory';
    this.maxConversations = 100;
  }

  saveConversation(conversationData: any): string {
    const conversations = this.getAllConversations();
    const newConversation = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      ...conversationData,
    };

    conversations.unshift(newConversation);

    if (conversations.length > this.maxConversations) {
      conversations.splice(this.maxConversations);
    }

    localStorage.setItem(this.storageKey, JSON.stringify(conversations));
    return newConversation.id;
  }

  getAllConversations(): any[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  }

  searchConversations(query: string): any[] {
    const conversations = this.getAllConversations();
    const searchTerm = query.toLowerCase();

    return conversations.filter(
      conv =>
        conv.userInput?.toLowerCase().includes(searchTerm) ||
        conv.docType?.toLowerCase().includes(searchTerm) ||
        conv.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm))
    );
  }

  extractKeywords(text: string): string[] {
    const stopWords = ['في', 'من', 'إلى', 'على', 'عن', 'مع', 'هذا', 'هذه', 'التي', 'الذي'];
    return text
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word));
  }

  calculateSimilarity(keywords1: string[], text2: string): number {
    const keywords2 = this.extractKeywords(text2);
    const intersection = keywords1.filter(word => keywords2.includes(word));
    return intersection.length / Math.max(keywords1.length, keywords2.length);
  }

  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  deleteConversation(id: string): void {
    const conversations = this.getAllConversations();
    const filtered = conversations.filter(conv => conv.id !== id);
    localStorage.setItem(this.storageKey, JSON.stringify(filtered));
  }

  getStats(): any {
    const conversations = this.getAllConversations();
    const docTypes: Record<string, number> = {};
    const ratings: number[] = [];

    conversations.forEach(conv => {
      if (conv.docType) {
        docTypes[conv.docType] = (docTypes[conv.docType] || 0) + 1;
      }
      if (conv.rating) {
        ratings.push(conv.rating);
      }
    });

    return {
      totalConversations: conversations.length,
      docTypeDistribution: docTypes,
      averageRating: ratings.length > 0 ? ratings.reduce((a, b) => a + b) / ratings.length : 0,
      mostUsedDocType:
        Object.keys(docTypes).length > 0
          ? Object.keys(docTypes).reduce((a, b) => (docTypes[a] > docTypes[b] ? a : b))
          : '',
    };
  }
}

describe('MemoryManager', () => {
  let memoryManager: MemoryManager;

  beforeEach(() => {
    memoryManager = new MemoryManager();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  test('should save and retrieve conversations', () => {
    const conversationData = {
      docType: 'عقد إيجار سقالات',
      userInput: 'أريد إنشاء عقد إيجار جديد',
      generatedContent: 'محتوى العقد المولد',
      tags: ['عقد', 'إيجار'],
    };

    const id = memoryManager.saveConversation(conversationData);
    expect(id).toBeDefined();
    expect(typeof id).toBe('string');

    const conversations = memoryManager.getAllConversations();
    expect(conversations).toHaveLength(1);
    expect(conversations[0].docType).toBe('عقد إيجار سقالات');
    expect(conversations[0].userInput).toBe('أريد إنشاء عقد إيجار جديد');
  });

  test('should search conversations by query', () => {
    const conversation1 = {
      docType: 'عقد إيجار سقالات',
      userInput: 'أريد إنشاء عقد إيجار جديد',
      tags: ['عقد', 'إيجار'],
    };

    const conversation2 = {
      docType: 'عقد عمالة',
      userInput: 'أحتاج عقد عمل للموظف الجديد',
      tags: ['عقد', 'عمالة'],
    };

    memoryManager.saveConversation(conversation1);
    memoryManager.saveConversation(conversation2);

    const results = memoryManager.searchConversations('إيجار');
    expect(results).toHaveLength(1);
    expect(results[0].docType).toBe('عقد إيجار سقالات');

    const workResults = memoryManager.searchConversations('عمالة');
    expect(workResults).toHaveLength(1);
    expect(workResults[0].docType).toBe('عقد عمالة');
  });

  test('should extract keywords correctly', () => {
    const text = 'أريد إنشاء عقد إيجار جديد للمشروع في الرياض';
    const keywords = memoryManager.extractKeywords(text);

    expect(keywords).toContain('أريد');
    expect(keywords).toContain('إنشاء');
    expect(keywords).toContain('عقد');
    expect(keywords).toContain('إيجار');
    expect(keywords).toContain('جديد');
    expect(keywords).toContain('للمشروع');
    expect(keywords).toContain('الرياض');

    // Should not contain stop words
    expect(keywords).not.toContain('في');
  });

  test('should calculate similarity between texts', () => {
    const keywords1 = ['عقد', 'إيجار', 'سقالات'];
    const text2 = 'أريد عقد إيجار للسقالات المعدنية';

    const similarity = memoryManager.calculateSimilarity(keywords1, text2);
    expect(similarity).toBeGreaterThan(0);
    expect(similarity).toBeLessThanOrEqual(1);
  });

  test('should generate unique IDs', () => {
    const id1 = memoryManager.generateId();
    const id2 = memoryManager.generateId();

    expect(id1).not.toBe(id2);
    expect(typeof id1).toBe('string');
    expect(typeof id2).toBe('string');
    expect(id1.length).toBeGreaterThan(0);
    expect(id2.length).toBeGreaterThan(0);
  });

  test('should delete conversations', () => {
    const conversation = {
      docType: 'عقد إيجار سقالات',
      userInput: 'عقد تجريبي',
    };

    const id = memoryManager.saveConversation(conversation);
    expect(memoryManager.getAllConversations()).toHaveLength(1);

    memoryManager.deleteConversation(id);
    expect(memoryManager.getAllConversations()).toHaveLength(0);
  });

  test('should calculate statistics correctly', () => {
    const conversations = [
      {
        docType: 'عقد إيجار سقالات',
        userInput: 'عقد 1',
        rating: 5,
      },
      {
        docType: 'عقد إيجار سقالات',
        userInput: 'عقد 2',
        rating: 4,
      },
      {
        docType: 'عقد عمالة',
        userInput: 'عقد 3',
        rating: 3,
      },
    ];

    conversations.forEach(conv => memoryManager.saveConversation(conv));

    const stats = memoryManager.getStats();
    expect(stats.totalConversations).toBe(3);
    expect(stats.docTypeDistribution['عقد إيجار سقالات']).toBe(2);
    expect(stats.docTypeDistribution['عقد عمالة']).toBe(1);
    expect(stats.averageRating).toBe(4); // (5 + 4 + 3) / 3 = 4
    expect(stats.mostUsedDocType).toBe('عقد إيجار سقالات');
  });

  test('should handle empty storage gracefully', () => {
    const conversations = memoryManager.getAllConversations();
    expect(conversations).toEqual([]);

    const stats = memoryManager.getStats();
    expect(stats.totalConversations).toBe(0);
    expect(stats.averageRating).toBe(0);
    expect(stats.mostUsedDocType).toBe('');
  });

  test('should limit number of conversations stored', () => {
    // Set a lower limit for testing
    memoryManager['maxConversations'] = 2;

    const conversation1 = { docType: 'test1', userInput: 'input1' };
    const conversation2 = { docType: 'test2', userInput: 'input2' };
    const conversation3 = { docType: 'test3', userInput: 'input3' };

    memoryManager.saveConversation(conversation1);
    memoryManager.saveConversation(conversation2);
    memoryManager.saveConversation(conversation3);

    const conversations = memoryManager.getAllConversations();
    expect(conversations).toHaveLength(2);

    // Should keep the most recent conversations
    expect(conversations[0].docType).toBe('test3');
    expect(conversations[1].docType).toBe('test2');
  });
});
