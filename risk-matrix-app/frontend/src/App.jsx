import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import RiskForm from './components/RiskForm'
import RiskMatrix from './components/RiskMatrix'

const API_URL = 'http://localhost:8000/risks/';

function App() {
  const [risks, setRisks] = useState([]);

  const fetchRisks = useCallback(async () => {
    try {
      const response = await axios.get(API_URL);
      setRisks(response.data);
    } catch (error) {
      console.error('Failed to fetch risks', error);
    }
  }, []);

  useEffect(() => {
    const loadRisks = async () => {
      await fetchRisks();
    };

    loadRisks();
  }, [fetchRisks]);

  return (
    <div className="app-container">
      <RiskForm onRiskAdded={fetchRisks} />
      <RiskMatrix risks={risks} onRiskDeleted={fetchRisks} />
    </div>
  )
}

export default App
