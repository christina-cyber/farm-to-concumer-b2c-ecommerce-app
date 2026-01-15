import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/login', { email, password });
            login(res.data.accessToken, res.data.refreshToken);
            navigate('/');
        } catch (error) {
            alert('Login failed');
        }
    };

    return (
        <div className="flex justify-center items-center h-screen bg-gray-100">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-96">
                <h2 className="text-2xl mb-4 text-center">Login</h2>
                <input
                    className="w-full p-2 mb-4 border rounded"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                />
                <input
                    className="w-full p-2 mb-4 border rounded"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                />
                <button className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600">Login</button>
                <div className="mt-4 text-center">
                    <Link to="/register" className="text-blue-500">Create Account</Link>
                </div>
            </form>
        </div>
    );
};

export default Login;
