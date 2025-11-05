"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSpecFromJson = generateSpecFromJson;
function isPlainObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}
function extractDataList(jsonData, sourceRoot) {
    const isObjectArray = (arr) => arr.some(item => isPlainObject(item));
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
                if (isObjectArray(arr))
                    return arr;
            }
        }
        if (Array.isArray(jsonData) && isObjectArray(jsonData)) {
            return jsonData;
        }
    }
    else {
        const parts = sourceRoot.split('.');
        let cursor = jsonData;
        for (const part of parts) {
            if (!isPlainObject(cursor)) {
                cursor = undefined;
                break;
            }
            cursor = cursor === null || cursor === void 0 ? void 0 : cursor[part];
        }
        if (Array.isArray(cursor) && isObjectArray(cursor)) {
            return cursor;
        }
    }
    if (isPlainObject(jsonData)) {
        for (const value of Object.values(jsonData)) {
            if (Array.isArray(value) && isObjectArray(value))
                return value;
        }
    }
    if (isPlainObject(jsonData)) {
        return [jsonData];
    }
    return Array.isArray(jsonData) && isObjectArray(jsonData) ? jsonData : [];
}
function flattenRecord(obj, prefix = '') {
    const output = {};
    if (!obj)
        return output;
    for (const [key, value] of Object.entries(obj)) {
        const path = prefix ? `${prefix}.${key}` : key;
        if (isPlainObject(value)) {
            Object.assign(output, flattenRecord(value, path));
        }
        else {
            output[path] = value;
        }
    }
    return output;
}
const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+\-]\d{2}:?\d{2})?)?$/;
function detectType(value) {
    if (value === null || value === undefined)
        return 'text';
    if (typeof value === 'number')
        return 'number';
    if (typeof value === 'boolean')
        return 'checkbox';
    if (typeof value === 'string') {
        if (ISO_DATETIME.test(value))
            return 'datetime';
        return 'text';
    }
    if (Array.isArray(value))
        return 'text';
    if (isPlainObject(value)) {
        if ('longitude' in value && 'latitude' in value)
            return 'location';
        if ('token' in value)
            return 'attachment';
    }
    return 'text';
}
function sampleArray(input, limit = 200) {
    if (!Array.isArray(input))
        return [];
    if (input.length <= limit)
        return [...input];
    return input.slice(0, limit);
}
function analyseStructure(dataList) {
    var _a;
    const sample = sampleArray(dataList, 200);
    const childTables = new Map();
    const masterFieldTypes = new Map();
    const masterRecords = [];
    const childRecordMap = new Map();
    for (const rec of sample) {
        if (!isPlainObject(rec))
            continue;
        for (const [key, value] of Object.entries(rec)) {
            if (Array.isArray(value) && value.length && isPlainObject(value[0])) {
                const bucket = (_a = childTables.get(key)) !== null && _a !== void 0 ? _a : [];
                bucket.push(...value.slice(0, 50));
                childTables.set(key, bucket);
            }
        }
        const flat = flattenRecord(rec);
        masterRecords.push(flat);
        for (const [key, value] of Object.entries(flat)) {
            if (!masterFieldTypes.has(key))
                masterFieldTypes.set(key, detectType(value));
        }
    }
    const fields = [];
    for (const [name, type] of masterFieldTypes.entries()) {
        fields.push({ target: name, source: name, type });
    }
    const children = [];
    for (const [name, rows] of childTables.entries()) {
        const fieldTypes = new Map();
        const flattenedRows = [];
        for (const row of rows) {
            if (!isPlainObject(row))
                continue;
            const flat = flattenRecord(row);
            flattenedRows.push(flat);
            for (const [key, value] of Object.entries(flat)) {
                if (!fieldTypes.has(key))
                    fieldTypes.set(key, detectType(value));
            }
        }
        const childFields = [];
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
function generateSpecFromJson(jsonData, entity = 'order', sourceRoot = 'auto') {
    var _a;
    const dataList = extractDataList(jsonData, sourceRoot);
    const structure = analyseStructure(Array.isArray(dataList) ? dataList : []);
    const masterTable = {
        key: 'master',
        table_name: '主表',
        app_token_key: 'default',
        record_source: { kind: 'root', unique_key: 'id' },
        fields: structure.fields,
        records: structure.master_records,
    };
    const tables = [masterTable];
    for (const child of structure.child_tables) {
        const records = (_a = structure.child_records_map.get(child.key)) !== null && _a !== void 0 ? _a : [];
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
