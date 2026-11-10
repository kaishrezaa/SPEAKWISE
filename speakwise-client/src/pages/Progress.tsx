import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, TrendingUp, Clock, Award, Mic, ChevronRight } from 'lucide-react';
import { getAllSessions, getDashboardStats, clearAllSessions, formatDuration, formatTotalTime } from '../utils/storage';
import { CATEGORY_CONFIG } from '../utils/questions';
import ScoreChart from '../components/ScoreChart';

export default function Progress() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState(getAllSessions());
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const stats = getDashboardStats();
  const hasData = sessions.length > 0;

  const handleClearHistory = () => {
    clearAllSessions();
    setSessions([]);
    setShowConfirmClear(false);
  };

  const scoreColor = (s: number) => s >= 75 ? '#34D399' : s >= 55 ? '#FBBF24' : '#F87171';

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#F8FAFC] mb-1">Progress Tracker</h1>
          <p className="text-[#94A3B8]">Your communication improvement over time.</p>
        </div>
        {hasData && !showConfirmClear && (
          <button
            onClick={() => setShowConfirmClear(true)}
            className="flex items-center gap-2 text-xs text-[#475569] hover:text-[#F87171] transition-colors px-3 py-2 rounded-lg hover:bg-[#F87171]/5"
          >
            <Trash2 size={13} />
            Clear history
          </button>
        )}
        {showConfirmClear && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#F87171]">Delete all sessions?</span>
            <button onClick={handleClearHistory} className="text-xs bg-[#F87171]/10 text-[#F87171] border border-[#F87171]/20 px-3 py-1.5 rounded-lg hover:bg-[#F87171]/20 transition-all">
              Yes, delete
            </button>
            <button onClick={() => setShowConfirmClear(false)} className="text-xs text-[#475569] hover:text-[#94A3B8] transition-colors">
              Cancel
            </button>
          </div>
        )}
      </div>

      {!hasData ? (
        <div className="bg-[#161D2B] border border-[#1E2D3D] rounded-2xl p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-[#8B7CFF]/10 flex items-center justify-center mx-auto mb-4">
            <TrendingUp size={24} className="text-[#8B7CFF]" />
          </div>
          <h3 className="text-base font-semibold text-[#F8FAFC] mb-2">No progress data yet</h3>
          <p className="text-sm text-[#475569] mb-6 max-w-xs mx-auto">
            Complete speaking sessions to start tracking your improvement.
          </p>
          <button
            onClick={() => navigate('/practice')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-all"
            style={{ background: 'linear-gradient(135deg, #8B7CFF, #6B5CDF)' }}
          >
            <Mic size={15} />
            Start Practising
          </button>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { icon: <Mic size={16} className="text-[#8B7CFF]" />, label: 'Sessions', value: stats.totalSessions.toString() },
              { icon: <Clock size={16} className="text-[#38BDF8]" />, label: 'Speaking Time', value: formatTotalTime(stats.totalSpeakingTime) },
              { icon: <TrendingUp size={16} className="text-[#34D399]" />, label: 'Average Score', value: stats.averageScore > 0 ? `${stats.averageScore}` : '—' },
              { icon: <Award size={16} className="text-[#FBBF24]" />, label: 'Best Score', value: stats.bestScore > 0 ? `${stats.bestScore}` : '—' },
            ].map(({ icon, label, value }) => (
              <div key={label} className="bg-[#161D2B] border border-[#1E2D3D] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-[#94A3B8]">{label}</span></div>
                <p className="text-2xl font-bold text-[#F8FAFC]">{value}</p>
              </div>
            ))}
          </div>

          {/* Chart */}
          {stats.scoreHistory.length > 1 && (
            <div className="bg-[#161D2B] border border-[#1E2D3D] rounded-2xl p-5 mb-6">
              <h2 className="text-sm font-semibold text-[#F8FAFC] mb-4">Score Over Time</h2>
              <ScoreChart data={stats.scoreHistory} height={160} />
            </div>
          )}

          {/* Session list */}
          <div>
            <h2 className="text-sm font-semibold text-[#F8FAFC] mb-3">All Sessions ({sessions.length})</h2>
            <div className="space-y-2">
              {sessions.map(session => (
                <button
                  key={session.id}
                  onClick={() => navigate(`/session/${session.id}`)}
                  className="w-full bg-[#161D2B] border border-[#1E2D3D] rounded-xl p-4 text-left hover:border-[#2D3F55] transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#F8FAFC] truncate mb-1">{session.question}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-[#475569]">
                          {new Date(session.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </span>
                        <span className="text-xs text-[#475569]">{formatDuration(session.duration)}</span>
                        {session.attempts?.length > 1 && (
                          <span className="text-[10px] text-[#8B7CFF] bg-[#8B7CFF]/10 px-1.5 py-0.5 rounded">
                            {session.attempts.length} attempts
                          </span>
                        )}
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded"
                          style={{ background: `${CATEGORY_CONFIG[session.category]?.color}15`, color: CATEGORY_CONFIG[session.category]?.color }}
                        >
                          {CATEGORY_CONFIG[session.category]?.label}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      {session.feedback && (
                        <span className="text-lg font-bold" style={{ color: scoreColor(session.feedback.overallScore) }}>
                          {session.feedback.overallScore}
                        </span>
                      )}
                      <ChevronRight size={15} className="text-[#475569] group-hover:text-[#94A3B8]" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
