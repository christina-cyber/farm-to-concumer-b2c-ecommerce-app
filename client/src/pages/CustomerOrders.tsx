import React, { useEffect, useState } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';

const CustomerOrders: React.FC = () => {
    const [orders, setOrders] = useState<any[]>([]);

    useEffect(() => {
        api.get('/customer/my-orders').then(res => setOrders(res.data));
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
                    <Link to="/market" className="text-emerald-600 font-bold hover:underline">Back to Market</Link>
                </div>

                <div className="space-y-4">
                    {orders.map(order => (
                        <div key={order.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-lg">Order #{order.id}</h3>
                                <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                                <p className="mt-1 font-medium">Rs. {order.totalAmount}</p>
                            </div>
                            <div className="text-right">
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 ${order.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-700' :
                                    order.status === 'PENDING' ? 'bg-gray-100 text-gray-600' :
                                        'bg-blue-100 text-blue-700'
                                    }`}>
                                    {order.status}
                                </span>
                                {(order.status === 'ACCEPTED' || order.status === 'PICKED' || order.status === 'DELIVERED') && (
                                    <div className="mt-1">
                                        <Link to={`/track/${order.id}`} className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-emerald-600 transition">
                                            Track Order
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CustomerOrders;
