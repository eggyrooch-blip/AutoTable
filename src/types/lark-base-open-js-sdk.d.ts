declare module '@lark-base-open/js-sdk' {
  export type TableMeta = { id: string; name: string };
  export type ViewMeta = { id: string; name: string };
  export interface RecordValue {
    recordId: string;
    fields: Record<string, any>;
  }

  export interface Table {
    getMeta?: () => Promise<{ id?: string; name?: string } | undefined>;
    getFieldMetaList: () => Promise<Array<{ id: string; name: string; type?: number }>>;
    addField: (payload: any) => Promise<{ fieldId?: string; id?: string }>;
    setField: (fieldId: string, payload: any) => Promise<boolean | void>;
    deleteField: (fieldId: string) => Promise<boolean | void>;
    addRecords: (records: Array<{ fields: Record<string, any> }>) => Promise<string[] | { recordIds: string[] }>;
    setRecords: (payload: { records: RecordValue[] }) => Promise<void>;
    deleteRecords: (recordIds: string[]) => Promise<void>;
    getFieldMetaById?: (fieldId: string) => Promise<{ id: string; name: string } | undefined>;
    getViewMetaList?: () => Promise<ViewMeta[]>;
  }

  export interface Base {
    getTableMetaList: () => Promise<TableMeta[]>;
    getTableById: (tableId: string) => Promise<Table>;
    getTableByName: (tableName: string) => Promise<Table>;
    addTable: (payload: { name: string; fields: any[] }) => Promise<{ tableId: string }>;
    getSelection: () => Promise<any>;
    getTableSelection: () => Promise<any>;
    onSelectionChange?: (handler: (event: any) => void) => (() => void) | void;
  }

  export interface Bridge {
    setData: (key: string, value: unknown) => Promise<void>;
    getData: <T = unknown>(key: string) => Promise<T | undefined>;
    getLanguage: () => Promise<string>;
    getTheme?: () => Promise<string>;
    subscribe?: (event: string, handler: (...args: any[]) => void) => { unsubscribe: () => void };
    on?: (event: string, handler: (...args: any[]) => void) => void;
    onDataChange?: (handler: () => void) => (() => void) | void;
  }

  export const bitable: {
    base: Base;
    bridge: Bridge;
  };

  export const FieldType: { [key: string]: number };
}
