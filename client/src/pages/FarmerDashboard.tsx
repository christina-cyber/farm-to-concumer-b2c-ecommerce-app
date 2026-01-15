import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const FarmerDashboard: React.FC = () => {
    const { logout } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [newProduct, setNewProduct] = useState({ name: '', category: 'Vegetables', pricePerKg: '', stockKg: '', harvestDate: new Date().toISOString().split('T')[0] });

    useEffect(() => {
        api.get('/farmer/stats').then(res => setStats(res.data));
        api.get('/products/my-products').then(res => setProducts(res.data));
    }, []);

    const addProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/products', newProduct);
            const res = await api.get('/products/my-products');
            setProducts(res.data);
            alert('Product added');
        } catch (e) {
            alert('Failed to add product');
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Farmer Dashboard</h1>
                <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded">Logout</button>
            </div>

            {stats && (
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-green-100 p-4 rounded text-center">
                        <h3 className="text-lg">Earnings</h3>
                        <p className="text-2xl font-bold">Rs. {stats.totalEarnings}</p>
                    </div>
                    <div className="bg-blue-100 p-4 rounded text-center">
                        <h3 className="text-lg">Orders</h3>
                        <p className="text-2xl font-bold">{stats.totalOrders}</p>
                    </div>
                    <div className="bg-yellow-100 p-4 rounded text-center">
                        <h3 className="text-lg">Active Products</h3>
                        <p className="text-2xl font-bold">{stats.activeProducts}</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h2 className="text-xl font-bold mb-4">Add Product</h2>
                    <form onSubmit={addProduct} className="space-y-4">
                        <input className="border p-2 w-full rounded" placeholder="Name" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} />
                        <input className="border p-2 w-full rounded" placeholder="Price/Kg" type="number" value={newProduct.pricePerKg} onChange={e => setNewProduct({ ...newProduct, pricePerKg: e.target.value })} />
                        <input className="border p-2 w-full rounded" placeholder="Stock (Kg)" type="number" value={newProduct.stockKg} onChange={e => setNewProduct({ ...newProduct, stockKg: e.target.value })} />
                        <button className="bg-green-600 text-white px-4 py-2 rounded w-full">Add Product</button>
                    </form>
                </div>
                <div>
                    <h2 className="text-xl font-bold mb-4">My Products</h2>
                    <div className="space-y-4">
                        {products.map(p => (
                            <div key={p.id} className="border p-4 rounded flex justify-between">
                                <div>
                                    <h3 className="font-bold">{p.name}</h3>
                                    <p className="text-sm text-gray-600">Rs. {p.pricePerKg}/kg | Stock: {p.stockKg}kg</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FarmerDashboard;
