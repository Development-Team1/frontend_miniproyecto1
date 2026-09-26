import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import './App.css'
import EventForm from './components/EventForm'

function App() {
  const [count, setCount] = useState(0)
  const [apiStatus, setApiStatus] = useState('Conectando...')

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/health`)
      .then((res) => res.json())
      .then((data) => setApiStatus(JSON.stringify(data)))
      .catch((err) => setApiStatus('Error: ' + err.message))
  }, [])

  return (
    <>
      <div>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>

      <div style={{ margin: '1rem', padding: '1rem', border: '1px solid gray' }}>
        <h2>Estado del Backend:</h2>
        <p>{apiStatus}</p>
      </div>

      <div className="card">
        <button onClick={() => setCount((count) => count + 2)}>
          count is {count}
        </button>
      </div>
      <EventForm />
    </>
  )
}

export default App