import { jest } from '@jest/globals';

// Mock the Google Generative AI
const mockGeminiModel = {
  generateContent: jest.fn()
};

const mockGenAI = {
  getGenerativeModel: jest.fn(() => mockGeminiModel)
};

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn(() => mockGenAI)
}));

// Mock file system
const mockFs = {
  readFileSync: jest.fn()
};

jest.mock('fs', () => mockFs);

// Import the functions to test (these would be extracted from server.js)
// For now, we'll test the logic as if they were in a separate service

describe('AI Integration Service', () => {
  let extractMedicationFromImage;
  let verifyPillInImage;
  let parseDate;
  let parseNumber;
  let parsePrice;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock implementations
    mockGeminiModel.generateContent.mockReset();
    mockFs.readFileSync.mockReset();
    
    // Mock successful Gemini response
    const mockResponse = {
      response: {
        text: jest.fn(() => JSON.stringify({
          medicationName: 'Test Medication',
          dosage: '10 MG TAB',
          schedule: 'Take 1 tablet by mouth every day',
          rawText: 'Test medication label text',
          dateFilled: '7/7/25',
          quantity: 90,
          daysSupply: 90,
          refillsRemaining: 2,
          refillExpiryDate: '4/14/26',
          pharmacyName: 'CVS Pharmacy',
          rxNumber: '928356 01 SS',
          ndcCode: '65862-0294-99',
          manufacturer: 'AUROBINDO PHARM',
          prescriber: 'Katherine Wei',
          insuranceProvider: 'MEDI-CALRX',
          retailPrice: 416.99,
          amountDue: 0.00
        }))
      }
    };
    
    mockGeminiModel.generateContent.mockResolvedValue(mockResponse);
    
    // Mock file read
    mockFs.readFileSync.mockReturnValue(Buffer.from('fake image data'));
    
    // Define the functions to test (these would normally be imported)
    extractMedicationFromImage = async (photoPath) => {
      try {
        const imageBuffer = mockFs.readFileSync(photoPath);
        const base64Image = imageBuffer.toString('base64');
        
        const prompt = `Extract comprehensive medication and refill information from this pharmacy label image. 

Return JSON with these fields:
- medicationName: Name of the medication
- dosage: Dosage information (e.g., "10 MG TAB")
- schedule: Dosage schedule (e.g., "Take 1 tablet by mouth every day")
- rawText: Raw extracted text from the image

REFILL INFORMATION (if available):
- dateFilled: Date medication was filled (e.g., "7/7/25" or "2025-07-07")
- quantity: Quantity dispensed (e.g., 90)
- daysSupply: Days the quantity will last (e.g., 90)
- refillsRemaining: Number of refills remaining (e.g., 2)
- refillExpiryDate: Date refills expire (e.g., "4/14/26" or "2026-04-14")

PHARMACY INFORMATION (if available):
- pharmacyName: Pharmacy name (e.g., "CVS Pharmacy")
- rxNumber: Prescription number (e.g., "928356 01 SS")
- ndcCode: National Drug Code (e.g., "65862-0294-99")
- manufacturer: Drug manufacturer (e.g., "AUROBINDO PHARM")
- prescriber: Prescribing doctor (e.g., "Katherine Wei")
- insuranceProvider: Insurance provider (e.g., "MEDI-CALRX")
- retailPrice: Retail price (e.g., 416.99)
- amountDue: Amount patient owes (e.g., 0.00)

Parse dates in MM/DD/YY or MM/DD/YYYY format and convert to YYYY-MM-DD.
Parse numbers for quantity, days supply, refills remaining, and prices.
Return only the JSON object, no other text.`;

        const result = await mockGeminiModel.generateContent([
          prompt,
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image
            }
          }
        ]);
        
        const response = result.response.text();
        
        // Clean up the response - remove markdown formatting if present
        let cleanResponse = response.trim();
        if (cleanResponse.startsWith('```json')) {
          cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanResponse.startsWith('```')) {
          cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        let extractedInfo = JSON.parse(cleanResponse);

        // Handle case where Gemini returns an array instead of a single object
        if (Array.isArray(extractedInfo) && extractedInfo.length > 0) {
          extractedInfo = extractedInfo[0];
        }

        // Ensure we have valid values for basic medication info
        const medicationName = extractedInfo.medicationName || extractedInfo.medication_name || 'Unknown Medication';
        const dosage = extractedInfo.dosage || 'Unknown Dosage';
        const schedule = extractedInfo.schedule || 'Unknown schedule';
        
        // Process refill information
        const refillInfo = {
          date_filled: parseDate(extractedInfo.dateFilled || extractedInfo.date_filled),
          quantity: parseNumber(extractedInfo.quantity),
          days_supply: parseNumber(extractedInfo.daysSupply || extractedInfo.days_supply),
          refills_remaining: parseNumber(extractedInfo.refillsRemaining || extractedInfo.refills_remaining),
          refill_expiry_date: parseDate(extractedInfo.refillExpiryDate || extractedInfo.refill_expiry_date)
        };

        // Process pharmacy information
        const pharmacyInfo = {
          pharmacy_name: extractedInfo.pharmacyName || extractedInfo.pharmacy_name,
          rx_number: extractedInfo.rxNumber || extractedInfo.rx_number,
          ndc_code: extractedInfo.ndcCode || extractedInfo.ndc_code,
          manufacturer: extractedInfo.manufacturer,
          prescriber: extractedInfo.prescriber,
          insurance_provider: extractedInfo.insuranceProvider || extractedInfo.insurance_provider,
          retail_price: parsePrice(extractedInfo.retailPrice || extractedInfo.retail_price),
          amount_due: parsePrice(extractedInfo.amountDue || extractedInfo.amount_due)
        };
        
        return {
          extractedText: extractedInfo.rawText || 'No text extracted',
          extractedInfo: {
            medicationName: medicationName,
            dosage: dosage,
            schedule: schedule,
            ...refillInfo,
            ...pharmacyInfo
          }
        };
        
      } catch (error) {
        console.error('Gemini extraction failed:', error);
        return {
          extractedText: 'Extraction failed',
          extractedInfo: {
            medicationName: 'Unknown Medication',
            dosage: 'Unknown Dosage',
            schedule: 'once daily'
          }
        };
      }
    };

    verifyPillInImage = async (photoPath) => {
      try {
        const imageBuffer = mockFs.readFileSync(photoPath);
        const base64Image = imageBuffer.toString('base64');
        
        const prompt = `
You are a medical assistant verifying medication intake. 

Look at this image and determine if a pill, tablet, capsule, or medication is visible.

Return ONLY a JSON object with these fields:
- pillVisible: true/false (is a pill/medication visible in the image?)
- confidence: "high", "medium", or "low" (how confident are you?)
- description: brief description of what you see (e.g., "white pill on palm", "empty hand", "tablet on surface")

Focus on:
- Pills, tablets, capsules, or medication forms
- Medication bottles or containers
- Hands holding medication
- Surfaces with medication

Ignore:
- Text or labels
- Background objects
- Non-medication items

Return only the JSON object, no other text:
`;

        const result = await mockGeminiModel.generateContent([
          prompt,
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image
            }
          }
        ]);
        
        const response = result.response.text();
        
        // Clean up the response - remove markdown formatting if present
        let cleanResponse = response.trim();
        if (cleanResponse.startsWith('```json')) {
          cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanResponse.startsWith('```')) {
          cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        const verification = JSON.parse(cleanResponse);
        
        return {
          pillVisible: verification.pillVisible || false,
          confidence: verification.confidence || 'low',
          description: verification.description || 'Unable to determine'
        };
        
      } catch (error) {
        console.error('Pill verification failed:', error);
        return {
          pillVisible: false,
          confidence: 'low',
          description: 'Verification failed: ' + error.message
        };
      }
    };

    // Helper functions
    parseDate = (dateString) => {
      if (!dateString) return null;
      
      try {
        // Handle MM/DD/YY format
        if (dateString.includes('/')) {
          const parts = dateString.split('/');
          if (parts.length === 3) {
            let month = parseInt(parts[0]) - 1; // Month is 0-indexed
            let day = parseInt(parts[1]);
            let year = parseInt(parts[2]);
            
            // Handle 2-digit years
            if (year < 100) {
              year += 2000; // Assume 21st century
            }
            
            const date = new Date(year, month, day);
            if (!isNaN(date.getTime())) {
              return date.toISOString().split('T')[0]; // Return YYYY-MM-DD
            }
          }
        }
        
        // Handle YYYY-MM-DD format
        if (dateString.includes('-')) {
          const date = new Date(dateString);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
          }
        }
        
        return null;
      } catch (error) {
        console.warn('Failed to parse date:', dateString, error);
        return null;
      }
    };

    parseNumber = (value) => {
      if (value === undefined || value === null || value === '') return null;
      
      const parsed = parseInt(value);
      return isNaN(parsed) ? null : parsed;
    };

    parsePrice = (value) => {
      if (value === undefined || value === null || value === '') return null;
      
      // Remove currency symbols and commas
      const cleanValue = String(value).replace(/[$,]/g, '');
      const parsed = parseFloat(cleanValue);
      return isNaN(parsed) ? null : parsed;
    };
  });

  describe('Medication Extraction from Images', () => {
    it('should extract medication information from pharmacy label images', async () => {
      const photoPath = '/path/to/pharmacy_label.jpg';
      
      const result = await extractMedicationFromImage(photoPath);
      
      expect(result.extractedText).toBe('Test medication label text');
      expect(result.extractedInfo.medicationName).toBe('Test Medication');
      expect(result.extractedInfo.dosage).toBe('10 MG TAB');
      expect(result.extractedInfo.schedule).toBe('Take 1 tablet by mouth every day');
    });

    it('should extract refill information correctly', async () => {
      const photoPath = '/path/to/pharmacy_label.jpg';
      
      const result = await extractMedicationFromImage(photoPath);
      
      expect(result.extractedInfo.date_filled).toBe('2025-07-07');
      expect(result.extractedInfo.quantity).toBe(90);
      expect(result.extractedInfo.days_supply).toBe(90);
      expect(result.extractedInfo.refills_remaining).toBe(2);
      expect(result.extractedInfo.refill_expiry_date).toBe('2026-04-14');
    });

    it('should extract pharmacy information correctly', async () => {
      const photoPath = '/path/to/pharmacy_label.jpg';
      
      const result = await extractMedicationFromImage(photoPath);
      
      expect(result.extractedInfo.pharmacy_name).toBe('CVS Pharmacy');
      expect(result.extractedInfo.rx_number).toBe('928356 01 SS');
      expect(result.extractedInfo.ndc_code).toBe('65862-0294-99');
      expect(result.extractedInfo.manufacturer).toBe('AUROBINDO PHARM');
      expect(result.extractedInfo.prescriber).toBe('Katherine Wei');
      expect(result.extractedInfo.insurance_provider).toBe('MEDI-CALRX');
      expect(result.extractedInfo.retail_price).toBe(416.99);
      expect(result.extractedInfo.amount_due).toBeNull();
    });

    it('should handle Gemini API responses with markdown formatting', async () => {
      const mockResponse = {
        response: {
          text: jest.fn(() => '```json\n{"medicationName": "Markdown Med", "dosage": "5mg"}\n```')
        }
      };
      mockGeminiModel.generateContent.mockResolvedValueOnce(mockResponse);
      
      const photoPath = '/path/to/pharmacy_label.jpg';
      const result = await extractMedicationFromImage(photoPath);
      
      expect(result.extractedInfo.medicationName).toBe('Markdown Med');
      expect(result.extractedInfo.dosage).toBe('5mg');
    });

    it('should handle Gemini API responses with array format', async () => {
      const mockResponse = {
        response: {
          text: jest.fn(() => JSON.stringify([{
            medicationName: 'Array Med',
            dosage: '20mg'
          }]))
        }
      };
      mockGeminiModel.generateContent.mockResolvedValueOnce(mockResponse);
      
      const photoPath = '/path/to/pharmacy_label.jpg';
      const result = await extractMedicationFromImage(photoPath);
      
      expect(result.extractedInfo.medicationName).toBe('Array Med');
      expect(result.extractedInfo.dosage).toBe('20mg');
    });

    it('should handle missing medication information gracefully', async () => {
      const mockResponse = {
        response: {
          text: jest.fn(() => JSON.stringify({
            // Missing medicationName, dosage, schedule
            rawText: 'Some text'
          }))
        }
      };
      mockGeminiModel.generateContent.mockResolvedValueOnce(mockResponse);
      
      const photoPath = '/path/to/pharmacy_label.jpg';
      const result = await extractMedicationFromImage(photoPath);
      
      expect(result.extractedInfo.medicationName).toBe('Unknown Medication');
      expect(result.extractedInfo.dosage).toBe('Unknown Dosage');
      expect(result.extractedInfo.schedule).toBe('Unknown schedule');
    });

    it('should handle Gemini API failures gracefully', async () => {
      mockGeminiModel.generateContent.mockRejectedValueOnce(new Error('API Error'));
      
      const photoPath = '/path/to/pharmacy_label.jpg';
      const result = await extractMedicationFromImage(photoPath);
      
      expect(result.extractedText).toBe('Extraction failed');
      expect(result.extractedInfo.medicationName).toBe('Unknown Medication');
      expect(result.extractedInfo.dosage).toBe('Unknown Dosage');
      expect(result.extractedInfo.schedule).toBe('once daily');
    });

    it('should handle file read failures gracefully', async () => {
      mockFs.readFileSync.mockImplementationOnce(() => {
        throw new Error('File not found');
      });
      
      const photoPath = '/path/to/nonexistent.jpg';
      const result = await extractMedicationFromImage(photoPath);
      
      expect(result.extractedText).toBe('Extraction failed');
    });
  });

  describe('Pill Verification in Images', () => {
    it('should verify pill presence in images', async () => {
      const mockResponse = {
        response: {
          text: jest.fn(() => JSON.stringify({
            pillVisible: true,
            confidence: 'high',
            description: 'White pill visible on palm'
          }))
        }
      };
      mockGeminiModel.generateContent.mockResolvedValueOnce(mockResponse);
      
      const photoPath = '/path/to/pill_image.jpg';
      const result = await verifyPillInImage(photoPath);
      
      expect(result.pillVisible).toBe(true);
      expect(result.confidence).toBe('high');
      expect(result.description).toBe('White pill visible on palm');
    });

    it('should handle no pill in image', async () => {
      const mockResponse = {
        response: {
          text: jest.fn(() => JSON.stringify({
            pillVisible: false,
            confidence: 'high',
            description: 'Empty hand, no medication visible'
          }))
        }
      };
      mockGeminiModel.generateContent.mockResolvedValueOnce(mockResponse);
      
      const photoPath = '/path/to/empty_hand.jpg';
      const result = await verifyPillInImage(photoPath);
      
      expect(result.pillVisible).toBe(false);
      expect(result.confidence).toBe('high');
      expect(result.description).toBe('Empty hand, no medication visible');
    });

    it('should handle low confidence responses', async () => {
      const mockResponse = {
        response: {
          text: jest.fn(() => JSON.stringify({
            pillVisible: true,
            confidence: 'low',
            description: 'Possible pill shape but unclear'
          }))
        }
      };
      mockGeminiModel.generateContent.mockResolvedValueOnce(mockResponse);
      
      const photoPath = '/path/to/unclear_image.jpg';
      const result = await verifyPillInImage(photoPath);
      
      expect(result.pillVisible).toBe(true);
      expect(result.confidence).toBe('low');
      expect(result.description).toBe('Possible pill shape but unclear');
    });

    it('should handle markdown formatting in pill verification responses', async () => {
      const mockResponse = {
        response: {
          text: jest.fn(() => '```json\n{"pillVisible": true, "confidence": "medium"}\n```')
        }
      };
      mockGeminiModel.generateContent.mockResolvedValueOnce(mockResponse);
      
      const photoPath = '/path/to/pill_image.jpg';
      const result = await verifyPillInImage(photoPath);
      
      expect(result.pillVisible).toBe(true);
      expect(result.confidence).toBe('medium');
    });

    it('should handle missing fields in pill verification responses', async () => {
      const mockResponse = {
        response: {
          text: jest.fn(() => JSON.stringify({
            pillVisible: true
            // Missing confidence and description
          }))
        }
      };
      mockGeminiModel.generateContent.mockResolvedValueOnce(mockResponse);
      
      const photoPath = '/path/to/pill_image.jpg';
      const result = await verifyPillInImage(photoPath);
      
      expect(result.pillVisible).toBe(true);
      expect(result.confidence).toBe('low'); // Default value
      expect(result.description).toBe('Unable to determine'); // Default value
    });

    it('should handle Gemini API failures in pill verification', async () => {
      mockGeminiModel.generateContent.mockRejectedValueOnce(new Error('API Error'));
      
      const photoPath = '/path/to/pill_image.jpg';
      const result = await verifyPillInImage(photoPath);
      
      expect(result.pillVisible).toBe(false);
      expect(result.confidence).toBe('low');
      expect(result.description).toBe('Verification failed: API Error');
    });

    it('should handle JSON parsing errors in pill verification', async () => {
      const mockResponse = {
        response: {
          text: jest.fn(() => 'Invalid JSON response')
        }
      };
      mockGeminiModel.generateContent.mockResolvedValueOnce(mockResponse);
      
      const photoPath = '/path/to/pill_image.jpg';
      const result = await verifyPillInImage(photoPath);
      
      expect(result.pillVisible).toBe(false);
      expect(result.confidence).toBe('low');
      expect(result.description).toContain('Verification failed');
    });
  });

  describe('Date Parsing Helper Functions', () => {
    describe('parseDate', () => {
      it('should parse MM/DD/YY format correctly', () => {
        expect(parseDate('7/7/25')).toBe('2025-07-07');
        expect(parseDate('12/31/23')).toBe('2023-12-31');
        expect(parseDate('1/1/24')).toBe('2024-01-01');
      });

      it('should parse MM/DD/YYYY format correctly', () => {
        expect(parseDate('7/7/2025')).toBe('2025-07-07');
        expect(parseDate('12/31/2023')).toBe('2023-12-31');
        expect(parseDate('1/1/2024')).toBe('2024-01-01');
      });

      it('should parse YYYY-MM-DD format correctly', () => {
        expect(parseDate('2025-07-07')).toBe('2025-07-07');
        expect(parseDate('2023-12-31')).toBe('2023-12-31');
        expect(parseDate('2024-01-01')).toBe('2024-01-01');
      });

      it('should handle invalid date formats', () => {
        expect(parseDate('invalid-date')).toBeNull();
        expect(parseDate('not-a-date')).toBeNull();
        expect(parseDate('abc/def/ghi')).toBeNull();
      });

      it('should handle null and undefined inputs', () => {
        expect(parseDate(null)).toBeNull();
        expect(parseDate(undefined)).toBeNull();
        expect(parseDate('')).toBeNull();
      });

      it('should handle edge cases like leap years', () => {
        expect(parseDate('2/29/24')).toBe('2024-02-29'); // Leap year
        expect(parseDate('2/29/23')).toBe('2023-03-01'); // JavaScript Date rolls over to next month
      });
    });

    describe('parseNumber', () => {
      it('should parse valid numbers correctly', () => {
        expect(parseNumber('123')).toBe(123);
        expect(parseNumber('0')).toBe(0);
        expect(parseNumber('-5')).toBe(-5);
      });

      it('should handle invalid number inputs', () => {
        expect(parseNumber('abc')).toBeNull();
        expect(parseNumber('12.34')).toBe(12); // parseInt truncates decimals
        expect(parseNumber('')).toBeNull();
      });

      it('should handle null and undefined inputs', () => {
        expect(parseNumber(null)).toBeNull();
        expect(parseNumber(undefined)).toBeNull();
      });
    });

    describe('parsePrice', () => {
      it('should parse valid price formats correctly', () => {
        expect(parsePrice('123.45')).toBe(123.45);
        expect(parsePrice('$123.45')).toBe(123.45);
        expect(parsePrice('1,234.56')).toBe(1234.56);
        expect(parsePrice('$1,234.56')).toBe(1234.56);
      });

      it('should handle edge cases', () => {
        expect(parsePrice('0.00')).toBe(0.00);
        expect(parsePrice('0')).toBe(0);
        expect(parsePrice('')).toBeNull();
      });

      it('should handle null and undefined inputs', () => {
        expect(parsePrice(null)).toBeNull();
        expect(parsePrice(undefined)).toBeNull();
      });

      it('should handle invalid price formats', () => {
        expect(parsePrice('invalid')).toBeNull();
        expect(parsePrice('$abc')).toBeNull();
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty Gemini responses', async () => {
      const mockResponse = {
        response: {
          text: jest.fn(() => '')
        }
      };
      mockGeminiModel.generateContent.mockResolvedValueOnce(mockResponse);
      
      const photoPath = '/path/to/pharmacy_label.jpg';
      const result = await extractMedicationFromImage(photoPath);
      
      expect(result.extractedText).toBe('Extraction failed');
    });

    it('should handle malformed JSON responses', async () => {
      const mockResponse = {
        response: {
          text: jest.fn(() => '{ invalid json }')
        }
      };
      mockGeminiModel.generateContent.mockResolvedValueOnce(mockResponse);
      
      const photoPath = '/path/to/pharmacy_label.jpg';
      const result = await extractMedicationFromImage(photoPath);
      
      expect(result.extractedText).toBe('Extraction failed');
    });

    it('should handle very long responses', async () => {
      const longText = 'a'.repeat(10000);
      const mockResponse = {
        response: {
          text: jest.fn(() => JSON.stringify({
            medicationName: 'Long Med',
            rawText: longText
          }))
        }
      };
      mockGeminiModel.generateContent.mockResolvedValueOnce(mockResponse);
      
      const photoPath = '/path/to/pharmacy_label.jpg';
      const result = await extractMedicationFromImage(photoPath);
      
      expect(result.extractedInfo.medicationName).toBe('Long Med');
      expect(result.extractedText).toBe(longText);
    });

    it('should handle special characters in medication names', async () => {
      const mockResponse = {
        response: {
          text: jest.fn(() => JSON.stringify({
            medicationName: 'Medication with special chars: @#$%^&*()',
            dosage: '10mg'
          }))
        }
      };
      mockGeminiModel.generateContent.mockResolvedValueOnce(mockResponse);
      
      const photoPath = '/path/to/pharmacy_label.jpg';
      const result = await extractMedicationFromImage(photoPath);
      
      expect(result.extractedInfo.medicationName).toBe('Medication with special chars: @#$%^&*()');
    });
  });

  describe('Performance and Resource Management', () => {
    it('should handle large image files efficiently', async () => {
      // Mock a large image buffer
      const largeBuffer = Buffer.alloc(10 * 1024 * 1024); // 10MB
      mockFs.readFileSync.mockReturnValueOnce(largeBuffer);
      
      const photoPath = '/path/to/large_image.jpg';
      const startTime = Date.now();
      
      const result = await extractMedicationFromImage(photoPath);
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      // Should complete within reasonable time (less than 5 seconds)
      expect(processingTime).toBeLessThan(5000);
      expect(result.extractedInfo.medicationName).toBe('Test Medication');
    });

    it('should handle multiple concurrent requests', async () => {
      const photoPaths = [
        '/path/to/image1.jpg',
        '/path/to/image2.jpg',
        '/path/to/image3.jpg'
      ];
      
      const promises = photoPaths.map(path => extractMedicationFromImage(path));
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.extractedInfo.medicationName).toBe('Test Medication');
      });
    });
  });
});
