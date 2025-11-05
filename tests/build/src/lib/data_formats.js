"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DATA_FORMAT_OPTIONS = void 0;
exports.getFormatAcceptMime = getFormatAcceptMime;
exports.getFormatPlaceholder = getFormatPlaceholder;
exports.getFormatLabel = getFormatLabel;
exports.DATA_FORMAT_OPTIONS = [
    { value: 'auto', label: '自动识别' },
    { value: 'json', label: 'JSON' },
    { value: 'tsv', label: 'TSV' },
    { value: 'yaml', label: 'YAML' },
    { value: 'log', label: '日志' },
];
function getFormatAcceptMime(format, detected) {
    if (format === 'auto') {
        return [
            'application/json',
            '.json',
            '.tsv',
            '.tab',
            'text/tab-separated-values',
            'text/plain',
            '.yaml',
            '.yml',
            'text/yaml',
            '.log',
            '.txt',
        ].join(',');
    }
    const resolved = detected !== null && detected !== void 0 ? detected : format;
    switch (resolved) {
        case 'json':
            return 'application/json,.json';
        case 'tsv':
            return '.tsv,.tab,text/tab-separated-values,text/plain';
        case 'yaml':
            return '.yaml,.yml,text/yaml';
        case 'log':
            return '.log,.txt,text/plain';
        default:
            return '';
    }
}
function getFormatPlaceholder(format, detected) {
    if (format === 'auto') {
        const current = getFormatLabel(detected !== null && detected !== void 0 ? detected : 'json');
        return `粘贴数据，自动识别格式（当前：${current}）`;
    }
    switch (format) {
        case 'json':
            return '粘贴接口返回的 JSON';
        case 'tsv':
            return '粘贴 TSV 数据（tab 分隔，首行为表头）';
        case 'yaml':
            return '粘贴 YAML 数据';
        case 'log':
            return '粘贴日志行（支持 key=value 或 JSON 行）';
        default:
            return '';
    }
}
function getFormatLabel(format) {
    switch (format) {
        case 'json':
            return 'JSON';
        case 'tsv':
            return 'TSV';
        case 'yaml':
            return 'YAML';
        case 'log':
            return '日志';
        default:
            if (format === 'xml')
                return 'XML（暂不支持）';
            return format;
    }
}
