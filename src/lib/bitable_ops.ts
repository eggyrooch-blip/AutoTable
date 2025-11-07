import { bitable, FieldType } from '@lark-base-open/js-sdk';
import type { Table, TableMeta } from '@lark-base-open/js-sdk';
import type { FieldSpec, TableSpec } from './json_parser';
import { normalizeName, resolveNameConflict } from './utils';

type Logger = (msg: string) => void;

type FieldMeta = { id: string; name: string; type?: number };

export type FieldMapping = Record<string, Record<string, string>>;

type MaterializeOptions = {
  insertSample?: boolean;
  sampleSize?: number;
  writeAll?: boolean;
  createOnly?: boolean;
  writeOnly?: boolean;
  fieldMapping?: Record<string, string>;
  onFieldResolved?: (fieldKey: string, fieldId: string, fieldLabel: string) => void;
  onTableCreated?: (tableName: string, tableId: string) => void;
  onRecordsInserted?: (tableName: string, recordIds: string[]) => void;
};

type PipelineOptions = {
  insertSample?: boolean;
  sampleSize?: number;
  writeAll?: boolean;
  createOnly?: boolean;
  writeOnly?: boolean;
  fieldMapping?: FieldMapping;
  onFieldResolved?: (tableName: string, fieldKey: string, fieldId: string, fieldLabel: string) => void;
  onTableCreated?: (tableName: string, tableId: string) => void;
  onRecordsInserted?: (tableName: string, recordIds: string[]) => void;
};

async function listTableNames(): Promise<string[]> {
  const metas = (await bitable.base.getTableMetaList()) as TableMeta[];
  return metas.map((meta: TableMeta) => meta.name);
}

export async function createTable(tableName: string, log?: Logger): Promise<Table> {
  const desired = normalizeName(tableName);
  const finalName = await resolveNameConflict(listTableNames, desired, '_dup');
  log?.(`创建数据表: ${finalName}`);
  const addRes = await bitable.base.addTable({ name: finalName, fields: [] });
  const table = await bitable.base.getTableById(addRes.tableId);
  try {
    const meta = await table.getMeta?.();
    if (meta?.id) {
      log?.(`  数据表ID: ${meta.id}`);
    }
  } catch {}
  return table;
}

export async function getTableByName(tableName: string): Promise<Table> {
  const metas = (await bitable.base.getTableMetaList()) as TableMeta[];
  const meta = metas.find((item: TableMeta) => item.name === tableName);
  if (!meta) throw new Error(`未找到数据表: ${tableName}`);
  return await bitable.base.getTableById(meta.id);
}

function mapToFieldType(t: string): number {
  switch (t) {
    case 'Number': return FieldType.Number;
    case 'Checkbox': return FieldType.Checkbox;
    case 'DateTime': return FieldType.DateTime;
    case 'SingleSelect': return FieldType.SingleSelect;
    case 'MultiSelect': return FieldType.MultiSelect;
    case 'Url': return FieldType.Url;
    case 'User': return FieldType.User;
    case 'Phone': return FieldType.Phone;
    case 'Attachment': return FieldType.Attachment;
    case 'SingleLink': return FieldType.SingleLink;
    case 'Lookup': return FieldType.Lookup;
    case 'Formula': return FieldType.Formula;
    case 'DuplexLink': return FieldType.DuplexLink;
    case 'Location': return FieldType.Location;
    case 'GroupChat': return FieldType.GroupChat;
    case 'CreatedTime': return FieldType.CreatedTime;
    case 'ModifiedTime': return FieldType.ModifiedTime;
    case 'CreatedUser': return FieldType.CreatedUser;
    case 'ModifiedUser': return FieldType.ModifiedUser;
    case 'AutoNumber': return FieldType.AutoNumber;
    case 'Email': return FieldType.Email;
    case 'Barcode': return FieldType.Barcode;
    case 'Progress': return FieldType.Progress;
    case 'Currency': return FieldType.Currency;
    case 'Rating': return FieldType.Rating;
    default: return FieldType.Text;
  }
}

