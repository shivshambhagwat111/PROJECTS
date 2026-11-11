import React from 'react';
import { Link } from "react-router-dom";
const LandingPage = () => {
  return (
    <div className="bg-gray-100 font-sans">

      {/* Navigation */}
      <nav className="bg-hpcl-blue-700 p-4 text-white w-full">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold">HPCL Asset Health</div>
          <ul className="flex space-x-4">
            <li><Link to="/" className="hover:text-hpcl-orange-400">Home</Link></li>
            <li><Link to="/login" className="hover:text-hpcl-orange-400">Sign In </Link></li>
            <li><Link to="/register" className="hover:text-hpcl-orange-400">Register</Link></li>
          </ul>
        </div>
      </nav>


      <div className="bg-hpcl-blue-900 text-white text-center p-6 ">
  <h1 className="text-4xl font-bold mb-4">Predictive Health Monitoring for Refinery Assets</h1>
  <p className="text-xl mb-8">Utilize AI to prevent unplanned shutdowns and optimize maintenance schedules across pumps, compressors, heat exchangers, storage tanks and pipelines.</p>
  <button className="bg-hpcl-orange text-white font-bold py-2 px-4 rounded hover:bg-hpcl-orange-700"><Link to="/register" className="hover:text-gray-100">Get Started</Link></button>
</div>
<div className="py-12">
  <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
    {/* Feature 1 */}
    <div className="text-center bg-white p-6 max-w-sm mx-auto rounded-lg shadow-md border-t-4 border-hpcl-orange">
      <h2 className="font-bold text-lg text-hpcl-blue-900">Real-Time Asset Monitoring</h2>
      <p>Track live sensor data from pumps, compressors, heat exchangers, storage tanks and pipeline segments to detect issues before they escalate.</p>
    </div>
    {/* Feature 2 */}
    <div className="text-center bg-white p-6 max-w-sm mx-auto rounded-lg shadow-md border-t-4 border-hpcl-orange">
      <h2 className="font-bold text-lg text-hpcl-blue-900">Predictive Health Scoring</h2>
      <p>Our ML models compute a live health score and Remaining Useful Life (RUL) for every asset, so failures can be anticipated ahead of time.</p>
    </div>
    {/* Feature 3 */}
    <div className="text-center bg-white p-6 max-w-sm mx-auto rounded-lg shadow-md border-t-4 border-hpcl-orange">
      <h2 className="font-bold text-lg text-hpcl-blue-900">Reduced Unplanned Shutdowns</h2>
      <p>Catch critical asset degradation early to cut maintenance costs, avoid unplanned refinery downtime, and improve plant safety.</p>
    </div>
  </div>
</div>
<div className="py-6 bg-gray-100">
  <div className="max-w-4xl mx-auto">
    <h2 className="text-center font-bold text-2xl mb-4 text-hpcl-blue-900">The Power of AI in Refinery Maintenance</h2>
    <p>
      By harnessing AI and predictive modeling, our app analyzes live sensor data from refinery assets such as pumps, compressors, heat exchangers, storage tanks and pipeline segments to forecast potential failures. This proactive approach helps schedule maintenance just in time, extending asset life and minimizing unplanned downtime.
    </p>
  </div>
</div>





      {/* Footer */}
      <footer className="bg-hpcl-blue-900 text-white text-center py-2 fixed bottom-0 left-0 w-full">
        <p>&copy; 2026 HPCL Asset Health Prediction System. All rights reserved.</p>
      </footer>

    </div>
  );
};

export default LandingPage;
