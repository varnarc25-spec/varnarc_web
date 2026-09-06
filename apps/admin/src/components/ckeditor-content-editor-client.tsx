'use client';

import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { normalizeArticleContent } from '@/lib/article-content';

export function CkeditorContentEditorClient({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  return (
    <div className="[&_.ck-editor__editable]:min-h-80 [&_.ck-editor__editable]:max-h-[60vh] [&_.ck-editor__editable]:overflow-y-auto">
      <CKEditor
        editor={ClassicEditor}
        data={normalizeArticleContent(value)}
        config={{
          toolbar: [
            'undo',
            'redo',
            '|',
            'heading',
            '|',
            'bold',
            'italic',
            'link',
            'bulletedList',
            'numberedList',
            '|',
            'blockQuote',
            'insertTable',
            'mediaEmbed',
          ],
          link: {
            addTargetToExternalLinks: true,
            defaultProtocol: 'https://',
          },
          placeholder: 'Write the page content…',
        }}
        onChange={(_, editor) => onChange(editor.getData())}
      />
    </div>
  );
}
