import './App.css';
import React from 'react';
import JsonInput from './components/JsonInput';
import Preview from './components/Preview';
import LogPane from './components/LogPane';
import { parseInputToSpecs, type TableSpec } from './lib/json_parser';
import { inferFieldsFromRecords } from './lib/type_infer';
import { runPipeline, syncFieldDifferences, FieldMapping, getTableByName } from './lib/bitable_ops';
import { generateSpecFromJson } from './lib/spec_generator';
import { bitable } from '@lark-base-open/js-sdk';
import { DataFormat, ActualDataFormat, getFormatLabel } from './lib/data_formats';
import {
  detectFormat,
  isPlainObject,
  parseDelimitedText,
  parseLogData,
  parseYamlData,
} from './lib/parsers';
import { DEFAULT_MOCK_DATASET, getRandomMockDataset, MockDataset } from './lib/mock_data';

type UIState = {
  lang?: 'zh' | 'en';
  theme?: 'light' | 'dark';
  activeTab?: number;
};

type SelectionInfo = {
  tableId?: string;
  viewId?: string;
  recordId?: string;
};

type FieldMetaSnapshot = {
  id: string;
  name: string;
  type: number;
  property?: any;
  mappingKeys: string[];
};

type TableSnapshot = {
  tableName: string;
  tableId?: string;
  existed: boolean;
  fields: FieldMetaSnapshot[];
  insertedRecordIds: string[];
};

type Snapshot = {
  timestamp: number;
  description: string;
  tables: TableSnapshot[];
  createdTables: Array<{ tableName: string; tableId?: string }>;
  fieldMapping: FieldMapping;
};

type TableSchemaInfo = {
  signature: string;
  fields: Array<{ key: string; type: string }>;
};

type TableTarget =
  | { mode: 'auto' }
  | { mode: 'existing'; tableId: string; tableName: string };

type ResolvedTableSpec = TableSpec & { __sourceName: string };

