import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AnalysisHistory({ onViewAnalysis }) {
  const { token } = useAuth();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    fetchAnalyses();
  }, [token]);

  const fetchAnalyses = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/api/analyses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setAnalyses(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch analysis history:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalysisDetail = async (id) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/api/analyses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        onViewAnalysis(data);
      }
    } catch (err) {
      console.error('Failed to fetch analysis detail:', err);
    }
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getScoreColor = (score) => {
    if (score >= 75) return 'text-green-600 bg-green-50';
    if (score >= 50) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  if (loading) {
    return (
      <div className="bento-card rounded-xl p-8">
        <div className="flex items-center justify-center gap-2 py-4">
          <span className="material-symbols-outlined animate-spin text-blue-300 text-[20px]">progress_activity</span>
          <span className="text-sm text-slate-400">Loading history...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bento-card rounded-xl p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-violet-600" style={{ fontVariationSettings: "'FILL' 1" }}>history</span>
          </div>
          <h3 className="editorial-headline text-lg font-bold text-slate-900">Analysis History</h3>
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-violet-600 bg-violet-50/80 px-3 py-1.5 rounded-full">
          {analyses.length} total
        </span>
      </div>

      {analyses.length === 0 ? (
        <div className="text-center py-8">
          <span className="material-symbols-outlined text-slate-200 text-4xl mb-3 block">folder_open</span>
          <p className="text-sm text-slate-400">No analyses yet. Run your first analysis above!</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
          {analyses.map((a) => (
            <button
              key={a.id}
              onClick={() => fetchAnalysisDetail(a.id)}
              className="w-full text-left bg-slate-50/50 rounded-xl p-4 hover:bg-white border border-transparent hover:border-slate-100 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium">{formatDate(a.created_at)} • {formatTime(a.created_at)}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className={`text-sm font-extrabold px-2.5 py-0.5 rounded-lg ${getScoreColor(a.match_score)}`}>
                      {Math.round(a.match_score)}%
                    </span>
                    <span className="text-xs text-slate-400">Semantic</span>
                    <span className={`text-sm font-extrabold px-2.5 py-0.5 rounded-lg ${getScoreColor(a.ats_score)}`}>
                      {Math.round(a.ats_score)}%
                    </span>
                    <span className="text-xs text-slate-400">ATS</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-slate-300 group-hover:text-blue-500 text-[18px] transition-colors">chevron_right</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
