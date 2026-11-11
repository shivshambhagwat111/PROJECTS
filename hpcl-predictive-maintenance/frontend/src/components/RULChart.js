import React,{useEffect,useState} from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto'
import axios from 'axios';
import correlation from '../images/correlation_heatmap.png'

const RULChart = () => {

  const [sensordata, setSensordata] = useState({});
  const [sensorLabels, setSensorLabels] = useState([]);
  const [sensorValues, setSensorValues] = useState([]);

  const [assetId, setAssetId] = useState('');
  const [assetType, setAssetType] = useState('');
  const [healthScore, setHealthScore] = useState(0);
  const [rul, setRul] = useState(0);



  useEffect(() => {
    const fetchData = async () => {
      try {
        // Make the GET request
        const response = await axios.get('http://localhost:5000/predict');
        const data = response.data;
        const new_data = data.s_data || {};
        console.log("new data is: ",new_data)
        setSensordata(new_data);
        setSensorLabels(Object.keys(new_data));
        setSensorValues(Object.values(new_data));
        setAssetId(data.asset_id);
        setAssetType(data.asset_type);
        setRul(data.rul);
        setHealthScore(data.health_score);
        console.log(response.data);
      } catch (error) {
        // Handle errors
        console.error('Error fetching data:', error);
      }
    };

    // Call fetchData initially
    fetchData();

    // Set up the interval to call fetchData every 10 seconds
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
        borderColor: '#F7941D',
        borderWidth: 1,
        lineTension: 0.4,
      },

    ],
  };

  const options = {
    title: {
      display: true,
      text: 'Live updation of data',
    },
    scales: {
      yAxes: [
        {
          ticks: {
            beginAtZero: true,
          },
        },
      ],
    },
  };
  return (
    <>
      <div className="flex justify-center items-center flex-col mt-4" >
        <div className="font-bold text-2xl text-center text-hpcl-blue-900">
          {assetId || '—'} {assetType && `(${assetType})`}
        </div>
        <div className="p-2 bg-white rounded shadow" style={{ height: '550px', width: '700px' }}>
          <Line data={data} options={options} />
        </div>
        <div className='text-3xl font-bold'>Predicted Remaining Useful Life (RUL): {rul} days &middot; Health Score: {healthScore}%</div>
        {/* <div>The s_data is: {sensordata}</div> */}
      </div>

    </>
  );

}

export default RULChart;
