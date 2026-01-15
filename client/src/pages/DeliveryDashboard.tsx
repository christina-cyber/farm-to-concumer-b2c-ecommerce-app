import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const DeliveryDashboard: React.FC = () => {
    const { logout } = useAuth();
    const [orders, setOrders] = useState<any[]>([]);
    const [isAvailable, setIsAvailable] = useState(true);

    // Simulation State
    const [, setLocation] = useState({ lat: 27.7172, long: 85.3240 }); // Start Kathmandu

    useEffect(() => {
        fetchOrders();
    }, []);

    // Simulate Movement if there is an active order
    useEffect(() => {
        const activeOrder = orders.find(o => o.status === 'ACCEPTED' || o.status === 'PICKED');
        if (activeOrder && isAvailable) {
            const interval = setInterval(() => {
                setLocation(prev => {
                    const newLat = prev.lat + (Math.random() - 0.5) * 0.001;
                    const newLong = prev.long + (Math.random() - 0.5) * 0.001;

                    // Send update to backend
                    api.post('/delivery/location', { lat: newLat, long: newLong }).catch(console.error);

                    return { lat: newLat, long: newLong };
                });
            }, 10000); // Every 10s
            return () => clearInterval(interval);
        }
    }, [orders, isAvailable]);

    const fetchOrders = () => {
        api.get('/delivery/my-deliveries').then(res => setOrders(res.data));
    };

    const toggleStatus = async () => {
        try {
            await api.patch('/delivery/availability', { isAvailable: !isAvailable });
            setIsAvailable(!isAvailable);
        } catch (e) {
            console.error(e);
        }
    };

    const updateOrder = async (orderId: number, status: string) => {
        try {
            await api.patch(`/delivery/order/${orderId}`, { status });
            fetchOrders();
        } catch (e) {
            alert('Failed to update status');
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Delivery Console</h1>
                <div className="flex gap-4">
                    <button
                        onClick={toggleStatus}
                        className={`px-4 py-2 rounded text-white ${isAvailable ? 'bg-green-500' : 'bg-gray-500'}`}
                    >
                        {isAvailable ? 'You are Online' : 'You are Offline'}
                    </button>
                    <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded">Logout</button>
                </div>
            </div>

            <div className="space-y-4">
                {orders.map(order => (
                    <div key={order.id} className="border p-6 rounded shadow flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-lg">Order #{order.id}</h3>
                            <p className="text-sm">From: {order.farmer.farmName}</p>
                            <p className="text-sm">To: Customer #{order.customerId}</p>
                            <div className="mt-2">
                                <span className="bg-gray-100 px-2 py-1 rounded text-sm font-bold">{order.status}</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            {order.status === 'ACCEPTED' && (
                                <button onClick={() => updateOrder(order.id, 'PICKED')} className="bg-blue-500 text-white px-4 py-2 rounded">Mark Picked</button>
                            )}
                            {order.status === 'PICKED' && (
                                <button onClick={() => updateOrder(order.id, 'DELIVERED')} className="bg-green-500 text-white px-4 py-2 rounded">Mark Delivered</button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DeliveryDashboard;
