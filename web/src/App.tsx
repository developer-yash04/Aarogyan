import { useWallet } from './useWallet';
import { DemographicForm } from './DemographicForm';

function App() {
  const { account, isConnecting, error, connectWallet } = useWallet();

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h1>Aarogyan - ZK Verification</h1>
      
      {account ? (
        <div style={{ textAlign: 'center' }}>
          <p><strong>Status:</strong> Connected ✅</p>
          <p><strong>Wallet Address:</strong> {account}</p>
          
          <DemographicForm />
        </div>
      ) : (
        <button onClick={connectWallet} disabled={isConnecting} style={{ padding: '0.6rem 1.2rem', cursor: 'pointer' }}>
          {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
        </button>
      )}

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default App;