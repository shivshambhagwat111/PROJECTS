import React from 'react'
import { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AssetHealthMonitor from './AssetHealthMonitor.js';

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

const healthBarColor = (score) => {
  if (score >= 70) return 'bg-green-500';
  if (score >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
};

const UserDashboard = () => {

  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true)
  const [assets, setAssets] = useState([])

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("type");
    navigate("/");
  };

  const type = localStorage.getItem("type")

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const response = await axios.get('http://localhost:5000/assets');
        setAssets(response.data.assets || []);
      } catch (error) {
        console.error('Error fetching assets:', error);
      }
    };

    fetchAssets();
  }, []);

  return (
    <>

      <nav className="bg-hpcl-blue-700 p-4 text-white">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold">HPCL Asset Health</div>
          <ul className="flex space-x-4">


            <li><Link to="/dashboard" className="hover:text-hpcl-orange-400 text-lg">Home</Link></li>
            {type == "Manager" && (<li><Link to="/inspection-plan" className='hover:text-hpcl-orange-400 text-lg'>Inspection Planner</Link></li>)}

            <li><Link to="/reports" className='hover:text-hpcl-orange-400 text-lg'>Reports</Link></li>
            <li><Link to="/profile" className="hover:text-hpcl-orange-400 text-lg">Profile</Link></li>

            <li><button onClick={logout} className="hover:text-hpcl-orange-400 text-lg">Logout</button></li>
          </ul>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto mt-6 px-4">
        <h2 className="text-2xl font-bold text-hpcl-blue-900 mb-4">Fleet Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {assets.map((asset) => (
            <div key={asset.asset_id} className="bg-white rounded-lg shadow p-4 border-t-4 border-hpcl-orange">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-lg text-hpcl-blue-900">{asset.asset_id}</div>
                  <div className="text-sm text-gray-500">{asset.asset_type}</div>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusBadgeClasses(asset.status)}`}>
                  {asset.status}
                </span>
              </div>

              <div className="mt-3">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Health Score</span>
                  <span>{asset.health_score}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${healthBarColor(asset.health_score)}`}
                    style={{ width: `${asset.health_score}%` }}
                  ></div>
                </div>
              </div>

              <div className="mt-2 text-sm text-gray-600">RUL: <span className="font-semibold">{asset.rul} days</span></div>

              {asset.damage_mechanism && (
                <div className="mt-3 pt-2 border-t border-gray-100">
                  <div className="text-xs uppercase tracking-wide text-gray-400">Likely Damage Mechanism</div>
                  <div className="text-sm font-medium text-hpcl-blue-900">{asset.damage_mechanism}</div>
                  <div className="text-xs text-gray-400">{asset.api571_ref}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <AssetHealthMonitor/>

    </>
  )
}


export default UserDashboard
