import React from 'react'
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import heatmap from '../images/top5.png'
import heatmap1 from '../images/correlation_heatmap.png'
import avp from '../images/actual_vs_predicted.png'
import img1 from '../images/box_plot.png'
import img2 from '../images/feature_weights_plot.png'
import img3 from '../images/xgb_importance_plot.png'
const Reports = () => {
    const navigate = useNavigate();
    const logout = () => {
        localStorage.removeItem("token");
localStorage.removeItem("type");
        navigate("/");
    };
    const type=localStorage.getItem("type")
    return (
        <div>
            <nav className="bg-hpcl-blue-700 p-4 text-white">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="text-2xl font-bold">HPCL Asset Health</div>
                    <ul className="flex space-x-4">
                        <li><Link to="/dashboard" className="hover:text-hpcl-orange-400 text-lg">Home</Link></li>
                        {type=="Manager" && (<li><Link to="/inspection-plan" className='hover:text-hpcl-orange-400 text-lg'>Inspection Planner</Link></li>)}
                        <li><Link to="/reports" className='hover:text-hpcl-orange-400 text-lg'>Reports</Link></li>
                        <li><Link to="/profile" className="hover:text-hpcl-orange-400 text-lg">Profile</Link></li>
                        { }
                        <li><button onClick={logout} className="hover:text-hpcl-orange-400 text-lg">Logout</button></li>
                    </ul>
                </div>
            </nav>

            <div className="flex justify-center items-center">
                <div className=''>
                    <div className='text-2xl font-bold text-center'>Effects of Sensor Features on Asset Health Score</div>
                    <img src={img2} alt="heatmap" height="500" width="500" />
                </div>
                <div className='mt-8'>
                    <div className='text-2xl font-bold text-center mt-4'>Feature Importance for Failure Prediction</div>
                    <img src={img3} alt="avp" height="500" width="550" />
                </div>

            </div>
            <div className="flex justify-center items-center">
                <div className='mt-6'>
                    <div className='text-2xl font-bold text-center'>Sensor Correlation Heatmap</div>
                    <img src={heatmap} alt="heatmap" height="500" width="500" />
                </div>

                <div>
                    <div className='text-2xl font-bold text-center'>Sensor Value Distribution (Box Plot)</div>
                    <img src={img1} alt="avp" height="550" width="550" />
                </div>
                
            </div>
        </div>
    )
}

export default Reports