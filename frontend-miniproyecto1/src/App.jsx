import { useState, useEffect } from 'react'
import EventForm from './components/EventForm'
import EventList from './components/EventList'
import './App.css'

function App() {
  const [apiStatus, setApiStatus] = useState('Conectando...')
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/health`)
      .then((res) => res.json())
      .then((data) => setApiStatus(JSON.stringify(data)))
      .catch((err) => setApiStatus('Error: ' + err.message))
  }, [])

  return (
    <>
      <div style={{ margin: '1rem', padding: '1rem', border: '1px solid gray' }}>
        <h2>Estado del Backend:</h2>
        <p>{apiStatus}</p>
      </div>

      <EventForm onEventoCreado={() => setRefreshTrigger((n) => n + 1)} />
      <EventList refreshTrigger={refreshTrigger} />
    </>
  )
}

export default App