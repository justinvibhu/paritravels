import React, { useState, useEffect, useCallback } from "react";

const API_URL = "http://localhost:5000/api";

export default function ToursManagement() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialFormState = {
    name: "",
    description: "",
    price: "",
    durationDays: "",
    active: true,
  };

  const [formData, setFormData] = useState(initialFormState);

  const fetchTours = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/tours`);
      if (!response.ok) throw new Error("Failed to fetch tours");
      const data = await response.json();
      setTours(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTours();
  }, [fetchTours]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setEditingId(null);
    setIsFormOpen(false);
  };

  const handleEdit = (tour) => {
    setFormData({
      name: tour.name || "",
      description: tour.description || "",
      price: tour.price || "",
      durationDays: tour.durationDays || "",
      active: tour.active,
    });
    setEditingId(tour.id);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this tour?")) {
      try {
        const response = await fetch(`${API_URL}/tours/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Failed to delete tour");
        fetchTours();
      } catch (err) {
        alert(`Failed to delete tour: ${err.message}`);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = { ...formData, active: String(formData.active) === 'true' };
      const url = editingId ? `${API_URL}/tours/${editingId}` : `${API_URL}/tours`;
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to save tour");
      }

      resetForm();
      fetchTours();
    } catch (err) {
      alert(`Failed to save tour: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-gray-600">Loading tours...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Tours Management</h1>
        <button onClick={() => setIsFormOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-sm">
          + Add Tour
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">{editingId ? "Edit Tour" : "Add New Tour"}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Tour Name" required className="w-full border-gray-300 rounded-md p-2"/>
            <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Description" className="w-full border-gray-300 rounded-md p-2" rows="3"/>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input type="number" name="price" value={formData.price} onChange={handleInputChange} placeholder="Price ($)" required className="w-full border-gray-300 rounded-md p-2"/>
              <input type="number" name="durationDays" value={formData.durationDays} onChange={handleInputChange} placeholder="Duration (Days)" required className="w-full border-gray-300 rounded-md p-2"/>
              <select name="active" value={formData.active} onChange={handleInputChange} className="w-full border-gray-300 rounded-md p-2">
                <option value={true}>Active</option>
                <option value={false}>Inactive</option>
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <button type="button" onClick={resetForm} className="px-4 py-2 text-gray-600 border rounded-md hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-50">
                {isSubmitting ? "Saving..." : "Save Tour"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tours.map((tour) => (
              <tr key={tour.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{tour.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">${tour.price}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{tour.durationDays} days</td>
                <td className="px-6 py-4"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${tour.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{tour.active ? 'Active' : 'Inactive'}</span></td>
                <td className="px-6 py-4 text-right text-sm font-medium">
                  <button onClick={() => handleEdit(tour)} className="text-blue-600 hover:text-blue-900 mr-4">Edit</button>
                  <button onClick={() => handleDelete(tour.id)} className="text-red-600 hover:text-red-900">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}