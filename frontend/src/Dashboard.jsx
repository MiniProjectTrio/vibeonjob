import { useEffect, useState } from 'react'
import { useAuth } from './context/AuthContext'

export default function Dashboard() {
  const { user, token, logout } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
        const response = await fetch(`${apiUrl}/api/dashboard-data`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) throw new Error('Failed to fetch data')
        setData(await response.json())
      } catch (err) {
        setError(err.message)
      }
    }
    if (token) fetchData()
  }, [token])

  return (
    <div className="min-h-screen bg-surface p-8">
      <header className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm mb-8">
        <h1 className="text-2xl font-bold font-headline text-primary">VibeOnJob Dashboard</h1>
        <button
          onClick={logout}
          className="px-4 py-2 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-red-50 hover:text-red-600 transition-all"
        >
          Sign Out
        </button>
      </header>

      <main className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm p-8 text-center">
        <h2 className="text-3xl font-bold mb-4">
          {data?.message || `Welcome back, ${user?.first_name || 'User'}!`}
        </h2>
        <p className="text-on-surface-variant font-medium mb-8">
          Logged in as: {user?.email}
        </p>

        {error ? (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg max-w-md mx-auto">
            Error loading backend data: {error}
          </div>
        ) : !data ? (
          <div className="mt-12 p-8 border border-outline/20 rounded-xl bg-surface-container-low">
            <span className="material-symbols-outlined text-6xl text-slate-300 mb-4 animate-pulse">sync</span>
            <h3 className="text-xl font-bold mb-2">Loading dashboard data...</h3>
          </div>
        ) : (
          <div className="mt-12 p-8 border border-outline/20 rounded-xl bg-white shadow-sm text-left">
            <h3 className="text-xl font-bold mb-6 text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">analytics</span>
              Your Insights
            </h3>
            <ul className="space-y-4">
              {data.insights.map((insight, idx) => (
                <li key={idx} className="flex items-start gap-3 text-on-surface-variant">
                  <span className="material-symbols-outlined text-green-500 text-sm mt-1" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  )
}
