import { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8000/risks/';

export default function RiskForm({ onRiskAdded }) {
  const [formData, setFormData] = useState({
    description: '',
    probability: 3,
    impact: 3,
    cia_pillar: 'Confidentiality',
    mitigation: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'probability' || name === 'impact' ? parseInt(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(API_URL, formData);
      onRiskAdded();
      setFormData({
        description: '',
        probability: 3,
        impact: 3,
        cia_pillar: 'Confidentiality',
        mitigation: ''
      });
    } catch (error) {
      console.error("Error adding risk", error);
      alert("Failed to add risk");
    }
  };

  return (
    <div className="glass-panel">
      <h2>Add New Risk</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea 
            id="description"
            name="description" 
            value={formData.description} 
            onChange={handleChange} 
            required 
            placeholder="Describe the risk..."
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="probability">Probability (1-5)</label>
          <input 
            type="number" 
            id="probability"
            name="probability" 
            min="1" max="5" 
            value={formData.probability} 
            onChange={handleChange} 
            required 
          />
        </div>

        <div className="form-group">
          <label htmlFor="impact">Impact (1-5)</label>
          <input 
            type="number" 
            id="impact"
            name="impact" 
            min="1" max="5" 
            value={formData.impact} 
            onChange={handleChange} 
            required 
          />
        </div>

        <div className="form-group">
          <label htmlFor="cia_pillar">CIA Pillar</label>
          <select 
            id="cia_pillar"
            name="cia_pillar" 
            value={formData.cia_pillar} 
            onChange={handleChange}
          >
            <option value="Confidentiality">Confidentiality</option>
            <option value="Integrity">Integrity</option>
            <option value="Availability">Availability</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="mitigation">Mitigation Measure</label>
          <textarea 
            id="mitigation"
            name="mitigation" 
            value={formData.mitigation} 
            onChange={handleChange} 
            required 
            placeholder="How to mitigate this risk..."
          />
        </div>

        <button type="submit" className="btn">Add Risk</button>
      </form>
    </div>
  );
}
