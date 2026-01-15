import React, { useState } from 'react';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register: React.FC = () => {
    const [role, setRole] = useState('CUSTOMER');
    const [formData, setFormData] = useState({
        email: '', password: '', farmName: '', address: '', vehicleType: '', latitude: 27.7172, longitude: 85.3240
    });
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload: any = { ...formData, role };
            // Clean up payload based on role
            if (role === 'CUSTOMER') {
                delete payload.farmName; delete payload.address; delete payload.vehicleType;
            }

            const res = await api.post('/auth/register', payload);
            login(res.data.accessToken, res.data.refreshToken);
            navigate('/');
        } catch (error) {
            alert('Registration failed');
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100 py-10">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-96">
                <h2 className="text-2xl mb-4 text-center">Register</h2>

                <label className="block mb-2">Role</label>
                <select value={role} onChange={e => setRole(e.target.value)} className="w-full p-2 mb-4 border rounded">
                    <option value="CUSTOMER">Customer</option>
                    <option value="FARMER">Farmer</option>
                    <option value="DELIVERY_PARTNER">Delivery Partner</option>
                </select>

                <input name="email" className="w-full p-2 mb-4 border rounded" placeholder="Email" onChange={handleChange} />
                <input name="password" type="password" className="w-full p-2 mb-4 border rounded" placeholder="Password" onChange={handleChange} />

                {role === 'FARMER' && (
                    <>
                        <input name="farmName" className="w-full p-2 mb-4 border rounded" placeholder="Farm Name" onChange={handleChange} />
                        <input name="address" className="w-full p-2 mb-4 border rounded" placeholder="Address" onChange={handleChange} />
                    </>
                )}

                {role === 'DELIVERY_PARTNER' && (
                    <input name="vehicleType" className="w-full p-2 mb-4 border rounded" placeholder="Vehicle Type (Bike/Scooter)" onChange={handleChange} />
                )}

                <button className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Sign Up</button>
                <div className="mt-4 text-center">
                    <Link to="/login" className="text-blue-500">Back to Login</Link>
                </div>
            </form>
        </div>
    );
};

export default Register;
