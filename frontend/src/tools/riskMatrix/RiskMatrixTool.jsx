import { useCallback, useEffect, useState } from 'react';
import RiskForm from '../../components/RiskForm';
import RiskMatrix from '../../components/RiskMatrix';
import { getRisks } from '../../services/risksApi';

export default function RiskMatrixTool() {
  const [risks, setRisks] = useState([]);

  const fetchRisks = useCallback(async () => {
    try {
      const response = await getRisks();
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
    <div className="tool-workspace risk-matrix-tool">
      <RiskForm onRiskAdded={fetchRisks} />
      <RiskMatrix risks={risks} onRiskDeleted={fetchRisks} />
    </div>
  );
}
