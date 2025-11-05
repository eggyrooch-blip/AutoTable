import React from 'react';
import { Collapse, Tag, Tooltip } from '@douyinfe/semi-ui';
import type { TableSpec } from '../lib/json_parser';

type Props = {
  tables: TableSpec[];
  activeIndex?: number;
  onTabChange?: (idx: number) => void;
  warnings: string[];
  onFieldTypeChange?: (tableIdx: number, fieldIdx: number, newType: string) => void;
  onFieldLabelChange?: (tableIdx: number, fieldIdx: number, newLabel: string) => void;
  onFieldToggle?: (tableIdx: number, fieldIdx: number, enabled: boolean) => void;
  lang?: 'zh' | 'en';
  tableTargets: Record<string, TableTargetConfig>;
  tableNames: Record<string, string>;
  onTableTargetChange?: (sourceName: string, target: TableTargetConfig) => void;
};

type TableTargetConfig =
  | { mode: 'auto' }
  | { mode: 'existing'; tableId: string; tableName: string };

const TYPE_ENUM = [
  'Text','Number','SingleSelect','MultiSelect','DateTime','Checkbox','Url','User','Phone','Attachment','SingleLink','Lookup','Formula','DuplexLink','Location','GroupChat','CreatedTime','ModifiedTime','CreatedUser','ModifiedUser','AutoNumber','Email','Barcode','Progress','Currency','Rating'
];

function getLang(fallback?: 'zh'|'en'){
  if (fallback) return fallback;
  if (typeof navigator !== 'undefined' && navigator.language) return navigator.language.startsWith('zh') ? 'zh' : 'en';
  return 'en';
}

const LABELS: Record<string, { zh: string; en: string }> = {
  Text: { zh: '多行文本', en: 'Text' },
  Number: { zh: '数字', en: 'Number' },
  SingleSelect: { zh: '单选', en: 'Single Select' },
  MultiSelect: { zh: '多选', en: 'Multi Select' },
  DateTime: { zh: '日期', en: 'Date/Time' },
  Checkbox: { zh: '复选框', en: 'Checkbox' },
  Url: { zh: '超链接', en: 'URL' },
  User: { zh: '人员', en: 'User' },
  Phone: { zh: '电话', en: 'Phone' },
  Attachment: { zh: '附件', en: 'Attachment' },
  SingleLink: { zh: '单向关联', en: 'Single Link' },
  Lookup: { zh: '查找引用', en: 'Lookup' },
  Formula: { zh: '公式', en: 'Formula' },
  DuplexLink: { zh: '双向关联', en: 'Duplex Link' },
  Location: { zh: '地理位置', en: 'Location' },
  GroupChat: { zh: '群组', en: 'Group Chat' },
  CreatedTime: { zh: '创建时间', en: 'Created Time' },
  ModifiedTime: { zh: '最后更新时间', en: 'Modified Time' },
  CreatedUser: { zh: '创建人', en: 'Created User' },
  ModifiedUser: { zh: '更新人', en: 'Modified User' },
  AutoNumber: { zh: '自动编号', en: 'Auto Number' },
  Email: { zh: '邮箱', en: 'Email' },
  Barcode: { zh: '条码', en: 'Barcode' },
  Progress: { zh: '进度', en: 'Progress' },
  Currency: { zh: '货币', en: 'Currency' },
  Rating: { zh: '评分', en: 'Rating' },
};

const SYSTEM_TYPES = new Set(['CreatedTime','ModifiedTime','CreatedUser','ModifiedUser','AutoNumber','Formula','Lookup']);

