type RecordSource =
  | { kind: 'root'; unique_key?: string }
  | { kind: 'child'; path: string; parent_key?: string };

type FieldSummary = {
  target: string;
  type: string;
  source: string;
};

type ChildTableSummary = {
  key: string;
  table_name: string;
  record_source: RecordSource;
  fields: FieldSummary[];
  records?: Array<Record<string, any>>;
  app_token_key?: string;
};

type MasterSummary = {
  key: string;
  table_name: string;
  record_source: RecordSource;
  fields: FieldSummary[];
  records?: Array<Record<string, any>>;
  app_token_key?: string;
};

export type GeneratedSpec = {
  entity: string;
  version: string;
  description: string;
  source_root: string;
  tables: Array<MasterSummary | ChildTableSummary>;
};

function isPlainObject(value: unknown): value is Record<string, any> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function extractDataList(jsonData: any, sourceRoot: string): any[] {
  const isObjectArray = (arr: any[]): boolean => arr.some(item => isPlainObject(item));

  if (!sourceRoot || sourceRoot === 'auto' || sourceRoot === 'data') {
    const keys = [
      'data',
      'result',
      'results',
      'list',
      'items',
      'records',
      'rows',
      'content',
      'value',
      'values',
      'payload',
      'body',
      'response',
      'object',
      'node',
      'nodes',
      'edges',
      'hits',
      'documents',
      'page',
      'dataset',
      'entry',
      'resource',
      'resources',
      'info',
      'detail',
      'output',
      'meta',
      'contentData',
      'dataList',
      'resultList',
      'resultSet',
      'dataSet',
    ];
    for (const key of keys) {
      if (isPlainObject(jsonData) && Array.isArray(jsonData[key])) {
        const arr = jsonData[key];
        if (isObjectArray(arr)) return arr;
      }
    }
    if (Array.isArray(jsonData) && isObjectArray(jsonData)) {
      return jsonData;
    }
  } else {
    const parts = sourceRoot.split('.');
    let cursor = jsonData;
    for (const part of parts) {
      if (!isPlainObject(cursor)) {
        cursor = undefined;
        break;
      }
      cursor = cursor?.[part];
    }
    if (Array.isArray(cursor) && isObjectArray(cursor)) {
      return cursor;
    }
  }

  if (isPlainObject(jsonData)) {
    for (const value of Object.values(jsonData)) {
      if (Array.isArray(value) && isObjectArray(value)) return value;
    }
  }
  if (isPlainObject(jsonData)) {
    return [jsonData];
  }
  return Array.isArray(jsonData) && isObjectArray(jsonData) ? jsonData : [];
}

function flattenRecord(obj: Record<string, any> | undefined | null, prefix = ''): Record<string, any> {
  const output: Record<string, any> = {};
  if (!obj) return output;
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (isPlainObject(value)) {
      Object.assign(output, flattenRecord(value, path));
    } else {
      output[path] = value;
    }
  }
  return output;
}

const ISO_DATETIME =
  /^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+\-]\d{2}:?\d{2})?)?$/;

function detectType(value: any): string {
  if (value === null || value === undefined) return 'text';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'checkbox';
  if (typeof value === 'string') {
    if (ISO_DATETIME.test(value)) return 'datetime';
    return 'text';
  }
  if (Array.isArray(value)) return 'text';
  if (isPlainObject(value)) {
    if ('longitude' in value && 'latitude' in value) return 'location';
    if ('token' in value) return 'attachment';
  }
  return 'text';
}

function sampleArray<T>(input: T[], limit = 200): T[] {
  if (!Array.isArray(input)) return [];
  if (input.length <= limit) return [...input];
  return input.slice(0, limit);
}

function analyseStructure(dataList: any[]) {
  const sample = sampleArray(dataList, 200);
  const childTables = new Map<string, any[]>();
  const masterFieldTypes = new Map<string, string>();
  const masterRecords: Array<Record<string, any>> = [];
  const childRecordMap = new Map<string, Array<Record<string, any>>>();

  for (const rec of sample) {
    if (!isPlainObject(rec)) continue;
    for (const [key, value] of Object.entries(rec)) {
      if (Array.isArray(value) && value.length && isPlainObject(value[0])) {
        const bucket = childTables.get(key) ?? [];
        bucket.push(...value.slice(0, 50));
        childTables.set(key, bucket);
      }
    }
    const flat = flattenRecord(rec);
    masterRecords.push(flat);
    for (const [key, value] of Object.entries(flat)) {
      if (!masterFieldTypes.has(key)) masterFieldTypes.set(key, detectType(value));
    }
  }

  const fields: FieldSummary[] = [];
  for (const [name, type] of masterFieldTypes.entries()) {
    fields.push({ target: name, source: name, type });
  }

  const children: ChildTableSummary[] = [];
  for (const [name, rows] of childTables.entries()) {
    const fieldTypes = new Map<string, string>();
    const flattenedRows: Array<Record<string, any>> = [];
    for (const row of rows) {
      if (!isPlainObject(row)) continue;
      const flat = flattenRecord(row);
      flattenedRows.push(flat);
      for (const [key, value] of Object.entries(flat)) {
        if (!fieldTypes.has(key)) fieldTypes.set(key, detectType(value));
      }
    }
    const childFields: FieldSummary[] = [];
    for (const [fname, ftype] of fieldTypes.entries()) {
      childFields.push({ target: fname, source: fname, type: ftype });
    }
    children.push({
      key: name,
      table_name: name,
      record_source: { kind: 'child', path: name, parent_key: 'id' },
      fields: childFields,
    });
    childRecordMap.set(name, flattenedRows.slice(0, 200));
  }

  return {
    fields,
    child_tables: children,
    master_records: masterRecords,
    child_records_map: childRecordMap,
  };
}

export function generateSpecFromJson(
  jsonData: any,
  entity = 'order',
  sourceRoot = 'auto'
): GeneratedSpec {
  const dataList = extractDataList(jsonData, sourceRoot);
  const structure = analyseStructure(Array.isArray(dataList) ? dataList : []);

  const masterTable: MasterSummary = {
    key: 'master',
    table_name: '主表',
    app_token_key: 'default',
    record_source: { kind: 'root', unique_key: 'id' },
    fields: structure.fields,
    records: structure.master_records,
  };

  const tables: GeneratedSpec['tables'] = [masterTable];

  for (const child of structure.child_tables) {
    const records = structure.child_records_map.get(child.key) ?? [];
    tables.push({
      ...child,
      app_token_key: 'default',
      records,
    });
  }

  return {
    entity,
    version: '2025.01.01',
    description: `${entity} ingestion mapping`,
    source_root: sourceRoot,
    tables,
  };
}
