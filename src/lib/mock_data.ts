import { ActualDataFormat } from './data_formats';

export type MockDataset = {
  id: string;
  label: string;
  description: string;
  content: string;
  format: ActualDataFormat;
};

export const MOCK_DATASETS: MockDataset[] = [
  {
    id: 'orders-basic-array',
    label: '基础订单列表',
    description: 'JSON 数组格式，涵盖三条跨币种订单数据，用于演示最常见的接口返回结构。',
    format: 'json',
    content: `[
  {
    "order_id": "ORD-6001",
    "customer": "Liam Chen",
    "amount": 199.9,
    "currency": "CNY",
    "paid": true
  },
  {
    "order_id": "ORD-6002",
    "customer": "Olivia Müller",
    "amount": 76.5,
    "currency": "EUR",
    "paid": false
  },
  {
    "order_id": "ORD-6003",
    "customer": "Noah Silva",
    "amount": 250,
    "currency": "USD",
    "paid": true
  }
]`,
  },
  {
    id: 'orders-yaml',
    label: '跨境备货单',
    description: 'YAML 格式示例，包含嵌套 items 数组与额外元数据，展示层级解析能力。',
    format: 'yaml',
    content: `generated_at: 2024-05-05T08:15:00Z
source: onboarding-mock
orders:
  - order_id: ORD-7201
    customer: Mateo Rossi
    amount: 120.5
    currency: EUR
    paid: false
    items:
      - sku: SKU-2101
        name: Ceramic Mug
        qty: 2
        price: 60.25
  - order_id: ORD-7202
    customer: Aisha Khan
    amount: 980
    currency: USD
    paid: true
    items:
      - sku: SKU-2102
        name: Standing Desk
        qty: 1
        price: 980`,
  },
  {
    id: 'orders-tsv',
    label: '门店流水',
    description: 'TSV 样例，首行表头、包含渠道与税率字段，验证制表能力。',
    format: 'tsv',
    content: `order_id\tcustomer\tamount\tcurrency\tpaid\tchannel\ttax_rate
ORD-7301\tSam Lin\t45.5\tUSD\tfalse\tweb\t0.06
ORD-7302\tPriya Desai\t860\tINR\ttrue\tpos\t0.12
ORD-7303\tNoah Silva\t132.9\tCNY\ttrue\tminiapp\t0.09`,
  },
  {
    id: 'orders-log',
    label: '渠道回调日志',
    description: '日志行格式，采用 key=value 键值对，适合演示日志解析。',
    format: 'log',
    content: `2024-05-05T09:12:45Z order_id=ORD-7401 customer="Sofia Ibarra" amount=560.0 currency=USD paid=true channel=online fulfillment=warehouse-a
2024-05-05T09:13:10Z order_id=ORD-7402 customer="Jonas Eriksen" amount=215.4 currency=EUR paid=false channel=retail note="awaiting bank transfer"
2024-05-05T09:16:02Z order_id=ORD-7403 customer="Lily Wei" amount=132.9 currency=CNY paid=true channel=miniapp coupons=YES`,
  },
];

export const DEFAULT_MOCK_DATASET = MOCK_DATASETS[0];

export function getRandomMockDataset(currentId?: string): MockDataset {
  const pool = currentId ? MOCK_DATASETS.filter(ds => ds.id !== currentId) : MOCK_DATASETS;
  const base = pool.length ? pool : MOCK_DATASETS;
  const index = Math.floor(Math.random() * base.length);
  return base[index];
}
