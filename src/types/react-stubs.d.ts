declare module 'react' {
  export type ReactNode = any;
  export interface FC<P = {}> {
    (props: P & { children?: ReactNode }): ReactNode | null;
  }
  export type Dispatch<A> = (value: A) => void;
  export type SetStateAction<S> = S | ((prevState: S) => S);
  export function createElement(...args: any[]): any;
  export function useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
  export function useEffect(effect: (...args: any[]) => any, deps?: any[]): void;
  export function useMemo<T>(factory: () => T, deps?: any[]): T;
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps?: any[]): T;
  export function useRef<T>(initialValue: T): { current: T };
  export function useRef<T>(initialValue: T | null): { current: T | null };
  export function useLayoutEffect(effect: (...args: any[]) => any, deps?: any[]): void;
  export function useReducer<R extends (...args: any[]) => any, I>(reducer: R, initialArg: I, init?: (arg: I) => any): [any, Dispatch<any>];
  export function useTransition(): [boolean, (callback: () => void) => void];
  export function startTransition(callback: () => void): void;
  export const Fragment: any;
  export const Children: any;
  export type CSSProperties = Record<string, string | number>;
  export interface HTMLAttributes<T> extends Record<string, any> {}
  export interface DetailedHTMLProps<E extends HTMLAttributes<T>, T> extends E {}
  export type ChangeEvent<T = Element> = {
    target: T & { value?: any; checked?: boolean };
    currentTarget: T & { value?: any; checked?: boolean };
    preventDefault: () => void;
  };
  export type KeyboardEvent<T = Element> = { key: string; target: T; preventDefault: () => void };
  export type FocusEvent<T = Element> = { target: T; currentTarget: T; preventDefault: () => void };
  export type ReactElement = any;
  export type MutableRefObject<T> = { current: T };
  export type MouseEvent<T = Element> = {
    target: T;
    currentTarget: T;
    preventDefault: () => void;
    stopPropagation?: () => void;
    button?: number;
  };
  const React: {
    createElement: typeof createElement;
    useState: typeof useState;
    useEffect: typeof useEffect;
    useMemo: typeof useMemo;
    useCallback: typeof useCallback;
    useRef: typeof useRef;
    useLayoutEffect: typeof useLayoutEffect;
    useReducer: typeof useReducer;
    useTransition: typeof useTransition;
    startTransition: typeof startTransition;
    Fragment: typeof Fragment;
    Children: typeof Children;
  };
  export default React;
}

declare namespace React {
  type ReactNode = any;
  interface FC<P = {}> {
    (props: P & { children?: ReactNode }): ReactNode | null;
  }
  type CSSProperties = Record<string, string | number>;
  interface SyntheticEvent<T = Element> {
    currentTarget: T;
    target: T;
    preventDefault(): void;
  }
  interface ChangeEvent<T = Element> extends SyntheticEvent<T> {
    target: T & { value?: any; checked?: boolean };
    currentTarget: T & { value?: any; checked?: boolean };
  }
  interface KeyboardEvent<T = Element> extends SyntheticEvent<T> {
    key: string;
  }
  interface MouseEvent<T = Element> extends SyntheticEvent<T> {
    currentTarget: T;
    button?: number;
    stopPropagation?: () => void;
  }
  interface FocusEvent<T = Element> extends SyntheticEvent<T> {
    currentTarget: T;
  }
}

declare namespace JSX {
  type Element = any;
  interface IntrinsicElements {
    [elemName: string]: any;
  }
  interface IntrinsicAttributes {
    key?: string | number;
  }
}

declare module 'react-dom/client' {
  import type { ReactNode } from 'react';
  export interface Root {
    render(children: ReactNode): void;
  }
  export function createRoot(container: Element | DocumentFragment): Root;
}

declare module 'react/jsx-runtime' {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}
