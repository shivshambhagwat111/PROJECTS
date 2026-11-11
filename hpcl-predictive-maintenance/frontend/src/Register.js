import React from 'react'
import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [type,setType]=useState('');
    const navigate = useNavigate();

    const handleEmailChange = (e) => {
        setEmail(e.target.value);
    };

    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
    };
    const handleType=(e)=>{
      setType(e.target.value);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Make a POST request to the /register API endpoint
        try {
            const response = await fetch('http://localhost:8000/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password,
                    type:type
                }),
            });

            if (response.ok) {
                const data = await response.json();

                // Save the token (assuming the token is returned in the response)
                const token = data.token;

                // Save the token in local storage or state as needed
                localStorage.setItem('token', token);
                localStorage.setItem("email",email);
                localStorage.setItem("type",type);
                // Redirect to the Dashboard component
                navigate("/dashboard");
                console.log('Registration successful!');
                // You can handle success actions here, e.g., redirect the user to another page
            } else {
                console.error('Registration failed.');
                // Handle failure, show an error message, etc.
            }
        } catch (error) {
            console.error('Error during registration:', error);
        }
    };

    return (
        <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <svg
            className="mx-auto h-20 w-auto"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Asset health gauge icon"
          >
            <circle cx="50" cy="50" r="45" fill="#E6EBF7" stroke="#003DA5" strokeWidth="5" />
            <path
              d="M20 65 A35 35 0 0 1 80 65"
              fill="none"
              stroke="#F7941D"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <line x1="50" y1="50" x2="68" y2="28" stroke="#003DA5" strokeWidth="4" strokeLinecap="round" />
            <circle cx="50" cy="50" r="5" fill="#F7941D" />
          </svg>
          <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
            Register your account
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <form className="space-y-6" action="#" method="POST">
            <div>
              <label htmlFor="email" className="block text-md font-bold  leading-6 text-gray-900">
                Email address
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={handleEmailChange}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-hpcl-blue-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-md font-bold leading-6 text-gray-900">
                  Password
                </label>
                
              </div>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={handlePasswordChange}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-hpcl-blue-600 sm:text-sm sm:leading-6"
                />
              </div>
              
            </div>
            
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="type" className="block text-md font-bold leading-6 text-gray-900">
                  Type
                </label>
                
              </div>
              <div className="mt-2">
                <input
                  id="type"
                  name="Type"
                  type="text"
                  autoComplete="current-password"
                  required
                  value={type}
                  onChange={handleType}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-hpcl-blue-600 sm:text-sm sm:leading-6"
                />
              </div>
              
            </div>

            

            <div>
              <button
                
                className="flex w-full justify-center rounded-md bg-hpcl-orange px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-hpcl-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hpcl-orange"
                onClick={handleSubmit}
              >
                Register
              </button>
            </div>
          </form>

          <p className="mt-10 text-center text-sm text-gray-500">
            Already a member?{' '}
            <div className="font-semibold leading-6 text-hpcl-blue-600 hover:text-hpcl-blue-900">
            <Link to="/login">Log in</Link>
            </div>
          </p>
        </div>
      </div>
    );
}

export default Register