async function createFieldInternal(table: Table, field: FieldSpec & { label?: string }, log?: Logger) {
  const desired = normalizeName(field.label || field.name);
  const existing = await table.getFieldMetaList();
  const existingNames = new Set<string>(existing.map((m: any) => m.name.toLowerCase()));
  let finalName = desired;
  if (existingNames.has(finalName.toLowerCase())) {
    let i = 1;
    while (existingNames.has((i === 1 ? `${desired}_dup` : `${desired}_dup${i}`).toLowerCase())) i++;
    finalName = i === 1 ? `${desired}_dup` : `${desired}_dup${i}`;
  }

  const type = field.type;
  log?.(`  创建字段: ${finalName} (${type})`);
  const fieldType = mapToFieldType(type);
  const payload: any = { name: finalName, type: fieldType };
  if (fieldType === FieldType.SingleSelect || fieldType === FieldType.MultiSelect) {
    payload.property = { options: (field.options || []).map((n) => ({ name: n })) };
  }
  return await table.addField(payload);
}

function coerceCellValue(type: string, value: any) {
  if (value == null) return null;
  
  // 优化：空数组统一转为null，避免写入无意义的JSON字符串
  if (Array.isArray(value) && value.length === 0) {
    return null;
  }
  
  switch (type) {
    case 'Number':
    case 'Progress':
    case 'Rating':
    case 'Currency':
      return typeof value === 'number' ? value : Number(value);
    case 'Checkbox':
      return Boolean(value);
    case 'DateTime':
      return typeof value === 'string' ? value : String(value);
    case 'Url':
    case 'Email':
    case 'Phone':
    case 'Barcode':
      return typeof value === 'string' ? value : String(value);
    case 'Location':
      return typeof value === 'object' && value.longitude && value.latitude 
        ? { location: `${value.longitude},${value.latitude}` }
        : JSON.stringify(value);
    case 'Attachment':
      return typeof value === 'object' && 'token' in value ? value : JSON.stringify(value);
    case 'SingleSelect':
    case 'MultiSelect':
      // 最小实现：直接用原字符串，未知项由 Base 自动创建或忽略
      if (Array.isArray(value)) return value.map(v => String(v));
      return String(value);
    default:
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
  }
}

function getByPath(obj: any, path: string) {
  try {
    if (!obj) return undefined;
    if (!path) return obj;
    const parts = path.split('.');
    let cur = obj;
    for (const p of parts) {
      if (cur == null) return undefined;
      cur = cur[p];
    }
    return cur;
  } catch { return undefined; }
}

