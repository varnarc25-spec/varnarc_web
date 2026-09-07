export type ArticleEditorHandle = {
  getData?: () => string;
  model: {
    change: (cb: (writer: unknown) => void) => void;
    insertContent: (frag: unknown) => void;
  };
  data: {
    processor: { toView: (html: string) => unknown };
    toModel: (view: unknown) => unknown;
  };
  editing: { view: { focus: () => void } };
};

export function insertEditorHtml(editor: ArticleEditorHandle, html: string) {
  editor.model.change(() => {
    const viewFragment = editor.data.processor.toView(html);
    const modelFragment = editor.data.toModel(viewFragment);
    editor.model.insertContent(modelFragment);
  });
  editor.editing.view.focus();
}
