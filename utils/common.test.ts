import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import * as commonUtils from './common';

describe('String Utilities', () => {
  describe('capitalize', () => {
    it('should capitalize first letter of a word', () => {
      expect(commonUtils.capitalize('hello')).toBe('Hello');
    });
    it('should handle empty strings', () => {
      expect(commonUtils.capitalize('')).toBe('');
    });
    it('should handle single character strings', () => {
      expect(commonUtils.capitalize('a')).toBe('A');
    });
    it('should handle already capitalized strings', () => {
      expect(commonUtils.capitalize('Hello')).toBe('Hello');
    });
    it('should throw on null and undefined', () => {
      // @ts-expect-error testing invalid inputs
      expect(() => commonUtils.capitalize(null)).toThrow();
      // @ts-expect-error testing invalid inputs
      expect(() => commonUtils.capitalize(undefined)).toThrow();
    });
  });
});

describe('Object/Array Utilities', () => {
  describe('deepClone', () => {
    it('should create deep copy of simple objects', () => {
      const original = { a: 1, b: 2 };
      const cloned = commonUtils.deepClone(original);
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
    });
    it('should handle nested objects', () => {
      const original = { a: { b: { c: 1 } } };
      const cloned = commonUtils.deepClone(original);
      cloned.a.b.c = 2;
      expect(original.a.b.c).toBe(1);
    });
    it('should handle arrays', () => {
      const original = [1, [2, 3], { a: 4 }];
      const cloned = commonUtils.deepClone(original);
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
    });
    it('should handle null and undefined', () => {
      expect(commonUtils.deepClone(null)).toBeNull();
      expect(commonUtils.deepClone(undefined)).toBeUndefined();
    });
  });

  describe('isEmpty', () => {
    it('should return true for empty objects', () => {
      expect(commonUtils.isEmpty({})).toBe(true);
    });
    it('should return true for empty arrays', () => {
      expect(commonUtils.isEmpty([])).toBe(true);
    });
    it('should return true for empty strings', () => {
      expect(commonUtils.isEmpty('')).toBe(true);
    });
    it('should return true for null and undefined', () => {
      expect(commonUtils.isEmpty(null)).toBe(true);
      expect(commonUtils.isEmpty(undefined)).toBe(true);
    });
    it('should return false for non-empty values', () => {
      expect(commonUtils.isEmpty({ a: 1 })).toBe(false);
      expect(commonUtils.isEmpty([1])).toBe(false);
      expect(commonUtils.isEmpty('hello')).toBe(false);
      expect(commonUtils.isEmpty(0)).toBe(false);
    });
  });
});

describe('Type Checking Utilities', () => {
  describe('isString', () => {
    it('should return true for strings', () => {
      expect(commonUtils.isString('hello')).toBe(true);
      expect(commonUtils.isString('')).toBe(true);
      expect(commonUtils.isString(String('test'))).toBe(true);
    });
    it('should return false for non-strings', () => {
      expect(commonUtils.isString(123)).toBe(false);
      expect(commonUtils.isString({})).toBe(false);
      expect(commonUtils.isString([])).toBe(false);
      expect(commonUtils.isString(null)).toBe(false);
      expect(commonUtils.isString(undefined)).toBe(false);
    });
  });

  describe('isNumber', () => {
    it('should return true for numbers', () => {
      expect(commonUtils.isNumber(123)).toBe(true);
      expect(commonUtils.isNumber(0)).toBe(true);
      expect(commonUtils.isNumber(-123)).toBe(true);
      expect(commonUtils.isNumber(3.14)).toBe(true);
    });
    it('should return false for non-numbers', () => {
      expect(commonUtils.isNumber('123')).toBe(false);
      expect(commonUtils.isNumber(NaN)).toBe(false);
      expect(commonUtils.isNumber(Infinity)).toBe(false);
      expect(commonUtils.isNumber(null)).toBe(false);
    });
  });
});

