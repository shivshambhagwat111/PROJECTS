import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const statusBadgeClasses = (status) => {
  switch (status) {
    case 'Healthy':
      return 'bg-green-100 text-green-800 border border-green-400';
    case 'Watch':
      return 'bg-yellow-100 text-yellow-800 border border-yellow-400';
    case 'Critical':
      return 'bg-red-100 text-red-800 border border-red-400';
    default:
      return 'bg-gray-100 text-gray-800 border border-gray-400';
  }
};

const InspectionPlanner = () => {
  const navigate = useNavigate();
  const type = localStorage.getItem('type');

  const [plan, setPlan] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('type');
    navigate('/');
  };

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const response = await axios.get('http://localhost:5000/inspection-plan');
        setPlan(response.data.plan || []);
        setSummary(response.data.summary || null);
      } catch (err) {
        console.error('Error fetching inspection plan:', err);
        setError('Could not load the inspection plan. Is the prediction backend running?');
      }
    };

    fetchPlan();
  }, []);

  return (
    <>
      <nav className="bg-hpcl-blue-700 p-4 text-white">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold">HPCL Asset Health</div>
          <ul className="flex space-x-4">
            <li><Link to="/dashboard" className="hover:text-hpcl-orange-400 text-lg">Home</Link></li>
            {type === 'Manager' && (
              <li><Link to="/inspection-plan" className="hover:text-hpcl-orange-400 text-lg">Inspection Planner</Link></li>
            )}
            <li><Link to="/reports" className="hover:text-hpcl-orange-400 text-lg">Reports</Link></li>
            <li><Link to="/profile" className="hover:text-hpcl-orange-400 text-lg">Profile</Link></li>
            <li><button onClick={logout} className="hover:text-hpcl-orange-400 text-lg">Logout</button></li>
          </ul>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto mt-6 px-4">
        <h2 className="text-2xl font-bold text-hpcl-blue-900 mb-1">Inspection Planner</h2>
        <p className="text-sm text-gray-500 mb-4">
          Inspection intervals below are derived from each asset's predicted RUL and health status,
          rather than walking the whole fleet on one fixed calendar.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded bg-red-100 border border-red-400 text-red-800 text-sm">{error}</div>
        )}

        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4 border-t-4 border-gray-400">
              <div className="text-sm text-gray-500">Fixed-cadence baseline</div>
              <div className="text-2xl font-bold text-hpcl-blue-900">{summary.baseline_inspections_per_year}/yr</div>
              <div className="text-xs text-gray-400">every asset every {summary.baseline_interval_days} days</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-t-4 border-hpcl-orange">
              <div className="text-sm text-gray-500">Risk-based optimized</div>
              <div className="text-2xl font-bold text-hpcl-blue-900">{summary.optimized_inspections_per_year}/yr</div>
              <div className="text-xs text-gray-400">interval scaled to RUL &amp; status</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-t-4 border-green-500">
              <div className="text-sm text-gray-500">Inspection load reduction</div>
              <div className="text-2xl font-bold text-green-600">{summary.pct_reduction}%</div>
              <div className="text-xs text-gray-400">vs. fixed-cadence baseline</div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-hpcl-blue-700 text-white">
              <tr>
                <th className="text-left px-4 py-2">Asset</th>
                <th className="text-left px-4 py-2">Type</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-left px-4 py-2">Health</th>
                <th className="text-left px-4 py-2">RUL (days)</th>
                <th className="text-left px-4 py-2">Recommended interval</th>
                <th className="text-left px-4 py-2">Next inspection due</th>
                <th className="text-left px-4 py-2">Likely mechanism</th>
              </tr>
            </thead>
            <tbody>
              {plan.map((a) => (
                <tr key={a.asset_id} className="border-t border-gray-100">
                  <td className="px-4 py-2 font-semibold text-hpcl-blue-900">{a.asset_id}</td>
                  <td className="px-4 py-2 text-gray-600">{a.asset_type}</td>
                  <td className="px-4 py-2">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusBadgeClasses(a.status)}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">{a.health_score}%</td>
                  <td className="px-4 py-2">{a.rul}</td>
                  <td className="px-4 py-2">every {a.recommended_interval_days} days</td>
                  <td className="px-4 py-2">{a.next_inspection_date}</td>
                  <td className="px-4 py-2 text-gray-500">{a.damage_mechanism}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default InspectionPlanner;
