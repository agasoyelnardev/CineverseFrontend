import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  MessageSquare, Heart, Plus, Search, HelpCircle, Award, Star, Globe, 
  Flame, Calendar, Mic, Play, Pause, Square, Trash2, Check, Radio, Edit3 
} from 'lucide-react';
import { Discussion, Comment, User } from '../types';
import { 
  apiGetDiscussionById,
  apiToggleDiscussionLike, 
  apiAddDiscussionComment, 
  apiDeleteDiscussionComment, 
  apiUpdateDiscussionComment,
  apiDeleteDiscussion, 
  apiUpdateDiscussion 
} from '../api';
import { useDiscussionsQuery, useCreateDiscussionMutation } from '../hooks/useApiQueries';

// Avatar boş/undefined olanda istifadəçinin ilk hərfindən ibarət default avatar generasiya edir
function getAvatarUrl(avatarUrl: string | undefined | null, username: string): string {
  if (avatarUrl && avatarUrl.trim() !== '') {
    return avatarUrl;
  }
  const initial = (username || '?').charAt(0).toUpperCase();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initial)}&background=dc2626&color=fff&bold=true&size=128`;
}

interface AudioCommentPlayerProps {
  durationSeconds: number;
  theme: 'dark' | 'light';
}

function AudioCommentPlayer({ durationSeconds, theme }: AudioCommentPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            clearInterval(timerRef.current!);
            return 0;
          }
          return prev + (100 / (durationSeconds * 10)); // 10 updates per second
        });
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, durationSeconds]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  // Generate deterministic bar heights for the waveform based on duration
  const barsCount = 28;
  const barHeights = Array.from({ length: barsCount }, (_, i) => {
    return Math.sin(i * 0.5) * 15 + 22 + (i % 3) * 4;
  });

  return (
    <div className={`p-3 rounded-2xl border flex items-center gap-4 max-w-xs mt-2 select-none ${
      theme === 'dark' 
        ? 'bg-zinc-950/80 border-red-500/20 shadow-[0_0_15px_-3px_rgba(239,68,68,0.15)]' 
        : 'bg-zinc-50 border-zinc-200 shadow-xs'
    }`}>
      <button
        type="button"
        onClick={togglePlay}
        className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shrink-0 cursor-pointer shadow-lg shadow-red-600/10 transition"
      >
        {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white ml-0.5" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-end gap-0.5 h-9 pb-1 overflow-hidden">
          {barHeights.map((height, idx) => {
            const barProgress = (idx / barsCount) * 100;
            const isPlayed = progress > barProgress;
            return (
              <div
                key={idx}
                className={`w-0.5 rounded-full transition-all duration-300 ${
                  isPlayed 
                    ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' 
                    : theme === 'dark' ? 'bg-zinc-850' : 'bg-zinc-300'
                }`}
                style={{ height: `${height * 0.8}px` }}
              />
            );
          })}
        </div>
        <div className="flex items-center justify-between text-[8px] text-zinc-500 font-mono mt-0.5 leading-none">
          <span>{isPlaying ? `00:${Math.floor((progress/100) * durationSeconds).toString().padStart(2, '0')}` : '00:00'}</span>
          <span>00:{durationSeconds.toString().padStart(2, '0')}</span>
        </div>
      </div>
    </div>
  );
}

interface ForumProps {
  discussions: Discussion[];
  setDiscussions: React.Dispatch<React.SetStateAction<Discussion[]>>;
  currentUser: User;
  theme: 'dark' | 'light';
}

type ForumCategory = 'Hamsı' | 'Rəylər' | 'Tövsiyələr' | 'Yeni Filmlər' | 'Nəzəriyyələr';

// Backend enum: Reyler=0, Tovsiyeler=1, YeniFilmler=2, Nezeriyyeler=3
// UI-da Azəri diakritikalı mətnlər göstərilir, backend-ə göndərəndə isə HƏMİŞƏ rəqəm göndərilir
// (System.Text.Json enum-u rəqəmlə də, diakritikasız adla da qəbul edir, amma diakritikalı Azəri mətni QƏBUL ETMİR).
const CATEGORY_TO_ENUM_INDEX: Record<Exclude<ForumCategory, 'Hamsı'>, number> = {
  'Rəylər': 0,
  'Tövsiyələr': 1,
  'Yeni Filmlər': 2,
  'Nəzəriyyələr': 3,
};

function backendCategoryToAzeri(raw: unknown): Exclude<ForumCategory, 'Hamsı'> {
  const key = String(raw).trim().toLowerCase();
  const byNumber: Record<string, Exclude<ForumCategory, 'Hamsı'>> = {
    '0': 'Rəylər', '1': 'Tövsiyələr', '2': 'Yeni Filmlər', '3': 'Nəzəriyyələr',
  };
  const byName: Record<string, Exclude<ForumCategory, 'Hamsı'>> = {
    'reyler': 'Rəylər', 'tovsiyeler': 'Tövsiyələr', 'yenifilmler': 'Yeni Filmlər', 'nezeriyyeler': 'Nəzəriyyələr',
  };
  return byNumber[key] || byName[key] || 'Rəylər';
}

// Backend DiscussionDto (siyahı) -> UI-nin gözlədiyi Discussion formatına çevirir.
// Qeyd: siyahı endpoint-i (GET /discussions) yalnız "commentsCount" qaytarır, tam şərh massivini yox —
// ona görə "comments" burada yalnız UZUNLUĞU düzgün olan boş yer tutucu massivdir.
// Müzakirə açılanda (handleSelectDiscussion) real şərhlər ayrıca yüklənir.
function mapDiscussionDtoToLocal(d: any): Discussion {
  return {
    id: d.id,
    title: d.title,
    content: d.content,
    category: backendCategoryToAzeri(d.category),
    author: d.author,
    authorAvatar: d.authorAvatar,
    likes: d.likes,
    isLikedByCurrentUser: !!d.isLikedByCurrentUser,
    comments: Array.from({ length: d.commentsCount || 0 }, (_, i) => ({
      id: `placeholder_${i}`,
      author: '',
      authorAvatar: '',
      content: '',
      date: ''
    })) as Comment[],
    date: d.createdAt
      ? new Date(d.createdAt).toLocaleString('az-AZ', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
      : ''
  };
}

function mapCommentDtoToLocal(c: any): Comment {
  return {
    id: c.id,
    author: c.author,
    authorAvatar: c.authorAvatar,
    content: c.content,
    date: c.createdAt
      ? new Date(c.createdAt).toLocaleString('az-AZ', { hour: '2-digit', minute: '2-digit' })
      : 'İndi'
  };
}

export default function Forum({
  discussions,
  setDiscussions,
  currentUser,
  theme
}: ForumProps) {
  const [selectedCategory, setSelectedCategory] = useState<ForumCategory>('Hamsı');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const { data: discussionsData, isLoading: isLoadingDiscussions, refetch: refetchDiscussions } = useDiscussionsQuery();
  const createDiscussionMutation = useCreateDiscussionMutation();

  // New discussion form
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<'Rəylər' | 'Tövsiyələr' | 'Yeni Filmlər' | 'Nəzəriyyələr'>('Rəylər');
  const [isSubmittingDiscussion, setIsSubmittingDiscussion] = useState(false);

  // Edit discussion form
  const [editingDiscussion, setEditingDiscussion] = useState<Discussion | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState<'Rəylər' | 'Tövsiyələr' | 'Yeni Filmlər' | 'Nəzəriyyələr'>('Rəylər');

  // New comment state
  const [commentText, setCommentText] = useState('');

  // Comment edit state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  // Voice Recording States
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceDuration, setVoiceDuration] = useState(0);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Backend-dən real müzakirələri yüklə (React Query)
  useEffect(() => {
    if (discussionsData) {
      setDiscussions(discussionsData.map(mapDiscussionDtoToLocal));
    }
  }, [discussionsData, setDiscussions]);

  // Müzakirəni açanda tam şərh siyahısını backend-dən yüklə
  const handleSelectDiscussion = async (disc: Discussion) => {
    setSelectedDiscussion(disc);
    setIsLoadingThread(true);
    try {
      const detail = await apiGetDiscussionById(disc.id);
      if (detail) {
        const fullDisc: Discussion = {
          ...disc,
          title: detail.title,
          content: detail.content,
          category: backendCategoryToAzeri(detail.category),
          likes: detail.likes,
          isLikedByCurrentUser: !!detail.isLikedByCurrentUser,
          comments: Array.isArray(detail.comments) ? detail.comments.map(mapCommentDtoToLocal) : []
        };
        setSelectedDiscussion(fullDisc);
        setDiscussions((prev) => prev.map((d) => (d.id === disc.id ? fullDisc : d)));
      }
    } catch (err) {
      console.error('Müzakirə detalları yüklənərkən xəta:', err);
    } finally {
      setIsLoadingThread(false);
    }
  };

  useEffect(() => {
    if (isRecordingVoice) {
      setVoiceDuration(0);
      recordingIntervalRef.current = setInterval(() => {
        setVoiceDuration((prev) => {
          if (prev >= 30) {
            // Stop recording at 30 seconds limit
            setIsRecordingVoice(false);
            if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [isRecordingVoice]);

  const handleStartRecording = () => {
    setIsRecordingVoice(true);
  };

  const handleCancelRecording = () => {
    setIsRecordingVoice(false);
    setVoiceDuration(0);
  };

  const handleSaveVoiceComment = async () => {
    if (voiceDuration === 0 || !selectedDiscussion) return;
    
    // Add audio comment with content formatted as "[AUDIO]:<duration>"
    const durationToSave = voiceDuration;
    const contentToAdd = `[AUDIO]:${durationToSave}`;
    const tempId = 'c_' + Date.now();

    setIsRecordingVoice(false);
    setVoiceDuration(0);

    const newComment: Comment = {
      id: tempId,
      author: currentUser.username,
      authorAvatar: currentUser.avatar,
      content: contentToAdd,
      date: 'İndi'
    };

    const targetDiscId = selectedDiscussion.id;
    const updatedDiscussions = discussions.map((d) => {
      if (d.id === targetDiscId) {
        const updatedDisc = {
          ...d,
          comments: [...d.comments, newComment]
        };
        setSelectedDiscussion(updatedDisc);
        return updatedDisc;
      }
      return d;
    });

    setDiscussions(updatedDiscussions);

    try {
      const createdCommentId = await apiAddDiscussionComment(targetDiscId, contentToAdd);
      if (createdCommentId) {
        setDiscussions((prev) =>
          prev.map((d) => {
            if (d.id === targetDiscId) {
              const updatedComments = d.comments.map((c) =>
                c.id === tempId ? { ...c, id: createdCommentId } : c
              );
              return { ...d, comments: updatedComments };
            }
            return d;
          })
        );
        setSelectedDiscussion((prev) => {
          if (!prev || prev.id !== targetDiscId) return prev;
          return {
            ...prev,
            comments: prev.comments.map((c) => (c.id === tempId ? { ...c, id: createdCommentId } : c))
          };
        });
      }
    } catch (err) {
      console.error('Səsli şərh göndərilərkən xəta yarandı:', err);
    }
  };

  // Categories list
  const categories: ForumCategory[] = ['Hamsı', 'Rəylər', 'Tövsiyələr', 'Yeni Filmlər', 'Nəzəriyyələr'];

  // Handle New Discussion submit — indi real backend-ə (CreateDiscussionCommandHandler) göndərir
  const handleCreateDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim() || isSubmittingDiscussion) return;

    const title = newTitle.trim();
    const content = newContent.trim();
    const category = newCategory;

    setIsSubmittingDiscussion(true);
    try {
      const newId = await createDiscussionMutation.mutateAsync({
        title,
        content,
        category: CATEGORY_TO_ENUM_INDEX[category],
      });

      const newDisc: Discussion = {
        id: newId || 'd_' + Date.now(),
        title,
        content,
        category,
        author: currentUser.username,
        authorAvatar: currentUser.avatar,
        likes: 0,
        isLikedByCurrentUser: false,
        comments: [],
        date: new Date().toLocaleString('az-AZ', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
      };

      setDiscussions((prev) => [newDisc, ...prev]);
      setIsCreating(false);
      setNewTitle('');
      setNewContent('');
      refetchDiscussions();
    } catch (err) {
      console.error('Müzakirə yaradılarkən xəta:', err);
      window.alert('Müzakirə yaradıla bilmədi. Zəhmət olmasa yenidən cəhd edin.');
    } finally {
      setIsSubmittingDiscussion(false);
    }
  };

  // Handle Like Discussion (ToggleDiscussionLikeCommandHandler integration)
  const handleLikeDiscussion = async (discId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    // 1. Canlı Yeniləmə (Optimistic Update)
    let previousLikedState = false;
    let previousLikesCount = 0;

    setDiscussions((prev) =>
      prev.map((d) => {
        if (d.id === discId) {
          previousLikedState = !!d.isLikedByCurrentUser;
          previousLikesCount = d.likes;
          const nextIsLiked = !previousLikedState;
          return {
            ...d,
            isLikedByCurrentUser: nextIsLiked,
            likes: nextIsLiked ? d.likes + 1 : Math.max(0, d.likes - 1)
          };
        }
        return d;
      })
    );

    if (selectedDiscussion && selectedDiscussion.id === discId) {
      setSelectedDiscussion((prev) => {
        if (!prev) return null;
        const nextIsLiked = !prev.isLikedByCurrentUser;
        return {
          ...prev,
          isLikedByCurrentUser: nextIsLiked,
          likes: nextIsLiked ? prev.likes + 1 : Math.max(0, prev.likes - 1)
        };
      });
    }

    // 2. Server (ToggleDiscussionLikeCommandHandler) sorğusu
    try {
      const res = await apiToggleDiscussionLike(discId);
      if (res && typeof res.isLiked === 'boolean') {
        const serverLiked = res.isLiked;
        setDiscussions((prev) =>
          prev.map((d) => {
            if (d.id === discId) {
              const currentLikes = d.likes;
              // Əgər server nəticəsi optimistik yeniləmədən fərqlənərsə, düzəliş et
              const adjustedLikes = serverLiked !== d.isLikedByCurrentUser 
                ? (serverLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1))
                : currentLikes;

              return {
                ...d,
                isLikedByCurrentUser: serverLiked,
                likes: adjustedLikes
              };
            }
            return d;
          })
        );
        if (selectedDiscussion && selectedDiscussion.id === discId) {
          setSelectedDiscussion((prev) => {
            if (!prev) return null;
            const currentLikes = prev.likes;
            const adjustedLikes = serverLiked !== prev.isLikedByCurrentUser 
              ? (serverLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1))
              : currentLikes;

            return {
              ...prev,
              isLikedByCurrentUser: serverLiked,
              likes: adjustedLikes
            };
          });
        }
      }
    } catch (err) {
      console.error('Bəyənmə xətası:', err);
      // Xəta yarandıqda əvvəlki vəziyyətə qaytar (Rollback)
      setDiscussions((prev) =>
        prev.map((d) => {
          if (d.id === discId) {
            return {
              ...d,
              isLikedByCurrentUser: previousLikedState,
              likes: previousLikesCount
            };
          }
          return d;
        })
      );
      if (selectedDiscussion && selectedDiscussion.id === discId) {
        setSelectedDiscussion((prev) =>
          prev
            ? {
                ...prev,
                isLikedByCurrentUser: previousLikedState,
                likes: previousLikesCount
              }
            : null
        );
      }
    }
  };

  // Handle New Comment (CreateCommentCommandHandler integration)
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedDiscussion) return;

    const contentToAdd = commentText.trim();
    const tempId = 'c_' + Date.now();
    const targetDiscId = selectedDiscussion.id;

    const newComment: Comment = {
      id: tempId,
      author: currentUser.username,
      authorAvatar: currentUser.avatar,
      content: contentToAdd,
      date: 'İndi'
    };

    // Optimistic append
    const updatedDiscussions = discussions.map((d) => {
      if (d.id === targetDiscId) {
        const updatedDisc = {
          ...d,
          comments: [...d.comments, newComment]
        };
        setSelectedDiscussion(updatedDisc);
        return updatedDisc;
      }
      return d;
    });

    setDiscussions(updatedDiscussions);
    setCommentText('');

    // Call API (CreateCommentCommandHandler on backend)
    try {
      const createdCommentId = await apiAddDiscussionComment(targetDiscId, contentToAdd);
      if (createdCommentId) {
        setDiscussions((prev) =>
          prev.map((d) => {
            if (d.id === targetDiscId) {
              const updatedComments = d.comments.map((c) =>
                c.id === tempId ? { ...c, id: createdCommentId } : c
              );
              return { ...d, comments: updatedComments };
            }
            return d;
          })
        );
        setSelectedDiscussion((prev) => {
          if (!prev || prev.id !== targetDiscId) return prev;
          return {
            ...prev,
            comments: prev.comments.map((c) => (c.id === tempId ? { ...c, id: createdCommentId } : c))
          };
        });
      }
    } catch (err) {
      console.error('Şərh göndərilərkən xəta yarandı:', err);
    }
  };

  // Delete Comment Handler (DeleteCommentCommandHandler on backend)
  const handleDeleteComment = async (commentId: string) => {
    if (!selectedDiscussion) return;
    if (!window.confirm('Bu şərhi silmək istədiyinizdən əminsiniz?')) return;

    const targetDiscId = selectedDiscussion.id;
    const updatedComments = selectedDiscussion.comments.filter((c) => c.id !== commentId);
    const updatedDisc = { ...selectedDiscussion, comments: updatedComments };

    setSelectedDiscussion(updatedDisc);
    setDiscussions((prev) =>
      prev.map((d) => (d.id === targetDiscId ? updatedDisc : d))
    );

    try {
      await apiDeleteDiscussionComment(commentId);
    } catch (err) {
      console.error('Şərh silinərkən xəta yarandı:', err);
    }
  };

  // Save Edit Comment Handler
  const handleSaveEditComment = async (commentId: string) => {
    if (!selectedDiscussion || !editingCommentText.trim()) return;

    const trimmedText = editingCommentText.trim();
    const targetDiscId = selectedDiscussion.id;
    const updatedComments = selectedDiscussion.comments.map((c) =>
      c.id === commentId ? { ...c, content: trimmedText } : c
    );
    const updatedDisc = { ...selectedDiscussion, comments: updatedComments };

    setSelectedDiscussion(updatedDisc);
    setDiscussions((prev) =>
      prev.map((d) => (d.id === targetDiscId ? updatedDisc : d))
    );
    setEditingCommentId(null);
    setEditingCommentText('');

    try {
      await apiUpdateDiscussionComment(commentId, trimmedText);
    } catch (err) {
      console.error('Şərh redaktə edilərkən xəta yarandı:', err);
    }
  };

  // Delete Discussion Handler (DeleteDiscussionCommandHandler on backend)
  const handleDeleteDiscussion = async (discussionId: string) => {
    if (!window.confirm('Bu müzakirəni silmək istədiyinizdən əminsiniz?')) return;

    setDiscussions((prev) => prev.filter((d) => d.id !== discussionId));
    if (selectedDiscussion?.id === discussionId) {
      setSelectedDiscussion(null);
    }

    try {
      await apiDeleteDiscussion(discussionId);
    } catch (err) {
      console.error('Müzakirə silinərkən xəta yarandı:', err);
    }
  };

  // Start Edit Discussion
  const handleStartEditDiscussion = (disc: Discussion) => {
    setEditingDiscussion(disc);
    setEditTitle(disc.title);
    setEditContent(disc.content);
    setEditCategory(disc.category as any);
  };

  // Save Edit Discussion (UpdateDiscussionCommandHandler on backend)
  const handleSaveEditDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDiscussion || !editTitle.trim() || !editContent.trim()) return;

    const targetId = editingDiscussion.id;
    const updatedDisc: Discussion = {
      ...editingDiscussion,
      title: editTitle.trim(),
      content: editContent.trim(),
      category: editCategory
    };

    setDiscussions((prev) => prev.map((d) => (d.id === targetId ? updatedDisc : d)));
    if (selectedDiscussion?.id === targetId) {
      setSelectedDiscussion(updatedDisc);
    }
    setEditingDiscussion(null);

    try {
      await apiUpdateDiscussion(targetId, {
        title: editTitle.trim(),
        content: editContent.trim(),
        category: CATEGORY_TO_ENUM_INDEX[editCategory]
      });
    } catch (err) {
      console.error('Müzakirə yenilənərkən xəta yarandı:', err);
    }
  };

  // Filter discussions
  const filteredDiscussions = discussions.filter((d) => {
    const matchesCategory = selectedCategory === 'Hamsı' || d.category === selectedCategory;
    const matchesSearch =
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (isCreating) {
    return (
      <div className="space-y-6 animate-fade-in max-w-3xl mx-auto py-2">
        <button
          type="button"
          onClick={() => setIsCreating(false)}
          className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-zinc-500 hover:text-red-500 transition cursor-pointer"
        >
          ← Müzakirələrə Qayıt
        </button>

        <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl ${
          theme === 'dark' ? 'bg-zinc-900/90 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
        }`}>
          <div className="mb-6 pb-4 border-b border-zinc-800/40">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight font-display mb-1">
              Yeni Müzakirə Başlat
            </h2>
            <p className="text-xs text-zinc-500">
              Kino və kitab həvəskarları ilə maraqlı mövzu ətrafında fikir mübadiləsi aparın.
            </p>
          </div>

          <form onSubmit={handleCreateDiscussion} className="space-y-5">
            <div>
              <label className={`block text-xs font-bold mb-1.5 ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>
                Mövzu Başlığı *
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Məsələn: Christopher Nolan-ın Oppenheimer filmindəki vizual simvolizm haqqında nə düşünürsünüz?"
                className={`w-full px-4 py-3 rounded-xl text-xs font-medium focus:outline-none border transition-all duration-300 ${
                  theme === 'dark' 
                    ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-600 focus:border-red-500' 
                    : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-red-500'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-bold mb-1.5 ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>
                Kateqoriya *
              </label>
              <select
                value={newCategory}
                onChange={(e: any) => setNewCategory(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl text-xs font-medium focus:outline-none border transition-all duration-300 ${
                  theme === 'dark' 
                    ? 'bg-zinc-950 border-zinc-800 text-zinc-200 focus:border-red-500' 
                    : 'bg-zinc-50 border-zinc-200 text-zinc-800 focus:border-red-500'
                }`}
              >
                <option value="Rəylər">💬 Rəylər və Təhlillər</option>
                <option value="Tövsiyələr">⭐ Tövsiyələr</option>
                <option value="Yeni Filmlər">🎬 Yeni Filmlər</option>
                <option value="Nəzəriyyələr">🧠 Nəzəriyyələr və Detallar</option>
              </select>
            </div>

            <div>
              <label className={`block text-xs font-bold mb-1.5 ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>
                Məzmun və Təfərrüat *
              </label>
              <textarea
                required
                rows={8}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Müzakirə etmək istədiyiniz mövzunu ətraflı şəkildə yazın. Suallarınızı, öz fikirlərinizi və ya təhlilinizi daxil edin..."
                className={`w-full px-4 py-3 rounded-xl text-xs font-medium focus:outline-none border transition-all duration-300 ${
                  theme === 'dark' 
                    ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-600 focus:border-red-500' 
                    : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-red-500'
                }`}
              />
            </div>

            <div className={`p-4 rounded-xl border text-xs space-y-1.5 ${
              theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400' : 'bg-zinc-50 border-zinc-200 text-zinc-600'
            }`}>
              <p className="font-bold text-red-500">📌 Qaydalar və Tövsiyələr:</p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-zinc-500">
                <li>Hörmətli və nəzakətli ünsiyyət saxlayın.</li>
                <li>Spoyler (süjet sirləri) ehtiva edən hissələri əvvəlcədən qeyd edin.</li>
                <li>Mövzu ilə əlaqədar aydın və oxunaqlı başlıq seçin.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800/50">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="py-2.5 px-5 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition cursor-pointer"
              >
                Ləğv Et
              </button>
              <button
                type="submit"
                disabled={isSubmittingDiscussion}
                className="py-2.5 px-6 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white transition cursor-pointer shadow-lg shadow-red-600/20"
              >
                {isSubmittingDiscussion ? 'Dərc edilir...' : 'Müzakirəni Dərc Et'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (editingDiscussion) {
    return (
      <div className="space-y-6 animate-fade-in max-w-3xl mx-auto py-2">
        <button
          type="button"
          onClick={() => setEditingDiscussion(null)}
          className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-zinc-500 hover:text-red-500 transition cursor-pointer"
        >
          ← Ləğv Et Və Qayıt
        </button>

        <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl ${
          theme === 'dark' ? 'bg-zinc-900/90 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
        }`}>
          <div className="mb-6 pb-4 border-b border-zinc-800/40">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight font-display mb-1">
              Müzakirəni Redaktə Et
            </h2>
            <p className="text-xs text-zinc-500">
              Müzakirə başlığını, kateqoriyasını və ya məzmununu yeniləyin.
            </p>
          </div>

          <form onSubmit={handleSaveEditDiscussion} className="space-y-5">
            <div>
              <label className={`block text-xs font-bold mb-1.5 ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>
                Mövzu Başlığı *
              </label>
              <input
                type="text"
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl text-xs font-medium focus:outline-none border transition-all duration-300 ${
                  theme === 'dark' 
                    ? 'bg-zinc-950 border-zinc-800 text-white focus:border-red-500' 
                    : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-red-500'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-bold mb-1.5 ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>
                Kateqoriya *
              </label>
              <select
                value={editCategory}
                onChange={(e: any) => setEditCategory(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl text-xs font-medium focus:outline-none border transition-all duration-300 ${
                  theme === 'dark' 
                    ? 'bg-zinc-950 border-zinc-800 text-zinc-200 focus:border-red-500' 
                    : 'bg-zinc-50 border-zinc-200 text-zinc-800 focus:border-red-500'
                }`}
              >
                <option value="Rəylər">💬 Rəylər və Təhlillər</option>
                <option value="Tövsiyələr">⭐ Tövsiyələr</option>
                <option value="Yeni Filmlər">🎬 Yeni Filmlər</option>
                <option value="Nəzəriyyələr">🧠 Nəzəriyyələr və Detallar</option>
              </select>
            </div>

            <div>
              <label className={`block text-xs font-bold mb-1.5 ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>
                Məzmun *
              </label>
              <textarea
                required
                rows={8}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl text-xs font-medium focus:outline-none border transition-all duration-300 ${
                  theme === 'dark' 
                    ? 'bg-zinc-950 border-zinc-800 text-white focus:border-red-500' 
                    : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-red-500'
                }`}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800/50">
              <button
                type="button"
                onClick={() => setEditingDiscussion(null)}
                className="py-2.5 px-5 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition cursor-pointer"
              >
                Ləğv Et
              </button>
              <button
                type="submit"
                className="py-2.5 px-6 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition cursor-pointer shadow-lg shadow-red-600/20"
              >
                Yeniləmələri Yadda Saxla
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Upper header section */}
      <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-5 ${
        theme === 'dark' ? 'border-white/5' : 'border-zinc-200'
      }`}>
        <div>
          <h1 className="text-xl font-bold tracking-tight font-display">İctimai Forum</h1>
          <p className="text-xs text-zinc-500 mt-1">Digər kino həvəskarları ilə müzakirələrə qoşulun, nəzəriyyələr paylaşın.</p>
        </div>
        <button
          onClick={() => {
            setIsCreating(true);
            setSelectedDiscussion(null);
          }}
          id="btn-new-discussion"
          className="flex items-center gap-2 py-2 px-4 bg-red-600 hover:bg-red-700 text-white text-[10px] uppercase tracking-wider font-bold rounded-full shadow-lg shadow-red-600/10 transition cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Müzakirə Başlat
        </button>
      </div>

      {selectedDiscussion ? (
        /* Detailed Thread View */
        <div className="space-y-6 animate-fade-in">
          <button
            onClick={() => setSelectedDiscussion(null)}
            className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 hover:text-red-500 transition cursor-pointer"
          >
            ← Bütün Müzakirələrə Qayıt
          </button>

          <div className={`p-6 rounded-2xl border backdrop-blur-xl ${
            theme === 'dark' ? 'bg-white/[0.02] border-white/5' : 'bg-white border-zinc-200 shadow-xs'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <img
  src={getAvatarUrl(selectedDiscussion.authorAvatar, selectedDiscussion.author)}
  alt={selectedDiscussion.author}
  className="w-9 h-9 rounded-full object-cover ring-2 ring-red-500/10"
/>
                <div>
                  <p className="text-xs font-bold">@{selectedDiscussion.author}</p>
                  <p className="text-[10px] text-zinc-500 font-mono">{selectedDiscussion.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-red-600/10 text-red-500 text-[9px] rounded font-bold uppercase font-mono tracking-wider">
                  {selectedDiscussion.category}
                </span>
                {(selectedDiscussion.author === currentUser.username || currentUser.role === 'admin') && (
                  <div className="flex items-center gap-1.5 ml-2">
                    <button
                      onClick={() => handleStartEditDiscussion(selectedDiscussion)}
                      title="Müzakirəni redaktə et"
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-700 transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteDiscussion(selectedDiscussion.id)}
                      title="Müzakirəni sil"
                      className="p-1.5 rounded-lg text-red-400 hover:text-red-300 bg-red-950/30 hover:bg-red-900/50 border border-red-800/30 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <h2 className="text-lg font-bold mb-3 font-display">{selectedDiscussion.title}</h2>
            <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-line">{selectedDiscussion.content}</p>

            <div className={`flex items-center gap-4 mt-6 border-t pt-4 ${
              theme === 'dark' ? 'border-white/5' : 'border-zinc-100'
            }`}>
              <button
                onClick={(e) => handleLikeDiscussion(selectedDiscussion.id, e)}
                className={`flex items-center gap-1 text-[10px] font-bold transition cursor-pointer ${
                  selectedDiscussion.isLikedByCurrentUser 
                    ? 'text-red-500' 
                    : 'text-zinc-500 hover:text-red-500'
                }`}
              >
                <Heart 
                  className={`w-3.5 h-3.5 ${
                    selectedDiscussion.isLikedByCurrentUser 
                      ? 'fill-red-500 text-red-500' 
                      : 'fill-transparent text-current'
                  }`} 
                />
                <span>{selectedDiscussion.likes} Bəyənmə</span>
              </button>
              <div className="flex items-center gap-1 text-xs text-zinc-500">
                <MessageSquare className="w-4 h-4" />
                <span>{selectedDiscussion.comments.length} Şərh</span>
              </div>
            </div>
          </div>

          {/* Comments List */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-400">Şərhlər ({selectedDiscussion.comments.length})</h3>

            {isLoadingThread && (
              <p className="text-[10px] text-zinc-500 font-mono">Şərhlər yüklənir...</p>
            )}
            
            <div className="space-y-3">
              {selectedDiscussion.comments.map((comment, index) => (
                <div
                  key={comment.id ? `comm_${comment.id}_${index}` : index}
                  className={`p-4 rounded-2xl border ${
                    theme === 'dark' ? 'bg-zinc-900/20 border-zinc-800/60' : 'bg-zinc-50 border-zinc-200/60'
                  } flex gap-3`}
                >
                 <img
  src={getAvatarUrl(comment.authorAvatar, comment.author)}
  alt={comment.author}
  className="w-8 h-8 rounded-full object-cover mt-0.5"
/>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-bold">@{comment.author}</span>
                        <span className="text-[10px] text-zinc-500">{comment.date}</span>
                      </div>
                      {(comment.author === currentUser.username || currentUser.role === 'admin') && (
                        <div className="flex items-center gap-1">
                          {!comment.content.startsWith('[AUDIO]:') && comment.author === currentUser.username && (
                            <button
                              onClick={() => {
                                setEditingCommentId(comment.id);
                                setEditingCommentText(comment.content);
                              }}
                              title="Şərhi redaktə et"
                              className="text-zinc-500 hover:text-white p-1 rounded-lg transition cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            title="Şərhi sil"
                            className="text-zinc-500 hover:text-red-500 p-1 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {editingCommentId === comment.id ? (
                      <div className="mt-2 space-y-2">
                        <textarea
                          rows={3}
                          value={editingCommentText}
                          onChange={(e) => setEditingCommentText(e.target.value)}
                          className={`w-full p-2.5 rounded-xl text-xs font-medium focus:outline-none border ${
                            theme === 'dark' 
                              ? 'bg-zinc-950 border-zinc-800 text-white focus:border-red-500' 
                              : 'bg-zinc-100 border-zinc-300 text-zinc-900 focus:border-red-500'
                          }`}
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingCommentId(null)}
                            className="px-3 py-1 rounded-lg text-[11px] font-semibold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition cursor-pointer"
                          >
                            Ləğv Et
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEditComment(comment.id)}
                            className="px-3 py-1 rounded-lg text-[11px] font-semibold bg-red-600 hover:bg-red-500 text-white transition cursor-pointer"
                          >
                            Yadda Saxla
                          </button>
                        </div>
                      </div>
                    ) : comment.content.startsWith('[AUDIO]:') ? (
                      <div className="space-y-1">
                        <span className="text-[10px] text-zinc-500 flex items-center gap-1 font-mono">
                          <Mic className="w-3 h-3 text-red-500" /> SƏSLİ RƏY
                        </span>
                        <AudioCommentPlayer 
                          durationSeconds={parseInt(comment.content.replace('[AUDIO]:', ''), 10) || 12} 
                          theme={theme} 
                        />
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-400 leading-relaxed">{comment.content}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add Comment Form & Voice Recording UI */}
            {isRecordingVoice ? (
              <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 animate-pulse ${
                theme === 'dark' ? 'bg-red-950/20 border-red-500/30' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  <div>
                    <p className="text-xs font-bold text-red-500">Səs Yazılır... 00:{voiceDuration.toString().padStart(2, '0')} / 00:30</p>
                    <p className="text-[10px] text-zinc-500">Maksimum 30 saniyə rəy yaza bilərsiniz.</p>
                  </div>
                </div>

                {/* Simulated Waveform animation */}
                <div className="hidden md:flex items-center gap-1 h-6">
                  {[...Array(12)].map((_, idx) => (
                    <div 
                      key={idx} 
                      className="w-1 bg-red-500 rounded-full animate-bounce" 
                      style={{ 
                        height: `${Math.sin(idx * 0.5) * 12 + 14}px`, 
                        animationDelay: `${idx * 0.08}s`,
                        animationDuration: '0.6s'
                      }} 
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancelRecording}
                    className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition cursor-pointer"
                    title="Ləğv et"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveVoiceComment}
                    className="py-1.5 px-4 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-lg transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Bitir və Göndər
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  required
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Bu müzakirəyə münasibət bildirin..."
                  className={`flex-1 px-4 py-2.5 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition ${
                    theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleStartRecording}
                  className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-center shrink-0 ${
                    theme === 'dark' 
                      ? 'bg-zinc-900 border-zinc-850 text-red-500 hover:bg-red-950/20' 
                      : 'bg-white border-zinc-200 text-red-600 hover:bg-red-50'
                  }`}
                  title="Səsli Rəy Yaz (Maks 30s) 🎙️"
                >
                  <Mic className="w-4 h-4" />
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl shadow-lg transition cursor-pointer"
                >
                  Göndər
                </button>
              </form>
            )}
          </div>
        </div>
      ) : (
        /* Main Grid/List view with Filters */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Sidebar Filters */}
          <div className="space-y-4">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-500">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Forumda axtar..."
                className={`w-full pl-10 pr-4 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 transition ${
                  theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
                }`}
              />
            </div>

            {/* Categories Menu */}
            <div className={`p-4 rounded-3xl border space-y-1.5 ${
              theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'
            }`}>
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 px-2">Kateqoriyalar</h3>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-3 py-2 text-xs font-medium rounded-xl transition ${
                    selectedCategory === cat
                      ? 'bg-red-600 text-white font-semibold'
                      : theme === 'dark'
                      ? 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Helper forum card */}
            <div className={`p-4 rounded-3xl border bg-gradient-to-tr from-red-650/10 to-transparent ${
              theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200'
            }`}>
              <HelpCircle className="w-5 h-5 text-red-500 mb-2" />
              <h4 className="text-xs font-bold">Forum Qaydaları</h4>
              <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                Müzakirə edərkən qarşılıqlı hörmət qaydalarına riayət edin. Spoyler (spoiler) olan şərhləri öncədən qeyd edin.
              </p>
            </div>
          </div>

          {/* Discussions feed */}
          <div className="lg:col-span-3 space-y-4">
            {isLoadingDiscussions ? (
              <div className="text-center py-16 border border-dashed border-zinc-850 rounded-3xl">
                <p className="text-sm text-zinc-500">Müzakirələr yüklənir...</p>
              </div>
            ) : filteredDiscussions.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-zinc-850 rounded-3xl">
                <p className="text-sm text-zinc-500">Meyarlara uyğun heç bir müzakirə tapılmadı.</p>
              </div>
            ) : (
              filteredDiscussions.map((d, index) => (
                <motion.div
                  key={d.id ? `disc_${d.id}_${index}` : index}
                  onClick={() => handleSelectDiscussion(d)}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -45 : 45, y: 25, scale: 0.94 }}
                  animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  className={`p-5 rounded-3xl border cursor-pointer hover:border-red-500/35 transition-all duration-300 relative group ${
                    theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-2.5">
                      <img src={getAvatarUrl(d.authorAvatar, d.author)} alt={d.author} className="w-7 h-7 rounded-full object-cover" />
                      <span className="text-xs font-semibold">@{d.author}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">• {d.date}</span>
                    </div>
                    <span className="px-2.5 py-0.5 bg-red-600/10 text-red-500 text-[10px] rounded-full font-bold uppercase">
                      {d.category}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm mb-1.5 group-hover:text-red-500 transition">{d.title}</h3>
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{d.content}</p>

                  <div className="flex items-center gap-4 mt-4 pt-3 border-t border-zinc-800/10 text-xs text-zinc-500">
                    <button
                      onClick={(e) => handleLikeDiscussion(d.id, e)}
                      className={`flex items-center gap-1 transition cursor-pointer ${
                        d.isLikedByCurrentUser 
                          ? 'text-red-500' 
                          : 'hover:text-red-500 text-zinc-500'
                      }`}
                    >
                      <Heart 
                        className={`w-3.5 h-3.5 ${
                          d.isLikedByCurrentUser 
                            ? 'fill-red-500 text-red-500' 
                            : 'fill-transparent text-current'
                        }`} 
                      />
                      <span>{d.likes}</span>
                    </button>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{d.comments.length} rəy</span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

        </div>
      )}

    </div>
  );
}