describe('Performance and Edge Cases', () => {
  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });
    it('should delay function execution', () => {
      const mockFn = jest.fn();
      const debouncedFn = commonUtils.debounce(mockFn, 100);
      debouncedFn();
      expect(mockFn).not.toHaveBeenCalled();
      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
    it('should cancel previous calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = commonUtils.debounce(mockFn, 100);
      debouncedFn();
      debouncedFn();
      debouncedFn();
      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('throttle', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });
    it('should limit function calls', () => {
      const mockFn = jest.fn();
      const throttledFn = commonUtils.throttle(mockFn, 100);
      throttledFn();
      throttledFn();
      throttledFn();
      expect(mockFn).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(100);
      throttledFn();
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });
});

describe('Parameterized Tests', () => {
  describe('formatNumber', () => {
    const testCases = [
      { input: 1000, expected: '1,000' },
      { input: 1000000, expected: '1,000,000' },
      { input: 0, expected: '0' },
      { input: -1000, expected: '-1,000' },
      { input: 123.45, expected: '123.45' },
    ];
    it.each(testCases)('should format $input as $expected', ({ input, expected }) => {
      expect(commonUtils.formatNumber(input)).toBe(expected);
    });
  });

  describe('validateEmail', () => {
    const validEmails = [
      'test@example.com',
      'user.name@domain.co.uk',
      'user+tag@example.org',
    ];
    const invalidEmails = [
      'invalid-email',
      '@example.com',
      'test@',
      'test..test@example.com',
    ];
    it.each(validEmails)('should validate %s as valid email', (email) => {
      expect(commonUtils.validateEmail(email)).toBe(true);
    });
    it.each(invalidEmails)('should validate %s as invalid email', (email) => {
      expect(commonUtils.validateEmail(email)).toBe(false);
    });
  });
});

describe('Error Handling and Boundaries', () => {
  describe('safeParseJSON', () => {
    it('should parse valid JSON', () => {
      expect(commonUtils.safeParseJSON('{"key":"value"}')).toEqual({ key: 'value' });
    });
    it('should handle invalid JSON gracefully', () => {
      expect(commonUtils.safeParseJSON('invalid json')).toBeNull();
    });
    it('should handle empty strings', () => {
      expect(commonUtils.safeParseJSON('')).toBeNull();
    });
    it('should handle null and undefined', () => {
      expect(commonUtils.safeParseJSON(null)).toBeNull();
      expect(commonUtils.safeParseJSON(undefined)).toBeNull();
    });
  });

  describe('arrayChunk', () => {
    it('should chunk array into specified sizes', () => {
      expect(commonUtils.arrayChunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    });
    it('should handle empty arrays', () => {
      expect(commonUtils.arrayChunk([], 2)).toEqual([]);
    });
    it('should handle chunk size larger than array', () => {
      expect(commonUtils.arrayChunk([1, 2], 5)).toEqual([[1, 2]]);
    });
    it('should throw error for invalid chunk size', () => {
      expect(() => commonUtils.arrayChunk([1, 2, 3], 0)).toThrow();
      expect(() => commonUtils.arrayChunk([1, 2, 3], -1)).toThrow();
    });
  });
});

describe('Integration Tests', () => {
  describe('utility function composition', () => {
    it('should chain string utilities correctly', () => {
      const input = '  hello world  ';
      const result = commonUtils.capitalize(commonUtils.trim(input));
      expect(result).toBe('Hello world');
    });
    it('should handle complex object transformations', () => {
      const data = { users: [{ name: 'john' }, { name: 'jane' }] };
      const cloned = commonUtils.deepClone(data);
      const transformed = {
        ...cloned,
        users: cloned.users.map(user => ({
          ...user,
          name: commonUtils.capitalize(user.name),
        })),
      };
      expect(transformed.users[0].name).toBe('John');
      expect(transformed.users[1].name).toBe('Jane');
      expect(data.users[0].name).toBe('john');
    });
  });
});

describe('TypeScript Type Safety', () => {
  it('should maintain type safety in utility functions', () => {
    const stringResult: string = commonUtils.capitalize('test');
    const numberResult: number = commonUtils.clamp(5, 0, 10);
    const booleanResult: boolean = commonUtils.isEmpty({});
    expect(typeof stringResult).toBe('string');
    expect(typeof numberResult).toBe('number');
    expect(typeof booleanResult).toBe('boolean');
  });
});