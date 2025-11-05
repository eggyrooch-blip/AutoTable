"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTable = createTable;
exports.getTableByName = getTableByName;
exports.materializeTable = materializeTable;
exports.runPipeline = runPipeline;
exports.syncFieldDifferences = syncFieldDifferences;
const js_sdk_1 = require("@lark-base-open/js-sdk");
const utils_1 = require("./utils");
async function listTableNames() {
    const metas = await js_sdk_1.bitable.base.getTableMetaList();
    return metas.map(m => m.name);
}
async function createTable(tableName, log) {
    var _a;
    const desired = (0, utils_1.normalizeName)(tableName);
    const finalName = await (0, utils_1.resolveNameConflict)(listTableNames, desired, '_dup');
    log === null || log === void 0 ? void 0 : log(`创建数据表: ${finalName}`);
    const addRes = await js_sdk_1.bitable.base.addTable({ name: finalName, fields: [] });
    const table = await js_sdk_1.bitable.base.getTableById(addRes.tableId);
    try {
        const meta = await ((_a = table.getMeta) === null || _a === void 0 ? void 0 : _a.call(table));
        if (meta === null || meta === void 0 ? void 0 : meta.id) {
            log === null || log === void 0 ? void 0 : log(`  数据表ID: ${meta.id}`);
        }
    }
    catch { }
    return table;
}
async function getTableByName(tableName) {
    const metas = await js_sdk_1.bitable.base.getTableMetaList();
    const meta = metas.find(m => m.name === tableName);
    if (!meta)
        throw new Error(`未找到数据表: ${tableName}`);
    return await js_sdk_1.bitable.base.getTableById(meta.id);
}
function mapToFieldType(t) {
    switch (t) {
        case 'Number': return js_sdk_1.FieldType.Number;
        case 'Checkbox': return js_sdk_1.FieldType.Checkbox;
        case 'DateTime': return js_sdk_1.FieldType.DateTime;
        case 'SingleSelect': return js_sdk_1.FieldType.SingleSelect;
        case 'MultiSelect': return js_sdk_1.FieldType.MultiSelect;
        case 'Url': return js_sdk_1.FieldType.Url;
        case 'User': return js_sdk_1.FieldType.User;
        case 'Phone': return js_sdk_1.FieldType.Phone;
        case 'Attachment': return js_sdk_1.FieldType.Attachment;
        case 'SingleLink': return js_sdk_1.FieldType.SingleLink;
        case 'Lookup': return js_sdk_1.FieldType.Lookup;
        case 'Formula': return js_sdk_1.FieldType.Formula;
        case 'DuplexLink': return js_sdk_1.FieldType.DuplexLink;
        case 'Location': return js_sdk_1.FieldType.Location;
        case 'GroupChat': return js_sdk_1.FieldType.GroupChat;
        case 'CreatedTime': return js_sdk_1.FieldType.CreatedTime;
        case 'ModifiedTime': return js_sdk_1.FieldType.ModifiedTime;
        case 'CreatedUser': return js_sdk_1.FieldType.CreatedUser;
        case 'ModifiedUser': return js_sdk_1.FieldType.ModifiedUser;
        case 'AutoNumber': return js_sdk_1.FieldType.AutoNumber;
        case 'Email': return js_sdk_1.FieldType.Email;
        case 'Barcode': return js_sdk_1.FieldType.Barcode;
        case 'Progress': return js_sdk_1.FieldType.Progress;
        case 'Currency': return js_sdk_1.FieldType.Currency;
        case 'Rating': return js_sdk_1.FieldType.Rating;
        default: return js_sdk_1.FieldType.Text;
    }
}
async function createFieldInternal(table, field, log) {
    const desired = (0, utils_1.normalizeName)(field.label || field.name);
    const existing = await table.getFieldMetaList();
    const existingNames = new Set(existing.map((m) => m.name.toLowerCase()));
    let finalName = desired;
    if (existingNames.has(finalName.toLowerCase())) {
        let i = 1;
        while (existingNames.has((i === 1 ? `${desired}_dup` : `${desired}_dup${i}`).toLowerCase()))
            i++;
        finalName = i === 1 ? `${desired}_dup` : `${desired}_dup${i}`;
    }
    const type = field.type;
    log === null || log === void 0 ? void 0 : log(`  创建字段: ${finalName} (${type})`);
    const fieldType = mapToFieldType(type);
    const payload = { name: finalName, type: fieldType };
    if (fieldType === js_sdk_1.FieldType.SingleSelect || fieldType === js_sdk_1.FieldType.MultiSelect) {
        payload.property = { options: (field.options || []).map((n) => ({ name: n })) };
    }
    return await table.addField(payload);
}
function coerceCellValue(type, value) {
    if (value == null)
        return null;
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
            if (Array.isArray(value))
                return value.map(v => String(v));
            return String(value);
        default:
            if (typeof value === 'object')
                return JSON.stringify(value);
            return String(value);
    }
}
function getByPath(obj, path) {
    try {
        if (!obj)
            return undefined;
        if (!path)
            return obj;
        const parts = path.split('.');
        let cur = obj;
        for (const p of parts) {
            if (cur == null)
                return undefined;
            cur = cur[p];
        }
        return cur;
    }
    catch {
        return undefined;
    }
}
async function materializeTable(spec, options = {}, log) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    let table;
    if (options.writeOnly) {
        try {
            table = await getTableByName(spec.name);
        }
        catch {
            log === null || log === void 0 ? void 0 : log(`未找到现有数据表 ${spec.name}，自动创建`);
            table = await createTable(spec.name, log);
            try {
                const meta = await ((_a = table.getMeta) === null || _a === void 0 ? void 0 : _a.call(table));
                if (meta === null || meta === void 0 ? void 0 : meta.id)
                    (_b = options.onTableCreated) === null || _b === void 0 ? void 0 : _b.call(options, spec.name, meta.id);
            }
            catch {
                (_c = options.onTableCreated) === null || _c === void 0 ? void 0 : _c.call(options, spec.name, spec.name);
            }
        }
    }
    else {
        table = await createTable(spec.name, log);
        try {
            const meta = await ((_d = table.getMeta) === null || _d === void 0 ? void 0 : _d.call(table));
            if (meta === null || meta === void 0 ? void 0 : meta.id)
                (_e = options.onTableCreated) === null || _e === void 0 ? void 0 : _e.call(options, spec.name, meta.id);
            else
                (_f = options.onTableCreated) === null || _f === void 0 ? void 0 : _f.call(options, spec.name, spec.name);
        }
        catch {
            (_g = options.onTableCreated) === null || _g === void 0 ? void 0 : _g.call(options, spec.name, spec.name);
        }
    }
    const tableFieldMapping = (_h = options.fieldMapping) !== null && _h !== void 0 ? _h : {};
    const desiredFields = spec.fields
        .filter(f => f.__enabled !== false)
        .map(f => ({
        spec: f,
        key: f.key || f.name,
        label: f.label || f.name,
        source: f.source || f.name,
        type: f.type,
        options: f.options,
    }));
    const refreshMeta = async () => {
        const metas = await table.getFieldMetaList();
        const byId = new Map();
        const byName = new Map();
        for (const meta of metas) {
            byId.set(meta.id, meta);
            byName.set(meta.name.toLowerCase(), meta);
        }
        return { metas, byId, byName };
    };
    let { metas, byId: metasById, byName: metasByName } = await refreshMeta();
    const fieldIdCache = new Map();
    const resolveFieldId = async (key, label, source, fieldSpec) => {
        const mappingCandidate = tableFieldMapping[key];
        if (mappingCandidate && metasById.has(mappingCandidate)) {
            return mappingCandidate;
        }
        const labelLower = label.toLowerCase();
        const exact = metasByName.get(labelLower);
        if (exact)
            return exact.id;
        const normalizedLabel = (0, utils_1.normalizeName)(label);
        const normalizedMatch = metas.find((meta) => (0, utils_1.normalizeName)(meta.name) === normalizedLabel);
        if (normalizedMatch)
            return normalizedMatch.id;
        if (source) {
            const sourceLower = source.toLowerCase();
            const sourceMatch = metasByName.get(sourceLower);
            if (sourceMatch)
                return sourceMatch.id;
        }
        try {
            const creationRes = await createFieldInternal(table, { ...fieldSpec, label }, log);
            const createdId = typeof creationRes === 'string'
                ? creationRes
                : (creationRes === null || creationRes === void 0 ? void 0 : creationRes.fieldId) || (creationRes === null || creationRes === void 0 ? void 0 : creationRes.id);
            ({ metas, byId: metasById, byName: metasByName } = await refreshMeta());
            if (createdId && metasById.has(createdId)) {
                return createdId;
            }
            const refreshNormalized = metas.find((meta) => (0, utils_1.normalizeName)(meta.name) === normalizedLabel);
            if (refreshNormalized)
                return refreshNormalized.id;
        }
        catch (error) {
            log === null || log === void 0 ? void 0 : log(`  字段创建失败 ${label}: ${error.message}`);
        }
        return undefined;
    };
    for (const field of desiredFields) {
        const fieldId = await resolveFieldId(field.key, field.label, field.source, field.spec);
        if (fieldId) {
            fieldIdCache.set(field.key, fieldId);
            (_j = options.onFieldResolved) === null || _j === void 0 ? void 0 : _j.call(options, field.key, fieldId, field.label);
        }
        else {
            log === null || log === void 0 ? void 0 : log(`  字段无法定位: ${field.label}`);
        }
    }
    const shouldWrite = !options.createOnly && (options.writeAll || ((_k = options.insertSample) !== null && _k !== void 0 ? _k : false));
    const sampleSize = (_l = options.sampleSize) !== null && _l !== void 0 ? _l : 100;
    if (shouldWrite && spec.records && spec.records.length) {
        const rows = options.writeAll ? spec.records : spec.records.slice(0, sampleSize);
        const payloads = [];
        const insertedIds = [];
        for (const rec of rows) {
            const fields = {};
            for (const desired of desiredFields) {
                const fieldId = fieldIdCache.get(desired.key);
                if (!fieldId)
                    continue;
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
                if (Array.isArray(res))
                    insertedIds.push(...res);
            }
            catch (e) {
                log === null || log === void 0 ? void 0 : log(`  批量插入失败（${chunk.length} 条）: ${e.message}; 尝试逐条写入`);
                for (const item of chunk) {
                    try {
                        const res = await table.addRecords([item]);
                        if (Array.isArray(res))
                            insertedIds.push(...res);
                    }
                    catch (singleErr) {
                        log === null || log === void 0 ? void 0 : log(`    插入失败: ${singleErr.message}`);
                    }
                }
            }
        }
        if (insertedIds.length) {
            (_m = options.onRecordsInserted) === null || _m === void 0 ? void 0 : _m.call(options, spec.name, insertedIds);
        }
    }
    return table;
}
async function runPipeline(specs, options = {}, log) {
    var _a;
    for (const spec of specs) {
        try {
            await materializeTable(spec, {
                insertSample: options.insertSample,
                sampleSize: options.sampleSize,
                writeAll: options.writeAll,
                createOnly: options.createOnly,
                writeOnly: options.writeOnly,
                fieldMapping: (_a = options.fieldMapping) === null || _a === void 0 ? void 0 : _a[spec.name],
                onFieldResolved: (fieldKey, fieldId, fieldLabel) => {
                    var _a;
                    (_a = options.onFieldResolved) === null || _a === void 0 ? void 0 : _a.call(options, spec.name, fieldKey, fieldId, fieldLabel);
                },
                onTableCreated: (tableName, tableId) => {
                    var _a;
                    (_a = options.onTableCreated) === null || _a === void 0 ? void 0 : _a.call(options, tableName, tableId);
                },
                onRecordsInserted: (tableName, recordIds) => {
                    var _a;
                    (_a = options.onRecordsInserted) === null || _a === void 0 ? void 0 : _a.call(options, tableName, recordIds);
                },
            }, log);
            log === null || log === void 0 ? void 0 : log(`完成: ${spec.name}`);
        }
        catch (e) {
            log === null || log === void 0 ? void 0 : log(`失败: ${spec.name} - ${e.message}`);
        }
    }
}
function cloneFieldMapping(mapping) {
    const result = {};
    if (!mapping)
        return result;
    for (const [tableName, fieldMap] of Object.entries(mapping)) {
        result[tableName] = { ...fieldMap };
    }
    return result;
}
function resolveFieldIdFromMeta(key, label, source, tableMapping, metas, metasById, metasByName) {
    let candidate = tableMapping[key];
    if (candidate && metasById.has(candidate))
        return candidate;
    const labelLower = label.toLowerCase();
    const exact = metasByName.get(labelLower);
    if (exact)
        return exact.id;
    const normalizedLabel = (0, utils_1.normalizeName)(label);
    const normalizedMatch = metas.find((meta) => (0, utils_1.normalizeName)(meta.name) === normalizedLabel);
    if (normalizedMatch)
        return normalizedMatch.id;
    if (source) {
        const sourceLower = source.toLowerCase();
        const sourceMatch = metasByName.get(sourceLower);
        if (sourceMatch)
            return sourceMatch.id;
    }
    return undefined;
}
async function syncFieldDifferences(specs, options = {}, log) {
    var _a;
    const mapping = cloneFieldMapping(options.fieldMapping);
    for (const spec of specs) {
        let table;
        try {
            table = await getTableByName(spec.name);
        }
        catch (error) {
            log === null || log === void 0 ? void 0 : log(`跳过同步（未找到数据表）: ${spec.name}`);
            continue;
        }
        const metas = await table.getFieldMetaList();
        const metasById = new Map();
        const metasByName = new Map();
        for (const meta of metas) {
            metasById.set(meta.id, meta);
            metasByName.set(meta.name.toLowerCase(), meta);
        }
        const tableMapping = (_a = mapping[spec.name]) !== null && _a !== void 0 ? _a : {};
        mapping[spec.name] = tableMapping;
        const desiredEnabled = spec.fields
            .filter(f => f.__enabled !== false)
            .map(f => ({
            key: f.key || f.name,
            label: f.label || f.name,
            source: f.source || f.name,
            spec: f,
        }));
        const disabledFields = spec.fields
            .filter(f => f.__enabled === false)
            .map(f => ({
            key: f.key || f.name,
            label: f.label || f.name,
            source: f.source || f.name,
        }));
        for (const field of desiredEnabled) {
            const fieldId = resolveFieldIdFromMeta(field.key, field.label, field.source, tableMapping, metas, metasById, metasByName);
            if (!fieldId) {
                log === null || log === void 0 ? void 0 : log(`  未找到可同步字段: ${field.label}`);
                continue;
            }
            tableMapping[field.key] = fieldId;
            const meta = metasById.get(fieldId);
            if (meta && meta.name !== field.label) {
                try {
                    await table.setField(fieldId, { name: field.label });
                    log === null || log === void 0 ? void 0 : log(`  字段重命名成功: ${meta.name} -> ${field.label}`);
                    metasByName.delete(meta.name.toLowerCase());
                    meta.name = field.label;
                    metasByName.set(field.label.toLowerCase(), meta);
                }
                catch (error) {
                    log === null || log === void 0 ? void 0 : log(`  字段重命名失败 ${field.label}: ${error.message}`);
                }
            }
        }
        for (const field of disabledFields) {
            const fieldId = resolveFieldIdFromMeta(field.key, field.label, field.source, tableMapping, metas, metasById, metasByName);
            if (!fieldId) {
                log === null || log === void 0 ? void 0 : log(`  未找到可删除字段: ${field.label}`);
                continue;
            }
            try {
                const success = await table.deleteField(fieldId);
                if (success) {
                    log === null || log === void 0 ? void 0 : log(`  已删除字段: ${field.label}`);
                    delete tableMapping[field.key];
                    metasById.delete(fieldId);
                    metasByName.delete(field.label.toLowerCase());
                }
            }
            catch (error) {
                log === null || log === void 0 ? void 0 : log(`  删除字段失败 ${field.label}: ${error.message}`);
            }
        }
        const specKeys = new Set(spec.fields.map(f => f.key || f.name));
        for (const key of Object.keys(tableMapping)) {
            if (!specKeys.has(key))
                delete tableMapping[key];
        }
        if (Object.keys(tableMapping).length === 0) {
            delete mapping[spec.name];
        }
    }
    return mapping;
}
