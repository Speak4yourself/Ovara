// src/App.jsx
export default function App() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0b0c10',
      color: '#fff',
      display: 'grid',
      placeItems: 'center',
      fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto'
    }}>
      <div style={{opacity:.85, textAlign:'center'}}>
        <h1 style={{fontSize:'2rem', fontWeight:800, letterSpacing:'-0.02em'}}>Ovara — The Writing Tool</h1>
        <p style={{marginTop:8}}>Site shell deployed. Replace <code>src/App.jsx</code> with your full app.</p>
      </div>
    </div>
  );
}
