from flask import Flask, request, jsonify
from flask_cors import CORS

# 复用 JS 版生成器的思路，这里实现等价的 Python 版最小逻辑

def is_plain_object(x):
    return isinstance(x, dict)


def extract_data_list(json_data, source_root):
    if not source_root or source_root in ("auto", "data"):
        keys = [
            "data", "result", "results",
            "list", "items", "records", "rows", "content",
            "value", "values", "payload", "body", "response", "object",
            "node", "nodes", "edges", "hits", "documents",
            "page", "dataset", "entry", "resource", "resources", "info", "detail", "output", "meta", "contentData",
            "dataList", "resultList", "resultSet", "dataSet",
        ]
        for k in keys:
            if is_plain_object(json_data) and isinstance(json_data.get(k), list):
                return json_data[k]
        if isinstance(json_data, list):
            return json_data
    else:
        parts = source_root.split('.')
        cur = json_data
        for p in parts:
            if cur is None or not is_plain_object(cur):
                cur = None
                break
            cur = cur.get(p)
        if isinstance(cur, list):
            return cur

    if is_plain_object(json_data):
        for v in json_data.values():
            if isinstance(v, list):
                return v
    return json_data if isinstance(json_data, list) else []


def flatten_record(obj, prefix=""):
    out = {}
    for k, v in (obj or {}).items():
        key = f"{prefix}.{k}" if prefix else k
        if isinstance(v, dict):
            out.update(flatten_record(v, key))
        else:
            out[key] = v
    return out


def detect_type(val):
    if val is None:
        return "text"
    if isinstance(val, (int, float)):
        return "number"
    if isinstance(val, list):
        # 识别空数组类型，用于类型推断和显示
        # 注意：空数组在写入时会被转为null，但类型标识有助于前端显示
        return "array"
    if isinstance(val, str):
        import re
        if re.match(r"^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+\-]\d{2}:?\d{2})?)?$", val):
            return "datetime"
        return "text"
    return "text"


def analyze_structure(data_list, force_child_tables=None, merge_strategy="all"):
    """
    分析数据结构
    Args:
        data_list: 数据列表
        force_child_tables: 强制作为子表的字段名列表（即使为空数组也生成子表）
        merge_strategy: 字段合并策略，"all"合并所有字段，"common"仅共同字段
    """
    if force_child_tables is None:
        force_child_tables = []
    
    sample = data_list[:200]
    child_tables = {}
    master_fields = {}
    master_records = []  # 保存主表的扁平化记录

    for rec in sample:
        if not is_plain_object(rec):
            continue
        
        # child arrays
        for k, v in rec.items():
            # 检查是否强制作为子表
            if k in force_child_tables:
                # 强制作为子表，即使为空数组也创建
                if isinstance(v, list):
                    if v and isinstance(v[0], dict):
                        child_tables.setdefault(k, []).extend(v[:50])
                    else:
                        # 空数组或非对象数组，创建空的子表结构
                        child_tables.setdefault(k, [])
            elif isinstance(v, list) and v and isinstance(v[0], dict):
                # 原有逻辑：非空对象数组
                child_tables.setdefault(k, []).extend(v[:50])
        
        # 扁平化主表记录并保存
        flat = flatten_record(rec)
        master_records.append(flat)
        for k, v in flat.items():
            master_fields.setdefault(k, detect_type(v))

    # 字段合并策略处理
    if merge_strategy == "common":
        # 仅保留在所有记录中都存在的字段
        all_record_fields = []
        for rec in master_records:
            all_record_fields.append(set(rec.keys()))
        if all_record_fields:
            common_fields = set.intersection(*all_record_fields)
            master_fields = {k: v for k, v in master_fields.items() if k in common_fields}
    
    fields = [{"target": n, "type": t, "source": n} for n, t in master_fields.items()]

    children = []
    child_records_map = {}  # 保存子表的扁平化记录
    for name, rows in child_tables.items():
        fmap = {}
        flattened_child_records = []
        
        if rows:  # 如果有数据
            for r in rows:
                flat = flatten_record(r)
                flattened_child_records.append(flat)
                for k, v in flat.items():
                    fmap.setdefault(k, detect_type(v))
        else:
            # 强制子表但无数据：从主表记录中推断字段结构
            for rec in master_records:
                # 检查主表记录中是否有该字段的空数组
                if name in rec:
                    # 如果主表记录中有该字段，尝试从其他记录推断结构
                    # 这里我们至少创建一个基本结构
                    pass
        
        cfields = [{"target": n, "type": t, "source": n} for n, t in fmap.items()]
        children.append({
            "key": name,
            "table_name": name,
            "record_source": {"kind": "child", "path": name, "parent_key": "id"},
            "fields": cfields,
            "is_forced": name in (force_child_tables or []),  # 标记是否为强制子表
        })
        child_records_map[name] = flattened_child_records[:200]  # 限制子表记录数量
    
    return {
        "fields": fields, 
        "child_tables": children,
        "master_records": master_records,  # 返回主表记录
        "child_records_map": child_records_map  # 返回子表记录映射
    }


def generate_spec(json_data, entity="order", source_root="data", merge_strategy="all", force_child_tables=None):
    """
    生成spec
    Args:
        json_data: JSON数据
        entity: 实体类型
        source_root: 数据根路径
        merge_strategy: 字段合并策略，"all"合并所有字段，"common"仅共同字段
        force_child_tables: 强制作为子表的字段名列表
    """
    data_list = extract_data_list(json_data, source_root)
    structure = analyze_structure(data_list, force_child_tables=force_child_tables, merge_strategy=merge_strategy)
    
    # 构建主表，包含记录数据
    master_table = {
        "key": "master",
        "table_name": "主表",
        "app_token_key": "default",
        "record_source": {"kind": "root", "unique_key": "id"},
        "fields": structure["fields"],
        "records": structure.get("master_records", []),  # 添加主表记录
    }
    
    tables = [master_table]
    
    # 构建子表，包含记录数据
    for c in structure["child_tables"]:
        c2 = dict(c)
        c2["app_token_key"] = "default"
        # 为子表添加对应的记录数据
        child_key = c.get("key")
        if child_key and "child_records_map" in structure:
            c2["records"] = structure["child_records_map"].get(child_key, [])
        else:
            c2["records"] = []
        tables.append(c2)
    
    return {
        "entity": entity,
        "version": "2025.01.01",
        "description": f"{entity} ingestion mapping",
        "source_root": source_root,
        "tables": tables,
    }


app = Flask(__name__)
CORS(app)


@app.post("/api/spec/generate")
def spec_generate():
    try:
        payload = request.get_json(force=True, silent=False) or {}
        json_data = payload.get("json_data")
        entity = payload.get("entity", "order")
        source_root = payload.get("source_root", "auto")
        merge_strategy = payload.get("merge_strategy", "all")  # "all" 或 "common"
        force_child_tables = payload.get("force_child_tables", [])  # 强制子表字段列表
        if json_data is None:
            return jsonify({"error": "missing json_data"}), 400
        spec = generate_spec(json_data, entity, source_root, merge_strategy, force_child_tables)
        return jsonify({"spec": spec})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port)


