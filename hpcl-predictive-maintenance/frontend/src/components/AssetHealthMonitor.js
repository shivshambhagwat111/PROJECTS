import React, { useEffect, useRef, useState } from 'react';
import { Line } from 'react-chartjs-2';

import 'chart.js/auto'
import axios from 'axios';

const AssetHealthMonitor = () => {

  const [sensordata, setSensordata] = useState({});
  const [sensorLabels, setSensorLabels] = useState([]);
  const [sensorValues, setSensorValues] = useState([]);

  const [assetId, setAssetId] = useState('');
  const [assetType, setAssetType] = useState('');
  const [healthScore, setHealthScore] = useState(0);
  const [rul, setRul] = useState(0);
  const [hlabels, setHlabels] = useState([]);
  const [xaxis, setXaxis] = useState([]);
  const [alertActive, setAlertActive] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [damageMechanism, setDamageMechanism] = useState('');
  const [api571Ref, setApi571Ref] = useState('');
  const [mechanismDescription, setMechanismDescription] = useState('');

  // Health score below this threshold is considered dangerous
  const threshold = 40;

  // Tracks which asset the trend chart currently belongs to. The /predict
  // feed walks a single shared time pointer across every asset in the
  // fleet, so every few minutes it rolls off one asset's end-of-life data
  // straight into the next asset's fresh start. Without this, the trend
  // line would silently splice two unrelated assets together and show a
  // misleading jump back up to a high health score.
  const currentAssetRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {

      try {
        // Make the GET request
        const response = await axios.get('http://localhost:5000/predict');
        const data = response.data;

        const assetChanged = currentAssetRef.current !== null && currentAssetRef.current !== data.asset_id;
        currentAssetRef.current = data.asset_id;

        setAssetId(data.asset_id);
        setAssetType(data.asset_type);

        setXaxis(prevXaxis => assetChanged ? [data.time] : [...prevXaxis, data.time]);

        const new_data = data.s_data || {};
        setSensordata(new_data);
        setSensorLabels(Object.keys(new_data));
        setSensorValues(Object.values(new_data));

        setHlabels(prevHlabels => assetChanged ? [data.health_score] : [...prevHlabels, data.health_score]);

        setHealthScore(data.health_score);
        setRul(data.rul);
        setDamageMechanism(data.damage_mechanism || '');
        setApi571Ref(data.api571_ref || '');
        setMechanismDescription(data.mechanism_description || '');

        if (data.alert) {
          setAlertActive(true);
          setAlertMessage(data.message || 'Critical asset condition detected. Schedule maintenance immediately.');
        } else {
          setAlertActive(false);
          setAlertMessage('');
        }

      } catch (error) {
        // Handle errors
        console.error('Error fetching data:', error);
      }
    };

    // Call fetchData initially
    fetchData();

    // Set up the interval to call fetchData every 1 second
    const intervalId = setInterval(fetchData, 1000);

    // Clean up the interval to prevent memory leaks
    return () => clearInterval(intervalId);
  }, []);

  const data = {
    labels: sensorLabels,
    datasets: [
      {
        label: 'Sensor data',
        data: sensorValues,
        backgroundColor: 'rgba(247, 148, 29, 0.2)',
        borderColor: '#003DA5',
        borderWidth: 4,
        lineTension: 0.4,
      },

    ],
  };

  const latestHealthScore = hlabels.length > 0 ? hlabels[hlabels.length - 1] : healthScore;
  const trendColor = latestHealthScore < threshold ? 'red' : 'green';

  const data1 = {
    labels: xaxis,
    datasets: [
      {
        label: 'Health Score',
        data: hlabels,
        backgroundColor: 'rgba(247, 148, 29, 0.2)',
        borderColor: trendColor,
        borderWidth: 4,
        lineTension: 0.4,
      },


    ],
  };


  const options = {
    annotations: {
      line1: {
        type: 'line',
        mode: 'horizontal',
        scaleID: 'y-axis-0',
        value: threshold, // Y-coordinate where the line will be drawn
        borderColor: 'red', // Color of the line
        borderWidth: 2 // Width of the line
      }
    },
    maintainAspectRatio: false, // Prevent the chart from maintaining aspect ratio
     // Set the maximum width of the chart
    responsive: true ,// Allow the chart to be responsive
    title: {
      display: true,
      text: 'Live updation of data',
    },
    scales: {
      yAxes: [{
        ticks: {
          beginAtZero: true // Start the y-axis from zero
        },
        gridLines: {
          color: (context) => {
            // Change the grid line color for a specific value (e.g., threshold)
            return context.tick.value === threshold ? 'red' : 'rgba(0, 0, 0, 0.1)';
          }
        }
      }]
    }
  };

  const healthOptions = {
    ...options,
    scales: {
      yAxes: [{
        ticks: {
          beginAtZero: true,
          max: 100,
        },
        gridLines: {
          color: (context) => {
            return context.tick.value === threshold ? 'red' : 'rgba(0, 0, 0, 0.1)';
          }
        }
      }]
    }
  };

  const containerStyle = {
    minWidth: '700px' ,// Adjust the max width as needed
    minHeight: '560px' ,// Adjust the max height as needed
  };

  return (
    <>
      <div className="text-center mt-6">
        <div className="text-2xl font-bold text-hpcl-blue-900">
          Live Feed &mdash; {assetId || '—'} {assetType && `(${assetType})`}
        </div>
      </div>

      {alertActive && (
        <div className="max-w-4xl mx-auto mt-4 p-4 rounded-lg bg-red-100 border-2 border-hpcl-orange text-red-800 font-semibold text-center">
          {alertMessage}
        </div>
      )}

      <div className="flex justify-center items-center flex-wrap gap-4 mt-4">
        <div className="flex flex-col items-center bg-white rounded shadow px-6 py-3">
          <span className="text-sm text-gray-500">Health Score</span>
          <span className={`text-3xl font-bold ${healthScore < threshold ? 'text-red-600' : 'text-green-600'}`}>{healthScore}%</span>
        </div>
        <div className="flex flex-col items-center bg-white rounded shadow px-6 py-3">
          <span className="text-sm text-gray-500">Remaining Useful Life</span>
          <span className="text-3xl font-bold text-hpcl-blue-900">{rul} days</span>
        </div>
      </div>

      {damageMechanism && (
        <div className="max-w-2xl mx-auto mt-4 p-4 rounded-lg bg-white shadow border-l-4 border-hpcl-blue-700">
          <div className="text-xs uppercase tracking-wide text-gray-400">Likely Damage Mechanism</div>
          <div className="text-lg font-bold text-hpcl-blue-900">{damageMechanism} <span className="text-sm font-normal text-gray-400">({api571Ref})</span></div>
          <p className="text-sm text-gray-600 mt-1">{mechanismDescription}</p>
        </div>
      )}

      <div className="flex justify-center items-center">

        <div className="flex justify-between items-center flex-col mt-4 " >
          <div className="font-bold text-3xl text-center">Live sensor data</div>
          <div className="p-2 bg-white rounded shadow " style={containerStyle} >
            <Line data={data} options={options} />
          </div>
        </div>

        <div className="flex justify-center items-center flex-col mt-4" >
          <div className="font-bold text-3xl text-center">Health Score Trend</div>
          <div className="p-2 bg-white rounded shadow" style={containerStyle}>
            <Line data={data1} options={healthOptions} ticks={[0, 25, 50, 75, 100]}/>

          </div>
           <div className='text-3xl font-bold'>Health Score: {healthScore}% &middot; RUL: {rul} days</div>


        </div>
      </div>
    </>
  );

}

export default AssetHealthMonitor;