function isRecord(value: any): value is Record<string, any> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function tryParseEmbeddedJson(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const firstChar = trimmed[0];
  if (firstChar !== '{' && firstChar !== '[') return null;
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function normalizeEmbeddedJson(value: any, depth = 0): any {
  if (depth > 6) return value;
  if (Array.isArray(value)) {
    return value.map(item => normalizeEmbeddedJson(item, depth + 1));
  }
  if (isRecord(value)) {
    const next: Record<string, any> = {};
    for (const [key, val] of Object.entries(value)) {
      next[key] = normalizeEmbeddedJson(val, depth + 1);
    }
    return next;
  }
  if (typeof value === 'string') {
    const parsed = tryParseEmbeddedJson(value);
    if (parsed) {
      return normalizeEmbeddedJson(parsed, depth + 1);
    }
  }
  return value;
}

type ApplyTextOptions = {
  persistOverride?: boolean;
  detectionFormat?: DataFormat | ActualDataFormat;
};

const buildMockNotice = (dataset: MockDataset): string => {
  const formatLabel = getFormatLabel(dataset.format);
  return `当前展示的是示例数据（格式：${formatLabel}）「${dataset.label}」。${dataset.description} 请在正式操作前替换为业务真实数据或直接编辑输入框。`;
};



export default function App() {
  const [text, setText] = React.useState('');
  const [logs, setLogs] = React.useState<string[]>([]);
  const [warnings, setWarnings] = React.useState<string[]>([]);
  const [tables, setTables] = React.useState<any[]>([]);
  const [inputFormat, setInputFormat] = React.useState<DataFormat>('auto');
  const [autoDetectedFormat, setAutoDetectedFormat] = React.useState<ActualDataFormat>('json');
  const resolvedFormat: ActualDataFormat = inputFormat === 'auto' ? autoDetectedFormat : inputFormat;
  const [lang, setLang] = React.useState<'zh' | 'en'>(
    () => (typeof navigator !== 'undefined' && navigator.language.startsWith('zh') ? 'zh' : 'en')
  );
  const [activeTab, setActiveTab] = React.useState(0);
  const [parsing, setParsing] = React.useState(false);
  const [executing, setExecuting] = React.useState(false);
  const [jsonHint, setJsonHint] = React.useState<string | undefined>(undefined);
  const [theme, setTheme] = React.useState<'light' | 'dark'>(() => 'light');
  const [fieldMappings, setFieldMappings] = React.useState<FieldMapping>(() => ({}));
  const [tableSchemas, setTableSchemas] = React.useState<Record<string, TableSchemaInfo>>({});
  const [tableTargets, setTableTargets] = React.useState<Record<string, TableTarget>>({});
  const [syncing, setSyncing] = React.useState(false);
  const [undoing, setUndoing] = React.useState(false);
  const [banner, setBanner] = React.useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [selection, setSelection] = React.useState<SelectionInfo | null>(null);
  const [lastDataChangeAt, setLastDataChangeAt] = React.useState<number | null>(null);
  const [tableNames, setTableNames] = React.useState<Record<string, string>>({});
  const [snapshots, setSnapshots] = React.useState<Snapshot[]>([]);
  const [isMockData, setIsMockData] = React.useState(false);
  const [mockNotice, setMockNotice] = React.useState<string | null>(null);
  const [activeMockId, setActiveMockId] = React.useState<string | null>(null);
  const [appendOnlyMode, setAppendOnlyMode] = React.useState(false);
  const [recentLogs, setRecentLogs] = React.useState<string[]>([]);

  const persist = React.useCallback(async (key: string, value: any) => {
    try {
      await bitable.bridge.setData(key, value);
    } catch {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {}
    }
  }, []);

  const restore = React.useCallback(async <T = any,>(key: string): Promise<T | undefined> => {
    try {
      const v = await bitable.bridge.getData<T>(key);
      if (v != null) return v as T;
    } catch {}
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : undefined;
    } catch {}
    return undefined;
  }, []);

  const applyText = React.useCallback(
    (value: string, options: ApplyTextOptions = {}) => {
      const { persistOverride = true, detectionFormat } = options;
      setText(value);
      if (persistOverride) {
        persist('last_text', value);
      }
      const trimmed = value.trim();
      const effectiveFormat = detectionFormat ?? inputFormat;
      const isAutoFormat = effectiveFormat === 'auto';
      if (!trimmed) {
        setJsonHint(undefined);
        if (isAutoFormat) setAutoDetectedFormat('json');
        return;
      }

      let detected: ActualDataFormat;
      if (isAutoFormat) {
        try {
          detected = detectFormat(value);
        } catch (err: any) {
          setAutoDetectedFormat('json');
          setJsonHint(`格式可能有误（将尝试宽松模式解析）：${err?.message ?? err}`);
          return;
        }
        setAutoDetectedFormat(detected);
      } else {
        detected = effectiveFormat as ActualDataFormat;
      }

      if (detected === 'json') {
        try {
          JSON.parse(value);
          setJsonHint(undefined);
        } catch (err: any) {
          setJsonHint(`格式可能有误（将尝试宽松模式解析）：${err?.message ?? err}`);
        }
      } else if (detected === 'xml') {
        setJsonHint('检测到 XML 数据，当前版本暂不支持解析，请转换为 JSON/YAML/TSV/日志 格式。');
      } else {
        setJsonHint(undefined);
      }
    },
    [inputFormat, persist]
  );

  const uiStateRef = React.useRef<UIState>({
    lang,
    theme,
    activeTab,
  });

  const persistUIState = React.useCallback(
    (patch: Partial<UIState>) => {
      const next = { ...uiStateRef.current, ...patch };
      uiStateRef.current = next;
      persist('ui_state', next);
    },
    [persist]
  );

  const cloneFieldMapping = React.useCallback((mapping: FieldMapping): FieldMapping => {
    const next: FieldMapping = {};
    for (const [tableName, fieldMap] of Object.entries(mapping)) {
      next[tableName] = { ...fieldMap };
    }
    return next;
  }, []);

  const computeTableSchema = React.useCallback((spec: any): TableSchemaInfo | null => {
    if (!spec || !spec.name) return null;
    const rawFields = Array.isArray(spec.fields) ? spec.fields : [];
    const activeFields = rawFields.filter((f: any) => (f as any)?.__enabled !== false);
    const normalized: Array<{ key: string; type: string }> = activeFields.map((field: any) => {
      const key = (field as any)?.key || field?.name;
      const type = (field?.type || 'Text').toString();
      return { key: key || 'unknown', type };
    });
    normalized.sort((a, b) => a.key.localeCompare(b.key));
    const signature = normalized
      .map(({ key, type }: { key: string; type: string }) => `${key.toLowerCase()}::${type.toLowerCase()}`)
      .join('|') || '__empty__';
    return { signature, fields: normalized };
  }, []);

  const persistTableSchemas = React.useCallback(
    async (next: Record<string, TableSchemaInfo>) => {
      setTableSchemas(next);
      await persist('table_schemas', next);
    },
    [persist]
  );

  const recordSchemasForTables = React.useCallback(
    async (specs: any[]) => {
      const next = { ...tableSchemas };
      let changed = false;
      for (const spec of specs) {
        if (!spec?.name) continue;
        const schema = computeTableSchema(spec);
        if (!schema) continue;
        if (!next[spec.name] || next[spec.name].signature !== schema.signature) {
          next[spec.name] = schema;
          changed = true;
        }
      }
      if (changed) {
        await persistTableSchemas(next);
      }
    },
    [tableSchemas, computeTableSchema, persistTableSchemas]
  );

  const resolveTablesForPipeline = React.useCallback((): ResolvedTableSpec[] => {
    return tables.map((spec: any) => {
      const target = tableTargetsRef.current[spec.name] ?? tableTargets[spec.name];
      const effectiveName = target?.mode === 'existing' && target.tableName ? target.tableName : spec.name;
      return {
        ...spec,
        name: effectiveName,
        __sourceName: spec.name,
      } as ResolvedTableSpec;
    });
  }, [tables, tableTargets]);

  const persistFieldMappings = React.useCallback(
    async (next: FieldMapping) => {
      setFieldMappings(next);
      await persist('field_mappings', next);
    },
    [persist]
  );

  const persistTableTargets = React.useCallback(
    async (next: Record<string, TableTarget>) => {
      tableTargetsRef.current = next;
      setTableTargets(next);
      await persist('table_targets', next);
    },
    [persist]
  );

  const persistAppendOnlyMode = React.useCallback(
    async (value: boolean) => {
      appendOnlyRef.current = value;
      setAppendOnlyMode(value);
      await persist('append_only_mode', value);
    },
    [persist]
  );

  const pruneFieldMapping = React.useCallback((mapping: FieldMapping, tableSpecs: any[]) => {
    for (const table of tableSpecs) {
      if (!table || !table.name) continue;
      const tableName: string = table.name;
      const tableMap = mapping[tableName];
      if (!tableMap) continue;
      const enabledKeys = new Set<string>(
        (table.fields || [])
          .filter((f: any) => (f as any).__enabled !== false)
          .map((f: any) => (f.key || f.name) as string)
      );
      for (const key of Object.keys(tableMap)) {
        if (!enabledKeys.has(key)) {
          delete tableMap[key];
        }
      }
      if (Object.keys(tableMap).length === 0) {
        delete mapping[tableName];
      }
    }
  }, []);

  const tableNamesRef = React.useRef<Record<string, string>>({});
  const tableTargetsRef = React.useRef<Record<string, TableTarget>>({});
  const appendOnlyRef = React.useRef<boolean>(appendOnlyMode);

  const updateTableNames = React.useCallback((map: Record<string, string>) => {
    tableNamesRef.current = map;
    setTableNames(map);
  }, []);

const refreshTableNames = React.useCallback(async () => {
  try {
    const metas = await bitable.base.getTableMetaList();
    const map: Record<string, string> = {};
    metas.forEach((meta: any) => {
      map[meta.id] = meta.name;
    });
    updateTableNames(map);
    return map;
  } catch (error) {
    console.warn('获取数据表名称失败', error);
    return tableNamesRef.current;
  }
}, [updateTableNames]);

const takeSnapshot = React.useCallback(async (description: string): Promise<Snapshot> => {
  const snapshotTables: TableSnapshot[] = [];
  for (const spec of tables) {
    const sourceName = spec?.name;
    if (!sourceName) continue;
    const targetConfig = tableTargetsRef.current[sourceName] ?? tableTargets[sourceName];
    const tableName = targetConfig?.mode === 'existing' && targetConfig.tableName ? targetConfig.tableName : sourceName;
    let existed = false;
    let tableId: string | undefined;
    let fields: FieldMetaSnapshot[] = [];
    try {
      const table = await getTableByName(tableName);
      existed = true;
      try {
        const meta = await table.getMeta?.();
        if (meta?.id) tableId = meta.id;
      } catch {}
      const metas = await table.getFieldMetaList();
      const tableMapping = fieldMappings[tableName] || {};
      fields = metas.map((m: any) => ({
        id: m.id,
        name: m.name,
        type: m.type,
        property: m.property,
        mappingKeys: Object.entries(tableMapping)
          .filter(([, mappedId]) => mappedId === m.id)
          .map(([key]) => key),
      }));
    } catch {
      existed = false;
    }
    snapshotTables.push({
      tableName,
      tableId,
      existed,
      fields,
      insertedRecordIds: [],
    });
  }
  return {
    timestamp: Date.now(),
    description,
    tables: snapshotTables,
    createdTables: [],
    fieldMapping: cloneFieldMapping(fieldMappings),
  };
}, [tables, tableTargets, cloneFieldMapping, fieldMappings]);

  // 初始化主题：从多维表格获取（优先于本地存储）

  React.useEffect(() => {
    uiStateRef.current = { lang, theme, activeTab };
  }, [lang, theme, activeTab]);

  React.useEffect(() => {
    appendOnlyRef.current = appendOnlyMode;
  }, [appendOnlyMode]);

  React.useEffect(() => {
    let disposeDataChange: (() => void) | undefined;
    let disposeSelection: (() => void) | undefined;

    const init = async () => {
      const ui = await restore<UIState>('ui_state');
      if (ui) {
        if (ui.lang) setLang(ui.lang);
        if (typeof ui.activeTab === 'number') setActiveTab(ui.activeTab);
        uiStateRef.current = { ...uiStateRef.current, ...ui };
      }

      try {
        const bitableTheme = await bitable.bridge.getTheme();
        const mappedTheme = bitableTheme === 'DARK' ? 'dark' : 'light';
        setTheme(mappedTheme);
        uiStateRef.current = { ...uiStateRef.current, theme: mappedTheme };
      } catch (err) {
        console.warn('Failed to get theme from bitable:', err);
        if (ui?.theme) setTheme(ui.theme);
      }

      const savedTables = await restore<any[]>('tables_state');
      if (Array.isArray(savedTables) && savedTables.length) {
        setTables(savedTables);
      }
      const savedText = await restore<string>('last_text');
      if (typeof savedText === 'string') {
        setIsMockData(false);
        setMockNotice(null);
        setActiveMockId(null);
        applyText(savedText, { persistOverride: false });
      } else {
        const dataset = DEFAULT_MOCK_DATASET;
        setIsMockData(true);
        setMockNotice(buildMockNotice(dataset));
        setActiveMockId(dataset.id);
        setInputFormat('auto');
        setAutoDetectedFormat(dataset.format);
        applyText(dataset.content, { detectionFormat: 'auto' });
      }
      const savedMappings = await restore<FieldMapping>('field_mappings');
      if (savedMappings) {
        setFieldMappings(savedMappings);
      }
      const savedTargets = await restore<Record<string, TableTarget>>('table_targets');
      if (savedTargets) {
        tableTargetsRef.current = savedTargets;
        setTableTargets(savedTargets);
      }
      const savedAppendOnly = await restore<boolean>('append_only_mode');
      if (typeof savedAppendOnly === 'boolean') {
        appendOnlyRef.current = savedAppendOnly;
        setAppendOnlyMode(savedAppendOnly);
      }
      const savedSchemas = await restore<Record<string, TableSchemaInfo>>('table_schemas');
      if (savedSchemas) {
        setTableSchemas(savedSchemas);
      }
      await refreshTableNames();
      try {
        const sel = await bitable.base.getSelection?.();
        if (sel) setSelection(sel as SelectionInfo);
      } catch {}
    };

    init();
    const handleDataChange = () => {
      (async () => {
        setLastDataChangeAt(Date.now());
        let tableLabel = '';
        try {
          const sel = await bitable.base.getSelection?.();
          if (sel) {
            setSelection(sel as SelectionInfo);
            const tableId = sel.tableId;
            if (tableId) {
              let names = tableNamesRef.current;
              if (!names[tableId]) {
                names = await refreshTableNames();
              }
              const name = names[tableId];
              tableLabel = name ? `「${name}」(${tableId})` : `tableId=${tableId}`;
            }
          }
        } catch (error) {
          console.warn('获取数据变更详情失败', error);
        }
        const time = new Date().toLocaleTimeString();
        const message = tableLabel
          ? `${time} 检测到 ${tableLabel} 数据变更`
          : `${time} 检测到数据变更`;
        setLogs(prev => [...prev, message]);
      })();
    };

    const handleSelectionChange = (event: any) => {
      setSelection(event as SelectionInfo);
      const tableId = event?.tableId;
      if (tableId && !tableNamesRef.current[tableId]) {
        refreshTableNames();
      }
    };

    try {
      disposeDataChange = bitable.bridge.onDataChange(handleDataChange);
    } catch {}
    try {
      disposeSelection = bitable.base.onSelectionChange?.(handleSelectionChange);
    } catch {}

    return () => {
      disposeDataChange?.();
      disposeSelection?.();
    };
  }, [refreshTableNames, restore]);

  function log(line: string) {
    setLogs(prev => [...prev, line]);
    setRecentLogs(prev => {
      const next = [...prev, line];
      return next.slice(-6);
    });
  }

  const restoreSnapshot = React.useCallback(async (snapshot: Snapshot) => {
    log(`开始回滚：${snapshot.description}`);
    const restoredMapping = cloneFieldMapping(snapshot.fieldMapping);

    for (const created of snapshot.createdTables) {
      try {
        const table = await getTableByName(created.tableName);
        const meta = await table.getMeta?.();
        const tableId = meta?.id || created.tableId;
        if (tableId && (bitable.base as any).deleteTable) {
          await (bitable.base as any).deleteTable(tableId);
          log(`已删除数据表：${created.tableName}`);
        }
        delete restoredMapping[created.tableName];
      } catch (error) {
        log(`删除数据表失败 ${created.tableName}: ${(error as Error).message}`);
      }
    }

    for (const tableSnap of snapshot.tables) {
      if (!tableSnap.existed) {
        try {
          const table = await getTableByName(tableSnap.tableName);
          const meta = await table.getMeta?.();
          const tableId = meta?.id || tableSnap.tableId;
          if (tableId && (bitable.base as any).deleteTable) {
            await (bitable.base as any).deleteTable(tableId);
            log(`已移除新建数据表：${tableSnap.tableName}`);
          }
        } catch {
          // 表已不存在，忽略
        }
        delete restoredMapping[tableSnap.tableName];
        continue;
      }

      let tableInstance: any;
      try {
        tableInstance = await getTableByName(tableSnap.tableName);
      } catch {
        log(`回滚跳过：未找到数据表 ${tableSnap.tableName}`);
        continue;
      }

      if (tableSnap.insertedRecordIds.length) {
        try {
          await tableInstance.deleteRecords(tableSnap.insertedRecordIds);
          log(`  已删除新增记录：${tableSnap.insertedRecordIds.length} 条`);
        } catch (error) {
          log(`  删除新增记录失败：${(error as Error).message}`);
        }
      }

      const currentMetas = await tableInstance.getFieldMetaList();
      const snapshotById = new Map(tableSnap.fields.map(f => [f.id, f]));
      const currentById = new Map(currentMetas.map((m: any) => [m.id, m]));

      for (const meta of currentMetas) {
        const snap = snapshotById.get(meta.id);
        if (!snap) {
          try {
            await tableInstance.deleteField(meta.id);
            log(`  已删除新增字段：${meta.name}`);
          } catch (error) {
            log(`  删除字段失败 ${meta.name}: ${(error as Error).message}`);
          }
        } else if (meta.name !== snap.name) {
          try {
            await tableInstance.setField(meta.id, { name: snap.name });
            log(`  字段名称恢复：${meta.name} -> ${snap.name}`);
          } catch (error) {
            log(`  恢复字段名称失败 ${meta.name}: ${(error as Error).message}`);
          }
        }
      }

      for (const snap of tableSnap.fields) {
        if (!currentById.has(snap.id)) {
          try {
            const result = await tableInstance.addField({ name: snap.name, type: snap.type, property: snap.property });
            let createdId: string | undefined;
            if (typeof result === 'string') createdId = result;
            else if (result?.fieldId) createdId = result.fieldId;
            else if (result?.id) createdId = result.id;
            log(`  已恢复缺失字段：${snap.name}`);
            if (createdId && snap.mappingKeys.length) {
              if (!restoredMapping[tableSnap.tableName]) restoredMapping[tableSnap.tableName] = {};
              snap.mappingKeys.forEach(key => {
                restoredMapping[tableSnap.tableName][key] = createdId as string;
              });
            }
          } catch (error) {
            log(`  恢复字段失败 ${snap.name}: ${(error as Error).message}`);
          }
        }
      }
    }

    setFieldMappings(restoredMapping);
    await persistFieldMappings(restoredMapping);
    await refreshTableNames();
    setLastDataChangeAt(Date.now());
    log(`回滚完成：${snapshot.description}`);
  }, [cloneFieldMapping, persistFieldMappings, refreshTableNames, setFieldMappings, setLastDataChangeAt]);

  async function onParse() {
    if (parsing) return;
    setParsing(true);
    setLogs([]);
    setRecentLogs([]);
    try {
      const trimmed = text.trim();
      if (!trimmed) {
        throw new Error('请先粘贴或导入数据');
      }

      let formatToUse: ActualDataFormat;
      if (inputFormat === 'auto') {
        formatToUse = detectFormat(text);
        setAutoDetectedFormat(formatToUse);
      } else {
        formatToUse = inputFormat;
      }

      if (formatToUse === 'xml') {
        throw new Error('检测到 XML 数据，当前版本暂不支持解析，请转换为 JSON/YAML/TSV/日志 格式');
      }

      let payload: any;
      if (formatToUse === 'json') {
        const { parse } = await import('relaxed-json');
        payload = parse(text);
      } else if (formatToUse === 'tsv') {
        payload = parseDelimitedText(text, '\t');
      } else if (formatToUse === 'yaml') {
        payload = parseYamlData(text);
      } else if (formatToUse === 'log') {
        payload = parseLogData(text);
      }

      payload = normalizeEmbeddedJson(payload);

      if (payload == null || (Array.isArray(payload) && payload.length === 0)) {
        throw new Error('未从数据中解析出有效记录');
      }

      const flattenRecord = (rec: any) => {
        if (!rec || typeof rec !== 'object') return { value: rec };
        const flat: Record<string, any> = {};
        const walk = (obj: any, prefix = '') => {
          for (const key in obj) {
            if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
            const value = obj[key];
            const path = prefix ? `${prefix}.${key}` : key;
            if (value && typeof value === 'object' && !Array.isArray(value)) {
              walk(value, path);
            } else {
              flat[path] = value;
            }
          }
        };
        walk(rec);
        return flat;
      };

      const buildFromSpec = (spec: any): any[] => {
        if (!spec || !Array.isArray(spec.tables)) return [];
        return (spec.tables || []).map((t: any) => {
          const sourceRecords = Array.isArray(t.records) ? t.records : [];
          const flattenedRecords = sourceRecords.map((rec: any) => {
            if (rec && typeof rec === 'object' && !Array.isArray(rec)) return rec;
            return flattenRecord(rec);
          });
          const enrichedFields = inferFieldsFromRecords(flattenedRecords);
          const fieldMap = new Map(enrichedFields.map(f => [f.name, f]));
          const resolvedFields = Array.isArray(t.fields) && t.fields.length > 0
            ? t.fields.map((f: any) => {
                const name = f.target || f.name;
                const enriched = fieldMap.get(name) || { name, type: 'Text' };
                const enrichedTypes = (enriched as any).suggestedTypes || [enriched.type || 'Text'];
                const normalizedType = (() => {
                  const base = (f.type || enriched.type || 'Text').toString().toLowerCase();
                  switch (base) {
                    case 'number': return 'Number';
                    case 'datetime': return 'DateTime';
                    case 'currency': return 'Currency';
                    default: return enriched.type || 'Text';
                  }
                })();
                return {
                  ...enriched,
                  name,
                  label: f.target || f.name,
                  type: normalizedType,
                  suggestedTypes: enrichedTypes,
                  key: f.source || name,
                  source: f.source || name,
                };
              })
            : enrichedFields.map(f => ({
                ...f,
                key: (f as any).key || f.name,
                source: (f as any).source || f.name,
              }));
          return {
            name: t.table_name || t.name || '未命名表',
            fields: resolvedFields,
            records: flattenedRecords,
          };
        });
      };

      const spec = generateSpecFromJson(payload, 'order', 'auto');
      let nextTables = buildFromSpec(spec);

      if (!nextTables.length && formatToUse === 'json') {
        const parsed = parseInputToSpecs(JSON.stringify(payload));
        nextTables = parsed.tables.map(t => {
          const flattened = (t.records || []).map(flattenRecord);
          const inferred = inferFieldsFromRecords(flattened).map(f => ({
            ...f,
            key: (f as any).key || f.name,
            source: (f as any).source || f.name,
          }));
          return {
            name: t.name || 'auto_table',
            fields: inferred,
            records: flattened,
          };
        });
        setWarnings(parsed.warnings);
        log(`解析完成（基础推断）：共 ${nextTables.length} 个表`);
      } else if (!nextTables.length) {
        throw new Error('未能根据数据推断出表结构，请检查格式或内容');
      } else {
        setWarnings([]);
        log(`解析完成（${formatToUse.toUpperCase()}）共 ${nextTables.length} 个表`);
      }

      const initIdx = new Array(nextTables.length).fill(0);
      setTables(nextTables);
      const nextTargets: Record<string, TableTarget> = {};
      nextTables.forEach((t: any) => {
        if (!t?.name) return;
        const prevTarget = tableTargetsRef.current[t.name];
        nextTargets[t.name] = prevTarget ?? { mode: 'auto' };
      });
      await persistTableTargets(nextTargets);
      await persist('tables_state', nextTables);
      setActiveTab(0);
      persistUIState({ activeTab: 0 });
      (window as any).__sampleIdx = initIdx;
      setBanner({ type: 'success', text: `解析完成，共 ${nextTables.length} 个表` });
      setTimeout(() => setBanner(null), 2500);
    } catch (e: any) {
      log(`解析失败：${e.message}`);
      setBanner({ type: 'error', text: `解析失败：${e.message}` });
    } finally {
      setParsing(false);
    }
  }

  async function onExecuteWriteAll() {
    if (executing || syncing || undoing) return;
    setExecuting(true);
    setLogs([]);
    setRecentLogs([]);
    if (!tables.length) {
      log('没有可执行的表定义');
      setExecuting(false);
      return;
    }
    const resolvedTables = resolveTablesForPipeline();
    const snapshot = await takeSnapshot('写入全部数据');
    const insertedRecordMap: Record<string, string[]> = {};
    const createdTables: Array<{ tableName: string; tableId?: string }> = [];
    const isAppendOnly = appendOnlyRef.current;
    let skippedCreation = false;
    try {
      const mappingAccumulator = cloneFieldMapping(fieldMappings);
      const toCreate: ResolvedTableSpec[] = [];
      const toAppend: ResolvedTableSpec[] = [];
      const createReasons: string[] = [];
      const appendTargets: string[] = [];

      for (const spec of resolvedTables) {
        if (!spec?.name) continue;
        const originalName = spec.__sourceName;
        const targetConfig = tableTargetsRef.current[originalName] ?? tableTargets[originalName];
        let tableExists = true;
        try {
          await getTableByName(spec.name);
        } catch {
          tableExists = false;
        }

        if (targetConfig?.mode === 'existing') {
          if (!tableExists) {
            log(`目标表 ${spec.name} 未找到，将为「${originalName}」自动创建新表`);
            toCreate.push(spec);
            createReasons.push(`${originalName}（指定目标缺失）`);
          } else {
            toAppend.push(spec);
            appendTargets.push(`${originalName} → ${spec.name}`);
          }
          continue;
        }

        if (!tableExists) {
          toCreate.push(spec);
          createReasons.push(`${originalName}（新建）`);
          continue;
        }

        const schema = computeTableSchema(spec);
        if (!schema) {
          toAppend.push(spec);
          appendTargets.push(`${originalName} → ${spec.name}`);
          continue;
        }

        const mapping = fieldMappings[spec.name];
        const stored = tableSchemas[spec.name];
        const missingMapping = schema.fields.some((field) => !mapping || !mapping[field.key]);
        const signatureChanged = stored && stored.signature !== schema.signature;
        if (!mapping || !stored || missingMapping || signatureChanged) {
          let reason = '';
          if (!mapping) reason = '缺少字段映射';
          else if (!stored) reason = '无历史结构记录';
          else if (missingMapping) reason = '发现新增字段';
          else reason = '字段或类型发生变更';
          toCreate.push(spec);
          createReasons.push(`${originalName}（${reason}）`);
        } else {
          toAppend.push(spec);
          appendTargets.push(`${originalName} → ${spec.name}`);
        }
      }

      if (createReasons.length) {
        if (isAppendOnly) {
          log(`追加模式启用：以下表结构不匹配或目标缺失，已跳过写入 → ${createReasons.join('；')}`);
          skippedCreation = true;
        } else {
          log(`检测到需要新建的数据表：${createReasons.join('；')}（自动使用最新结构）`);
        }
      }
      if (appendTargets.length) {
        log(`结构一致：将在 ${appendTargets.join('、')} 中追加数据`);
      }

      const processTables = async (targetTables: ResolvedTableSpec[], writeOnly: boolean) => {
        if (!targetTables.length) return;
        await runPipeline(
          targetTables,
          {
            writeOnly,
            writeAll: true,
            fieldMapping: mappingAccumulator,
            onFieldResolved: (tableName, fieldKey, fieldId) => {
              if (!mappingAccumulator[tableName]) mappingAccumulator[tableName] = {};
              mappingAccumulator[tableName][fieldKey] = fieldId;
            },
            onTableCreated: (tableName, tableId) => {
              createdTables.push({ tableName, tableId });
            },
            onRecordsInserted: (tableName, recordIds) => {
              if (!insertedRecordMap[tableName]) insertedRecordMap[tableName] = [];
              insertedRecordMap[tableName].push(...recordIds);
            },
          },
          log
        );
      };

      if (!isAppendOnly) {
        await processTables(toCreate, false);
      }
      await processTables(toAppend, true);
      pruneFieldMapping(mappingAccumulator, resolvedTables);
      await persistFieldMappings(mappingAccumulator);
      await recordSchemasForTables(resolvedTables);
      snapshot.tables.forEach(t => {
        if (insertedRecordMap[t.tableName]?.length) {
          t.insertedRecordIds = insertedRecordMap[t.tableName];
        }
      });
      snapshot.createdTables = [...snapshot.createdTables, ...createdTables];
      setSnapshots(prev => [...prev, snapshot]);
      if (createdTables.length) {
        const summaryCreated = createdTables.map(t => t.tableName).join('、');
        log(`新建数据表：${summaryCreated}`);
      }
      if (Object.keys(insertedRecordMap).length) {
        setLastDataChangeAt(Date.now());
        const summary = Object.entries(insertedRecordMap)
          .map(([name, ids]) => `${name}（${ids.length} 条）`)
          .join('、');
        log(`写入记录：${summary}`);
      }
      if (skippedCreation) {
        setBanner({ type: 'error', text: '追加模式生效：部分表未写入，请查看日志' });
      } else {
        setBanner({ type: 'success', text: '写入全部数据完成' });
      }
      setTimeout(() => setBanner(null), 2500);
    } finally {
      setExecuting(false);
    }
  }

  async function onSyncFields() {
    if (syncing || executing || undoing) return;
    if (!tables.length) {
      log('没有可同步的表定义');
      return;
    }
    setSyncing(true);
    setLogs([]);
    setRecentLogs([]);
    const resolvedTables = resolveTablesForPipeline();
    const snapshot = await takeSnapshot('同步字段');
    const createdTables: Array<{ tableName: string; tableId?: string }> = [];
    const isAppendOnly = appendOnlyRef.current;
    let skippedCreation = false;
    try {
      const mappingAccumulator = cloneFieldMapping(fieldMappings);
      const tablesToCreate: ResolvedTableSpec[] = [];

      for (const spec of resolvedTables) {
        if (!spec?.name) continue;
        const originalName = spec.__sourceName;
        const targetConfig = tableTargetsRef.current[originalName] ?? tableTargets[originalName];
        let tableExists = true;
        try {
          await getTableByName(spec.name);
        } catch {
          tableExists = false;
        }
        if (!tableExists) {
          if (targetConfig?.mode === 'existing') {
            log(`目标表 ${spec.name} 未找到，暂未同步该表，请在「目标数据表」中重新选择或创建后重试`);
            continue;
          }
          tablesToCreate.push(spec);
        }
      }

      if (tablesToCreate.length) {
        if (isAppendOnly) {
          log(`追加模式启用：以下表缺失，未执行自动创建 → ${tablesToCreate.map(t => t.name).join('、')}`);
          skippedCreation = true;
        } else {
          await runPipeline(
            tablesToCreate,
            {
              createOnly: true,
              fieldMapping: mappingAccumulator,
              onFieldResolved: (tableName, fieldKey, fieldId) => {
                if (!mappingAccumulator[tableName]) mappingAccumulator[tableName] = {};
                mappingAccumulator[tableName][fieldKey] = fieldId;
              },
              onTableCreated: (tableName, tableId) => {
                createdTables.push({ tableName, tableId });
              },
            },
            log
          );
          const summaryCreated = tablesToCreate.map(t => t.name).join('、');
          log(`已创建缺失的数据表：${summaryCreated}`);
        }
      }

      const updatedMapping = await syncFieldDifferences(resolvedTables, { fieldMapping: mappingAccumulator }, log);
      pruneFieldMapping(updatedMapping, resolvedTables);
      await persistFieldMappings(updatedMapping);
      await recordSchemasForTables(resolvedTables);
      snapshot.createdTables = [...snapshot.createdTables, ...createdTables];
      setSnapshots(prev => [...prev, snapshot]);
      setLastDataChangeAt(Date.now());
      if (skippedCreation) {
        setBanner({ type: 'error', text: '追加模式生效：存在缺失表未同步，请检查日志' });
      } else {
        setBanner({ type: 'success', text: '字段同步完成' });
      }
      setTimeout(() => setBanner(null), 2500);
    } catch (e: any) {
      log(`字段同步失败：${e.message}`);
      setBanner({ type: 'error', text: `字段同步失败：${e.message}` });
    } finally {
      setSyncing(false);
    }
  }

  function handleFieldTypeChange(tableIdx: number, fieldIdx: number, newType: string) {
    setTables(prev => {
      const next = prev.map(t => ({ ...t, fields: t.fields.map((f: any) => ({ ...f })) }));
      next[tableIdx].fields[fieldIdx].type = newType;
      persist('tables_state', next);
      return next;
    });
  }

  function handleFieldLabelChange(tableIdx: number, fieldIdx: number, newLabel: string) {
    setTables(prev => {
      const next = prev.map(t => ({ ...t, fields: t.fields.map((f: any) => ({ ...f })) }));
      next[tableIdx].fields[fieldIdx].label = newLabel;
      persist('tables_state', next);
      return next;
    });
  }

  function handleFieldToggle(tableIdx: number, fieldIdx: number, enabled: boolean) {
    setTables(prev => {
      const next = prev.map(t => ({ ...t, fields: t.fields.map((f: any) => ({ ...f })) }));
      next[tableIdx].fields[fieldIdx].__enabled = enabled;
      persist('tables_state', next);
      return next;
    });
  }

  const handleTableTargetChange = React.useCallback(
    async (sourceName: string, target: TableTarget) => {
      const next = { ...tableTargetsRef.current, [sourceName]: target };
      await persistTableTargets(next);
    },
    [persistTableTargets]
  );

  const handleUndo = React.useCallback(async () => {
    if (executing || syncing || undoing || snapshots.length === 0) return;
    const snapshot = snapshots[snapshots.length - 1];
    setUndoing(true);
    setLogs([]);
    try {
      await restoreSnapshot(snapshot);
      setSnapshots(prev => prev.slice(0, -1));
      setBanner({ type: 'success', text: '已撤销上一次变更' });
      setTimeout(() => setBanner(null), 2500);
    } catch (error: any) {
      const message = error?.message || String(error);
      log(`回滚失败：${message}`);
      setBanner({ type: 'error', text: `回滚失败：${message}` });
    } finally {
      setUndoing(false);
    }
  }, [executing, syncing, undoing, snapshots, restoreSnapshot]);

  const handleRandomMock = React.useCallback(() => {
    const dataset = getRandomMockDataset(activeMockId ?? undefined);
    setIsMockData(true);
    setMockNotice(buildMockNotice(dataset));
    setActiveMockId(dataset.id);
    setInputFormat('auto');
    setAutoDetectedFormat(dataset.format);
    applyText(dataset.content, { detectionFormat: 'auto' });
  }, [activeMockId, applyText]);

  const handleClearInput = React.useCallback(() => {
    if (isMockData) {
      setIsMockData(false);
    }
    setMockNotice(null);
    setActiveMockId(null);
    setWarnings([]);
    setSnapshots([]);
    setInputFormat('auto');
    setAutoDetectedFormat('json');
    persistTableTargets({});
    setRecentLogs([]);
    applyText('', { detectionFormat: 'auto' });
  }, [applyText, isMockData, persistTableTargets]);

const tableScopeLabel = React.useMemo(() => {
    if (!tables.length) return '暂无解析中的表';
    const entries = tables
      .map((t: any) => {
        if (!t?.name) return null;
        const target = tableTargets[t.name];
        if (target?.mode === 'existing') {
          return `${t.name} → ${target.tableName}`;
        }
        return `${t.name}（自动创建）`;
      })
      .filter(Boolean) as string[];
    if (!entries.length) return '暂无解析中的表';
    const preview = entries.slice(0, 3).join('、');
    return entries.length > 3 ? `${preview} 等 ${entries.length} 张表` : preview;
  }, [tables, tableTargets]);

  const targetSummary = React.useMemo(() => {
    if (!tables.length) return [];
    return tables
      .map((t: any) => {
        if (!t?.name) return null;
        const target = tableTargets[t.name];
        if (target?.mode === 'existing') {
          const name = target.tableName || target.tableId;
          return { source: t.name, target: name, mode: 'existing' as const };
        }
        return { source: t.name, target: '自动创建新表', mode: 'auto' as const };
      })
      .filter(Boolean) as Array<{ source: string; target: string; mode: 'auto' | 'existing' }>;
  }, [tables, tableTargets]);

  const selectionLabel = React.useMemo(() => {
    if (!selection) return '当前未选中表';
    const parts: string[] = [];
    if (selection.tableId) {
      const tableName = tableNames[selection.tableId];
      parts.push(tableName ? `表 ${tableName}(${selection.tableId})` : `表 ${selection.tableId}`);
    }
    if (selection.viewId) parts.push(`视图 ${selection.viewId}`);
    if (selection.recordId) parts.push(`记录 ${selection.recordId}`);
    return parts.length ? parts.join(' · ') : '当前未选中表';
  }, [selection, tableNames]);

  const lastSnapshotTime = React.useMemo(() => {
    if (!snapshots.length) return null;
    return new Date(snapshots[snapshots.length - 1].timestamp).toLocaleString();
  }, [snapshots]);

  return (
    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0, width: '100%', boxSizing: 'border-box' }} data-theme={theme}>
      {banner && (
        <div className={`alert ${banner.type === 'success' ? 'alert-success' : banner.type === 'error' ? 'alert-error' : 'alert-info'}`}>
          {banner.text}
        </div>
      )}
      <JsonInput
        value={text}
        format={inputFormat}
        detectedFormat={resolvedFormat}
        onFormatChange={(fmt) => {
          setInputFormat(fmt);
          if (fmt === 'auto') {
            if (text.trim()) {
              const detected = detectFormat(text);
              setAutoDetectedFormat(detected);
              if (detected === 'json') {
                try {
                  JSON.parse(text);
                  setJsonHint(undefined);
                } catch (err: any) {
                  setJsonHint(`格式可能有误（将尝试宽松模式解析）：${err.message}`);
                }
              } else if (detected === 'xml') {
                setJsonHint('检测到 XML 数据，当前版本暂不支持解析，请转换为 JSON/YAML/TSV/日志 格式。');
              } else {
                setJsonHint(undefined);
              }
            } else {
              setAutoDetectedFormat('json');
              setJsonHint(undefined);
            }
          } else {
            setAutoDetectedFormat(fmt);
            if (fmt === 'json') {
              try {
                if (text.trim()) JSON.parse(text);
                setJsonHint(undefined);
              } catch (err: any) {
                setJsonHint(`格式可能有误（将尝试宽松模式解析）：${err.message}`);
              }
            } else if (fmt === 'xml') {
              setJsonHint('检测到 XML 数据，当前版本暂不支持解析，请转换为 JSON/YAML/TSV/日志 格式。');
            } else {
              setJsonHint(undefined);
            }
          }
        }}
        onChange={v => {
          if (isMockData) {
            setIsMockData(false);
            setMockNotice(null);
            setActiveMockId(null);
          }
          applyText(v);
        }}
        onParse={onParse}
        parseLoading={parsing}
        error={jsonHint}
        onClear={handleClearInput}
        isMockData={isMockData}
        mockInfo={mockNotice}
        onRandomMock={handleRandomMock}
      />
      <div className="muted" style={{ fontSize: '0.8rem', lineHeight: 1.6 }}>
        操作范围：{tableScopeLabel}。执行前会自动生成快照，可使用“撤销上一次变更”恢复{lastSnapshotTime ? `（最近快照：${lastSnapshotTime}）` : ''}。
        当前表 → 目标表：
      </div>
      <div className="card" style={{ padding: '0.6rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>源表 → 目标表</span>
          <label className="muted" style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.8rem' }} title="启用后仅允许向已存在且结构匹配的数据表追加数据，不会自动创建新表或字段。">
            <input
              type="checkbox"
              checked={appendOnlyMode}
              onChange={(e) => persistAppendOnlyMode(e.target.checked)}
            />
            仅追加模式
          </label>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {targetSummary.length ? (
            targetSummary.map((item) => (
              <span
                key={item.source}
                className="muted"
                style={{
                  fontSize: '0.78rem',
                  padding: '4px 8px',
                  background: item.mode === 'existing' ? 'rgba(22,119,255,0.12)' : 'rgba(82,196,26,0.12)',
                  borderRadius: 6,
                  border: item.mode === 'existing' ? '1px solid rgba(22,119,255,0.2)' : '1px solid rgba(82,196,26,0.25)',
                }}
              >
                {item.source} → {item.target}
              </span>
            ))
          ) : (
            <span className="muted" style={{ fontSize: '0.78rem' }}>暂无映射，请在下方表单中配置目标数据表</span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn btn-ghost" onClick={handleUndo} disabled={executing || syncing || undoing || snapshots.length === 0}>
          {undoing ? '撤销中…' : '撤销上一次变更'}
        </button>
        <button className="btn btn-ghost" onClick={onSyncFields} disabled={executing || syncing || undoing} title="更新所有表的字段结构；将按下方目标表设置决定是创建新表还是同步到既有表">
          {syncing ? '同步中…' : '同步字段'}
        </button>
        <button className="btn btn-primary" onClick={onExecuteWriteAll} disabled={executing || syncing || undoing} title="将解析出的所有记录写入目标表：结构匹配时追加，不匹配时自动新建">
          {executing ? '执行中…' : '写入全部（基于目标表）'}
        </button>
      </div>
      {recentLogs.length ? (
        <div className="card" style={{ padding: '0.5rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <span className="muted" style={{ fontSize: '0.78rem' }}>最近操作日志</span>
          {recentLogs.map((line, idx) => (
            <span key={idx} style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{line}</span>
          ))}
        </div>
      ) : null}
      <div className="muted" style={{ fontSize: '0.8rem' }}>{selectionLabel}</div>
      {lastDataChangeAt && (
        <div className="muted" style={{ fontSize: '0.8rem' }}>最近数据更新：{new Date(lastDataChangeAt).toLocaleTimeString()}</div>
      )}
      <Preview
        tables={tables}
        activeIndex={Math.min(activeTab, Math.max(0, tables.length - 1))}
        onTabChange={v => {
          setActiveTab(v);
          persistUIState({ activeTab: v });
        }}
        warnings={warnings}
        onFieldTypeChange={handleFieldTypeChange}
        onFieldLabelChange={handleFieldLabelChange}
        onFieldToggle={handleFieldToggle}
        lang={lang}
        tableTargets={tableTargets}
        tableNames={tableNames}
        onTableTargetChange={handleTableTargetChange}
      />
      <LogPane logs={logs} />
    </div>
  );
}
