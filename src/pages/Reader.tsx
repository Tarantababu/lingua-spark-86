import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, AlertCircle, CheckCircle, BookOpen, Loader2, CheckSquare } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

interface Word {
  id: string;
  word: string;
  translation: string;
  isKnown: boolean;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string;
  words: Word[];
}

export default function Reader() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isCompletingLesson, setIsCompletingLesson] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/lessons/${lessonId}`);
        setLesson(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to load lesson. Please try again.');
        console.error('Error fetching lesson:', err);
        toast.error('Failed to load lesson');
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [lessonId]);

  const handleMarkAsKnown = async (wordId: string) => {
    if (!lesson) return;

    try {
      await axios.put(`/api/lessons/${lessonId}/words/${wordId}`, {
        isKnown: true,
      });

      setLesson({
        ...lesson,
        words: lesson.words.map((word) =>
          word.id === wordId ? { ...word, isKnown: true } : word
        ),
      });

      toast.success('Word marked as known!');

      // Move to next word
      if (currentWordIndex < lesson.words.length - 1) {
        setCurrentWordIndex(currentWordIndex + 1);
      }
    } catch (err) {
      setError('Failed to update word. Please try again.');
      console.error('Error updating word:', err);
      toast.error('Failed to mark word as known');
    }
  };

  const handleSkipWord = () => {
    if (lesson && currentWordIndex < lesson.words.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
      toast.info('Word skipped');
    }
  };

  const handleCompleteLessonConfirm = async () => {
    if (!lesson) return;

    try {
      setIsCompletingLesson(true);
      
      // Mark all remaining words as known
      const unknownWords = lesson.words.filter((w) => !w.isKnown);
      
      const updatePromises = unknownWords.map((word) =>
        axios.put(`/api/lessons/${lessonId}/words/${word.id}`, {
          isKnown: true,
        })
      );

      await Promise.all(updatePromises);

      // Update local state
      setLesson({
        ...lesson,
        words: lesson.words.map((word) => ({ ...word, isKnown: true })),
      });

      setShowConfirmDialog(false);
      
      // Show success animation and toast
      setShowSuccessAnimation(true);
      toast.success(`🎉 Lesson completed! All ${lesson.words.length} words marked as known!`);
      
      // Redirect after animation
      setTimeout(() => {
        navigate('/lessons', { 
          state: { 
            message: `Successfully completed "${lesson.title}"!`,
            completedLesson: lesson.id
          } 
        });
      }, 2000);
    } catch (err) {
      setError('Failed to complete lesson. Please try again.');
      console.error('Error completing lesson:', err);
      toast.error('Failed to complete lesson');
      setShowConfirmDialog(false);
    } finally {
      setIsCompletingLesson(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center animate-fade-in">
          <BookOpen className="w-12 h-12 text-indigo-600 mx-auto mb-4 animate-bounce" />
          <p className="text-gray-600 font-semibold">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center animate-fade-in">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Lesson Not Found</h1>
          <p className="text-gray-600 mb-6">The lesson you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/lessons')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg transition hover:shadow-lg"
          >
            Back to Lessons
          </button>
        </div>
      </div>
    );
  }

  const currentWord = lesson.words[currentWordIndex];
  const knownWordsCount = lesson.words.filter((w) => w.isKnown).length;
  const totalWords = lesson.words.length;
  const progressPercentage = (knownWordsCount / totalWords) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      {/* Success Animation Overlay */}
      {showSuccessAnimation && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="animate-pop">
            <CheckSquare className="w-24 h-24 text-green-500 drop-shadow-lg" />
          </div>
          <style>{`
            @keyframes pop {
              0% {
                transform: scale(0);
                opacity: 1;
              }
              50% {
                transform: scale(1.2);
              }
              100% {
                transform: scale(1);
                opacity: 0;
              }
            }
            .animate-pop {
              animation: pop 2s ease-out forwards;
            }
            @keyframes fade-in {
              from {
                opacity: 0;
                transform: translateY(10px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .animate-fade-in {
              animation: fade-in 0.5s ease-out;
            }
          `}</style>
        </div>
      )}

      <div className="max-w-2xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/lessons')}
            className="flex items-center text-indigo-600 hover:text-indigo-800 font-semibold transition hover:shadow-md px-4 py-2 rounded-lg hover:bg-white"
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-800">{lesson.title}</h1>
          <div className="w-20"></div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg animate-fade-in">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 mr-3" />
              {error}
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-700 font-semibold">Progress</span>
            <span className="text-gray-600">{knownWordsCount} / {totalWords}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-blue-500 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 mt-2">{Math.round(progressPercentage)}% Complete</p>
        </div>

        {/* Word Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8 hover:shadow-xl transition animate-fade-in">
          <div className="text-center mb-8">
            <p className="text-gray-600 text-sm mb-2 font-medium">Word {currentWordIndex + 1} of {totalWords}</p>
            <h2 className="text-5xl font-bold text-indigo-600 mb-4 animate-bounce">{currentWord.word}</h2>
            <p className="text-xl text-gray-700">{currentWord.translation}</p>
          </div>

          {currentWord.isKnown && (
            <div className="flex items-center justify-center text-green-600 mb-6 animate-fade-in">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span className="font-semibold">Already marked as known</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleSkipWord}
              disabled={currentWordIndex >= totalWords - 1}
              className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition hover:shadow-lg hover:scale-105 active:scale-95"
            >
              Skip
              <ChevronRight className="w-5 h-5" />
            </button>
            {!currentWord.isKnown && (
              <button
                onClick={() => handleMarkAsKnown(currentWord.id)}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition hover:shadow-lg hover:scale-105 active:scale-95"
              >
                <CheckCircle className="w-5 h-5" />
                Mark as Known
              </button>
            )}
          </div>
        </div>

        {/* Complete Lesson Button */}
        <div className="flex justify-center mb-6 animate-fade-in">
          <button
            onClick={() => setShowConfirmDialog(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg transition hover:shadow-lg hover:scale-105 active:scale-95"
          >
            Complete Lesson
          </button>
        </div>

        {/* Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-sm animate-fade-in">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Complete Lesson?</h2>
              <p className="text-gray-600 mb-6">
                This will mark <strong>{lesson.words.filter(w => !w.isKnown).length}</strong> remaining unknown words as known. This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  disabled={isCompletingLesson}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition hover:shadow-md disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCompleteLessonConfirm}
                  disabled={isCompletingLesson}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2 px-4 rounded-lg transition hover:shadow-lg disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCompletingLesson ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    'Complete'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}