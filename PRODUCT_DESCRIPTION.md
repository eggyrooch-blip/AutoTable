# JSON → 多维表格自动建表/字段 产品说明

## 产品概述

**产品名称**：JSON → 多维表格自动建表/字段  
**定位**：飞书多维表格（Base）侧边栏插件  
**核心价值**：将任意 JSON 数据快速转换为多维表格结构，自动推断字段类型，实现一键建表和导入数据

---

## 产品主要目的

### 核心目标
1. **消除手动建表成本**：从粘贴 JSON 到生成完整的多维表格，全过程自动化
2. **智能类型推断**：自动识别字段类型（文本、数字、日期、邮箱、电话、URL 等 25+ 种类型）
3. **灵活数据适配**：支持标准 JSON、JavaScript 对象字面量、嵌套结构、API 响应体等多种数据格式
4. **用户可控**：允许自定义字段名称、手动调整字段类型、选择性导入字段

### 解决的核心问题
- **场景1**：开发人员需要将 API 响应快速导入到飞书 Base 进行分析
- **场景2**：业务人员需要将 Excel/数据库导出的 JSON 数据转为多维表格
- **场景3**：数据工程师需要批量创建多个数据表并导入历史数据
- **场景4**：需要快速搭建原型，验证数据结构和业务逻辑

---

## 产品核心能力

### 1. 自动表结构分析
- 解析 JSON 数据，自动识别主表和子表
- 检测数组嵌套、对象结构、键值对等复杂数据形态
- 支持 `data`、`result`、`items` 等 30+ 种常见的根键识别

### 2. 智能字段类型推断
支持 25+ 种多维表格字段类型：

| 类型分类 | 支持类型 | 自动识别规则 |
|---------|---------|------------|
| **文本类** | Text（多行文本） | 默认类型 |
| | Email | 邮箱格式 `xxx@xxx.xxx` |
| | Phone | 手机号格式 `1[3-9]\\d{9}` |
| | Barcode | 条码格式 `[A-Z0-9]{8,}` |
| **数字类** | Number | 整数、浮点数 |
| | Progress | 0-100 范围的数字 |
| | Rating | 0-5 范围的数字 |
| | Currency | 货币对象（含 amount/currency 字段） |
| **日期时间** | DateTime | ISO 格式日期字符串 |
| **布尔** | Checkbox | true/false |
| **选项** | SingleSelect | 字符串枚举 |
| | MultiSelect | 字符串数组 |
| **关联** | SingleLink | 对象包含 id 字段 |
| | DuplexLink | 双向关联对象 |
| **定位** | Location | {longitude, latitude} 对象 |
| **附件** | Attachment | {token: "xxx"} 对象 |
| **链接** | Url | HTTP/HTTPS 链接 |
| **系统字段** | AutoNumber | 不可编辑 |
| | CreatedTime | 不可编辑 |
| | ModifiedTime | 不可编辑 |
| | CreatedUser | 不可编辑 |
| | ModifiedUser | 不可编辑 |

### 3. 字段管理
- **自定义字段名称**：默认使用 JSON 键名，可编辑修改
- **字段类型切换**：基于示例数据提供候选类型建议，支持下拉选择
- **选择性导入**：通过 checkbox 控制是否写入该字段
- **批量操作**：支持全选/全不选

### 4. 数据预览与导航
- **实时预览**：解析后立即显示字段结构、类型、示例数据
- **记录导航**：支持“上一条/下一条”浏览示例数据
- **多表切换**：Excel 风格的表单页签，支持切换主表/子表

### 5. 灵活的执行策略
- **仅创建结构**：只创建表与字段，不导入数据
- **采样导入**：导入 2 条示例数据用于验证
- **全量导入**：导入所有数据（最多 100 条，可配置）

### 6. 冲突处理
- **名称冲突**：自动在冲突的名称后追加 `_dup`、`_dup2` 等后缀
- **系统字段**：自动隐藏不可写字段，避免误操作

---

## 支持的数据结构

### 1. ✅ SQL 结果集
**格式**：`[{id:1, name:"张三", age:25}]`  
**说明**：每个对象为一条记录，对象键为字段名

**验证数据**：
```javascript
[
  {id:1, name:"张三", age:25, email:"zhangsan@example.com"},
  {id:2, name:"李四", age:30, email:"lisi@example.com"}
]
```

### 2. ✅ 标准 JSON 对象
**格式**：`{"key":"value", "num":123}`  
**说明**：单个对象会被解析为单行记录

**验证数据**：
```json
{
  "id": "u001",
  "name": "张三",
  "age": 25,
  "active": true
}
```

### 3. ✅ API 响应体（嵌套套娃）
**格式**：`{data: {result: [{...}]}}`  
**说明**：自动识别 `data`、`result`、`results`、`list`、`items`、`records` 等 30+ 种根键

**验证数据**：
```javascript
{
  code: 200,
  message: "success",
  data: {
    result: [
      {id: 1, name: "订单1", amount: 100.50, status: "completed"},
      {id: 2, name: "订单2", amount: 200.75, status: "pending"}
    ]
  }
}
```

