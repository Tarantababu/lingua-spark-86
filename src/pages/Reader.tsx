import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, AlertCircle, CheckCircle, BookOpen } from 'lucide-react';
import axios from 'axios';

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

      // Move to next word
      if (currentWordIndex < lesson.words.length - 1) {
        setCurrentWordIndex(currentWordIndex + 1);
      }
    } catch (err) {
      setError('Failed to update word. Please try again.');
      console.error('Error updating word:', err);
    }
  };

  const handleSkipWord = () => {
    if (lesson && currentWordIndex < lesson.words.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
    }
  };

  const handleCompleteLessonConfirm = async () => {
    if (!lesson) return;

    try {
      // Mark all remaining words as known
      const unknownWords = lesson.words.filter((w) => !w.isKnown);
      
      await Promise.all(
        unknownWords.map((word) =>
          axios.put(`/api/lessons/${lessonId}/words/${word.id}`, {
            isKnown: true,
          })
        )
      );

      // Update local state
      setLesson({
        ...lesson,
        words: lesson.words.map((word) => ({ ...word, isKnown: true })),
      });

      setShowConfirmDialog(false);
      
      // Redirect to lessons page or completion page
      navigate('/lessons', { state: { message: 'Lesson completed!' } });
    } catch (err) {
      setError('Failed to complete lesson. Please try again.');
      console.error('Error completing lesson:', err);
      setShowConfirmDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-indigo-600 mx-auto mb-4 animate-bounce" />
          <p className="text-gray-600">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Lesson Not Found</h1>
          <p className="text-gray-600 mb-6">The lesson you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/lessons')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg transition"
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
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/lessons')}
            className="flex items-center text-indigo-600 hover:text-indigo-800 font-semibold transition"
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-800">{lesson.title}</h1>
          <div className="w-20"></div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-700 font-semibold">Progress</span>
            <span className="text-gray-600">{knownWordsCount} / {totalWords}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-indigo-500 to-blue-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Word Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="text-center mb-8">
            <p className="text-gray-600 text-sm mb-2">Word {currentWordIndex + 1} of {totalWords}</p>
            <h2 className="text-5xl font-bold text-indigo-600 mb-4">{currentWord.word}</h2>
            <p className="text-xl text-gray-700">{currentWord.translation}</p>
          </div>

          {currentWord.isKnown && (
            <div className="flex items-center justify-center text-green-600 mb-6">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span className="font-semibold">Already marked as known</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleSkipWord}
              disabled={currentWordIndex >= totalWords - 1}
              className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              Skip
              <ChevronRight className="w-5 h-5" />
            </button>
            {!currentWord.isKnown && (
              <button
                onClick={() => handleMarkAsKnown(currentWord.id)}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition"
              >
                <CheckCircle className="w-5 h-5" />
                Mark as Known
              </button>
            )}
          </div>
        </div>

        {/* Complete Lesson Button */}
        <div className="flex justify-center mb-6">
          <button
            onClick={() => setShowConfirmDialog(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg transition shadow-lg"
          >
            Complete Lesson
          </button>
        </div>

        {/* Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-sm">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Complete Lesson?</h2>
              <p className="text-gray-600 mb-6">
                This will mark all remaining unknown words as known. This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCompleteLessonConfirm}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  Complete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
