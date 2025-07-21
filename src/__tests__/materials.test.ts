/**
 * Tests for materials utility functions
 * 
 * These tests verify the materials data structure and helper functions.
 */

import { 
  MATERIALS_LIST, 
  getMaterialById, 
  getMaterialsByType, 
  getTotalMaterialTypes 
} from '../utils/materials';

describe('Materials Utility', () => {
  describe('MATERIALS_LIST', () => {
    it('should contain valid material data structure', () => {
      expect(Array.isArray(MATERIALS_LIST)).toBe(true);
      expect(MATERIALS_LIST.length).toBeGreaterThan(0);

      // Check first item structure
      const firstItem = MATERIALS_LIST[0];
      expect(firstItem).toHaveProperty('id');
      expect(firstItem).toHaveProperty('type');
      expect(firstItem).toHaveProperty('unit');
      expect(firstItem).toHaveProperty('defaultQuantity');
      
      expect(typeof firstItem.id).toBe('number');
      expect(typeof firstItem.type).toBe('string');
      expect(typeof firstItem.unit).toBe('string');
      expect(typeof firstItem.defaultQuantity).toBe('number');
    });

    it('should have unique IDs for all materials', () => {
      const ids = MATERIALS_LIST.map(material => material.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should contain expected material types', () => {
      const types = MATERIALS_LIST.map(material => material.type);
      
      expect(types).toContain('قائم 3م');
      expect(types).toContain('لدجر 1.8م');
      expect(types).toContain('يوهد');
      expect(types).toContain('ميزانيه');
    });

    it('should use "قطعة" as the unit for all materials', () => {
      const units = MATERIALS_LIST.map(material => material.unit);
      const uniqueUnits = new Set(units);
      
      expect(uniqueUnits.size).toBe(1);
      expect(uniqueUnits.has('قطعة')).toBe(true);
    });
  });

  describe('getMaterialById', () => {
    it('should return material when valid ID is provided', () => {
      const material = getMaterialById(1);
      
      expect(material).toBeDefined();
      expect(material?.id).toBe(1);
      expect(material?.type).toBe('قائم 3م');
    });

    it('should return undefined for invalid ID', () => {
      const material = getMaterialById(999);
      expect(material).toBeUndefined();
    });

    it('should return correct material for each valid ID', () => {
      const testCases = [
        { id: 1, expectedType: 'قائم 3م' },
        { id: 15, expectedType: 'يوهد' },
        { id: 22, expectedType: 'لوح بوندي 4م' },
      ];

      testCases.forEach(({ id, expectedType }) => {
        const material = getMaterialById(id);
        expect(material?.type).toBe(expectedType);
      });
    });
  });

  describe('getMaterialsByType', () => {
    it('should return materials matching the search term', () => {
      const results = getMaterialsByType('قائم');
      
      expect(results.length).toBeGreaterThan(0);
      results.forEach(material => {
        expect(material.type).toContain('قائم');
      });
    });

    it('should be case insensitive', () => {
      const lowerCase = getMaterialsByType('قائم');
      const upperCase = getMaterialsByType('قائم');
      
      expect(lowerCase.length).toBe(upperCase.length);
    });

    it('should return empty array for non-matching search', () => {
      const results = getMaterialsByType('غير موجود');
      expect(results).toEqual([]);
    });

    it('should return multiple matches for common terms', () => {
      const ledgerResults = getMaterialsByType('لدجر');
      expect(ledgerResults.length).toBeGreaterThan(1);
      
      ledgerResults.forEach(material => {
        expect(material.type).toContain('لدجر');
      });
    });

    it('should handle partial matches', () => {
      const results = getMaterialsByType('3م');
      expect(results.length).toBeGreaterThan(0);
      
      results.forEach(material => {
        expect(material.type).toContain('3م');
      });
    });
  });

  describe('getTotalMaterialTypes', () => {
    it('should return correct total number of material types', () => {
      const total = getTotalMaterialTypes();
      expect(total).toBe(MATERIALS_LIST.length);
      expect(total).toBe(22); // Based on current materials list
    });

    it('should return a positive number', () => {
      const total = getTotalMaterialTypes();
      expect(total).toBeGreaterThan(0);
    });
  });

  describe('Data integrity checks', () => {
    it('should have sequential IDs starting from 1', () => {
      const sortedMaterials = [...MATERIALS_LIST].sort((a, b) => a.id - b.id);
      
      for (let i = 0; i < sortedMaterials.length; i++) {
        expect(sortedMaterials[i].id).toBe(i + 1);
      }
    });

    it('should have non-empty type names', () => {
      MATERIALS_LIST.forEach(material => {
        expect(material.type.trim().length).toBeGreaterThan(0);
      });
    });

    it('should have non-negative default quantities', () => {
      MATERIALS_LIST.forEach(material => {
        expect(material.defaultQuantity).toBeGreaterThanOrEqual(0);
      });
    });
  });
});