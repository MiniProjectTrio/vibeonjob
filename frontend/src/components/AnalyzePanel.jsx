import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AnalyzePanel({ onAnalysisComplete }) {
  const { token } = useAuth();
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState('');
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && isValidFile(droppedFile)) {
      setFile(droppedFile);
      setError(null);
    } else {
      setError('Please upload a PDF or DOCX file.');
    }
  };

  const isValidFile = (f) => {
    const name = f.name.toLowerCase();
    return name.endsWith('.pdf') || name.endsWith('.docx');
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && isValidFile(selected)) {
      setFile(selected);
      setError(null);
    } else if (selected) {
      setError('Please upload a PDF or DOCX file.');
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Please upload a resume file.');
      return;
    }
    if (!jobDescription.trim()) {
      setError('Please enter a job description.');
      return;
    }

    setLoading(true);
    setError(null);
    setProgress('Uploading resume and starting analysis...');

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('job_description', jobDescription);

      setProgress('Running 6-layer NLP pipeline — this may take 15-30 seconds...');

      const response = await fetch(`${apiUrl}/api/analyze`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Analysis failed');
      }

      const result = await response.json();
      setProgress('Analysis complete!');
      onAnalysisComplete(result);
    } catch (err) {
      setError(err.message);
      setProgress('');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setJobDescription('');
    setError(null);
    setProgress('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="bento-card rounded-xl p-2 h-full">
      <div className="rounded-[2rem] p-8 md:p-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
            <span className="material-symbols-outlined text-blue-600" style={{ fontVariationSettings: "'FILL' 1" }}>biotech</span>
          </div>
          <div>
            <h2 className="editorial-headline text-xl font-bold text-slate-900">Resume Analysis Pipeline</h2>
            <p className="text-sm text-slate-400">Upload your resume and paste the job description</p>
          </div>
        </div>

        {/* File Upload Zone */}
        <div
          className={`upload-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all duration-300 mb-6 cursor-pointer ${
            dragActive ? 'bg-blue-50/60 border-blue-400' : file ? 'bg-green-50/30' : 'hover:bg-blue-50/20'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !file && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx"
            onChange={handleFileChange}
            className="hidden"
            id="resume-upload"
          />
          {file ? (
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center">
                <span className="material-symbols-outlined text-green-600 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-900 text-sm">{file.name}</p>
                <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleReset(); }}
                className="ml-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-red-50 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-slate-400 hover:text-red-500 text-[18px]">close</span>
              </button>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-blue-600 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>cloud_upload</span>
              </div>
              <p className="font-bold text-slate-700 text-sm mb-1">
                {dragActive ? 'Drop your file here' : 'Drag & drop your resume here'}
              </p>
              <p className="text-xs text-slate-400">or click to browse — PDF or DOCX</p>
            </>
          )}
        </div>

        {/* Job Description */}
        <div className="mb-6">
          <label htmlFor="job-description" className="block text-sm font-bold text-slate-700 mb-2">
            <span className="material-symbols-outlined text-[16px] align-middle mr-1">work</span>
            Job Description
          </label>
          <textarea
            id="job-description"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full job description here..."
            rows={6}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300 transition-all resize-none"
            disabled={loading}
          />
          <div className="flex justify-between mt-1">
            <p className="text-xs text-slate-400">{jobDescription.split(/\s+/).filter(Boolean).length} words</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <p>{error}</p>
          </div>
        )}

        {/* Progress */}
        {loading && progress && (
          <div className="flex items-center gap-3 p-3 mb-4 bg-blue-50/50 text-blue-700 rounded-xl border border-blue-100 text-sm">
            <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
            <div>
              <p className="font-semibold">{progress}</p>
              <p className="text-xs text-blue-500 mt-0.5">Ingestion → Extraction → Vectorization → Alignment → RAG → Render</p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          id="analyze-submit"
          onClick={handleSubmit}
          disabled={loading || !file || !jobDescription.trim()}
          className={`w-full py-4 rounded-xl font-bold text-sm shadow-lg transition-all active:scale-[0.98] ${
            loading || !file || !jobDescription.trim()
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              : 'primary-gradient text-white shadow-blue-500/25 hover:shadow-blue-500/40'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
              Analyzing...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              Run Analysis Pipeline
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
