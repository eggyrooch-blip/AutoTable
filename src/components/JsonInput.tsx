import React from 'react';
import {
  DATA_FORMAT_OPTIONS,
  DataFormat,
  ActualDataFormat,
  getFormatAcceptMime,
  getFormatPlaceholder,
  getFormatLabel,
} from '../lib/data_formats';

type Props = {
  value: string;
  format: DataFormat;
  detectedFormat?: ActualDataFormat;
  onFormatChange: (format: DataFormat) => void;
  onChange: (v: string) => void;
  onParse: () => void;
  parseLoading?: boolean;
  error?: string;
  onClear?: () => void;
  isMockData?: boolean;
  mockInfo?: string | null;
  onRandomMock?: () => void;
};

export default function JsonInput({
  value,
  format,
  detectedFormat,
  onFormatChange,
  onChange,
  onParse,
  parseLoading,
  error,
  onClear,
  isMockData = false,
  mockInfo,
  onRandomMock,
}: Props) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const tagContainerRef = React.useRef<HTMLDivElement | null>(null);
  const [formatMenuOpen, setFormatMenuOpen] = React.useState(false);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewContent, setPreviewContent] = React.useState(value);
  const [formatError, setFormatError] = React.useState<string | null>(null);
  const accept = React.useMemo(() => getFormatAcceptMime(format, detectedFormat), [format, detectedFormat]);
  const placeholder = React.useMemo(
    () => getFormatPlaceholder(format, detectedFormat),
    [format, detectedFormat]
  );
  const resolvedLabel = React.useMemo(() => {
    if (format === 'auto') return getFormatLabel(detectedFormat ?? 'json');
    return getFormatLabel(format);
  }, [format, detectedFormat]);
  const formatChipLabel = React.useMemo(() => {
    if (format === 'auto') {
      const detectedLabel = getFormatLabel(detectedFormat ?? 'json');
      return `自动识别 · ${detectedLabel}`;
    }
    return resolvedLabel;
  }, [format, detectedFormat, resolvedLabel]);
  const showRandomButton = typeof onRandomMock === 'function';
  const wrapperClassName = showRandomButton ? 'textarea-wrapper with-random' : 'textarea-wrapper';

  React.useEffect(() => {
    if (!formatMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (tagContainerRef.current && !tagContainerRef.current.contains(event.target as Node)) {
        setFormatMenuOpen(false);
      }
    };
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFormatMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [formatMenuOpen]);

  React.useEffect(() => {
    setFormatMenuOpen(false);
  }, [format]);

  React.useEffect(() => {
    if (!previewOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPreviewOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    setPreviewContent(value);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [previewOpen, value]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      onChange(text);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFormatSelect = (value: DataFormat) => {
    if (value !== format) {
      onFormatChange(value);
    }
    setFormatMenuOpen(false);
  };

  const resolvedFormatForPreview = React.useMemo<ActualDataFormat>(() => {
    if (format === 'auto') return detectedFormat ?? 'json';
    return format;
  }, [format, detectedFormat]);

  const canFormatJson = resolvedFormatForPreview === 'json';

  const handleOpenPreview = () => {
    setFormatMenuOpen(false);
    setFormatError(null);
    setPreviewContent(value);
    setPreviewOpen(true);
  };

  const handleFormatJson = async () => {
    if (!canFormatJson) return;
    try {
      const formatted = JSON.stringify(JSON.parse(previewContent), null, 2);
      setPreviewContent(formatted);
      onChange(formatted);
      setFormatError(null);
    } catch (err: any) {
      try {
        const { parse } = await import('relaxed-json');
        const relaxed = parse(previewContent);
        const formatted = JSON.stringify(relaxed, null, 2);
        setPreviewContent(formatted);
        onChange(formatted);
        setFormatError(null);
      } catch (inner: any) {
        setFormatError(inner?.message ?? String(inner));
      }
    }
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    setFormatError(null);
  };

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      handleClosePreview();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={wrapperClassName}>
        <div className="textarea-tags" ref={tagContainerRef}>
          <button
            type="button"
            className={`format-tag${formatMenuOpen ? ' is-active' : ''}`}
            onClick={() => setFormatMenuOpen(prev => !prev)}
            aria-haspopup="true"
            aria-expanded={formatMenuOpen}
            aria-label="选择数据格式"
          >
            {formatChipLabel}
          </button>
          {isMockData ? <span className="mock-tag">示例数据</span> : null}
          {formatMenuOpen ? (
            <div className="format-menu" role="menu">
              {DATA_FORMAT_OPTIONS.map(opt => {
                const isActive = opt.value === format;
                return (
                  <button
                    type="button"
                    key={opt.value}
                    className={`format-menu-item${isActive ? ' is-active' : ''}`}
                    onClick={() => handleFormatSelect(opt.value)}
                    role="menuitem"
                  >
                    <span>{opt.label}</span>
                    {opt.value === 'auto' ? (
                      <span className="format-menu-extra">识别：{getFormatLabel(detectedFormat ?? 'json')}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
        {showRandomButton ? (
          <button
            type="button"
            className="mock-random-btn"
            onClick={() => {
              setFormatMenuOpen(false);
              if (onRandomMock) onRandomMock();
            }}
            aria-label="随机填充示例数据"
          >
            随机示例
          </button>
        ) : null}
        <button
          type="button"
          className="preview-btn"
          onClick={handleOpenPreview}
          aria-label="展开预览或编辑"
        >
          展开预览/编辑
        </button>
        <textarea
          value={value}
          onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)}
          placeholder={placeholder}
          className="textarea"
          style={{ minHeight: '6rem' }}
          spellCheck={false}
        />
      </div>
      {previewOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={handleBackdropClick}>
          <div className="modal">
            <div className="modal-header">
              <h3>数据预览</h3>
              <div className="modal-actions">
                {canFormatJson ? (
                  <button type="button" className="btn btn-ghost" onClick={handleFormatJson} style={{ marginRight: 8 }}>
                    格式化 JSON
                  </button>
                ) : null}
                <button type="button" className="btn btn-ghost" onClick={handleClosePreview}>
                  关闭
                </button>
              </div>
            </div>
            <div className="modal-body">
              {formatError ? <div className="format-error">格式化失败：{formatError}</div> : null}
              <textarea
                value={previewContent}
                onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => {
                  setFormatError(null);
                  const next = event.target.value;
                  setPreviewContent(next);
                  onChange(next);
                }}
                className="modal-textarea"
                spellCheck={false}
              />
            </div>
          </div>
        </div>
      ) : null}
      {isMockData && mockInfo ? <div className="mock-notice muted">{mockInfo}</div> : null}
      {error ? (
        <div className="muted" style={{ color: '#b36b00' }}>提示：{error}</div>
      ) : null}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={onParse} disabled={!!parseLoading}>{parseLoading ? '解析中…' : '解析数据'}</button>
        <label className="btn btn-ghost" style={{ cursor: 'pointer' }}>
          导入文件
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </label>
        {onClear ? (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setFormatMenuOpen(false);
              setPreviewOpen(false);
              setPreviewContent('');
              setFormatError(null);
              onClear();
            }}
          >
            清除
          </button>
        ) : null}
      </div>
    </div>
  );
}
