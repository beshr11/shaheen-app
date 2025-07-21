/**
 * Tests for MemoryManager utility class
 * 
 * These tests verify the conversation storage, retrieval, and search
 * functionality of the MemoryManager class.
 */

import { MemoryManager } from '../utils/MemoryManager';
import { Conversation } from '../types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('MemoryManager', () => {
  let memoryManager: MemoryManager;

  beforeEach(() => {
    memoryManager = new MemoryManager();
    localStorageMock.clear();
  });

  describe('saveConversation', () => {
    it('should save a conversation and return an ID', () => {
      const conversationData = {
        docType: 'عقد إيجار سقالات',
        userInput: 'إنشاء عقد إيجار للمشروع',
        generatedContent: 'محتوى العقد المولد',
      };

      const id = memoryManager.saveConversation(conversationData);

      expect(id).toBeTruthy();
      expect(typeof id).toBe('string');
    });

    it('should store conversation in localStorage', () => {
      const conversationData = {
        docType: 'عقد إيجار سقالات',
        userInput: 'إنشاء عقد إيجار للمشروع',
      };

      memoryManager.saveConversation(conversationData);
      const stored = memoryManager.getAllConversations();

      expect(stored).toHaveLength(1);
      expect(stored[0].docType).toBe('عقد إيجار سقالات');
      expect(stored[0].userInput).toBe('إنشاء عقد إيجار للمشروع');
    });
  });

  describe('getAllConversations', () => {
    it('should return empty array when no conversations exist', () => {
      const conversations = memoryManager.getAllConversations();
      expect(conversations).toEqual([]);
    });

    it('should return all stored conversations', () => {
      const testData = [
        { docType: 'عقد إيجار سقالات', userInput: 'نص تجريبي 1' },
        { docType: 'عقد عمالة', userInput: 'نص تجريبي 2' },
      ];

      testData.forEach(data => memoryManager.saveConversation(data));
      const conversations = memoryManager.getAllConversations();

      expect(conversations).toHaveLength(2);
    });
  });

  describe('searchConversations', () => {
    beforeEach(() => {
      const testConversations = [
        { docType: 'عقد إيجار سقالات', userInput: 'مشروع البناء الجديد' },
        { docType: 'عقد عمالة', userInput: 'توظيف عامل تقني' },
        { docType: 'محضر تسليم', userInput: 'تسليم مواد البناء' },
      ];

      testConversations.forEach(conv => memoryManager.saveConversation(conv));
    });

    it('should find conversations by user input content', () => {
      const results = memoryManager.searchConversations('البناء');
      expect(results).toHaveLength(2); // 'مشروع البناء' و 'مواد البناء'
    });

    it('should find conversations by document type', () => {
      const results = memoryManager.searchConversations('عقد');
      expect(results).toHaveLength(2); // Both contract types
    });

    it('should return empty array for non-matching search', () => {
      const results = memoryManager.searchConversations('غير موجود');
      expect(results).toEqual([]);
    });
  });

  describe('extractKeywords', () => {
    it('should extract Arabic keywords correctly', () => {
      const text = 'إنشاء عقد إيجار للسقالات في المشروع';
      const keywords = memoryManager.extractKeywords(text);

      expect(keywords).toContain('إنشاء');
      expect(keywords).toContain('عقد');
      expect(keywords).toContain('إيجار');
      expect(keywords).toContain('للسقالات');
      expect(keywords).toContain('المشروع');
    });

    it('should filter out stop words', () => {
      const text = 'في من إلى على';
      const keywords = memoryManager.extractKeywords(text);

      expect(keywords).toEqual([]);
    });

    it('should handle empty text', () => {
      const keywords = memoryManager.extractKeywords('');
      expect(keywords).toEqual([]);
    });
  });

  describe('calculateSimilarity', () => {
    it('should calculate similarity between keyword sets', () => {
      const keywords1 = ['مشروع', 'بناء', 'عقد'];
      const text2 = 'مشروع البناء الجديد يحتاج عقد';

      const similarity = memoryManager.calculateSimilarity(keywords1, text2);

      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThanOrEqual(1);
    });

    it('should return 0 for completely different texts', () => {
      const keywords1 = ['مشروع', 'بناء'];
      const text2 = 'طائرة سفر';

      const similarity = memoryManager.calculateSimilarity(keywords1, text2);

      expect(similarity).toBe(0);
    });

    it('should handle empty inputs', () => {
      const similarity1 = memoryManager.calculateSimilarity([], 'any text');
      const similarity2 = memoryManager.calculateSimilarity(['keyword'], '');

      expect(similarity1).toBe(0);
      expect(similarity2).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      const testConversations = [
        { docType: 'عقد إيجار سقالات', userInput: 'test', rating: 5 },
        { docType: 'عقد إيجار سقالات', userInput: 'test', rating: 4 },
        { docType: 'عقد عمالة', userInput: 'test', rating: 3 },
      ];

      testConversations.forEach(conv => memoryManager.saveConversation(conv));
      const stats = memoryManager.getStats();

      expect(stats.totalConversations).toBe(3);
      expect(stats.docTypeDistribution['عقد إيجار سقالات']).toBe(2);
      expect(stats.docTypeDistribution['عقد عمالة']).toBe(1);
      expect(stats.averageRating).toBe(4); // (5+4+3)/3 = 4
      expect(stats.mostUsedDocType).toBe('عقد إيجار سقالات');
    });

    it('should handle empty data', () => {
      const stats = memoryManager.getStats();

      expect(stats.totalConversations).toBe(0);
      expect(stats.docTypeDistribution).toEqual({});
      expect(stats.averageRating).toBe(0);
      expect(stats.mostUsedDocType).toBe('');
    });
  });

  describe('deleteConversation', () => {
    it('should delete conversation by ID', () => {
      const id = memoryManager.saveConversation({
        docType: 'عقد إيجار سقالات',
        userInput: 'test conversation',
      });

      expect(memoryManager.getAllConversations()).toHaveLength(1);

      memoryManager.deleteConversation(id);

      expect(memoryManager.getAllConversations()).toHaveLength(0);
    });

    it('should not affect other conversations when deleting one', () => {
      const id1 = memoryManager.saveConversation({
        docType: 'عقد إيجار سقالات',
        userInput: 'conversation 1',
      });

      const id2 = memoryManager.saveConversation({
        docType: 'عقد عمالة',
        userInput: 'conversation 2',
      });

      expect(memoryManager.getAllConversations()).toHaveLength(2);

      memoryManager.deleteConversation(id1);

      const remaining = memoryManager.getAllConversations();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe(id2);
    });
  });
});