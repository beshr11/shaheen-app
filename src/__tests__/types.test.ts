import {
  Material,
  RentalCommencementFormData,
  Message,
  ConversationData,
  DocumentType,
} from '../types';

describe('Type Definitions', () => {
  test('Material interface has correct structure', () => {
    const material: Material = {
      id: 1,
      type: 'قائم 3م',
      unit: 'قطعة',
      defaultQuantity: 10,
    };

    expect(material.id).toBe(1);
    expect(material.type).toBe('قائم 3م');
    expect(material.unit).toBe('قطعة');
    expect(material.defaultQuantity).toBe(10);
  });

  test('RentalCommencementFormData interface allows all required fields', () => {
    const formData: RentalCommencementFormData = {
      lessor: 'شركة أعمال الشاهين للمقاولات',
      lessee: 'المستأجر',
      project: 'مشروع تجريبي',
      location: 'الرياض',
      contractDate: '2024-01-01',
      installationDate: '2024-01-05',
      rentalStartDate: '2024-01-10',
      monthlyRate: '10000',
      dailyRate: '333.33',
      installationIncluded: true,
      contractNumber: 'CNT-001',
      engineerName: 'أحمد محمد',
      notes: 'ملاحظات تجريبية',
      quantity_1: 50,
      installed_1: 45,
    };

    expect(formData.lessor).toBe('شركة أعمال الشاهين للمقاولات');
    expect(formData.installationIncluded).toBe(true);
    expect(formData.quantity_1).toBe(50);
  });

  test('Message interface has correct structure', () => {
    const message: Message = {
      id: 123456,
      content: 'رسالة تجريبية',
      isUser: true,
      type: 'text',
      timestamp: '12:00:00',
    };

    expect(message.id).toBe(123456);
    expect(message.isUser).toBe(true);
    expect(message.type).toBe('text');
  });

  test('ConversationData interface allows optional fields', () => {
    const conversation: ConversationData = {
      docType: 'عقد إيجار سقالات',
      userInput: 'أريد إنشاء عقد إيجار',
      generatedContent: 'محتوى مولد',
      tags: ['عقد', 'إيجار'],
      rating: 5,
    };

    expect(conversation.docType).toBe('عقد إيجار سقالات');
    expect(conversation.tags).toEqual(['عقد', 'إيجار']);
    expect(conversation.rating).toBe(5);
  });

  test('DocumentType includes all valid types', () => {
    const validTypes: DocumentType[] = [
      'عقد إيجار سقالات',
      'محضر بدء إيجار الشدات المعدنية',
      'عقد عمالة',
      'محضر تسليم واستلام',
      'مذكرة مطالبة مالية',
      'إشعار تسليم',
      'محضر إرجاع وفحص',
    ];

    validTypes.forEach(type => {
      expect(typeof type).toBe('string');
      expect(type.length).toBeGreaterThan(0);
    });
  });
});
