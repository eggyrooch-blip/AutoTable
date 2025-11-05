"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPlainObject = isPlainObject;
exports.parseDelimitedLine = parseDelimitedLine;
exports.parseDelimitedText = parseDelimitedText;
exports.parseYamlScalar = parseYamlScalar;
exports.parseYamlData = parseYamlData;
exports.parseXmlData = parseXmlData;
exports.parseLogData = parseLogData;
exports.detectFormat = detectFormat;
function isPlainObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}
function parseDelimitedLine(line, delimiter) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            }
            else {
                inQuotes = !inQuotes;
            }
        }
        else if (char === delimiter && !inQuotes) {
            result.push(current.trim());
            current = '';
        }
        else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}
function parseDelimitedText(text, delimiter) {
    const lines = text
        .split(/\r?\n/)
        .map((line) => line.trimEnd())
        .filter((line) => line.length > 0);
    if (!lines.length)
        return [];
    const headers = parseDelimitedLine(lines[0], delimiter);
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseDelimitedLine(lines[i], delimiter);
        if (values.length === 1 && values[0] === '')
            continue;
        const row = {};
        headers.forEach((header, idx) => {
            var _a;
            const key = header || `col_${idx + 1}`;
            row[key] = (_a = values[idx]) !== null && _a !== void 0 ? _a : '';
        });
        rows.push(row);
    }
    return rows;
}
function parseYamlScalar(value) {
    const trimmed = value.trim();
    if (!trimmed)
        return '';
    if (trimmed === 'null' || trimmed === '~')
        return null;
    if (trimmed === 'true')
        return true;
    if (trimmed === 'false')
        return false;
    if (/^[-+]?[0-9]+$/.test(trimmed))
        return Number(trimmed);
    if (/^[-+]?[0-9]*\.[0-9]+$/.test(trimmed))
        return Number(trimmed);
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
        return trimmed.slice(1, -1);
    }
    return trimmed;
}
function splitYamlKeyValue(line) {
    var _a;
    let inSingle = false;
    let inDouble = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === "'" && !inDouble)
            inSingle = !inSingle;
        else if (char === '"' && !inSingle)
            inDouble = !inDouble;
        if (char !== ':')
            continue;
        if (inSingle || inDouble)
            continue;
        const next = (_a = line[i + 1]) !== null && _a !== void 0 ? _a : '';
        if (next && ![' ', '\t', '\r', '\n', '"', "'", '[', '{'].includes(next))
            continue;
        const keyPart = line.slice(0, i).trim();
        if (!keyPart)
            return null;
        const valuePart = line.slice(i + 1).trim();
        return { key: keyPart, value: valuePart.length ? valuePart : null };
    }
    return null;
}
function tokenizeYaml(text) {
    const tokens = [];
    const lines = text
        .split(/\r?\n/)
        .map((line) => line.replace(/\t/g, '  '))
        .map((line) => line.replace(/#.*$/, ''))
        .filter((line) => line.trim().length > 0);
    for (const line of lines) {
        let indent = 0;
        while (indent < line.length && line[indent] === ' ')
            indent++;
        const trimmed = line.slice(indent);
        if (!trimmed)
            continue;
        if (trimmed.startsWith('- ')) {
            const rest = trimmed.slice(2);
            const kv = splitYamlKeyValue(rest);
            if (kv) {
                tokens.push({
                    type: 'sequence',
                    indent,
                    key: kv.key,
                    inlineValue: kv.value != null ? parseYamlScalar(kv.value) : null,
                    hasInlineValue: kv.value != null,
                    raw: trimmed,
                });
            }
            else {
                const payload = rest.trim();
                tokens.push({
                    type: 'sequence',
                    indent,
                    inlineValue: payload ? parseYamlScalar(payload) : undefined,
                    hasInlineValue: !!payload,
                    raw: trimmed,
                });
            }
            continue;
        }
        const kv = splitYamlKeyValue(trimmed);
        if (kv) {
            tokens.push({
                type: 'mapping',
                indent,
                key: kv.key,
                inlineValue: kv.value != null ? parseYamlScalar(kv.value) : null,
                hasInlineValue: kv.value != null,
                raw: trimmed,
            });
        }
        else {
            tokens.push({
                type: 'scalar',
                indent,
                inlineValue: parseYamlScalar(trimmed),
                raw: trimmed,
            });
        }
    }
    return tokens;
}
function parseYamlBlock(tokens, startIndex, indent) {
    if (startIndex >= tokens.length)
        return { value: null, next: startIndex };
    const first = tokens[startIndex];
    if (first.indent < indent)
        return { value: null, next: startIndex };
    if (first.type === 'sequence' && first.indent === indent) {
        const arr = [];
        let idx = startIndex;
        while (idx < tokens.length) {
            const token = tokens[idx];
            if (token.indent < indent || token.type !== 'sequence' || token.indent !== indent)
                break;
            const { value, next } = parseYamlSequenceItem(tokens, idx, indent);
            arr.push(value);
            idx = next;
        }
        return { value: arr, next: idx };
    }
    if (first.type === 'mapping' && first.indent === indent) {
        return parseYamlMapping(tokens, startIndex, indent);
    }
    if (first.type === 'scalar' && first.indent === indent) {
        return { value: first.inlineValue, next: startIndex + 1 };
    }
    return parseYamlBlock(tokens, startIndex, first.indent);
}
function parseYamlSequenceItem(tokens, index, indent) {
    const token = tokens[index];
    const childStart = index + 1;
    let childIdx = childStart;
    while (childIdx < tokens.length && tokens[childIdx].indent > indent)
        childIdx++;
    let nextIndex = childIdx;
    if (token.type !== 'sequence')
        return { value: null, next: nextIndex };
    if (token.key != null) {
        const result = {};
        if (token.hasInlineValue)
            result[token.key] = token.inlineValue;
        if (childStart < childIdx) {
            const child = parseYamlBlock(tokens, childStart, indent + 2);
            nextIndex = child.next;
            if (token.hasInlineValue) {
                if (isPlainObject(child.value)) {
                    Object.assign(result, child.value);
                }
                else if (child.value !== undefined) {
                    result[token.key] = child.value;
                }
            }
            else {
                result[token.key] = child.value;
            }
        }
        else if (!token.hasInlineValue) {
            result[token.key] = null;
        }
        return { value: result, next: nextIndex };
    }
    if (token.hasInlineValue) {
        let value = token.inlineValue;
        if (childStart < childIdx) {
            const child = parseYamlBlock(tokens, childStart, indent + 2);
            nextIndex = child.next;
            if (child.value !== undefined) {
                if (isPlainObject(value) && isPlainObject(child.value)) {
                    value = { ...value, ...child.value };
                }
                else if (isPlainObject(child.value)) {
                    value = { value, ...child.value };
                }
                else {
                    value = child.value;
                }
            }
        }
        return { value, next: nextIndex };
    }
    if (childStart < childIdx) {
        const child = parseYamlBlock(tokens, childStart, indent + 2);
        nextIndex = child.next;
        return { value: child.value, next: nextIndex };
    }
    return { value: null, next: index + 1 };
}
function parseYamlMapping(tokens, startIndex, indent) {
    const obj = {};
    let idx = startIndex;
    while (idx < tokens.length) {
        const token = tokens[idx];
        if (token.indent < indent)
            break;
        if (token.type === 'sequence' && token.indent === indent)
            break;
        if (token.type !== 'mapping' || token.indent !== indent)
            break;
        let value = token.hasInlineValue ? token.inlineValue : null;
        const childStart = idx + 1;
        let childIdx = childStart;
        while (childIdx < tokens.length && tokens[childIdx].indent > indent)
            childIdx++;
        let nextIndex = childIdx;
        if (childStart < childIdx) {
            const child = parseYamlBlock(tokens, childStart, indent + 2);
            nextIndex = child.next;
            if (!token.hasInlineValue) {
                value = child.value;
            }
            else if (isPlainObject(value) && isPlainObject(child.value)) {
                value = { ...value, ...child.value };
            }
            else if (value == null || value === '') {
                value = child.value;
            }
            else if (child.value !== undefined) {
                value = child.value;
            }
        }
        obj[token.key] = value;
        idx = nextIndex;
    }
    return { value: obj, next: idx };
}
function parseYamlData(text) {
    try {
        return JSON.parse(text);
    }
    catch {
        /* ignore */
    }
    const tokens = tokenizeYaml(text);
    if (!tokens.length)
        return {};
    const { value } = parseYamlBlock(tokens, 0, Math.min(tokens[0].indent, 0));
    return value !== null && value !== void 0 ? value : {};
}
function decodeXmlEntities(text) {
    return text
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, '&');
}
function parseXmlAttributes(raw) {
    var _a, _b, _c;
    const attrs = {};
    const attrRegex = /([^\s=]+)\s*=\s*("([^"]*)"|'([^']*)'|[^\s'">]+)/g;
    let match;
    while ((match = attrRegex.exec(raw))) {
        const name = match[1];
        const value = (_c = (_b = (_a = match[3]) !== null && _a !== void 0 ? _a : match[4]) !== null && _b !== void 0 ? _b : match[2]) !== null && _c !== void 0 ? _c : '';
        attrs[name] = decodeXmlEntities(value.replace(/^['"]|['"]$/g, ''));
    }
    return attrs;
}
function tokenizeXml(text) {
    const cleaned = text.replace(/<\?xml[^>]*\?>/g, '').replace(/<!--[\s\S]*?-->/g, '');
    const tokens = [];
    const tagRegex = /<\/?[^>]+>/g;
    let lastIndex = 0;
    let match;
    while ((match = tagRegex.exec(cleaned))) {
        if (match.index > lastIndex) {
            const segment = cleaned.slice(lastIndex, match.index).trim();
            if (segment)
                tokens.push({ type: 'text', value: decodeXmlEntities(segment) });
        }
        const tag = match[0];
        if (tag.startsWith('</')) {
            const name = tag.slice(2, -1).trim();
            tokens.push({ type: 'end', name });
        }
        else {
            const selfClosing = tag.endsWith('/>');
            const inner = tag.slice(1, selfClosing ? -2 : -1).trim();
            const parts = inner.split(/\s+/);
            const name = parts[0];
            const attrSource = inner.slice(name.length).trim();
            const attrs = attrSource ? parseXmlAttributes(attrSource) : {};
            tokens.push(selfClosing ? { type: 'self', name, attrs } : { type: 'start', name, attrs });
        }
        lastIndex = match.index + tag.length;
    }
    if (lastIndex < cleaned.length) {
        const tail = cleaned.slice(lastIndex).trim();
        if (tail)
            tokens.push({ type: 'text', value: decodeXmlEntities(tail) });
    }
    return tokens;
}
function buildXmlTree(tokens) {
    const stack = [];
    let root = null;
    for (const token of tokens) {
        if (token.type === 'text') {
            if (stack.length)
                stack[stack.length - 1].text.push(token.value);
            continue;
        }
        if (token.type === 'start') {
            const node = { name: token.name, attributes: token.attrs, children: [], text: [] };
            if (stack.length) {
                stack[stack.length - 1].children.push(node);
            }
            else {
                root = node;
            }
            stack.push(node);
            continue;
        }
        if (token.type === 'self') {
            const node = { name: token.name, attributes: token.attrs, children: [], text: [] };
            if (stack.length) {
                stack[stack.length - 1].children.push(node);
            }
            else {
                root = node;
            }
            continue;
        }
        if (token.type === 'end') {
            const popped = stack.pop();
            if (!popped || popped.name !== token.name) {
                throw new Error('XML 结构不匹配，请检查标签是否成对出现');
            }
            continue;
        }
    }
    if (stack.length) {
        throw new Error('XML 解析失败，存在未闭合的标签');
    }
    return root;
}
function xmlNodeToObject(node) {
    const attributes = Object.entries(node.attributes);
    const childrenMap = {};
    for (const child of node.children) {
        const value = xmlNodeToObject(child);
        if (childrenMap[child.name]) {
            if (!Array.isArray(childrenMap[child.name])) {
                childrenMap[child.name] = [childrenMap[child.name]];
            }
            childrenMap[child.name].push(value);
        }
        else {
            childrenMap[child.name] = value;
        }
    }
    const textContent = node.text.join('').trim();
    const hasChildren = Object.keys(childrenMap).length > 0;
    const hasAttributes = attributes.length > 0;
    if (!hasChildren) {
        if (!hasAttributes) {
            return parseYamlScalar(textContent);
        }
        const result = {};
        attributes.forEach(([key, value]) => {
            result[`@${key}`] = parseYamlScalar(value);
        });
        if (textContent)
            result['#text'] = parseYamlScalar(textContent);
        return result;
    }
    const result = { ...childrenMap };
    if (textContent)
        result['#text'] = parseYamlScalar(textContent);
    attributes.forEach(([key, value]) => {
        result[`@${key}`] = parseYamlScalar(value);
    });
    return result;
}
function parseXmlViaDom(text) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'application/xml');
    if (doc.getElementsByTagName('parsererror').length) {
        throw new Error('XML 解析失败，请检查格式是否正确');
    }
    const root = doc.documentElement;
    const convert = (node) => {
        var _a, _b;
        const childElements = Array.from(node.children);
        const attributes = node.attributes ? Array.from(node.attributes) : [];
        if (!childElements.length) {
            const text = (_b = (_a = node.textContent) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : '';
            if (!attributes.length)
                return parseYamlScalar(text);
            const payload = {};
            attributes.forEach((attr) => {
                payload[`@${attr.name}`] = parseYamlScalar(attr.value);
            });
            if (text)
                payload['#text'] = parseYamlScalar(text);
            return payload;
        }
        const obj = {};
        attributes.forEach((attr) => {
            obj[`@${attr.name}`] = parseYamlScalar(attr.value);
        });
        childElements.forEach((child) => {
            const value = convert(child);
            if (obj[child.tagName]) {
                if (!Array.isArray(obj[child.tagName]))
                    obj[child.tagName] = [obj[child.tagName]];
                obj[child.tagName].push(value);
            }
            else {
                obj[child.tagName] = value;
            }
        });
        const inlineText = Array.from(node.childNodes)
            .filter((n) => n.nodeType === Node.TEXT_NODE)
            .map((n) => { var _a; return ((_a = n.textContent) !== null && _a !== void 0 ? _a : '').trim(); })
            .filter(Boolean)
            .join(' ');
        if (inlineText)
            obj['#text'] = parseYamlScalar(inlineText);
        return obj;
    };
    return { [root.tagName]: convert(root) };
}
function parseXmlData(text) {
    const trimmed = text.trim();
    if (!trimmed)
        return {};
    if (typeof DOMParser !== 'undefined') {
        return parseXmlViaDom(trimmed);
    }
    const tokens = tokenizeXml(trimmed);
    if (!tokens.length)
        return {};
    const root = buildXmlTree(tokens);
    if (!root)
        return {};
    return { [root.name]: xmlNodeToObject(root) };
}
function parseLogData(text) {
    const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
    const records = [];
    const kvRegex = /(\b[\w.-]+)=("[^"]*"|'[^']*'|\S+)/g;
    for (const line of lines) {
        if (!line)
            continue;
        if (line.startsWith('{') || line.startsWith('[')) {
            try {
                const obj = JSON.parse(line);
                if (isPlainObject(obj)) {
                    records.push(obj);
                    continue;
                }
            }
            catch {
                /* ignore */
            }
        }
        const record = {};
        let match;
        while ((match = kvRegex.exec(line)) !== null) {
            const key = match[1];
            let val = match[2];
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                val = val.slice(1, -1);
            }
            record[key] = parseYamlScalar(val);
        }
        if (Object.keys(record).length === 0)
            record.message = line;
        records.push(record);
    }
    return records;
}
function detectFormat(text) {
    const trimmed = text.trim();
    if (!trimmed)
        return 'json';
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
            JSON.parse(trimmed);
            return 'json';
        }
        catch {
            /* ignore */
        }
    }
    if (/^<[^>]+>/.test(trimmed) && /<\/[^>]+>\s*$/.test(trimmed)) {
        return 'xml';
    }
    const lines = trimmed.split(/\r?\n/);
    if (lines.some((line) => /(\b[\w.-]+)=/.test(line))) {
        return 'log';
    }
    const tabSeparated = lines.filter((line) => line.includes('\t')).length;
    if (tabSeparated >= Math.max(1, Math.floor(lines.length / 2))) {
        return 'tsv';
    }
    const dashLines = lines.filter((line) => line.trim().startsWith('- ')).length;
    const colonLines = lines.filter((line) => /:\s*/.test(line)).length;
    if (dashLines >= 1 || colonLines >= Math.max(1, Math.floor(lines.length / 2))) {
        return 'yaml';
    }
    try {
        JSON.parse(trimmed);
        return 'json';
    }
    catch {
        /* ignore */
    }
    return 'yaml';
}
