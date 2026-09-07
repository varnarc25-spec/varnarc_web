'use client';

import { useEffect, useRef } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
  Autoformat,
  BlockQuote,
  Bold,
  ClassicEditor,
  Essentials,
  GeneralHtmlSupport,
  Heading,
  HorizontalLine,
  Image,
  ImageCaption,
  ImageStyle,
  ImageToolbar,
  ImageUpload,
  Italic,
  Link,
  List,
  MediaEmbed,
  Paragraph,
  SourceEditing,
  Table,
  TableToolbar,
  Underline,
  Undo,
} from 'ckeditor5';
import 'ckeditor5/ckeditor5.css';
import { normalizeArticleContent } from '@/lib/article-content';
import type { ArticleEditorHandle } from '@/lib/ckeditor-insert';

type EditorLike = {
  getData: () => string;
  setData: (data: string) => void;
  model: {
    change: (cb: (writer: unknown) => void) => void;
    insertContent: (frag: unknown) => void;
  };
  data: {
    processor: { toView: (html: string) => unknown };
    toModel: (view: unknown) => unknown;
  };
  editing: { view: { focus: () => void } };
  plugins: { get: (name: string) => { createUploadAdapter: (loader: FileLoader) => unknown } };
};

type FileLoader = { file: Promise<File> };

function mediaUploadAdapterPlugin(editor: EditorLike) {
  editor.plugins.get('FileRepository').createUploadAdapter = (loader) => ({
    async upload() {
      const file = await loader.file;
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/admin/media/upload', { method: 'POST', body: form });
      const json = (await res.json().catch(() => ({}))) as {
        data?: { url?: string; secureUrl?: string };
        error?: { message?: string };
      };
      const url = json.data?.secureUrl || json.data?.url;
      if (!res.ok || !url) {
        throw new Error(json.error?.message || 'Image upload failed');
      }
      return { default: url };
    },
    abort() {},
  });
}

export function CkeditorContentEditorClient({
  value,
  onChange,
  onReady,
  placeholder = 'Write the article…',
  enableSourceEditing = false,
}: {
  value: string;
  onChange: (html: string) => void;
  onReady?: (editor: ArticleEditorHandle) => void;
  placeholder?: string;
  enableSourceEditing?: boolean;
}) {
  const editorRef = useRef<EditorLike | null>(null);
  const lastEmitted = useRef(normalizeArticleContent(value));

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const next = normalizeArticleContent(value);
    if (next === lastEmitted.current || next === editor.getData()) return;
    editor.setData(next);
    lastEmitted.current = next;
  }, [value]);

  const toolbarItems = [
    'undo',
    'redo',
    '|',
    'heading',
    '|',
    'bold',
    'italic',
    'underline',
    '|',
    'link',
    'bulletedList',
    'numberedList',
    '|',
    'insertTable',
    'uploadImage',
    'blockQuote',
    'mediaEmbed',
    'horizontalLine',
    ...(enableSourceEditing ? (['|', 'sourceEditing'] as const) : []),
  ];

  return (
    <div className="ckeditor-shell [&_.ck-editor__editable]:min-h-[28rem] [&_.ck-editor__editable]:max-h-[70vh] [&_.ck-editor__editable]:overflow-y-auto">
      <CKEditor
        editor={ClassicEditor}
        data={lastEmitted.current}
        config={{
          licenseKey: 'GPL',
          extraPlugins: [mediaUploadAdapterPlugin as never],
          plugins: [
            Essentials,
            Paragraph,
            Heading,
            Bold,
            Italic,
            Underline,
            Link,
            List,
            BlockQuote,
            Table,
            TableToolbar,
            Image,
            ImageCaption,
            ImageStyle,
            ImageToolbar,
            ImageUpload,
            MediaEmbed,
            HorizontalLine,
            GeneralHtmlSupport,
            Autoformat,
            Undo,
            ...(enableSourceEditing ? [SourceEditing] : []),
          ],
          toolbar: {
            items: [...toolbarItems],
            shouldNotGroupWhenFull: true,
          },
          heading: {
            options: [
              { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
              { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
              { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
              { model: 'heading4', view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' },
            ],
          },
          htmlSupport: {
            allow: [{ name: /.*/, attributes: true, classes: true, styles: true }],
          },
          image: {
            toolbar: [
              'imageTextAlternative',
              'toggleImageCaption',
              'imageStyle:inline',
              'imageStyle:block',
              'imageStyle:side',
            ],
          },
          table: {
            contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells'],
          },
          link: {
            addTargetToExternalLinks: true,
            defaultProtocol: 'https://',
          },
          placeholder,
        }}
        onReady={(editor) => {
          editorRef.current = editor as unknown as EditorLike;
          onReady?.(editor as unknown as ArticleEditorHandle);
        }}
        onChange={(_, editor) => {
          const html = editor.getData();
          lastEmitted.current = html;
          onChange(html);
        }}
      />
    </div>
  );
}
