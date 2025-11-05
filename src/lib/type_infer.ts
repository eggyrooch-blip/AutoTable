import type { FieldSpec } from './json_parser';

const ISO_DATE_REGEX = /^(\d{4}-\d{2}-\d{2})([ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+\-]\d{2}:?\d{2})?)?$/;
const URL_REGEX = /^https?:\/\//i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^1[3-9]\d{9}$|^\+\d{1,4}[\d\s-]+$/;
const BARCODE_REGEX = /^[A-Z0-9]{8,}$/;

function isIsoDateString(s: string): boolean {
  return ISO_DATE_REGEX.test(s);
}

function isPhoneNumber(s: string): boolean {
  return PHONE_REGEX.test(s.replace(/[\s-]/g, ''));
}

function isBarcode(s: string): boolean {
  return BARCODE_REGEX.test(s.trim().toUpperCase());
}

function isLikelyProgress(num: number): boolean {
  return num >= 0 && num <= 100;
}

function isLikelyRating(num: number): boolean {
  return num >= 0 && num <= 5;
}

function chooseStringType(s: string): string {
  if (URL_REGEX.test(s)) return 'Url';
  if (EMAIL_REGEX.test(s)) return 'Email';
  if (isPhoneNumber(s)) return 'Phone';
  if (isIsoDateString(s)) return 'DateTime';
  if (isBarcode(s)) return 'Barcode';
  return 'Text';
}

function inferPrimitiveType(value: any): string {
  if (value === null || value === undefined) return 'Text';
  
  // 数字类型推断
  if (typeof value === 'number') {
    if (isLikelyProgress(value)) return 'Progress';
    if (isLikelyRating(value)) return 'Rating';
    return 'Number';
  }
  
  // 布尔类型
  if (typeof value === 'boolean') return 'Checkbox';
  
  // 字符串类型推断
  if (typeof value === 'string') return chooseStringType(value);
  
  // 数组类型
  if (Array.isArray(value)) return 'Text';
  
  // 对象类型推断（检测特定结构）
  if (typeof value === 'object') {
    if ('id' in value && typeof value.id === 'string') return 'Text'; // 用户ID结构
    if ('longitude' in value && 'latitude' in value) return 'Location';
    if ('token' in value) return 'Attachment';
    if ('amount' in value || 'currency' in value || 'currencyCode' in value) return 'Currency';
  }
  
  return 'Text';
}

function aggregateOptions(values: any[]): string[] | undefined {
  const set = new Set<string>();
  for (const v of values) {
    if (typeof v === 'string') set.add(v);
    else if (v != null && (typeof v === 'number' || typeof v === 'boolean')) set.add(String(v));
    if (set.size > 50) return undefined;
  }
  return Array.from(set);
}

function getSuggestedTypes(value: any): string[] {
  const suggestions = new Set<string>();
  
  if (value === null || value === undefined) {
    suggestions.add('Text');
    return Array.from(suggestions);
  }
  
  if (typeof value === 'number') {
    suggestions.add('Number');
    if (value >= 0 && value <= 100) suggestions.add('Progress');
    if (value >= 0 && value <= 5) suggestions.add('Rating');
    suggestions.add('Currency');
    return Array.from(suggestions);
  }
  
  if (typeof value === 'boolean') {
    suggestions.add('Checkbox');
    return Array.from(suggestions);
  }
  
  if (typeof value === 'string') {
    suggestions.add('Text');
    suggestions.add('SingleSelect');
    if (URL_REGEX.test(value)) suggestions.add('Url');
    if (EMAIL_REGEX.test(value)) suggestions.add('Email');
    if (isPhoneNumber(value)) suggestions.add('Phone');
    if (isBarcode(value)) suggestions.add('Barcode');
    if (isIsoDateString(value)) suggestions.add('DateTime');
    return Array.from(suggestions);
  }
  
  if (Array.isArray(value)) {
    const options = aggregateOptions(value);
    if (options && options.length > 0) {
      suggestions.add('MultiSelect');
    }
    suggestions.add('Text');
    return Array.from(suggestions);
  }
  
  if (typeof value === 'object') {
    suggestions.add('Text');
    if ('id' in value && typeof value.id === 'string') {
      suggestions.add('SingleLink');
      suggestions.add('DuplexLink');
    }
    if ('longitude' in value && 'latitude' in value) suggestions.add('Location');
    if ('token' in value) suggestions.add('Attachment');
    if ('amount' in value || 'currency' in value || 'currencyCode' in value) suggestions.add('Currency');
    return Array.from(suggestions);
  }
  
  suggestions.add('Text');
  return Array.from(suggestions);
}

export function inferFieldsFromRecords(records: Array<Record<string, any>>): FieldSpec[] {
  const fieldMap = new Map<string, { type: string; suggestedTypes?: string[]; options?: string[] }>();
  for (const rec of records) {
    if (!rec || typeof rec !== 'object') continue;
    for (const key of Object.keys(rec)) {
      const val = (rec as any)[key];
      let type: string;
      let suggestedTypes: string[] = [];
      
      if (Array.isArray(val)) {
        // 数组：若为小规模字符串集合 -> MultiSelect，否则 Text
        const options = aggregateOptions(val);
        if (options && options.length > 0) {
          type = 'MultiSelect';
          const prev = fieldMap.get(key);
          const merged = new Set([...(prev?.options || []), ...options]);
          fieldMap.set(key, { type, suggestedTypes: ['MultiSelect', 'Text'], options: Array.from(merged).slice(0, 50) });
          continue;
        }
        type = 'Text';
        suggestedTypes = ['Text'];
      } else {
        type = inferPrimitiveType(val);
        suggestedTypes = getSuggestedTypes(val);
      }
      
      const prev = fieldMap.get(key);
      if (!prev) {
        fieldMap.set(key, { type, suggestedTypes });
      } else {
        // 重要：合并候选类型时，保留所有可能的值
        const mergedSuggestions = new Set([...(prev.suggestedTypes || []), ...suggestedTypes]);
        // 只有当类型完全一致时才保留原类型，否则降级为Text但合并所有候选类型
        if (prev.type !== type) {
          fieldMap.set(key, { type: 'Text', suggestedTypes: Array.from(mergedSuggestions), options: prev.options });
        } else {
          fieldMap.set(key, { type, suggestedTypes: Array.from(mergedSuggestions), options: prev.options });
        }
      }
    }
  }
  return Array.from(fieldMap.entries()).map(([name, v]) => ({ name, type: v.type, options: v.options, suggestedTypes: v.suggestedTypes }));
}


