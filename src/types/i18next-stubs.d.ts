declare module 'i18next' {
  export type TFunction = (key: string, options?: Record<string, any>) => string;
  export interface i18nInstance {
    use: (plugin: any) => i18nInstance;
    init: (config: Record<string, any>) => Promise<void>;
    changeLanguage: (lng: string) => Promise<void>;
    t: TFunction;
    language?: string;
  }
  const i18n: i18nInstance;
  export default i18n;
}

declare module 'react-i18next' {
  import type { TFunction } from 'i18next';
  export const initReactI18next: any;
  export function useTranslation(): { t: TFunction };
}

declare module 'i18next-browser-languagedetector' {
  const Detector: any;
  export default Detector;
}
