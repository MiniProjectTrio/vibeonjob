import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'

export default function SignupPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(email, password, firstName)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-background text-on-surface min-h-screen flex flex-col overflow-x-hidden relative">
      <div className="absolute w-[800px] h-[800px] rounded-full blur-[120px] z-0 opacity-15 pointer-events-none bg-gradient-to-br from-blue-400 to-indigo-600 -top-48 -left-48"></div>
      <div className="absolute w-[800px] h-[800px] rounded-full blur-[120px] z-0 opacity-15 pointer-events-none bg-gradient-to-tr from-indigo-500 to-primary/40 -bottom-48 -right-48"></div>
      
      <nav className="relative z-50 w-full px-6 py-5 flex items-center justify-between max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          </div>
          <span className="font-headline text-2xl font-extrabold tracking-tighter text-on-surface">VibeOnJob</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link to="#" className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors">Features</Link>
          <Link to="#" className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors">Free Tools</Link>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-bold text-on-surface hover:text-primary transition-colors">Log In</Link>
          <Link to="/signup" className="bg-primary hover:bg-primary-dim text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-lg shadow-primary/20 transition-all">Get Started Free</Link>
        </div>
      </nav>

      <main className="flex-1 relative z-10 flex items-center justify-center px-6 py-12">
        <div className="bg-surface/80 backdrop-blur-xl w-full max-w-[520px] rounded-[2.5rem] p-10 md:p-12 shadow-[0_32px_64px_-12px_rgba(0,33,80,0.08)] border border-white/50 flex flex-col items-center">
            <div className="text-center mb-8 w-full">
               <h1 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight mb-3">Join VibeOnJob</h1>
               <p className="text-on-surface-variant font-medium mb-6">Create your account to start analyzing</p>
            </div>

            {error && (
               <div className="mb-6 p-4 w-full bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 flex items-center gap-3">
                 <span className="material-symbols-outlined">error</span>
                 {error}
               </div>
            )}

            <form onSubmit={handleSubmit} className="w-full space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-extrabold uppercase tracking-widest text-on-surface-variant/80 ml-1">First Name</label>
                <div className="relative">
                  <input 
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jane" 
                    className="w-full h-14 bg-slate-50/50 border border-slate-200 rounded-2xl px-5 text-on-surface placeholder:text-slate-400 focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white transition-all outline-none font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-extrabold uppercase tracking-widest text-on-surface-variant/80 ml-1">Email Address</label>
                <div className="relative">
                  <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@company.com" 
                    className="w-full h-14 bg-slate-50/50 border border-slate-200 rounded-2xl px-5 text-on-surface placeholder:text-slate-400 focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white transition-all outline-none font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-extrabold uppercase tracking-widest text-on-surface-variant/80 ml-1">Password</label>
                <div className="relative">
                  <input 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••" 
                    className="w-full h-14 bg-slate-50/50 border border-slate-200 rounded-2xl px-5 text-on-surface placeholder:text-slate-400 focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white transition-all outline-none font-medium"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full h-14 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-full shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-300 mt-4 text-base disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Sign Up'}
              </button>
            </form>

            <div className="mt-8 text-center w-full">
                <p className="text-on-surface-variant font-medium text-sm">
                    Already have an account? 
                    <Link to="/login" className="text-primary font-bold ml-1 hover:underline underline-offset-8">Sign in</Link>
                </p>
            </div>
        </div>
      </main>

      <footer className="pb-10 text-center px-8 relative z-10">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
            By continuing, you agree to our <br/>
            <Link to="#" className="hover:text-slate-600 transition-colors">Terms of Service</Link> and <Link to="#" className="hover:text-slate-600 transition-colors">Privacy Policy</Link>.
        </p>
      </footer>
    </div>
  )
}
