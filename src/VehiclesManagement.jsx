import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase/client";

const API_URL = import.meta.env.VITE_API_URL || '/api';

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
    type: "Car",
    capacity: 4,
    pricePerDay: "",
    origin: "",
    destination: "",
    status: "active",
    imageUrl: "",
    category: "suv",
    ac: true,
    features: "AC, GPS, Music System",
    rating: 5.0,
    reviews: 0,
  };

  const [formData, setFormData] = useState(initialFormState);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/vehicles`);
      if (!response.ok) {
        throw new Error("Failed to fetch vehicles");
      }
      const data = await response.json();
      setVehicles(data);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching vehicles:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setImageFile(null);
    setEditingId(null);
    setIsFormOpen(false);
  };

  const handleEdit = (vehicle) => {
    setFormData({
      name: vehicle.name || "",
      type: vehicle.type || "Car",
      capacity: vehicle.capacity || 4,
      pricePerDay: vehicle.pricePerDay || "",
      origin: vehicle.origin || "",
      destination: vehicle.destination || "",
      status: vehicle.status || "active",
      imageUrl: vehicle.imageUrl || "",
      category: vehicle.category || "suv",
      ac: vehicle.ac !== false,
      features: Array.isArray(vehicle.features) ? vehicle.features.join(", ") : (vehicle.features || ""),
      rating: vehicle.rating || 5.0,
      reviews: vehicle.reviews || 0,
    });
    setEditingId(vehicle.id);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this vehicle?")) {
      try {
        const response = await fetch(`${API_URL}/vehicles/${id}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          throw new Error("Failed to delete vehicle");
        }
        fetchVehicles(); // Refetch vehicles list
      } catch (err) {
        console.error("Error deleting vehicle:", err);
        alert(`Failed to delete vehicle: ${err.message}`);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let uploadedImageUrl = formData.imageUrl;

      // Upload new image to Supabase if selected
      if (imageFile) {
        const fileName = `${Date.now()}_${imageFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("vehicle-images") // NOTE: Assumes a 'vehicle-images' bucket in Supabase.
          .upload(fileName, imageFile);

        if (uploadError) {
          throw uploadError;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("vehicle-images").getPublicUrl(fileName);

        if (publicUrl) {
          uploadedImageUrl = publicUrl;
        }
      }

      const payload = {
        ...formData,
        capacity: Number(formData.capacity),
        pricePerDay: Number(formData.pricePerDay),
        origin: formData.origin,
        destination: formData.destination,
        imageUrl: uploadedImageUrl,
        ac: String(formData.ac) === "true",
        features: typeof formData.features === 'string' ? formData.features.split(',').map(f => f.trim()).filter(Boolean) : formData.features,
        rating: Number(formData.rating),
        reviews: Number(formData.reviews),
      };

      const url = editingId
        ? `${API_URL}/vehicles/${editingId}`
        : `${API_URL}/vehicles`;
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.error) errorMessage = errorData.error;
        } catch (parseError) {
          // Fallback if the server returned HTML (like a crash page) instead of JSON
        }
        throw new Error(errorMessage);
      }

      resetForm();
      fetchVehicles(); // Refetch to show the new/updated item
    } catch (err) {
      console.error("Error saving vehicle:", err);
      alert(`Failed to save vehicle: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-gray-600">Loading vehicles...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">Error: {error.toString()}</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Vehicles Management</h1>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-sm transition"
        >
          + Add Vehicle
        </button>
      </div>

      {/* Modal / Inline Form */}
      {isFormOpen && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h2 className="text-xl font-semibold mb-4">{editingId ? "Edit Vehicle" : "Add New Vehicle"}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Car">Car</option>
                <option value="Bus">Bus</option>
                <option value="Van">Van</option>
                <option value="SUV">SUV</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (Persons)</label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price Per Day ($)</label>
              <input
                type="number"
                name="pricePerDay"
                value={formData.pricePerDay}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Origin</label>
              <input
                type="text"
                name="origin"
                value={formData.origin}
                onChange={handleInputChange}
                placeholder="Enter departure city or route"
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
              <input
                type="text"
                name="destination"
                value={formData.destination}
                onChange={handleInputChange}
                placeholder="Enter arrival city or route"
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="suv">SUV</option>
                <option value="sedan">Sedan</option>
                <option value="hatchback">Hatchback</option>
                <option value="van">Van</option>
                <option value="bus">Bus</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">AC Available</label>
              <select
                name="ac"
                value={formData.ac}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={true}>Yes</option>
                <option value={false}>No</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Features (comma separated)</label>
              <input
                type="text"
                name="features"
                value={formData.features}
                onChange={handleInputChange}
                placeholder="AC, GPS, Music System"
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            <div className="md:col-span-2 flex justify-end space-x-3 mt-4">
              <button type="button" onClick={resetForm} className="px-4 py-2 text-gray-600 border rounded-md hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50">
                {isSubmitting ? "Saving..." : "Save Vehicle"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type / Capacity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price / Day</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {vehicles.map((vehicle) => (
              <tr key={vehicle.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  {vehicle.imageUrl ? (
                    <img src={vehicle.imageUrl} alt={vehicle.name} className="h-10 w-16 object-cover rounded-md border" />
                  ) : (
                    <div className="h-10 w-16 bg-gray-200 rounded-md border flex items-center justify-center text-xs text-gray-400">No Img</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{vehicle.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vehicle.type} ({vehicle.capacity} pax)</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${vehicle.pricePerDay}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    vehicle.status === 'active' ? 'bg-green-100 text-green-800' : 
                    vehicle.status === 'maintenance' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {vehicle.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleEdit(vehicle)} className="text-blue-600 hover:text-blue-900 mr-4">Edit</button>
                  <button onClick={() => handleDelete(vehicle.id)} className="text-red-600 hover:text-red-900">Delete</button>
                </td>
              </tr>
            ))}
            {vehicles.length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">No vehicles found. Add one to get started.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}