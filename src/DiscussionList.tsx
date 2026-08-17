import { useState } from 'react';
import { useDiscussionsQuery, useCreateDiscussionMutation } from './hooks/useApiQueries';
import EmptyState from './components/EmptyState';
import { MessageSquare } from 'lucide-react';

export function DiscussionList() {
  const { data: discussions = [], isLoading, isError, refetch } = useDiscussionsQuery();
  const createDiscussion = useCreateDiscussionMutation();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleCreate = async () => {
    if (!title.trim() || !content.trim() || createDiscussion.isPending) return;
    try {
      await createDiscussion.mutateAsync({ title: title.trim(), content: content.trim(), category: 0 });
      setTitle('');
      setContent('');
      refetch();
    } catch (err) {
      console.error('Xəta:', err);
    }
  };

  return (
    <div className="p-4">
      <div className="mb-6 p-4 border rounded">
        <h2 className="text-xl font-bold mb-3">Yeni Müzakirə</h2>
        <input
          type="text"
          placeholder="Başlıq"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 border rounded mb-2"
        />
        <textarea
          placeholder="Məzmun"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full p-2 border rounded mb-2"
          rows={4}
        />
        <button
          onClick={handleCreate}
          disabled={createDiscussion.isPending}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {createDiscussion.isPending ? 'Yaradılır...' : 'Yarat'}
        </button>
      </div>

      {isLoading ? (
        <div className="text-sm text-zinc-500">Yüklənir...</div>
      ) : isError ? (
        <EmptyState
          icon={MessageSquare}
          title="Müzakirələr yüklənmədi"
          description="Backend əlçatan deyil. Zəhmət olmasa bir az sonra yenidən cəhd edin."
          actionLabel="Yenidən cəhd et"
          onAction={() => refetch()}
        />
      ) : discussions.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="Hələ müzakirə yoxdur"
          description="İlk müzakirəni yuxarıdakı formadan yarada bilərsiniz."
        />
      ) : (
        <div className="space-y-4">
          {discussions.map((d) => (
            <div key={d.id} className="p-4 border rounded">
              <h3 className="text-lg font-bold">{d.title}</h3>
              <p>{d.content}</p>
              <p className="text-sm text-gray-400">Yazar: {d.author}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
