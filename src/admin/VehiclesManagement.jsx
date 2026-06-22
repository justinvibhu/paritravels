import React, { useState, useEffect } from "react";
import { getVehicles, addVehicle, updateVehicle, deleteVehicle } from "../supabase/db";

export default function VehiclesManagement() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);

  const initialFormState = {
    name: "",
    vehicleNumber: "",
    type: "",
    category: "suv",
    capacity: 4,
    price: "",
    origin: "",
    destination: "",
    ac: true,
    status: "active",
    imageUrl: "",
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const data = await getVehicles();
      setVehicles(data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching vehicles:", err);
      setError("Failed to fetch vehicles.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setEditingId(null);
    setImageFile(null);
    setIsFormOpen(false);
  };

  const handleEdit = (vehicle) => {
    setFormData({
      name: vehicle.name || "",
      vehicleNumber: vehicle.vehicleNumber || vehicle.vehicle_number || "",
      type: vehicle.type || "",
      category: vehicle.category || "suv",
      capacity: vehicle.capacity || 4,
      price: vehicle.price || vehicle.pricePerDay || "",
      origin: vehicle.origin || "",
      destination: vehicle.destination || "",
      ac: vehicle.ac !== undefined ? vehicle.ac : true,
      status: vehicle.status || "active",
      imageUrl: vehicle.imageUrl || vehicle.image_url,
    });
    setEditingId(vehicle.id);
    setImageFile(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this vehicle? This will also remove its image.")) {
      try {
        await deleteVehicle(id);
        setVehicles(vehicles.filter((v) => v.id !== id));
      } catch (err) {
        console.error("Error deleting vehicle:", err);
        alert("Failed to delete vehicle.");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        capacity: Number(formData.capacity),
        origin: formData.origin,
        destination: formData.destination,
      };

      if (editingId) {
        await updateVehicle(editingId, payload, imageFile);
      } else {
        await addVehicle(payload, imageFile);
      }

      await fetchVehicles();
      resetForm();
    } catch (err) {
      console.error("Error saving vehicle:", err);
      alert("Failed to save vehicle.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-gray-600">Loading vehicles...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Fleet Management</h1>
        <button onClick={() => { resetForm(); setIsFormOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-sm transition">
          + Add Vehicle
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h2 className="text-xl font-semibold mb-4">{editingId ? "Edit Vehicle" : "Add New Vehicle"}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Name</label><input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="w-full border border-gray-300 rounded-md p-2" placeholder="e.g., Toyota Innova" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label><input type="text" name="vehicleNumber" value={formData.vehicleNumber} onChange={handleInputChange} required className="w-full border border-gray-300 rounded-md p-2" placeholder="e.g., MH12AB1234" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Type / Subtitle</label><input type="text" name="type" value={formData.type} onChange={handleInputChange} required className="w-full border border-gray-300 rounded-md p-2" placeholder="e.g., 6 Seater SUV" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Category</label><select name="category" value={formData.category} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md p-2 bg-white"><option value="sedan">Sedan</option><option value="suv">SUV</option><option value="tempo">Tempo Traveller</option><option value="bus">Bus</option></select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Capacity (Seats)</label><input type="number" name="capacity" value={formData.capacity} onChange={handleInputChange} required min="1" className="w-full border border-gray-300 rounded-md p-2" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Price Per Day (₹)</label><input type="number" name="price" value={formData.price} onChange={handleInputChange} required min="0" className="w-full border border-gray-300 rounded-md p-2" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Origin</label><input type="text" name="origin" value={formData.origin} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md p-2" placeholder="e.g., Mumbai" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Destination</label><input type="text" name="destination" value={formData.destination} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md p-2" placeholder="e.g., Pune" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select name="status" value={formData.status} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md p-2 bg-white"><option value="active">Active</option><option value="inactive">Inactive</option><option value="maintenance">Maintenance</option></select></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Image</label><input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />{editingId && formData.imageUrl && !imageFile && <p className="text-xs text-gray-500 mt-1">Leave empty to keep current image.</p>}</div>
            <div className="md:col-span-2 flex items-center mt-2"><input type="checkbox" name="ac" checked={formData.ac} onChange={handleInputChange} id="vehicle-ac" className="h-4 w-4 text-blue-600 border-gray-300 rounded" /><label htmlFor="vehicle-ac" className="ml-2 block text-sm text-gray-900">Air Conditioned (AC)</label></div>
            <div className="md:col-span-2 flex justify-end space-x-3 pt-4 border-t">
              <button type="button" onClick={resetForm} className="px-4 py-2 text-gray-600 border rounded-md hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50">{isSubmitting ? "Saving..." : "Save Vehicle"}</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price/Day</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {vehicles.map((v) => (
              <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap flex items-center gap-3">
                  <img src={v.imageUrl || v.image_url || "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=100&h=100&fit=crop"} alt={v.name} className="w-12 h-12 rounded-lg object-cover bg-gray-100 border" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{v.name}</div>
                    <div className="text-sm text-gray-500">{v.type} • {v.capacity} Seats {v.ac ? "• AC" : ""}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{v.origin ? `${v.origin} → ${v.destination || 'Unknown'}` : 'Route not set'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{v.category}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">₹{v.price || v.pricePerDay || 0}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${v.status === 'active' ? 'bg-green-100 text-green-800' : v.status === 'maintenance' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'}`}>{v.status || "Active"}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleEdit(v)} className="text-blue-600 hover:text-blue-900 mr-4">Edit</button>
                  <button onClick={() => handleDelete(v.id)} className="text-red-600 hover:text-red-900">Delete</button>
                </td>
              </tr>
            ))}
            {vehicles.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No vehicles found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}