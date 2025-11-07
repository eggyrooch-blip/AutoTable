import './App.css';
import React from 'react';
import JsonInput from './components/JsonInput';
import Preview from './components/Preview';
import LogPane from './components/LogPane';
import StepHeader from './components/StepHeader';
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
type FieldWriteScope = 'selected' | 'all';

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

function ensureUniqueTableName(baseName: string, usedNames: Set<string>): string {
  const normalized = baseName && baseName.trim().length ? baseName.trim() : 'auto_table';
  if (!usedNames.has(normalized)) {
    return normalized;
  }
  let counter = 2;
  let candidate = `${normalized}_auto${counter}`;
  while (usedNames.has(candidate)) {
    counter += 1;
    candidate = `${normalized}_auto${counter}`;
  }
  return candidate;
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
  const [recordSummary, setRecordSummary] = React.useState<{ tables: number; records: number }>({ tables: 0, records: 0 });
  const [autoSyncFieldNames, setAutoSyncFieldNames] = React.useState(false);
  const [fieldWriteScope, setFieldWriteScope] = React.useState<FieldWriteScope>('selected');
  const [logMode, setLogMode] = React.useState<'latest' | 'history'>('latest');
  const [logsCollapsed, setLogsCollapsed] = React.useState(false);
  const [lastHighlight, setLastHighlight] = React.useState<string | null>(null);
  const [previewCollapsed, setPreviewCollapsed] = React.useState(true);
  const [previewManualToggle, setPreviewManualToggle] = React.useState(false);
  const latestLogs = React.useMemo(() => logs.slice(-5), [logs]);
  const visibleLogs = React.useMemo(
    () => (logMode === 'latest' ? latestLogs : logs),
    [logMode, latestLogs, logs]
  );
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

  const handleThemeToggle = React.useCallback(() => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      persistUIState({ theme: next });
      return next;
    });
  }, [persistUIState]);

  const handleLangChange = React.useCallback(
    (value: 'zh' | 'en') => {
      setLang(value);
      persistUIState({ lang: value });
    },
    [persistUIState]
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

  const resolveTablesForPipeline = React.useCallback(
    (options: { includeDisabled?: boolean } = {}): ResolvedTableSpec[] => {
      const includeDisabled = options.includeDisabled ?? false;
      const usedNames = new Set<string>();
      Object.values(tableNamesRef.current || {}).forEach(name => {
        if (typeof name === 'string' && name) usedNames.add(name);
      });
      const resolved: ResolvedTableSpec[] = [];
      for (const spec of tables) {
        if (!spec || !spec.name) continue;
        const sourceName = spec.name;
        const target = tableTargetsRef.current[sourceName] ?? tableTargets[sourceName];
        let effectiveName: string;
        if (target?.mode === 'existing' && target.tableName) {
          effectiveName = target.tableName;
        } else {
          effectiveName = sourceName;
          if (usedNames.has(effectiveName)) {
            effectiveName = ensureUniqueTableName(effectiveName, usedNames);
          }
        }
        usedNames.add(effectiveName);
        const rawFields = Array.isArray(spec.fields) ? spec.fields : [];
        const clonedFields = rawFields.map((field: any) => {
          const clone: any = { ...field };
          if (includeDisabled && clone && clone.__enabled === false) {
            delete clone.__enabled;
          }
          return clone;
        });
        resolved.push({
          ...spec,
          fields: clonedFields,
          name: effectiveName,
          __sourceName: sourceName,
        });
      }
      return resolved;
    },
    [tables, tableTargets]
  );

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

  const persistAutoSyncFieldNames = React.useCallback(
    async (value: boolean) => {
      autoSyncFieldNamesRef.current = value;
      setAutoSyncFieldNames(value);
      if (value) autoSyncReadyRef.current = true;
      await persist('auto_sync_field_names', value);
    },
    [persist]
  );

  const persistFieldWriteScope = React.useCallback(
    async (value: FieldWriteScope) => {
      setFieldWriteScope(value);
      await persist('field_write_scope', value);
    },
    [persist]
  );

  const ensureInitialLabels = React.useCallback((inputTables: any[] = []) => {
    return (inputTables || []).map(table => {
      if (!table) return table;
      const fields = Array.isArray(table.fields) ? table.fields : [];
      const normalizedFields = fields.map((field: any) => {
        if (!field) return field;
        const initialLabelValue =
          (field as any).__initialLabel ??
          (field as any)._initialLabel ??
          (field as any).label ??
          (field as any).source ??
          field.name ??
          '';
        const normalizedInitial =
          typeof initialLabelValue === 'string'
            ? initialLabelValue
            : String(initialLabelValue ?? '');
        const currentLabelValue =
          (field as any).label !== undefined && (field as any).label !== null
            ? (field as any).label
            : normalizedInitial;
        const normalizedLabel =
          typeof currentLabelValue === 'string'
            ? currentLabelValue
            : String(currentLabelValue ?? '');
        return {
          ...field,
          label: normalizedLabel,
          __initialLabel: normalizedInitial,
        };
      });
      return { ...table, fields: normalizedFields };
    });
  }, []);

  const rebaseSyncedLabels = React.useCallback((inputTables: any[] = []) => {
    const rebased = (inputTables || []).map(table => {
      if (!table) return table;
      const fields = Array.isArray(table.fields) ? table.fields : [];
      const nextFields = fields.map((field: any) => {
        if (!field) return field;
        const currentLabelValue = ((field as any).label ?? field.name) ?? '';
        const normalizedLabel =
          typeof currentLabelValue === 'string' ? currentLabelValue : String(currentLabelValue ?? '');
        return {
          ...field,
          __initialLabel: normalizedLabel,
        };
      });
      return { ...table, fields: nextFields };
    });
    return ensureInitialLabels(rebased);
  }, [ensureInitialLabels]);


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
  const autoSyncFieldNamesRef = React.useRef<boolean>(autoSyncFieldNames);
  const autoSyncReadyRef = React.useRef<boolean>(true);

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

const takeSnapshot = React.useCallback(
  async (description: string, resolvedTablesOverride?: ResolvedTableSpec[]): Promise<Snapshot> => {
    const targetSpecs = resolvedTablesOverride ?? resolveTablesForPipeline();
    const snapshotTables: TableSnapshot[] = [];
    for (const spec of targetSpecs) {
      if (!spec || !spec.name) continue;
      const tableName = spec.name;
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
  },
  [resolveTablesForPipeline, cloneFieldMapping, fieldMappings]
);

  // 初始化主题：从多维表格获取（优先于本地存储）

  React.useEffect(() => {
    uiStateRef.current = { lang, theme, activeTab };
  }, [lang, theme, activeTab]);

  React.useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    document.body?.setAttribute('data-theme', theme);
  }, [theme]);

  React.useEffect(() => {
    autoSyncFieldNamesRef.current = autoSyncFieldNames;
  }, [autoSyncFieldNames]);

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
        const bitableTheme = await bitable.bridge.getTheme?.();
        if (bitableTheme) {
          const mappedTheme = bitableTheme === 'DARK' ? 'dark' : 'light';
          setTheme(mappedTheme);
          uiStateRef.current = { ...uiStateRef.current, theme: mappedTheme };
        } else if (ui?.theme) {
          setTheme(ui.theme);
        }
      } catch (err) {
        console.warn('Failed to get theme from bitable:', err);
        if (ui?.theme) setTheme(ui.theme);
      }

      const savedTables = await restore<any[]>('tables_state');
      if (Array.isArray(savedTables) && savedTables.length) {
        setTables(ensureInitialLabels(savedTables));
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
      const savedAutoSync = await restore<boolean>('auto_sync_field_names');
      if (typeof savedAutoSync === 'boolean') {
        autoSyncFieldNamesRef.current = savedAutoSync;
        setAutoSyncFieldNames(savedAutoSync);
      }
      const savedWriteScope = await restore<FieldWriteScope>('field_write_scope');
      if (savedWriteScope === 'selected' || savedWriteScope === 'all') {
        setFieldWriteScope(savedWriteScope);
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
              let names: Record<string, string> = tableNamesRef.current;
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

    const handleSelectionChange = (event: SelectionInfo) => {
      setSelection(event);
      const tableId = event?.tableId;
      if (tableId && !tableNamesRef.current[tableId]) {
        refreshTableNames();
      }
    };

    try {
      if (typeof bitable.bridge.onDataChange === 'function') {
        const disposer = bitable.bridge.onDataChange(handleDataChange);
        disposeDataChange = typeof disposer === 'function' ? disposer : undefined;
      }
    } catch {}
    try {
      const selectionDisposer = bitable.base.onSelectionChange?.(handleSelectionChange);
      if (typeof selectionDisposer === 'function') {
        disposeSelection = selectionDisposer;
      }
    } catch {}

    return () => {
      disposeDataChange?.();
      disposeSelection?.();
    };
  }, [refreshTableNames, restore, ensureInitialLabels]);

  function log(line: string) {
    setLogs(prev => [...prev, line]);
    if (/(完成|成功|写入|新建|同步|失败)/.test(line)) {
      setLastHighlight(line);
    }
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

      const tablesWithFields = nextTables.filter(
        (t: any) => Array.isArray(t.fields) && t.fields.some((f: any) => !!f)
      );
      if (tablesWithFields.length === 0) {
        throw new Error('未检测到可写字段，请复制日志反馈给支持人员。');
      }

      const normalizedTables = ensureInitialLabels(nextTables);
      const initIdx = new Array(normalizedTables.length).fill(0);
      setTables(normalizedTables);
      if (!previewManualToggle) {
        setPreviewCollapsed(false);
      }
      const totalRecords = normalizedTables.reduce((sum: number, t: any) => sum + (Array.isArray(t.records) ? t.records.length : 0), 0);
      setRecordSummary({ tables: normalizedTables.length, records: totalRecords });
      const nextTargets: Record<string, TableTarget> = {};
      normalizedTables.forEach((t: any) => {
        if (!t?.name) return;
        const prevTarget = tableTargetsRef.current[t.name];
        nextTargets[t.name] = prevTarget ?? { mode: 'auto' };
      });
      await persistTableTargets(nextTargets);
      await persist('tables_state', normalizedTables);
      setActiveTab(0);
      persistUIState({ activeTab: 0 });
      (window as any).__sampleIdx = initIdx;
      setBanner({ type: 'success', text: `解析完成，共 ${nextTables.length} 个表` });
      setTimeout(() => setBanner(null), 2500);
    } catch (e: any) {
      const message = e?.message || String(e);
      log(`解析失败：${message}`);
      log('请复制上述日志并反馈给支持人员。');
      setBanner({ type: 'error', text: `解析失败：${message}` });
    } finally {
      setParsing(false);
    }
  }

  async function onExecuteWriteAll() {
    if (executing || syncing || undoing) return;
    setExecuting(true);
    setLogs([]);
    if (!tables.length) {
      log('没有可执行的表定义');
      setExecuting(false);
      return;
    }
    const includeDisabled = fieldWriteScope === 'all';
    const resolvedTables = resolveTablesForPipeline({ includeDisabled });
    const snapshot = await takeSnapshot('写入全部数据', resolvedTables);
    const insertedRecordMap: Record<string, string[]> = {};
    const createdTables: Array<{ tableName: string; tableId?: string }> = [];
    try {
      const mappingAccumulator = cloneFieldMapping(fieldMappings);
      const autoCreates: ResolvedTableSpec[] = [];
      const autoCreateReasons: string[] = [];
      const conditionalCreates: ResolvedTableSpec[] = [];
      const conditionalCreateReasons: string[] = [];
      const toAppend: ResolvedTableSpec[] = [];
      const appendTargets: string[] = [];
      const existingNames = new Set<string>(Object.values(tableNamesRef.current || {}));

      for (let idx = 0; idx < resolvedTables.length; idx += 1) {
        let spec = resolvedTables[idx];
        if (!spec?.name) continue;
        const originalName = spec.__sourceName;
        const targetConfig = tableTargetsRef.current[originalName] ?? tableTargets[originalName];
        const isAutoTarget = !targetConfig || targetConfig.mode !== 'existing';

        if (isAutoTarget) {
          const desiredBase = originalName || spec.name;
          let nextName = desiredBase;
          if (existingNames.has(nextName)) {
            nextName = ensureUniqueTableName(desiredBase, existingNames);
          }
          existingNames.add(nextName);
          if (nextName !== spec.name) {
            spec = { ...spec, name: nextName };
            resolvedTables[idx] = spec;
          }
          autoCreates.push(spec);
          autoCreateReasons.push(`${originalName} → ${spec.name}（自动目标：始终新建）`);
          continue;
        }

        let tableExists = true;
        try {
          await getTableByName(spec.name);
        } catch {
          tableExists = false;
        }

        if (targetConfig?.mode === 'existing') {
          if (!tableExists) {
            log(`目标表 ${spec.name} 未找到，将为「${originalName}」自动创建新表`);
            conditionalCreates.push(spec);
            conditionalCreateReasons.push(`${originalName}（指定目标缺失）`);
          } else {
            toAppend.push(spec);
            appendTargets.push(`${originalName} → ${spec.name}`);
          }
          continue;
        }

        if (!tableExists) {
          conditionalCreates.push(spec);
          conditionalCreateReasons.push(`${originalName} → ${spec.name}（新建）`);
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
          conditionalCreates.push(spec);
          conditionalCreateReasons.push(`${originalName} → ${spec.name}（${reason}）`);
        } else {
          toAppend.push(spec);
          appendTargets.push(`${originalName} → ${spec.name}`);
        }
      }

      if (autoCreateReasons.length) {
        log(`自动创建目标：${autoCreateReasons.join('；')}`);
      }
      if (conditionalCreateReasons.length) {
        log(`检测到需要新建的数据表：${conditionalCreateReasons.join('；')}（自动使用最新结构）`);
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

      if (autoCreates.length) {
        await processTables(autoCreates, false);
      }
      if (conditionalCreates.length) {
        await processTables(conditionalCreates, false);
      }
      await processTables(toAppend, true);
      pruneFieldMapping(mappingAccumulator, resolvedTables);
      await persistFieldMappings(mappingAccumulator);
      await recordSchemasForTables(resolvedTables);
      setTables(prev => {
        const normalized = rebaseSyncedLabels(prev);
        void persist('tables_state', normalized);
        return normalized;
      });
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
      setBanner({ type: 'success', text: '写入全部数据完成' });
      setTimeout(() => setBanner(null), 2500);
    } finally {
      await refreshTableNames();
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
    const resolvedTables = resolveTablesForPipeline();
    const snapshot = await takeSnapshot('同步字段', resolvedTables);
    const createdTables: Array<{ tableName: string; tableId?: string }> = [];
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

      const updatedMapping = await syncFieldDifferences(resolvedTables, { fieldMapping: mappingAccumulator }, log);
      pruneFieldMapping(updatedMapping, resolvedTables);
      await persistFieldMappings(updatedMapping);
      await recordSchemasForTables(resolvedTables);
      snapshot.createdTables = [...snapshot.createdTables, ...createdTables];
      setSnapshots(prev => [...prev, snapshot]);
      setLastDataChangeAt(Date.now());
      setBanner({ type: 'success', text: '字段同步完成' });
      setTimeout(() => setBanner(null), 2500);
    } catch (e: any) {
      log(`字段同步失败：${e.message}`);
      setBanner({ type: 'error', text: `字段同步失败：${e.message}` });
    } finally {
      await refreshTableNames();
      setSyncing(false);
    }
  }

  function handleFieldTypeChange(tableIdx: number, fieldIdx: number, newType: string) {
    setTables(prev => {
      const next = prev.map(t => ({ ...t, fields: t.fields.map((f: any) => ({ ...f })) }));
      next[tableIdx].fields[fieldIdx].type = newType;
      const normalized = ensureInitialLabels(next);
      persist('tables_state', normalized);
      return normalized;
    });
  }

  function handleFieldLabelChange(tableIdx: number, fieldIdx: number, newLabel: string) {
    setTables(prev => {
      const next = prev.map(t => ({ ...t, fields: t.fields.map((f: any) => ({ ...f })) }));
      next[tableIdx].fields[fieldIdx].label = newLabel;
      const normalized = ensureInitialLabels(next);
      persist('tables_state', normalized);
      return normalized;
    });
  }

  function handleFieldToggle(tableIdx: number, fieldIdx: number, enabled: boolean) {
    setTables(prev => {
      const next = prev.map(t => ({ ...t, fields: t.fields.map((f: any) => ({ ...f })) }));
      next[tableIdx].fields[fieldIdx].__enabled = enabled;
      const normalized = ensureInitialLabels(next);
      persist('tables_state', normalized);
      return normalized;
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
    setRecordSummary({ tables: 0, records: 0 });
    applyText('', { detectionFormat: 'auto' });
    setPreviewCollapsed(true);
    setPreviewManualToggle(false);
  }, [applyText, isMockData, persistTableTargets]);

  const resolvedTargetNameMap = React.useMemo(() => {
    const used = new Set<string>();
    Object.values(tableNames || {}).forEach(name => {
      if (typeof name === 'string' && name) used.add(name);
    });
    const map: Record<string, string> = {};
    for (const spec of tables) {
      if (!spec || !spec.name) continue;
      const sourceName = spec.name;
      const target = tableTargets[sourceName];
      let effectiveName: string;
      if (target?.mode === 'existing' && target.tableName) {
        effectiveName = target.tableName;
      } else {
        effectiveName = sourceName;
        if (used.has(effectiveName)) {
          effectiveName = ensureUniqueTableName(effectiveName, used);
        }
      }
      used.add(effectiveName);
      map[sourceName] = effectiveName;
    }
    return map;
  }, [tables, tableTargets, tableNames]);

  const tableScopeLabel = React.useMemo(() => {
    if (!tables.length) return '暂无解析中的表';
    const entries = tables
      .map((t: any) => {
        if (!t?.name) return null;
        const target = tableTargets[t.name];
        const resolvedName = resolvedTargetNameMap[t.name] || t.name;
        if (target?.mode === 'existing') {
          return `${t.name} → ${resolvedName}`;
        }
        return `${t.name} → ${resolvedName}（待创建）`;
      })
      .filter(Boolean) as string[];
    if (!entries.length) return '暂无解析中的表';
    const preview = entries.slice(0, 3).join('、');
    return entries.length > 3 ? `${preview} 等 ${entries.length} 张表` : preview;
  }, [tables, tableTargets, resolvedTargetNameMap]);

  const tableOptionEntries = React.useMemo(() => {
    return Object.entries(tableNames || {}).sort((a, b) => {
      const nameA = a[1] ?? '';
      const nameB = b[1] ?? '';
      return nameA.localeCompare(nameB);
    });
  }, [tableNames]);

  const targetSummary = React.useMemo(() => {
    if (!tables.length) return [];
    return tables
      .map((t: any) => {
        if (!t?.name) return null;
        const target = tableTargets[t.name];
        const resolvedName = resolvedTargetNameMap[t.name] || t.name;
        if (target?.mode === 'existing') {
          const name = resolvedName || target.tableId;
          return { source: t.name, target: name, mode: 'existing' as const };
        }
        return { source: t.name, target: resolvedName, mode: 'auto' as const };
      })
      .filter(Boolean) as Array<{ source: string; target: string; mode: 'auto' | 'existing' }>;
  }, [tables, tableTargets, resolvedTargetNameMap]);

  const metricItems = React.useMemo(() => {
    const enabledFieldCount = tables.reduce((total, table) => {
      if (!table || !Array.isArray(table.fields)) return total;
      const enabled = table.fields.filter((field: any) => (field as any)?.__enabled !== false).length;
      return total + enabled;
    }, 0);
    const linkedTargetCount = tables.reduce((total, table) => {
      if (!table?.name) return total;
      return total + (tableTargets[table.name]?.mode === 'existing' ? 1 : 0);
    }, 0);
    return [
      { label: '解析表', value: recordSummary.tables },
      { label: '预计记录', value: recordSummary.records },
      { label: '启用字段', value: enabledFieldCount },
      { label: '已绑定目标', value: linkedTargetCount },
    ];
  }, [recordSummary, tables, tableTargets]);

  const themeButtonLabel = theme === 'light' ? '切换至深色模式' : '切换至浅色模式';


  const activeTableIndex = React.useMemo(() => {
    if (!tables.length) return -1;
    return Math.min(activeTab, tables.length - 1);
  }, [tables, activeTab]);

  const syncFieldsAvailability = React.useMemo(() => {
    const disabledState = (reason: string) => ({ disabled: true, reason });
    if (activeTableIndex < 0) {
      return disabledState('暂无解析中的表');
    }
    const table = tables[activeTableIndex];
    if (!table || !table.name) {
      return disabledState('当前表信息不完整');
    }
    const targetConfig = tableTargets[table.name];
    const targetName = resolvedTargetNameMap[table.name] || table.name;
    const hasLinkedExisting = targetConfig?.mode === 'existing';
    const hasSchema = targetName ? Boolean(tableSchemas[targetName]) : false;
    const knownInBase = targetName
      ? Object.values(tableNames || {}).some(name => name === targetName)
      : false;
    const tableReady = hasLinkedExisting || hasSchema || knownInBase;
    if (!tableReady) {
      return disabledState('请先创建或关联目标数据表');
    }
    const fields = Array.isArray(table.fields) ? table.fields : [];
    const hasRename = fields.some((field: any) => {
      if (!field) return false;
      const initial =
        ((field as any).__initialLabel ??
          (field as any)._initialLabel ??
          (field as any).source ??
          field.name) ?? '';
      const current = ((field as any).label ?? field.name) ?? '';
      return String(current).trim() !== String(initial).trim();
    });
    if (!hasRename) {
      return disabledState('字段名称未发生变化');
    }
    if (syncing) {
      return disabledState('字段同步进行中');
    }
    if (executing) {
      return disabledState('写入全部任务执行中');
    }
    if (undoing) {
      return disabledState('撤销处理中');
    }
    return { disabled: false, reason: '字段名称已调整，可随时同步' };
  }, [activeTableIndex, tables, tableTargets, resolvedTargetNameMap, tableSchemas, tableNames, syncing, executing, undoing]);

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

  React.useEffect(() => {
    if (!autoSyncFieldNamesRef.current) return;
    if (syncFieldsAvailability.disabled) {
      autoSyncReadyRef.current = true;
      return;
    }
    if (!autoSyncReadyRef.current) return;
    if (syncing || executing || undoing) return;
    autoSyncReadyRef.current = false;
    onSyncFields();
  }, [autoSyncFieldNames, syncFieldsAvailability.disabled, syncing, executing, undoing, onSyncFields]);

  React.useEffect(() => {
    if (banner?.type === 'success') {
      setLastHighlight(`${banner.text} · ${new Date().toLocaleTimeString()}`);
      autoSyncReadyRef.current = true;
    }
  }, [banner]);

  return (
    <div className="app-shell" data-theme={theme}>
      <header className="app-toolbar">
        <div className="app-toolbar__brand">
          <h1 className="app-toolbar__title">AutoTable 助手</h1>
          <p className="app-toolbar__subtitle">快速解析数据、同步字段并写入多维表格。</p>
        </div>
        <div className="app-toolbar__actions">
          <label className="app-toolbar__control">
            <span>界面语言</span>
            <select
              className="select app-toolbar__select"
              value={lang}
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                handleLangChange(event.target.value as 'zh' | 'en')
              }
            >
              <option value="zh">中文</option>
              <option value="en">English</option>
            </select>
          </label>
          <button
            type="button"
            className="btn btn-ghost app-toolbar__toggle"
            onClick={handleThemeToggle}
            aria-pressed={theme === 'dark'}
            title={themeButtonLabel}
          >
            {themeButtonLabel}
          </button>
        </div>
      </header>
      {banner && (
        <div className={`alert ${banner.type === 'success' ? 'alert-success' : banner.type === 'error' ? 'alert-error' : 'alert-info'}`}>
          {banner.text}
        </div>
      )}
      <section className="app-metrics" aria-label="解析概览">
        {metricItems.map(item => (
          <div key={item.label} className="app-metric">
            <span className="app-metric__value">{item.value.toLocaleString()}</span>
            <span className="app-metric__label">{item.label}</span>
          </div>
        ))}
      </section>
      <section className="step-section">
        <StepHeader step="01" title="数据输入" hint="粘贴原始数据或导入文件后解析。" />
        <div className="card card--padded">
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
          <div className="app-hint">
            {recordSummary.tables > 0
              ? `已解析：${recordSummary.tables} 张表 / ${recordSummary.records} 条记录`
              : '粘贴数据后点击“解析数据”开始。'}
          </div>
        </div>
      </section>

      <section className="step-section">
        <StepHeader
          step="02"
          title="结构预览"
          hint="核对字段、类型与样本记录。"
          action={
            tables.length > 0 ? (
              <button
                className="btn btn-ghost"
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                onClick={() => {
                  setPreviewManualToggle(true);
                  setPreviewCollapsed(prev => !prev);
                }}
              >
                {previewCollapsed ? '展开预览' : '收起预览'}
              </button>
            ) : null
          }
        />
        <div className="card card--padded">
          {previewCollapsed ? (
            <div className="preview-placeholder">
              <div>
                解析结果：{recordSummary.tables} 张表 / {recordSummary.records} 条记录
              </div>
              {tables.length > 0 ? (
                <div>
                  涉及表：
                  {tables
                    .map((t: any) => t?.name)
                    .filter(Boolean)
                    .slice(0, 3)
                    .join('、')}
                  {tables.length > 3 ? ` 等 ${tables.length} 张表` : ''}
                </div>
              ) : (
                <div>暂无解析数据。</div>
              )}
              <div className="preview-placeholder__hint">
                点击“展开预览”查看字段列表与示例值。
              </div>
            </div>
          ) : (
            <Preview
              tables={tables}
              activeIndex={activeTableIndex >= 0 ? activeTableIndex : 0}
              onTabChange={v => {
                setActiveTab(v);
                persistUIState({ activeTab: v });
              }}
              warnings={warnings}
              onFieldTypeChange={handleFieldTypeChange}
              onFieldLabelChange={handleFieldLabelChange}
              onFieldToggle={handleFieldToggle}
              lang={lang}
              autoSyncFieldNames={autoSyncFieldNames}
              onAutoSyncToggle={persistAutoSyncFieldNames}
            />
          )}
        </div>
      </section>

      <section className="step-section">
        <StepHeader step="03" title="执行任务" hint="选择目标表与字段范围后同步或写入。" />
        <div className="card card--spacious">
          <div className="card__section card__section--header">
            <span className="muted" style={{ fontSize: '0.78rem' }}>操作范围：{tableScopeLabel}</span>
            {lastSnapshotTime ? (
              <span className="muted" style={{ fontSize: '0.72rem' }}>最近快照：{lastSnapshotTime}</span>
            ) : null}
            <span
              style={{
                padding: '2px 6px',
                borderRadius: 6,
                background: 'rgba(37, 99, 235, 0.12)',
                border: '1px solid rgba(37, 99, 235, 0.2)',
                fontSize: '0.72rem',
                color: '#2563eb',
              }}
              title="同步或写入前会生成快照，可随时撤销。"
            >
              自动快照
            </span>
          </div>
          {tables.length ? (
            tables.map((t: any, idx: number) => {
              if (!t?.name) return null;
              const targetConfig = tableTargets[t.name] ?? { mode: 'auto' as const };
              const selectValue = targetConfig.mode === 'existing' ? targetConfig.tableId : 'auto';
              const resolvedAutoName = resolvedTargetNameMap[t.name] || t.name;
              const targetLabel =
                targetConfig.mode === 'existing'
                  ? (targetConfig.tableName || tableNames[targetConfig.tableId] || targetConfig.tableId)
                  : resolvedAutoName;
              return (
                <div
                  key={t.name || idx}
                  className={`target-row${idx === tables.length - 1 ? ' is-last' : ''}`}
                >
                  <span className="target-row__name">{t.name || `表${idx + 1}`}</span>
                  <select
                    className="select target-row__select"
                    value={selectValue}
                    onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                      const value = event.target.value;
                      if (value === 'auto') {
                        void handleTableTargetChange(t.name, { mode: 'auto' });
                      } else {
                        const tableName = tableNames[value] || value;
                        void handleTableTargetChange(t.name, { mode: 'existing', tableId: value, tableName });
                      }
                    }}
                    title="目标数据表：默认自动创建，也可绑定既有表。"
                  >
                    <option value="auto">自动创建新表（默认）</option>
                    {tableOptionEntries.map(([id, name]) => (
                      <option key={id} value={id}>{name}</option>
                    ))}
                  </select>
                  <span className="muted target-row__hint">
                    {targetConfig.mode === 'existing' ? `写入：${targetLabel}` : `新建：${targetLabel}`}
                  </span>
                </div>
              );
            })
          ) : (
            <span className="muted" style={{ fontSize: '0.78rem' }}>暂无解析中的表，请先解析数据或选择示例。</span>
          )}
          <div className="scope-controls">
            <label className="muted scope-controls__option">
              <input
                type="radio"
                name="field_write_scope"
                value="selected"
                checked={fieldWriteScope === 'selected'}
                onChange={() => persistFieldWriteScope('selected')}
              />
              仅勾选字段
            </label>
            <label className="muted scope-controls__option">
              <input
                type="radio"
                name="field_write_scope"
                value="all"
                checked={fieldWriteScope === 'all'}
                onChange={() => persistFieldWriteScope('all')}
              />
              所有字段
            </label>
            <span className="muted scope-controls__hint" title="仅勾选字段：按照字段面板勾选项写入；所有字段：忽略勾选状态写入全部字段。">
              字段范围
            </span>
          </div>
          {targetSummary.length ? (
            <div className="target-summary">
              {targetSummary.map((item) => (
                <span
                  key={`${item.source}-${item.target}`}
                  className={`target-summary__pill target-summary__pill--${item.mode}`}
                >
                  {item.source} → {item.target}{item.mode === 'auto' ? '（待创建）' : ''}
                </span>
              ))}
            </div>
          ) : null}
          <div className="action-row">
            <button
              className="btn btn-primary"
              style={{ minWidth: '200px' }}
              onClick={onExecuteWriteAll}
              disabled={executing || syncing || undoing}
              title="写入当前解析出的所有记录：自动模式将生成新表，已绑定目标则追加记录。"
            >
              {executing ? '执行中…' : '写入全部'}
            </button>
            <button
              className="btn"
              onClick={onSyncFields}
              disabled={syncFieldsAvailability.disabled || syncing || executing || undoing}
              title={syncFieldsAvailability.disabled ? (syncFieldsAvailability.reason || '字段名称未准备就绪') : '同步字段名称以保持目标表字段标题一致'}
            >
              {syncing ? '同步中…' : '同步字段名称'}
            </button>
            <button
              className="btn btn-ghost"
              onClick={handleUndo}
              disabled={executing || syncing || undoing || snapshots.length === 0}
              title="撤销最近一次写入或字段同步操作"
            >
              {undoing ? '撤销中…' : '撤销上一次变更'}
            </button>
          </div>
          {syncFieldsAvailability.disabled && syncFieldsAvailability.reason ? (
            <span className="muted" style={{ fontSize: '0.75rem' }}>{syncFieldsAvailability.reason}</span>
          ) : null}
        </div>
      </section>

      <section className="step-section">
        <StepHeader step="04" title="任务反馈" hint="查看最新结果与历史日志。" />
        <div
          className="card"
          style={{
            padding: '0.85rem 1rem',
            background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
            border: '1px solid rgba(15,23,42,0.06)',
          }}
        >
          <LogPane
            logs={visibleLogs}
            mode={logMode}
            onModeChange={setLogMode}
            collapsed={logsCollapsed}
            onToggleCollapse={() => setLogsCollapsed(prev => !prev)}
            highlight={lastHighlight}
            totalCount={logs.length}
            latestCount={latestLogs.length}
          />
        </div>
      </section>

      <div className="muted" style={{ fontSize: '0.8rem' }}>{selectionLabel}</div>
      {lastDataChangeAt && (
        <div className="muted" style={{ fontSize: '0.8rem' }}>最近数据更新：{new Date(lastDataChangeAt).toLocaleTimeString()}</div>
      )}
    </div>
  );

}