// 字段分组函数
function groupFieldsByPrefix(fields: any[], customGroups?: Array<{ groupName: string; fields: string[] }>): Record<string, any[]> {
  const groups: Record<string, any[]> = {};
  
  if (customGroups && customGroups.length > 0) {
    // 使用自定义分组
    const customGroupMap = new Map<string, Set<string>>();
    customGroups.forEach(cg => {
      cg.fields.forEach(fieldPath => {
        if (!customGroupMap.has(cg.groupName)) {
          customGroupMap.set(cg.groupName, new Set());
        }
        customGroupMap.get(cg.groupName)!.add(fieldPath);
      });
    });
    
    const usedFields = new Set<string>();
    fields.forEach(f => {
      let matched = false;
      for (const [groupName, fieldSet] of customGroupMap.entries()) {
        if (fieldSet.has(f.name)) {
          if (!groups[groupName]) groups[groupName] = [];
          groups[groupName].push(f);
          usedFields.add(f.name);
          matched = true;
          break;
        }
      }
      if (!matched) {
        const groupName = '其他';
        if (!groups[groupName]) groups[groupName] = [];
        groups[groupName].push(f);
      }
    });
  } else {
    // 自动分组：按路径前缀
    fields.forEach(f => {
      const dotIndex = f.name.indexOf('.');
      const groupName = dotIndex > 0 ? f.name.substring(0, dotIndex) : '其他';
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(f);
    });
  }
  
  return groups;
}

// 缩短字段名显示
function shortenFieldName(fullName: string): string {
  const dotIndex = fullName.lastIndexOf('.');
  if (dotIndex > 0) {
    const shortName = fullName.substring(dotIndex + 1);
    return shortName.length > 20 ? shortName.substring(0, 17) + '...' : shortName;
  }
  return fullName.length > 20 ? fullName.substring(0, 17) + '...' : fullName;
}

