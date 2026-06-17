import { useState, useEffect } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function App() {
  const [scales, setScales] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Form states for creating a new scale
  const [newTitle, setNewTitle] = useState("")
  const [newDesc, setNewDesc] = useState("")

  // Dynamic input states mapped by Scale ID
  const [voteOptions, setVoteOptions] = useState({})
  const [voterNames, setVoterNames] = useState({})

  // Fetch all scales and their votes
  const fetchScales = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/scales`)
      if (!response.ok) throw new Error("Failed to load scales")
      const data = await response.ok ? await response.json() : []
      setScales(data)
      setError(null)
    } catch (err) {
      console.error(err)
      setError("Cannot connect to backend API server.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchScales()
  }, [])

  // Create a new scale topic
  const handleCreateScale = async (e) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    try {
      const response = await fetch(`${API_URL}/scales`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, description: newDesc })
      })
      if (!response.ok) throw new Error("Failed to create scale")
      
      setNewTitle("")
      setNewDesc("")
      fetchScales()
    } catch (err) {
      alert("Error creating scale. Is the backend running?")
    }
  }

  // Cast a vote
  const handleCastVote = async (scaleId) => {
    const option = voteOptions[scaleId] || ""
    const voterName = voterNames[scaleId] || ""

    if (!option.trim()) {
      alert("Please enter a voting option!")
      return
    }

    try {
      const response = await fetch(`${API_URL}/scales/${scaleId}/votes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ option: option.trim(), voter_name: voterName.trim() })
      })
      if (!response.ok) throw new Error("Failed to cast vote")

      // Clear input fields for this scale
      setVoteOptions(prev => ({ ...prev, [scaleId]: "" }))
      setVoterNames(prev => ({ ...prev, [scaleId]: "" }))
      fetchScales()
    } catch (err) {
      alert("Error casting vote.")
    }
  }

  // Delete a scale topic
  const handleDeleteScale = async (scaleId) => {
    if (!confirm("Are you sure you want to delete this voting scale?")) return

    try {
      const response = await fetch(`${API_URL}/scales/${scaleId}`, {
        method: "DELETE"
      })
      if (!response.ok) throw new Error("Failed to delete scale")
      fetchScales()
    } catch (err) {
      alert("Error deleting scale.")
    }
  }

  // Helper to aggregate votes by option and calculate percentages
  const getVoteResults = (votes) => {
    if (!votes || votes.length === 0) return []
    
    const counts = {}
    votes.forEach(v => {
      counts[v.option] = (counts[v.option] || 0) + 1
    })

    return Object.keys(counts).map(option => ({
      option,
      count: counts[option],
      percentage: Math.round((counts[option] / votes.length) * 100)
    })).sort((a, b) => b.count - a.count)
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>⚖️ VoteScale</h1>
        <p className="app-subtitle">DevOps-Native Interactive Voting Dashboard</p>
        <span className="api-badge">API Endpoint: <code>{API_URL}</code></span>
      </header>

      <div className="main-content">
        {/* Creation Form */}
        <section className="form-section">
          <h2>Create a New Voting Scale</h2>
          <form onSubmit={handleCreateScale} className="scale-form">
            <div className="form-group">
              <label>Topic Title</label>
              <input 
                type="text" 
                placeholder="e.g., FastAPI vs Express" 
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Description (Optional)</label>
              <textarea 
                placeholder="What is this debate about?"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows="3"
              />
            </div>
            <button type="submit" className="btn btn-primary">Launch Scale</button>
          </form>
        </section>

        {/* Scales List Display */}
        <section className="scales-section">
          <h2>Active Voting Scales</h2>
          
          {loading && <div className="status-msg">Loading scales from the cluster...</div>}
          
          {error && (
            <div className="status-msg error-msg">
              <p>{error}</p>
              <button onClick={fetchScales} className="btn btn-secondary">Retry Connection</button>
            </div>
          )}

          {!loading && !error && scales.length === 0 && (
            <div className="status-msg empty-msg">
              No active scales found. Use the form on the left to create one!
            </div>
          )}

          {!loading && !error && scales.map((scale) => {
            const results = getVoteResults(scale.votes)
            
            return (
              <div key={scale.id} className="scale-card">
                <div className="scale-header">
                  <div>
                    <h3>{scale.title}</h3>
                    {scale.description && <p className="scale-desc">{scale.description}</p>}
                  </div>
                  <button 
                    onClick={() => handleDeleteScale(scale.id)} 
                    className="btn-delete"
                    title="Delete Scale"
                  >
                    🗑️
                  </button>
                </div>

                {/* Vote Progress Bars */}
                <div className="results-container">
                  {scale.votes.length === 0 ? (
                    <p className="no-votes">No votes cast yet. Be the first!</p>
                  ) : (
                    <div className="progress-list">
                      {results.map((res, index) => (
                        <div key={index} className="progress-item">
                          <div className="progress-label">
                            <span className="option-name">{res.option}</span>
                            <span className="option-count">{res.count} vote{res.count !== 1 && 's'} ({res.percentage}%)</span>
                          </div>
                          <div className="progress-bar-bg">
                            <div 
                              className="progress-bar-fill" 
                              style={{ width: `${res.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Voting Input Form */}
                <div className="voting-actions">
                  <h4>Cast Your Vote</h4>
                  <div className="vote-inputs">
                    <input 
                      type="text" 
                      placeholder="Your option (e.g. FastAPI)"
                      value={voteOptions[scale.id] || ""}
                      onChange={(e) => setVoteOptions(prev => ({ ...prev, [scale.id]: e.target.value }))}
                      required
                    />
                    <input 
                      type="text" 
                      placeholder="Your Name (Optional)"
                      value={voterNames[scale.id] || ""}
                      onChange={(e) => setVoterNames(prev => ({ ...prev, [scale.id]: e.target.value }))}
                    />
                    <button 
                      onClick={() => handleCastVote(scale.id)} 
                      className="btn btn-secondary"
                    >
                      Submit Vote
                    </button>
                  </div>
                </div>

                {/* Recent Activity Log */}
                {scale.votes.length > 0 && (
                  <div className="voter-log">
                    <h5>Recent Voters</h5>
                    <div className="voter-pills">
                      {scale.votes.slice(-5).reverse().map((v, i) => (
                        <span key={i} className="voter-pill">
                          <strong>{v.voter_name || "Anonymous"}</strong> voted <em>{v.option}</em>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </section>
      </div>
    </div>
  )
}

export default App
