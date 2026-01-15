import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const CustomerMarketplace: React.FC = () => {
    const { logout } = useAuth();
    const [products, setProducts] = useState<any[]>([]);
    const [cart, setCart] = useState<any[]>([]);

    // Mock user location for now
    const userLat = 27.7172;
    const userLong = 85.3240;

    useEffect(() => {
        api.get(`/customer/products?lat=${userLat}&long=${userLong}`).then(res => setProducts(res.data));
    }, []);

    const addToCart = (product: any) => {
        setCart([...cart, { ...product, quantity: 1 }]);
    };

    const placeOrder = async () => {
        if (cart.length === 0) return;

        // Group by farmer (Simplification: assuming one farmer per order for now, or loop)
        // Correct way: loop unique farmers
        const items = cart.map(c => ({ productId: c.id, quantity: 1 }));
        const farmerId = cart[0].farmerId; // Hacky MVP

        try {
            await api.post('/customer/order', { farmerId, items });
            alert('Order Placed!');
            setCart([]);
        } catch (e) {
            alert('Order failed');
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Vegetable Marketplace</h1>
                <div className="flex gap-4 items-center">
                    <span>Cart: {cart.length}</span>
                    <Link to="/orders" className="text-emerald-600 font-bold hover:underline">My Orders</Link>
                    <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded">Logout</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(p => (
                    <div key={p.id} className="border p-4 rounded shadow-sm hover:shadow-md transition">
                        <h3 className="font-bold text-lg">{p.name}</h3>
                        <p className="text-gray-600">Farm: {p.farmer.farmName}</p>
                        <p className="text-green-600 font-bold mt-2">Rs. {p.pricePerKg}/kg</p>
                        <button onClick={() => addToCart(p)} className="mt-4 w-full bg-green-500 text-white py-2 rounded hover:bg-green-600">Add to Cart</button>
                    </div>
                ))}
            </div>

            {cart.length > 0 && (
                <div className="fixed bottom-0 right-0 p-8 w-full md:w-1/3">
                    <div className="bg-white p-6 rounded-t-xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] border-t">
                        <h3 className="text-xl font-bold mb-4">Values</h3>
                        <div className="flex justify-between items-center mb-4">
                            <span>Subtotal:</span>
                            <span>Rs. {cart.reduce((acc, p) => acc + p.pricePerKg * p.quantity, 0)}</span>
                        </div>
                        <button onClick={placeOrder} className="w-full bg-black text-white py-3 rounded text-lg">Checkout</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerMarketplace;