export async function materializeTable(
  spec: TableSpec & { fields: Array<FieldSpec & { label?: string }> },
  options: MaterializeOptions = {},
  log?: Logger
) {
  let table: Table;
  if (options.writeOnly) {
    try {
      table = await getTableByName(spec.name);
    } catch {
      log?.(`未找到现有数据表 ${spec.name}，自动创建`);
      table = await createTable(spec.name, log);
      try {
        const meta = await table.getMeta?.();
        if (meta?.id) options.onTableCreated?.(spec.name, meta.id);
      } catch {
        options.onTableCreated?.(spec.name, spec.name);
      }
    }
  } else {
    table = await createTable(spec.name, log);
    try {
      const meta = await table.getMeta?.();
      if (meta?.id) options.onTableCreated?.(spec.name, meta.id);
      else options.onTableCreated?.(spec.name, spec.name);
    } catch {
      options.onTableCreated?.(spec.name, spec.name);
    }
  }

  const tableFieldMapping: Record<string, string> = options.fieldMapping ? { ...options.fieldMapping } : {};
  const desiredFields = spec.fields
    .filter(f => (f as any).__enabled !== false)
    .map(f => ({
      spec: f,
      key: (f as any).key || f.name,
      label: (f as any).label || f.name,
      source: f.source || f.name,
      type: f.type,
      options: f.options,
    }));

  const refreshMeta = async () => {
    const metas = (await table.getFieldMetaList()) as FieldMeta[];
    const byId = new Map<string, FieldMeta>();
    const byName = new Map<string, FieldMeta>();
    for (const meta of metas) {
      byId.set(meta.id, meta);
      byName.set(meta.name.toLowerCase(), meta);
    }
    return { metas, byId, byName };
  };

  let { metas, byId: metasById, byName: metasByName } = await refreshMeta();
  const fieldIdCache = new Map<string, string>();

  const resolveFieldId = async (
    key: string,
    label: string,
    source: string | undefined,
    fieldSpec: FieldSpec & { label?: string }
  ): Promise<string | undefined> => {
    const mappingCandidate = tableFieldMapping[key];
    if (mappingCandidate && metasById.has(mappingCandidate)) {
      return mappingCandidate;
    }

    const labelLower = label.toLowerCase();
    const exact = metasByName.get(labelLower);
    if (exact) return exact.id;

    const normalizedLabel = normalizeName(label);
    const normalizedMatch = metas.find((meta: FieldMeta) => normalizeName(meta.name) === normalizedLabel);
    if (normalizedMatch) return normalizedMatch.id;

    if (source) {
      const sourceLower = source.toLowerCase();
      const sourceMatch = metasByName.get(sourceLower);
      if (sourceMatch) return sourceMatch.id;
    }

    try {
      const creationRes = await createFieldInternal(table, { ...fieldSpec, label }, log);
      const createdId =
        typeof creationRes === 'string'
          ? creationRes
          : creationRes?.fieldId || creationRes?.id;
      ({ metas, byId: metasById, byName: metasByName } = await refreshMeta());
      if (createdId && metasById.has(createdId)) {
        return createdId;
      }
      const refreshNormalized = metas.find((meta: FieldMeta) => normalizeName(meta.name) === normalizedLabel);
      if (refreshNormalized) return refreshNormalized.id;
    } catch (error) {
      log?.(`  字段创建失败 ${label}: ${(error as Error).message}`);
    }
    return undefined;
  };

  for (const field of desiredFields) {
    const fieldId = await resolveFieldId(field.key, field.label, field.source, field.spec);
    if (fieldId) {
      fieldIdCache.set(field.key, fieldId);
      options.onFieldResolved?.(field.key, fieldId, field.label);
    } else {
      log?.(`  字段无法定位: ${field.label}`);
    }
  }

  const shouldWrite = !options.createOnly && (options.writeAll || (options.insertSample ?? false));
  const sampleSize = options.sampleSize ?? 100;
  if (shouldWrite && spec.records && spec.records.length) {
    const rows = options.writeAll ? spec.records : spec.records.slice(0, sampleSize);
    const payloads: Array<{ fields: Record<string, any> }> = [];
    const insertedIds: string[] = [];
    for (const rec of rows) {
      const fields: Record<string, any> = {};
      for (const desired of desiredFields) {
        const fieldId = fieldIdCache.get(desired.key);
        if (!fieldId) continue;
        const rawVal = desired.source in rec ? rec[desired.source] : getByPath(rec, desired.source);
        fields[fieldId] = coerceCellValue(desired.type, rawVal);
      }
      if (Object.keys(fields).length > 0) {
        payloads.push({ fields });
      }
    }
    const BATCH_SIZE = 50;
    for (let i = 0; i < payloads.length; i += BATCH_SIZE) {
      const chunk = payloads.slice(i, i + BATCH_SIZE);
      try {
        const res = await table.addRecords(chunk);
        if (Array.isArray(res)) insertedIds.push(...res);
      } catch (e) {
        log?.(`  批量插入失败（${chunk.length} 条）: ${(e as Error).message}; 尝试逐条写入`);
        for (const item of chunk) {
          try {
            const res = await table.addRecords([item]);
            if (Array.isArray(res)) insertedIds.push(...res);
          } catch (singleErr) {
            log?.(`    插入失败: ${(singleErr as Error).message}`);
          }
        }
      }
    }
    if (insertedIds.length) {
      options.onRecordsInserted?.(spec.name, insertedIds);
    }
  }
  return table;
}

export async function runPipeline(
  specs: Array<TableSpec & { fields: Array<FieldSpec & { label?: string }> }>,
  options: PipelineOptions = {},
  log?: Logger
) {
  for (const spec of specs) {
    try {
      await materializeTable(
        spec,
        {
          insertSample: options.insertSample,
          sampleSize: options.sampleSize,
          writeAll: options.writeAll,
          createOnly: options.createOnly,
          writeOnly: options.writeOnly,
          fieldMapping: options.fieldMapping?.[spec.name],
          onFieldResolved: (fieldKey, fieldId, fieldLabel) => {
            options.onFieldResolved?.(spec.name, fieldKey, fieldId, fieldLabel);
          },
          onTableCreated: (tableName, tableId) => {
            options.onTableCreated?.(tableName, tableId);
          },
          onRecordsInserted: (tableName, recordIds) => {
            options.onRecordsInserted?.(tableName, recordIds);
          },
        },
        log
      );
      log?.(`完成: ${spec.name}`);
    } catch (e) {
      log?.(`失败: ${spec.name} - ${(e as Error).message}`);
    }
  }
}


