'use client';

import { useState } from 'react';
import {
  ArticleTrendingSuggestions,
  type CategoryTreeNode,
  type EditorialSuggestion,
} from '@/components/article-trending-suggestions';
import { ArticleCreateForm } from '@/components/article-create-form';

export function ArticlesEditorSection({
  initialSuggestions = [],
  initialCategoryTree = [],
}: {
  initialSuggestions?: EditorialSuggestion[];
  initialCategoryTree?: CategoryTreeNode[];
}) {
  const [selected, setSelected] = useState<EditorialSuggestion | null>(null);

  return (
    <>
      <ArticleTrendingSuggestions
        initialSuggestions={initialSuggestions}
        initialCategoryTree={initialCategoryTree}
        selectedTopic={selected?.topic}
        onSelect={setSelected}
      />
      <div id="article-create-form">
        <ArticleCreateForm
          seedTopic={selected?.topic}
          seedVertical={selected?.vertical}
        />
      </div>
    </>
  );
}
