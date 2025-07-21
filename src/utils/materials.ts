/**
 * Materials List - Construction materials and equipment data
 * 
 * This file contains the comprehensive list of construction materials
 * and equipment used by Shaheen Contracting Company for scaffolding
 * and metalwork projects.
 */

import { Material } from '../types';

/**
 * Complete list of materials with their specifications
 * Each material includes ID, type description, unit of measurement, and default quantity
 */
export const MATERIALS_LIST: Material[] = [
  { id: 1, type: "قائم 3م", unit: "قطعة", defaultQuantity: 0 },
  { id: 2, type: "قائم 2.5م", unit: "قطعة", defaultQuantity: 0 },
  { id: 3, type: "قائم 2م", unit: "قطعة", defaultQuantity: 0 },
  { id: 4, type: "قائم 1.5م", unit: "قطعة", defaultQuantity: 0 },
  { id: 5, type: "قائم 1م", unit: "قطعة", defaultQuantity: 0 },
  { id: 6, type: "لدجر 1.8م", unit: "قطعة", defaultQuantity: 0 },
  { id: 7, type: "لدجر 1.5م", unit: "قطعة", defaultQuantity: 0 },
  { id: 8, type: "لدجر 1.60م", unit: "قطعة", defaultQuantity: 0 },
  { id: 9, type: "لدجر 1.00م", unit: "قطعة", defaultQuantity: 0 },
  { id: 10, type: "لدجر 1.25م", unit: "قطعة", defaultQuantity: 0 },
  { id: 11, type: "لدجر 0.9م", unit: "قطعة", defaultQuantity: 0 },
  { id: 12, type: "لدجر 1.2م", unit: "قطعة", defaultQuantity: 0 },
  { id: 13, type: "لدجر 0.8م", unit: "قطعة", defaultQuantity: 0 },
  { id: 14, type: "لدجر 0.6م", unit: "قطعة", defaultQuantity: 0 },
  { id: 15, type: "يوهد", unit: "قطعة", defaultQuantity: 0 },
  { id: 16, type: "ميزانيه", unit: "قطعة", defaultQuantity: 0 },
  { id: 17, type: "دوكا المنيوم", unit: "قطعة", defaultQuantity: 0 },
  { id: 18, type: "وصلات", unit: "قطعة", defaultQuantity: 0 },
  { id: 19, type: "ماسورة", unit: "قطعة", defaultQuantity: 0 },
  { id: 20, type: "كلامب", unit: "قطعة", defaultQuantity: 0 },
  { id: 21, type: "بليتة تثبيت", unit: "قطعة", defaultQuantity: 0 },
  { id: 22, type: "لوح بوندي 4م", unit: "قطعة", defaultQuantity: 0 }
];

/**
 * Helper function to get material by ID
 * @param id - Material ID
 * @returns Material object or undefined if not found
 */
export const getMaterialById = (id: number): Material | undefined => {
  return MATERIALS_LIST.find(material => material.id === id);
};

/**
 * Helper function to get materials by type
 * @param type - Material type search term
 * @returns Array of matching materials
 */
export const getMaterialsByType = (type: string): Material[] => {
  return MATERIALS_LIST.filter(material => 
    material.type.toLowerCase().includes(type.toLowerCase())
  );
};

/**
 * Helper function to calculate total materials
 * @returns Total number of different material types
 */
export const getTotalMaterialTypes = (): number => {
  return MATERIALS_LIST.length;
};