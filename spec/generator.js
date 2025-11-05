// Simple spec generator adapted from src/cli_spec_generator.py logic (JS version)

function isPlainObject(x) {
  return x && typeof x === 'object' && !Array.isArray(x);
}

function extractDataList(json, sourceRoot) {
  if (!sourceRoot || sourceRoot === 'auto' || sourceRoot === 'data') {
    const keys = [
        // 最常见
        'data',
        'result',
        'results',
      
        // 列表/分页类
        'list',
        'items',
        'records',
        'rows',
        'content',
      
        // 后端常用命名
        'value',
        'values',
        'payload',
        'body',
        'response',
        'object',
      
        // REST / GraphQL / SDK 风格
        'node',
        'nodes',
        'edges',
        'hits',
        'documents',
      
        // 特定生态常用
        'page',         // 分页整体对象
        'dataset',      // 数据集
        'entry',        // 单条数据
        'resource',     // REST 资源返回
        'resources',    // 资源集合
        'info',         // 通用信息对象
        'detail',       // 详情类接口返回
        'output',       // 处理结果
        'meta',         // 元数据节点
        'contentData',  // 有些 CMS 接口习惯
      
        // 特殊或旧式风格
        'dataList',
        'resultList',
        'resultSet',
        'dataSet'
      ];
      
    for (const k of keys) {
      if (isPlainObject(json) && Array.isArray(json[k])) return json[k];
    }
    if (Array.isArray(json)) return json;
  } else if (typeof sourceRoot === 'string') {
    const parts = sourceRoot.split('.');
    let cur = json;
    for (const p of parts) {
      if (cur == null) break;
      cur = cur[p];
    }
    if (Array.isArray(cur)) return cur;
  }
  // fallback: try to find first array of objects
  if (isPlainObject(json)) {
    for (const v of Object.values(json)) if (Array.isArray(v)) return v;
  }
  return Array.isArray(json) ? json : [];
}

function flattenRecord(obj, prefix = '') {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (isPlainObject(v)) Object.assign(out, flattenRecord(v, key));
    else out[key] = v;
  }
  return out;
}

function detectType(val) {
  if (val == null) return 'text';
  if (typeof val === 'number') return 'number';
  if (typeof val === 'boolean') return 'text';
  if (typeof val === 'string') {
    if (/^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?.*)?$/.test(val)) return 'datetime';
    return 'text';
  }
  return 'text';
}

function analyzeStructure(dataList) {
  const sample = dataList.slice(0, 200);
  const childTables = new Map();
  let masterFields = new Map();

  for (const rec of sample) {
    if (!isPlainObject(rec)) continue;
    // child arrays
    for (const [k, v] of Object.entries(rec)) {
      if (Array.isArray(v) && v.length && isPlainObject(v[0])) {
        const arr = childTables.get(k) || [];
        arr.push(...v.slice(0, 50));
        childTables.set(k, arr);
      }
    }
    const flat = flattenRecord(rec);
    for (const [k, v] of Object.entries(flat)) {
      if (!masterFields.has(k)) masterFields.set(k, detectType(v));
    }
  }

  const fields = Array.from(masterFields.entries()).map(([name, type]) => ({
    target: name,
    type,
    source: name,
  }));

  const children = [];
  for (const [name, rows] of childTables.entries()) {
    const fMap = new Map();
    for (const r of rows) {
      const flat = flattenRecord(r);
      for (const [k, v] of Object.entries(flat)) if (!fMap.has(k)) fMap.set(k, detectType(v));
    }
    const cfields = Array.from(fMap.entries()).map(([n, t]) => ({ target: n, type: t, source: n }));
    children.push({ key: name, table_name: name, fields: cfields, record_source: { kind: 'child', path: name, parent_key: 'id' } });
  }

  return { fields, child_tables: children };
}

export function generateSpec(jsonData, entity = 'entity', sourceRoot = 'data') {
  const dataList = extractDataList(jsonData, sourceRoot);
  const structure = analyzeStructure(dataList);
  const tables = [];
  tables.push({
    key: 'master',
    table_name: '主表',
    app_token_key: 'default',
    record_source: { kind: 'root', unique_key: 'id' },
    fields: structure.fields,
  });
  for (const c of structure.child_tables) tables.push({ ...c, app_token_key: 'default' });
  return {
    entity,
    version: '2025.01.01',
    description: `${entity} ingestion mapping`,
    source_root: sourceRoot,
    tables,
  };
}


