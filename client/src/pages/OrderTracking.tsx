import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../api';
import L from 'leaflet';

// Fix Leaflet marker icon issue in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons
const deliveryIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/713/713311.png',
    iconSize: [40, 40],
    iconAnchor: [20, 20]
});

const homeIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/25/25694.png',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
});

const OrderTracking: React.FC = () => {
    const { orderId } = useParams();
    const [trackingData, setTrackingData] = useState<any>(null);
    const [error, setError] = useState('');

    const fetchTracking = async () => {
        try {
            const res = await api.get(`/tracking/${orderId}`);
            setTrackingData(res.data);
        } catch (e) {
            setError('Failed to load tracking data');
        }
    };

    useEffect(() => {
        fetchTracking();
        const interval = setInterval(fetchTracking, 15000); // Poll every 15s
        return () => clearInterval(interval);
    }, [orderId]);

    if (error) return <div className="p-8 text-red-500 text-center">{error}</div>;
    if (!trackingData) return <div className="p-8 text-center">Loading live location...</div>;

    const { status, currentLocation, partner } = trackingData;
    const position: [number, number] | null = currentLocation?.lat && currentLocation?.lng
        ? [currentLocation.lat, currentLocation.lng]
        : null;

    // Default center (Kathmandu) if no position
    const center: [number, number] = position || [27.7172, 85.3240];

    return (
        <div className="h-screen flex flex-col">
            <div className="bg-white p-4 shadow-md z-10 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Order #{orderId} Tracking</h2>
                    <p className="text-sm text-gray-500">Status: <span className="font-bold text-emerald-600">{status}</span></p>
                </div>
                {partner && (
                    <div className="text-right">
                        <p className="font-bold">{partner.vehicle} Delivery</p>
                        <p className="text-xs text-gray-500">Partner: {partner.name}</p>
                    </div>
                )}
            </div>

            <div className="flex-1 relative">
                <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {position && (
                        <Marker position={position} icon={deliveryIcon}>
                            <Popup>
                                Delivery Partner <br />
                                Updated: {new Date(currentLocation.updatedAt).toLocaleTimeString()}
                            </Popup>
                        </Marker>
                    )}
                    {/* Assuming User is at fixed Kathmandu loc for MVP */}
                    <Marker position={[27.7172, 85.3240]} icon={homeIcon}>
                        <Popup>You (Customer)</Popup>
                    </Marker>
                </MapContainer>

                {status === 'DELIVERED' && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
                        <div className="bg-white p-8 rounded-2xl text-center shadow-2xl">
                            <h2 className="text-3xl font-bold text-emerald-600 mb-2">Order Delivered!</h2>
                            <p className="text-gray-600">Enjoy your fresh vegetables.</p>
                            <a href="/market" className="mt-6 inline-block bg-gray-900 text-white px-6 py-2 rounded-lg">Back to Market</a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderTracking;
