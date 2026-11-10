import { useNavigate } from 'react-router-dom';
import { Mic, Clock, TrendingUp, Award, ArrowRight, ChevronRight } from 'lucide-react';
import { getDashboardStats, formatDuration, formatTotalTime } from '../utils/storage';
import { CATEGORY_CONFIG } from '../utils/questions';
import type { QuestionCategory } from '../types';
import ScoreChart from '../components/ScoreChart';

export default function Dashboard() {
  const navigate = useNavigate();
  const stats = getDashboardStats();
  const hasData = stats.totalSessions > 0;

  const handleStartPractice = () => navigate('/practice');
  const handleStartCategory = (category: QuestionCategory) => navigate(`/practice?category=${category}`);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-[#F8FAFC] mb-2">
          {hasData ? 'Welcome back.' : 'Ready to become a better communicator?'}
        </h1>
        <p className="text-[#94A3B8] text-lg">
          Practise speaking. Discover your weaknesses. Express yourself better.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Mic size={18} className="text-[#8B7CFF]" />}
          label="Sessions"
          value={hasData ? stats.totalSessions.toString() : '—'}
          sub={hasData ? 'completed' : 'No sessions yet'}
        />
        <StatCard
          icon={<Clock size={18} className="text-[#38BDF8]" />}
          label="Speaking Time"
          value={hasData ? formatTotalTime(stats.totalSpeakingTime) : '—'}
          sub={hasData ? 'total practice' : 'Start practising'}
        />
        <StatCard
          icon={<TrendingUp size={18} className="text-[#34D399]" />}
          label="Avg Score"
          value={hasData ? `${stats.averageScore}` : '—'}
          sub={hasData ? 'out of 100' : 'Pending'}
        />
        <StatCard
          icon={<Award size={18} className="text-[#FBBF24]" />}
          label="Best Score"
          value={hasData ? `${stats.bestScore}` : '—'}
          sub={hasData ? 'personal best' : 'Not set yet'}
        />
      </div>

      <div className="grid grid-cols-5 gap-6 mb-8">
        {/* CTA */}
        <div className="col-span-3 bg-gradient-to-br from-[#8B7CFF]/10 to-[#38BDF8]/5 border border-[#8B7CFF]/20 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-[#F8FAFC] mb-2">Start Speaking Practice</h2>
          <p className="text-[#94A3B8] text-sm mb-6">
            Pick a topic, record your response, and get detailed feedback on your communication style.
          </p>
          <button
            onClick={handleStartPractice}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-all duration-150 hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #8B7CFF, #6B5CDF)' }}
          >
            <Mic size={15} />
            Start Speaking Practice
            <ArrowRight size={15} />
          </button>
        </div>

        {/* Score chart */}
        <div className="col-span-2 bg-[#161D2B] border border-[#1E2D3D] rounded-xl p-5">
          <h3 className="text-sm font-medium text-[#94A3B8] mb-4">Score Trend</h3>
          {hasData && stats.scoreHistory.length > 1 ? (
            <ScoreChart data={stats.scoreHistory} height={100} />
          ) : (
            <div className="h-[100px] flex items-center justify-center">
              <p className="text-xs text-[#475569] text-center">Complete sessions to<br />see your progress</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick categories */}
      <div className="mb-8">
        <h2 className="text-base font-semibold text-[#F8FAFC] mb-4">Practice Categories</h2>
        <div className="grid grid-cols-2 gap-3">
          {(Object.entries(CATEGORY_CONFIG) as [QuestionCategory, typeof CATEGORY_CONFIG[QuestionCategory]][]).map(([key, config]) => (
            <button
              key={key}
              onClick={() => handleStartCategory(key)}
              className="bg-[#161D2B] border border-[#1E2D3D] rounded-xl p-4 text-left hover:border-[#2D3F55] hover:bg-[#1C2535] transition-all duration-150 group"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-xl">{config.icon}</span>
                <ChevronRight size={15} className="text-[#475569] group-hover:text-[#94A3B8] transition-colors" />
              </div>
              <p className="font-medium text-[#F8FAFC] text-sm mb-1">{config.label}</p>
              <p className="text-xs text-[#475569]">{config.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent sessions */}
      {hasData && stats.recentSessions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#F8FAFC]">Recent Sessions</h2>
            <button
              onClick={() => navigate('/progress')}
              className="text-xs text-[#8B7CFF] hover:text-[#A99DFF] transition-colors flex items-center gap-1"
            >
              View all <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-2">
            {stats.recentSessions.map(session => (
              <button
                key={session.id}
                onClick={() => navigate(`/session/${session.id}`)}
                className="w-full bg-[#161D2B] border border-[#1E2D3D] rounded-xl p-4 text-left hover:border-[#2D3F55] transition-all duration-150 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#F8FAFC] truncate mb-1">{session.question}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[#475569]">
                        {new Date(session.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="text-xs text-[#475569]">{formatDuration(session.duration)}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${CATEGORY_CONFIG[session.category]?.color}15`, color: CATEGORY_CONFIG[session.category]?.color }}>
                        {CATEGORY_CONFIG[session.category]?.label}
                      </span>
                    </div>
                  </div>
                  {session.feedback && (
                    <div className="flex items-center gap-2 ml-4">
                      <div className="text-right">
                        <p className="text-lg font-bold" style={{ color: scoreColor(session.feedback.overallScore) }}>
                          {session.feedback.overallScore}
                        </p>
                        <p className="text-[10px] text-[#475569]">score</p>
                      </div>
                      <ChevronRight size={15} className="text-[#475569] group-hover:text-[#94A3B8]" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasData && (
        <div className="bg-[#161D2B] border border-[#1E2D3D] rounded-xl p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-[#8B7CFF]/10 flex items-center justify-center mx-auto mb-4">
            <Mic size={24} className="text-[#8B7CFF]" />
          </div>
          <h3 className="text-base font-semibold text-[#F8FAFC] mb-2">Your journey starts here</h3>
          <p className="text-sm text-[#475569] mb-6 max-w-xs mx-auto">
            Complete your first speaking session to see your personalised progress and feedback.
          </p>
          <button
            onClick={handleStartPractice}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-all"
            style={{ background: 'linear-gradient(135deg, #8B7CFF, #6B5CDF)' }}
          >
            <Mic size={15} />
            Begin First Session
          </button>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="bg-[#161D2B] border border-[#1E2D3D] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-xs text-[#94A3B8] font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-[#F8FAFC]">{value}</p>
      <p className="text-xs text-[#475569] mt-0.5">{sub}</p>
    </div>
  );
}

function scoreColor(score: number): string {
  if (score >= 75) return '#34D399';
  if (score >= 55) return '#FBBF24';
  return '#F87171';
}
