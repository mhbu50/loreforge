import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bug, MessageSquare, Send, X, Sparkles, LifeBuoy, HelpCircle, BookOpen, Palette, FileText, ExternalLink } from 'lucide-react';
import { auth, db } from '../firebase';
import { collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';
import { toast } from 'sonner';
import { UserProfile } from '../types';
import { cn } from '../lib/utils';

export default function Support() {
  const [feedbackModal, setFeedbackModal] = useState<{ show: boolean; type: 'bug' | 'suggestion' }>({ show: false, type: 'bug' });
  const [feedbackContent, setFeedbackContent] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const handleSubmitFeedback = async () => {
    if (!feedbackContent.trim() || !auth.currentUser) return;
    setIsSubmittingFeedback(true);
    const path = 'feedback';
    try {
      await addDoc(collection(db, 'feedback'), {
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        type: feedbackModal.type,
        content: feedbackContent,
        status: 'pending',
        createdAt: Date.now(),
      });
      toast.success("Thank you for your feedback! Our team will review it.");
      setFeedbackModal({ show: false, type: 'bug' });
      setFeedbackContent('');
    } catch (error) {
      console.error(error);
      if (error instanceof Error && error.message.includes('permission')) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
      toast.error("Failed to submit feedback");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8 pb-32">
      {/* Page header */}
      <header className="mb-14">
        <h1 className="text-6xl font-sans font-light mb-3 leading-none">
          Forge <span className="italic text-[#D97757]">Support</span>
        </h1>
        <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-black/40">
          We're here to help you forge your best stories
        </p>
      </header>

      {/* Main contact cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        {/* Bug report */}
        <button
          onClick={() => setFeedbackModal({ show: true, type: 'bug' })}
          className="group p-8 bg-white border border-black/5 rounded-[2rem] text-left hover:shadow-xl hover:shadow-[#D97757]/10 hover:-translate-y-1 transition-all"
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-red-50 text-red-500 mb-6 group-hover:scale-110 transition-transform">
            <Bug size={28} />
          </div>
          <h3 className="text-2xl font-semibold mb-2">Report a Bug</h3>
          <p className="text-sm text-black/40 leading-relaxed">
            Found a glitch in the forge? Let us know so we can fix it immediately.
          </p>
        </button>

        {/* Suggestion */}
        <button
          onClick={() => setFeedbackModal({ show: true, type: 'suggestion' })}
          className="group p-8 bg-white border border-black/5 rounded-[2rem] text-left hover:shadow-xl hover:shadow-[#D97757]/10 hover:-translate-y-1 transition-all"
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-500 mb-6 group-hover:scale-110 transition-transform">
            <MessageSquare size={28} />
          </div>
          <h3 className="text-2xl font-semibold mb-2">Share a Suggestion</h3>
          <p className="text-sm text-black/40 leading-relaxed">
            Have an idea for a new feature or improvement? We'd love to hear it!
          </p>
        </button>
      </div>

      {/* Resource cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[
          { title: 'Documentation', icon: <BookOpen size={20} />, desc: 'Learn how to use all the forge tools.', bg: 'bg-[#D97757]/10', color: 'text-[#D97757]' },
          { title: 'Community FAQ', icon: <HelpCircle size={20} />, desc: 'Common questions from other storytellers.', bg: 'bg-blue-50', color: 'text-blue-500' },
          { title: 'Live Status', icon: <LifeBuoy size={20} />, desc: 'Check if the forge engines are running smoothly.', bg: 'bg-green-50', color: 'text-green-500' },
        ].map((item, i) => (
          <div key={i} className="p-6 bg-white border border-black/5 rounded-[1.5rem] shadow-sm">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4", item.bg, item.color)}>
              {item.icon}
            </div>
            <h4 className="text-base font-bold mb-1">{item.title}</h4>
            <p className="text-xs text-black/40 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Legal banner */}
      <div className="p-8 bg-[#D97757]/5 border border-[#D97757]/20 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-[#D97757]/10 text-[#D97757] rounded-2xl flex items-center justify-center flex-shrink-0">
            <FileText size={28} />
          </div>
          <div>
            <h3 className="text-2xl font-semibold">Legal &amp; Privacy</h3>
            <p className="text-sm text-black/40 mt-0.5">Review our terms of service and privacy policy.</p>
          </div>
        </div>
        <button
          onClick={async () => {
            const settingsDoc = await getDoc(doc(db, 'settings', 'global'));
            const terms =
              (settingsDoc.exists() ? settingsDoc.data().termsOfConditions : null) ||
              'Welcome to StoryCraft. Our terms of conditions are currently being updated.';
            toast.info("Terms & Conditions", {
              description: (typeof terms === 'string' ? terms : '').substring(0, 100) + "...",
              action: {
                label: "Read Full",
                onClick: () => window.open('/terms', '_blank'),
              },
            });
          }}
          className="flex items-center gap-2 px-8 py-4 bg-black text-white rounded-2xl font-bold hover:bg-[#D97757] hover:text-[#1a1a1a] transition-all shadow-lg shadow-[#D97757]/20 flex-shrink-0"
        >
          <span>View Terms</span>
          <ExternalLink size={16} />
        </button>
      </div>

      {/* Feedback Modal */}
      <AnimatePresence>
        {feedbackModal.show && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFeedbackModal({ show: false, type: 'bug' })}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', damping: 24, stiffness: 220 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-10 shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center",
                    feedbackModal.type === 'bug' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'
                  )}>
                    {feedbackModal.type === 'bug' ? <Bug size={22} /> : <MessageSquare size={22} />}
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold leading-tight">
                      {feedbackModal.type === 'bug' ? 'Report a Bug' : 'Share a Suggestion'}
                    </h3>
                    <p className="text-[10px] text-black/40 uppercase tracking-widest font-bold mt-0.5">
                      Help us craft a better StoryCraft
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setFeedbackModal({ show: false, type: 'bug' })}
                  className="p-2 hover:bg-black/5 rounded-xl transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Type toggle pills */}
              <div className="flex gap-2 mb-6 p-1 bg-black/5 rounded-2xl">
                {(['bug', 'suggestion'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setFeedbackModal(prev => ({ ...prev, type: t }))}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                      feedbackModal.type === t
                        ? "bg-white shadow-sm text-black"
                        : "text-black/40 hover:text-black/60"
                    )}
                  >
                    {t === 'bug' ? 'Bug Report' : 'Suggestion'}
                  </button>
                ))}
              </div>

              {/* Textarea */}
              <textarea
                value={feedbackContent}
                onChange={(e) => setFeedbackContent(e.target.value)}
                placeholder={
                  feedbackModal.type === 'bug'
                    ? "Describe the bug you encountered..."
                    : "What features would you like to see?"
                }
                className="w-full h-44 bg-black/5 border border-black/5 rounded-2xl p-4 resize-none outline-none focus:border-[#D97757]/30 transition-colors font-medium text-sm mb-6"
              />

              {/* Submit */}
              <button
                onClick={handleSubmitFeedback}
                disabled={isSubmittingFeedback || !feedbackContent.trim()}
                className="w-full py-4 bg-[#D97757] text-[#1a1a1a] rounded-2xl font-bold hover:bg-[#141414] hover:text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#D97757]/20 disabled:opacity-50"
              >
                {isSubmittingFeedback ? (
                  <div className="w-5 h-5 border-2 border-night/30 border-t-night rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={16} />
                    <span>Send Feedback</span>
                  </>
                )}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
