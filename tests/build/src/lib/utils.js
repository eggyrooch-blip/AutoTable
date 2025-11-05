"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeName = normalizeName;
exports.resolveNameConflict = resolveNameConflict;
function normalizeName(name) {
    if (!name)
        return 'unnamed';
    // 替换不安全字符，并裁剪长度
    let n = name.trim().replace(/[\n\r\t]/g, ' ').replace(/\s+/g, ' ');
    n = n.replace(/[\\/:*?"<>|]/g, '_');
    if (n.length > 80)
        n = n.slice(0, 80);
    return n || 'unnamed';
}
async function resolveNameConflict(listExisting, desired, suffix = '_dup') {
    const existing = new Set((await listExisting()).map(s => s.toLowerCase()));
    let name = desired;
    if (!existing.has(name.toLowerCase()))
        return name;
    let i = 1;
    while (true) {
        const candidate = i === 1 ? `${desired}${suffix}` : `${desired}${suffix}${i}`;
        if (!existing.has(candidate.toLowerCase()))
            return candidate;
        i++;
        if (i > 1000)
            throw new Error('命名冲突次数过多');
    }
}