function cloneFieldMapping(mapping: FieldMapping | undefined): FieldMapping {
  const result: FieldMapping = {};
  if (!mapping) return result;
  for (const [tableName, fieldMap] of Object.entries(mapping)) {
    result[tableName] = { ...fieldMap };
  }
  return result;
}

function resolveFieldIdFromMeta(
  key: string,
  label: string,
  source: string | undefined,
  tableMapping: Record<string, string>,
  metas: FieldMeta[],
  metasById: Map<string, FieldMeta>,
  metasByName: Map<string, FieldMeta>
): string | undefined {
  let candidate = tableMapping[key];
  if (candidate && metasById.has(candidate)) return candidate;

  const labelLower = label.toLowerCase();
  const exact = metasByName.get(labelLower);
  if (exact) return exact.id;

  const normalizedLabel = normalizeName(label);
  const normalizedMatch = metas.find((meta: any) => normalizeName(meta.name) === normalizedLabel);
  if (normalizedMatch) return normalizedMatch.id;

  if (source) {
    const sourceLower = source.toLowerCase();
    const sourceMatch = metasByName.get(sourceLower);
    if (sourceMatch) return sourceMatch.id;
  }
  return undefined;
}

export async function syncFieldDifferences(
  specs: Array<TableSpec & { fields: Array<FieldSpec & { label?: string }> }>,
  options: { fieldMapping?: FieldMapping } = {},
  log?: Logger
): Promise<FieldMapping> {
  const mapping = cloneFieldMapping(options.fieldMapping);

  for (const spec of specs) {
    let table: Table;
    try {
      table = await getTableByName(spec.name);
    } catch (error) {
      log?.(`跳过同步（未找到数据表）: ${spec.name}`);
      continue;
    }

    const metas = (await table.getFieldMetaList()) as FieldMeta[];
    const metasById = new Map<string, FieldMeta>();
    const metasByName = new Map<string, FieldMeta>();
    for (const meta of metas) {
      metasById.set(meta.id, meta);
      metasByName.set(meta.name.toLowerCase(), meta);
    }

    const tableMapping = mapping[spec.name] ?? {};
    mapping[spec.name] = tableMapping;

    const desiredEnabled = spec.fields
      .filter(f => (f as any).__enabled !== false)
      .map(f => ({
        key: (f as any).key || f.name,
        label: (f as any).label || f.name,
        source: f.source || f.name,
        spec: f,
      }));

    const disabledFields = spec.fields
      .filter(f => (f as any).__enabled === false)
      .map(f => ({
        key: (f as any).key || f.name,
        label: (f as any).label || f.name,
        source: f.source || f.name,
      }));

    for (const field of desiredEnabled) {
      const fieldId = resolveFieldIdFromMeta(
        field.key,
        field.label,
        field.source,
        tableMapping,
        metas,
        metasById,
        metasByName
      );
      if (!fieldId) {
        log?.(`  未找到可同步字段: ${field.label}`);
        continue;
      }
      tableMapping[field.key] = fieldId;
      const meta = metasById.get(fieldId);
      if (meta && meta.name !== field.label) {
        try {
          await table.setField(fieldId, { name: field.label });
          log?.(`  字段重命名成功: ${meta.name} -> ${field.label}`);
          metasByName.delete(meta.name.toLowerCase());
          meta.name = field.label;
          metasByName.set(field.label.toLowerCase(), meta);
        } catch (error) {
          log?.(`  字段重命名失败 ${field.label}: ${(error as Error).message}`);
        }
      }
    }

    for (const field of disabledFields) {
      const fieldId = resolveFieldIdFromMeta(
        field.key,
        field.label,
        field.source,
        tableMapping,
        metas,
        metasById,
        metasByName
      );
      if (!fieldId) {
        log?.(`  未找到可删除字段: ${field.label}`);
        continue;
      }
      try {
        const success = await table.deleteField(fieldId);
        if (success) {
          log?.(`  已删除字段: ${field.label}`);
          delete tableMapping[field.key];
          metasById.delete(fieldId);
          metasByName.delete(field.label.toLowerCase());
        }
      } catch (error) {
        log?.(`  删除字段失败 ${field.label}: ${(error as Error).message}`);
      }
    }

    const specKeys = new Set(spec.fields.map(f => (f as any).key || f.name));
    for (const key of Object.keys(tableMapping)) {
      if (!specKeys.has(key)) delete tableMapping[key];
    }

    if (Object.keys(tableMapping).length === 0) {
      delete mapping[spec.name];
    }
  }

  return mapping;
}