export default function Preview({ tables, activeIndex = 0, onTabChange, warnings, onFieldTypeChange, onFieldLabelChange, onFieldToggle, lang, tableTargets, tableNames, onTableTargetChange }: Props) {
  const [query, setQuery] = React.useState('');
  const [onlySuggested, setOnlySuggested] = React.useState(false);
  const [groupingEnabled, setGroupingEnabled] = React.useState(true);
  const [selectedTypes, setSelectedTypes] = React.useState<string[]>([]);
  const tableOptionEntries = React.useMemo(() => {
    return Object.entries(tableNames || {}).sort((a, b) => a[1]?.localeCompare(b[1] ?? '') ?? 0);
  }, [tableNames]);
  function highlight(text: string, q: string){
    if (!q) return text;
    try {
      const idx = text.toLowerCase().indexOf(q.toLowerCase());
      if (idx === -1) return text;
      return (
        <>
          {text.slice(0, idx)}
          <mark>{text.slice(idx, idx + q.length)}</mark>
          {text.slice(idx + q.length)}
        </>
      );
    } catch { return text; }
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
    } catch {
      return undefined;
    }
  }

  // 切换类型筛选
  const toggleTypeFilter = (type: string) => {
    setSelectedTypes(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {warnings.length > 0 && (
        <div style={{ color: '#b36b00' }}>
          {warnings.map((w, i) => (
            <div key={i}>⚠️ {w}</div>
          ))}
        </div>
      )}
      {/* tabs 改为贴着字段说明下面渲染（而非全局顶部） */}
      {tables.length === 0 ? (
        <div className="card" style={{ padding: 16 }}>
          <div className="muted">暂无可预览的表，请先在上方粘贴 JSON 并解析。</div>
        </div>
      ) : tables.map((t, idx) => {
        if (idx !== activeIndex) return null;
        const targetConfig: TableTargetConfig = tableTargets[t.name] ?? { mode: 'auto' };
        const targetValue = targetConfig.mode === 'existing' ? targetConfig.tableId : 'auto';
        return (
        <div key={idx} className="card" style={{ overflow: 'hidden' }}>
          {/* 去掉单独的数据表标题行，只保留表格主体 */}
          <div style={{ padding: 0 }}>
          {t.fields.length > 0 ? (
            <div>
              {/* Sheet 区域：表内标题行 + 表头行 + 数据行，全部等宽 */}
              <div style={{ padding: '0.5rem 0.75rem' }}>
                <span
                  style={{ fontWeight: 600, cursor: 'help' }}
                  title="字段名称默认使用解析出的键，修改后以用户输入为准；系统字段与不可写字段已自动隐藏"
                >
                  字段
                </span>
              </div>
              {tables.length > 1 && (
                <div className="tabs" style={{ padding: '0 0.75rem 0.5rem 0.75rem' }}>
                  {tables.map((tb, i) => (
                    <button
                      key={i}
                      onClick={() => onTabChange && onTabChange(i)}
                      className={`tab ${i===activeIndex ? 'is-active' : ''}`}
                    >{tb.name || `表${i+1}`}</button>
                  ))}
                </div>
              )}
              <div style={{ padding: '0 0.75rem 0.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className="muted" style={{ fontSize: 12, fontWeight: 600 }}>目标数据表</span>
                <select
                  className="select"
                  value={targetValue}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!onTableTargetChange) return;
                    if (value === 'auto') {
                      onTableTargetChange(t.name, { mode: 'auto' });
                    } else {
                      const tableName = tableNames[value] || value;
                      onTableTargetChange(t.name, { mode: 'existing', tableId: value, tableName });
                    }
                  }}
                  style={{ width: '240px', maxWidth: '100%' }}
                >
                  <option value="auto">自动创建新表（默认）</option>
                  {tableOptionEntries.map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
                {targetConfig.mode === 'existing' ? (
                  <span className="muted" style={{ fontSize: 12 }}>将写入：{targetConfig.tableName}</span>
                ) : (
                  <span className="muted" style={{ fontSize: 12 }}>未选择目标时会自动创建并追踪结构</span>
                )}
              </div>
              {/* 搜索、筛选与批量操作 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0 0.75rem 0.5rem 0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input className="input" placeholder="搜索字段名…" value={query} onChange={(e)=>setQuery(e.target.value)} style={{ maxWidth: '100%', width: '280px', minWidth: '200px' }} />
                  <label className="muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input type="checkbox" checked={onlySuggested} onChange={(e)=>setOnlySuggested(e.target.checked)} /> 仅建议字段
                  </label>
                  <label className="muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input type="checkbox" checked={groupingEnabled} onChange={(e)=>setGroupingEnabled(e.target.checked)} /> 启用分组
                  </label>
                  <button className="btn" onClick={()=>{
                    const visible = (t.fields || []).filter((f:any)=>!SYSTEM_TYPES.has(f.type));
                    const filtered = visible.filter((f:any)=>{
                      if (onlySuggested && !((f as any).suggestedTypes && (f as any).suggestedTypes.length)) return false;
                      if (selectedTypes.length > 0 && !selectedTypes.includes(f.type)) return false;
                      return !query || String(f.name).toLowerCase().includes(query.toLowerCase()) || String((f as any).label||'').toLowerCase().includes(query.toLowerCase());
                    });
                    filtered.forEach((f:any, i:number)=>{
                      const idxField = t.fields.indexOf(f);
                      onFieldToggle && onFieldToggle(idx, idxField, true);
                    });
                  }}>全选可见</button>
                  <button className="btn" onClick={()=>{
                    const visible = (t.fields || []).filter((f:any)=>!SYSTEM_TYPES.has(f.type));
                    const filtered = visible.filter((f:any)=>{
                      if (onlySuggested && !((f as any).suggestedTypes && (f as any).suggestedTypes.length)) return false;
                      if (selectedTypes.length > 0 && !selectedTypes.includes(f.type)) return false;
                      return !query || String(f.name).toLowerCase().includes(query.toLowerCase()) || String((f as any).label||'').toLowerCase().includes(query.toLowerCase());
                    });
                    filtered.forEach((f:any)=>{
                      const idxField = t.fields.indexOf(f);
                      const enabled = (f as any).__enabled ?? true;
                      onFieldToggle && onFieldToggle(idx, idxField, !enabled);
                    });
                  }}>反选可见</button>
                </div>
                {/* 类型筛选标签 */}
                {(() => {
                  const visibleFields = (t.fields || []).filter((f:any)=>!SYSTEM_TYPES.has(f.type));
                  const availableTypes = Array.from(new Set(visibleFields.map((f:any) => f.type))).sort();
                  return (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span className="muted" style={{ fontSize: 12 }}>筛选类型：</span>
                      {availableTypes.map(type => (
                        <Tag
                          key={type}
                          color={selectedTypes.includes(type) ? 'blue' : 'grey'}
                          onClick={() => toggleTypeFilter(type)}
                          style={{ cursor: 'pointer' }}
                        >
                          {LABELS[type]?.[getLang(lang)] || type}
                        </Tag>
                      ))}
                      {selectedTypes.length > 0 && (
                        <Tag color="red" onClick={() => setSelectedTypes([])} style={{ cursor: 'pointer' }}>
                          清除筛选
                        </Tag>
                      )}
                    </div>
                  );
                })()}
              </div>
              <div style={{ borderTop: '1px solid var(--color-border)' }}>
                <div className="scroll-panel">
                  <div className="table-head">
                    <div className="table-head-cell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <input
                        type="checkbox"
                        checked={(() => {
                          const visible = (t.fields || []).filter((f:any)=>!SYSTEM_TYPES.has(f.type));
                          const filtered = visible.filter((f:any)=>{
                            if (onlySuggested && !((f as any).suggestedTypes && (f as any).suggestedTypes.length)) return false;
                            if (selectedTypes.length > 0 && !selectedTypes.includes(f.type)) return false;
                            return !query || String(f.name).toLowerCase().includes(query.toLowerCase()) || String((f as any).label||'').toLowerCase().includes(query.toLowerCase());
                          });
                          return filtered.length>0 && filtered.every((f:any)=>(f.__enabled ?? true));
                        })()}
                        onChange={(e)=>{
                          const enabled = e.target.checked;
                          const visible = (t.fields || []).filter((f:any)=>!SYSTEM_TYPES.has(f.type));
                          const filtered = visible.filter((f:any)=>{
                            if (onlySuggested && !((f as any).suggestedTypes && (f as any).suggestedTypes.length)) return false;
                            if (selectedTypes.length > 0 && !selectedTypes.includes(f.type)) return false;
                            return !query || String(f.name).toLowerCase().includes(query.toLowerCase()) || String((f as any).label||'').toLowerCase().includes(query.toLowerCase());
                          });
                          filtered.forEach((f:any)=>{
                            const idxField = t.fields.indexOf(f);
                            onFieldToggle && onFieldToggle(idx, idxField, enabled);
                          });
                        }}
                      />
                    </div>
                    <div className="table-head-cell">字段名称</div>
                    <div className="table-head-cell">字段类型</div>
                    <div className="table-head-cell" style={{ borderRight: 'none' }}>示例数据</div>
                  </div>
                  {/* 数据行 - 支持分组和展开 */}
                  {(() => {
                  // 获取过滤后的字段列表
                  let filteredFields = (t.fields || []).filter((f:any)=>!SYSTEM_TYPES.has(f.type))
                    .filter((f:any)=>{
                      if (onlySuggested && !((f as any).suggestedTypes && (f as any).suggestedTypes.length)) return false;
                      if (selectedTypes.length > 0 && !selectedTypes.includes(f.type)) return false;
                      return !query || String(f.name).toLowerCase().includes(query.toLowerCase()) || String((f as any).label||'').toLowerCase().includes(query.toLowerCase());
                    });

                  // 渲染单行的函数
                  const renderFieldRow = (f: any, fieldIndex: number, globalIndex: number) => {
                    const idxArr = (window as any).__sampleIdx || [];
                    const cursor = idxArr[idx] || 0;
                    const rec = ((t.records || [])[cursor] as any) || {};
                    const fieldValue = (f.name in rec) ? rec[f.name] : getByPath(rec, f.name);
                    const sampleValue = (() => {
                      if (Array.isArray(fieldValue) && fieldValue.length === 0) {
                        return '[空数组]';
                      }
                      if (typeof fieldValue === 'object' && fieldValue !== null) {
                        return JSON.stringify(fieldValue);
                      }
                      return String(fieldValue ?? '');
                    })();
                    const sampleValueFull = (() => {
                      if (Array.isArray(fieldValue) && fieldValue.length === 0) {
                        return '[空数组]';
                      }
                      return typeof fieldValue === 'object' && fieldValue !== null ? JSON.stringify(fieldValue, null, 2) : String(fieldValue ?? '');
                    })();

                        return (
                      <div key={globalIndex} className="table-row">
                        <div className="table-cell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <input
                            type="checkbox"
                            checked={(f as any).__enabled !== false}
                            onChange={(e) => {
                              const fieldIdx = t.fields.indexOf(f);
                              onFieldToggle && onFieldToggle(idx, fieldIdx, e.target.checked);
                            }}
                          />
                        </div>
                        <div className="table-cell">
                          <input
                            className="input"
                            style={{ fontFamily: 'monospace', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
                            defaultValue={(f as any).label || f.name}
                            placeholder={f.name}
                            onBlur={(e) => {
                              const fieldIdx = t.fields.indexOf(f);
                              onFieldLabelChange && onFieldLabelChange(idx, fieldIdx, e.target.value || f.name);
                            }}
                          />
                          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                            <Tooltip content={f.name}>
                              {highlight(shortenFieldName(String(f.name)), query)}
                            </Tooltip>
                            {(f as any).isCommon && (
                              <span style={{ marginLeft: 6, color: '#52c41a', fontSize: 10 }} title="所有记录都包含此字段">✓</span>
                            )}
                            {(f as any).presenceRate !== undefined && (f as any).presenceRate < 1.0 && (f as any).presenceRate > 0 && (
                              <span style={{ marginLeft: 6, color: '#faad14', fontSize: 10 }} title={`${Math.round((f as any).presenceRate * 100)}% 记录包含此字段`}>
                                {Math.round((f as any).presenceRate * 100)}%
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="table-cell">
                          <select
                            value={f.type}
                            onChange={(e) => {
                              const fieldIdx = t.fields.indexOf(f);
                              onFieldTypeChange && onFieldTypeChange(idx, fieldIdx, e.target.value);
                            }}
                            className="select"
                            style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
                          >
                            {(() => {
                              const suggestions = (f as any).suggestedTypes || TYPE_ENUM.filter(opt => !SYSTEM_TYPES.has(opt));
                              return suggestions.map((opt: string) => (
                                <option key={opt} value={opt}>{LABELS[opt]?.[getLang(lang)] || opt}</option>
                              ));
                            })()}
                          </select>
                        </div>
                        <div className="table-cell muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <Tooltip content={sampleValueFull}>
                            <span className="cell-text sample">{sampleValue}</span>
                          </Tooltip>
                        </div>
                      </div>
                    );
                  };

                  // 如果启用分组
                  if (groupingEnabled) {
                    const groups = groupFieldsByPrefix(filteredFields);
                    const groupKeys = Object.keys(groups).sort();
                    let globalIndex = 0;

                    return (
                      <Collapse defaultActiveKey={groupKeys} style={{ border: 'none', background: 'transparent' }}>
                        {groupKeys.map(groupName => {
                          const groupFields = groups[groupName];
                          return (
                            <Collapse.Panel 
                              header={`${groupName} (${groupFields.length})`} 
                              itemKey={groupName} 
                              key={groupName}
                              style={{ border: 'none' }}
                            >
                              <div>
                                {groupFields.map((f: any) => {
                                  const currentIndex = globalIndex++;
                                  const fieldIndex = t.fields.indexOf(f);
                                  return renderFieldRow(f, fieldIndex, currentIndex);
                                })}
                              </div>
                            </Collapse.Panel>
                          );
                        })}
                      </Collapse>
                    );
                  } else {
                    // 不分组，直接渲染
                    return (
                      <div>
                        {filteredFields.map((f: any, i) => {
                          const fieldIndex = t.fields.indexOf(f);
                          return renderFieldRow(f, fieldIndex, i);
                        })}
                      </div>
                    );
                  }
                  })()}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: 12 }} className="muted">该表暂无可编辑字段</div>
          )}
          </div>
        </div>
      );
    })}
    </div>
  );
}