### 4. ✅ 嵌套对象（自动扁平化）
**格式**：`{user: {profile: {age: 25}}}`  
**说明**：自动展开为 `user.profile.age`

**验证数据**：
```javascript
{
  user: {
    id: "u001",
    name: "张三",
    profile: {
      age: 25,
      city: "北京",
      contacts: {
        phone: "13800138000",
        email: "zhangsan@example.com"
      }
    }
  }
}
```
**生成字段**：`user.id`, `user.name`, `user.profile.age`, `user.profile.city`, `user.profile.contacts.phone`, `user.profile.contacts.email`

### 5. ✅ 键值对数组
**格式**：`[{key:"收入", value:1000}]`  
**说明**：自动映射为两列（key 和 value）

**验证数据**：
```javascript
[
  {key: "收入", value: 1000, type: "monthly"},
  {key: "支出", value: 500, type: "monthly"},
  {key: "余额", value: 500, type: "total"}
]
```

### 6. ✅ 包含日期字段的数据
**格式**：`{applyTime: "2025-07-30 10:57:18"}`  
**说明**：自动识别 ISO 日期格式并推荐 DateTime 类型

**验证数据**：
```javascript
{
  data: [
    {
      applyTime: "2025-07-30 10:57:18",
      id: "12345",
      applicant: "张三",
      amount: 5000,
      description: "差旅费用"
    }
  ]
}
```

### 7. ✅ 多表结构（主子表）
**格式**：主表包含子数组  
**说明**：自动识别数组类型的子表，创建关联表

**验证数据**：
```javascript
{
  data: [
    {
      orderId: "ORD001",
      customer: "张三",
      items: [
        {product: "商品A", quantity: 2, price: 100},
        {product: "商品B", quantity: 1, price: 200}
      ]
    }
  ]
}
```
**生成结构**：
- 主表：`orderId`, `customer`
- 子表（items）：`product`, `quantity`, `price`

### 8. ✅ JavaScript 对象字面量（非严格 JSON）
**格式**：`{id:1, name:"张三"}`（不带引号的键）  
**说明**：使用 relaxed-json 库支持，兼容常见编程语言对象字面量语法

**验证数据**：
```javascript
[
  {id:1, name:"张三", age:25, email:"zhangsan@example.com"},
  {id:2, name:"李四", age:30, email:"lisi@example.com"}
]
```

### 9. ✅ 混合类型数据
**格式**：包含多种数据类型的复杂结构  
**说明**：自动识别并推荐合适的字段类型

**验证数据**：
```javascript
[
  {
    id: 1,
    name: "测试项目",
    isActive: true,
    score: 4.5,
    url: "https://example.com",
    tags: ["前端", "后端", "全栈"],
    metadata: {
      created: "2025-01-01",
      author: {name: "张三", email: "zhangsan@example.com"}
    }
  }
]
```

---

## 技术架构

### 前端技术栈
- **框架**：React 18 + TypeScript
- **构建工具**：Vite 5
- **SDK**：@lark-base-open/js-sdk v0.5.0
- **JSON 解析**：relaxed-json（支持非严格 JSON）
- **UI 组件**：Semi Design

### 后端技术栈
- **框架**：Python Flask
- **API 端口**：8000
- **核心逻辑**：复用原有 SpecGenerator（字段类型推断、表结构分析）

### 数据流
```
用户输入 JSON → relaxed-json 解析 → 前端扁平化 → 后端类型推断
                                           ↓
                              多维表格字段创建 ← Base JS SDK
```

---

## 使用流程

1. **输入数据**：在文本框中粘贴 JSON 数据（无行数限制）
2. **点击解析**：自动识别表结构、推断字段类型、提取示例数据
3. **预览与调整**：
   - 查看字段列表和示例数据
   - 修改字段名称
   - 调整字段类型（基于推荐）
   - 选择要导入的字段
4. **执行操作**：选择“仅创建表字段”、“写入示例数据”或“写入全部数据”

---

## 产品优势

1. **零学习成本**：只需粘贴 JSON，无需了解多维表格字段类型
2. **智能推断**：基于示例数据自动推荐最合适的字段类型
3. **高容错性**：支持 JavaScript 对象字面量、嵌套结构、API 响应体等多样格式
4. **用户可控**：保留人工干预能力，支持自定义字段名和类型调整
5. **一键导入**：从粘贴到建表到导入数据，全流程自动化

---

## 适用场景

- ✅ API 数据快速导入飞书 Base
- ✅ Excel/CSV 转 JSON 后再导入 Base
- ✅ 数据库导出数据批量导入
- ✅ 原型开发快速创建测试数据
- ✅ 业务数据从其他系统迁移到飞书

---

## 开发信息

**项目路径**：`/Users/kite/Documents/aaa/base_plugin_autogen/`  
**前端端口**：80  
**后端端口**：8000

---

## 版本信息

**当前版本**：v1.0.0  
**最后更新**：2025-01-14  
**维护状态**：开发中

