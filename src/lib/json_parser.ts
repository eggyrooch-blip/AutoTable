export type FieldSpec = {
  name: string;
  type: string;
  options?: string[];
  key?: string;
  source?: string;
};

export type TableSpec = {
  name: string;
  fields: FieldSpec[];
  records?: Array<Record<string, any>>;
};

export type ParseResult = {
  tables: TableSpec[];
  warnings: string[];
};

function tryParse(jsonText: string): any {
  try {
    return JSON.parse(jsonText);
  } catch (e) {
    // 兼容偶发性结尾逗号等（最小实现不做容错）
    throw new Error(`JSON 解析失败: ${(e as Error).message}`);
  }
}

function unwrapCommonContainers(obj: any): any {
  if (obj == null) return obj;
  if (Array.isArray(obj)) return obj;
  if (typeof obj !== 'object') return obj;

  const candidateKeys = ['data', 'result', 'payload', 'records', 'items', 'list'];
  for (const key of candidateKeys) {
    if (obj && Object.prototype.hasOwnProperty.call(obj, key)) {
      const inner = (obj as any)[key];
      if (inner != null) return inner;
    }
  }
  return obj;
}

function isArrayOfObjects(x: any): x is Array<Record<string, any>> {
  return Array.isArray(x) && x.length > 0 && x.every(it => it && typeof it === 'object' && !Array.isArray(it));
}

function topLevelObjectHasObjectArrays(x: any): string[] {
  if (!x || typeof x !== 'object' || Array.isArray(x)) return [];
  const keys = Object.keys(x);
  const res: string[] = [];
  for (const k of keys) {
    const v = (x as any)[k];
    if (isArrayOfObjects(v)) res.push(k);
  }
  return res;
}

function sampleRecords<T>(arr: T[], max = 200): T[] {
  if (!Array.isArray(arr)) return [];
  if (arr.length <= max) return arr;
  return arr.slice(0, max);
}

export function parseInputToSpecs(input: string): ParseResult {
  const warnings: string[] = [];
  const raw = tryParse(input);
  let unwrapped = unwrapCommonContainers(raw);

  // 二次解包（常见 data.result 等套娃）
  if (unwrapped && typeof unwrapped === 'object' && !Array.isArray(unwrapped)) {
    const maybe = unwrapCommonContainers(unwrapped);
    if (maybe !== unwrapped) unwrapped = maybe;
  }

  // 1) 顶层数组 → 单表
  if (isArrayOfObjects(unwrapped)) {
    const records = sampleRecords(unwrapped);
    return {
      tables: [{ name: 'auto_table', fields: [], records }],
      warnings,
    };
  }

  // 2) 顶层对象包含多个数组对象 → 多表
  if (unwrapped && typeof unwrapped === 'object') {
    const keys = topLevelObjectHasObjectArrays(unwrapped);
    if (keys.length > 0) {
      const tables: TableSpec[] = keys.map(k => ({
        name: k,
        fields: [],
        records: sampleRecords((unwrapped as any)[k]),
      }));
      return { tables, warnings };
    }

    // 3) 其它对象 → 拍平为单条记录
    warnings.push('顶层未发现数组对象，按单条记录生成单表。');
    return {
      tables: [{ name: 'auto_table', fields: [], records: [unwrapped] }],
      warnings,
    };
  }

  warnings.push('无法识别为有效的对象/数组，返回空结果。');
  return { tables: [], warnings };
}

