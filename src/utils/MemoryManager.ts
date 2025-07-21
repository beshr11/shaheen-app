/**
 * MemoryManager - Advanced conversation memory and learning system
 * 
 * This class manages conversation history, provides search capabilities,
 * and enables the AI agent to learn from previous interactions.
 * All data is stored securely in localStorage with proper error handling.
 */

import { Conversation, MemoryStats } from '../types';

export class MemoryManager {
  private readonly storageKey = 'shaheen_ai_memory';
  private readonly maxConversations = 100;
  private readonly stopWords = ['في', 'من', 'إلى', 'على', 'عن', 'مع', 'هذا', 'هذه', 'التي', 'الذي'];

  /**
   * Save a new conversation to memory
   * @param conversationData - The conversation data to save
   * @returns The ID of the saved conversation
   */
  saveConversation(conversationData: Partial<Conversation>): string {
    try {
      const conversations = this.getAllConversations();
      const newConversation: Conversation = {
        id: this.generateId(),
        timestamp: new Date().toISOString(),
        docType: '',
        userInput: '',
        ...conversationData
      } as Conversation;
      
      conversations.unshift(newConversation);
      
      // Maintain maximum conversation limit
      if (conversations.length > this.maxConversations) {
        conversations.splice(this.maxConversations);
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(conversations));
      return newConversation.id;
    } catch (error) {
      console.error('خطأ في حفظ المحادثة:', error);
      return '';
    }
  }

  /**
   * Retrieve all conversations from memory
   * @returns Array of all stored conversations
   */
  getAllConversations(): Conversation[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('خطأ في قراءة الذاكرة:', error);
      return [];
    }
  }

  /**
   * Search conversations by query
   * @param query - Search term
   * @returns Array of matching conversations
   */
  searchConversations(query: string): Conversation[] {
    const conversations = this.getAllConversations();
    const searchTerm = query.toLowerCase();
    
    return conversations.filter(conv => 
      conv.userInput?.toLowerCase().includes(searchTerm) ||
      conv.docType?.toLowerCase().includes(searchTerm) ||
      conv.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  /**
   * Find similar conversations based on document type and content
   * @param docType - Type of document
   * @param userInput - User input to compare against
   * @param limit - Maximum number of results to return
   * @returns Array of similar conversations with similarity scores
   */
  getSimilarConversations(docType: string, userInput: string, limit = 3): Conversation[] {
    const conversations = this.getAllConversations();
    const keywords = this.extractKeywords(userInput);
    
    return conversations
      .filter(conv => conv.docType === docType)
      .map(conv => ({
        ...conv,
        similarity: this.calculateSimilarity(keywords, conv.userInput)
      }))
      .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
      .slice(0, limit);
  }

  /**
   * Extract meaningful keywords from text (excluding stop words)
   * @param text - Text to extract keywords from
   * @returns Array of keywords
   */
  extractKeywords(text: string): string[] {
    if (!text) return [];
    
    return text.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && !this.stopWords.includes(word));
  }

  /**
   * Calculate similarity between two sets of keywords
   * @param keywords1 - First set of keywords
   * @param text2 - Second text to compare against
   * @returns Similarity score between 0 and 1
   */
  calculateSimilarity(keywords1: string[], text2: string): number {
    if (!text2) return 0;
    
    const keywords2 = this.extractKeywords(text2);
    if (keywords1.length === 0 || keywords2.length === 0) return 0;
    
    const intersection = keywords1.filter(word => keywords2.includes(word));
    return intersection.length / Math.max(keywords1.length, keywords2.length);
  }

  /**
   * Generate a unique ID for conversations
   * @returns Unique identifier string
   */
  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Delete a conversation by ID
   * @param id - ID of conversation to delete
   */
  deleteConversation(id: string): void {
    try {
      const conversations = this.getAllConversations();
      const filtered = conversations.filter(conv => conv.id !== id);
      localStorage.setItem(this.storageKey, JSON.stringify(filtered));
    } catch (error) {
      console.error('خطأ في حذف المحادثة:', error);
    }
  }

  /**
   * Update an existing conversation
   * @param id - ID of conversation to update
   * @param updates - Updates to apply
   */
  updateConversation(id: string, updates: Partial<Conversation>): void {
    try {
      const conversations = this.getAllConversations();
      const index = conversations.findIndex(conv => conv.id === id);
      if (index !== -1) {
        conversations[index] = { ...conversations[index], ...updates };
        localStorage.setItem(this.storageKey, JSON.stringify(conversations));
      }
    } catch (error) {
      console.error('خطأ في تحديث المحادثة:', error);
    }
  }

  /**
   * Get usage statistics from stored conversations
   * @returns Memory statistics object
   */
  getStats(): MemoryStats {
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

  /**
   * Clear all stored conversations (use with caution)
   */
  clearAllConversations(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('خطأ في مسح جميع المحادثات:', error);
    }
  }

  /**
   * Export conversations for backup
   * @returns JSON string of all conversations
   */
  exportConversations(): string {
    return JSON.stringify(this.getAllConversations(), null, 2);
  }

  /**
   * Import conversations from backup
   * @param jsonData - JSON string of conversations to import
   * @returns Success status
   */
  importConversations(jsonData: string): boolean {
    try {
      const conversations = JSON.parse(jsonData);
      if (Array.isArray(conversations)) {
        localStorage.setItem(this.storageKey, JSON.stringify(conversations));
        return true;
      }
      return false;
    } catch (error) {
      console.error('خطأ في استيراد المحادثات:', error);
      return false;
    }
  }
}