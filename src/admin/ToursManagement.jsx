import React, { useState, useEffect } from "react";
import { supabase } from "../supabase/client";

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function ToursManagement() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);

  const initialFormState = {
    name: "",
    description: "",
    price: "",
    durationDays: "",
    active: true,
    imageUrl: "",
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchTours();
  }, []);

  const fetchTours = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/tours`);
      const data = await response.json();
      setTours(data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching tours:", err);
      setError("Failed to fetch tours.");
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

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setEditingId(null);
    setImageFile(null);
    setIsFormOpen(false);
  };

  const handleEdit = (tour) => {
    setFormData({
      name: tour.name || "",
      description: tour.description || "",
      price: tour.price || "",
      durationDays: tour.durationDays || "",
      active: tour.active !== undefined ? tour.active : true,
      imageUrl: tour.imageUrl || tour.image_url || "",
    });
    setEditingId(tour.id);
    setImageFile(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this tour?")) {
      try {
        const response = await fetch(`${API_URL}/tours/${id}`, { method: 'DELETE' });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to delete tour');
        }
        setTours(tours.filter(t => t.id !== id));
      } catch (err) {
        console.error("Error deleting tour:", err);
        alert("Failed to delete tour.");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let uploadedImageUrl = formData.imageUrl;

      // Upload new image if a file was selected
      if (imageFile) {
        try {
          const fileName = `${Date.now()}_${imageFile.name}`;
          const { error: uploadError } = await supabase.storage.from("tour-images").upload(fileName, imageFile);
          if (uploadError) {
            console.warn("Image upload failed (continuing without image):", uploadError.message);
          } else {
            const { data: publicUrlData } = supabase.storage.from("tour-images").getPublicUrl(fileName);
            uploadedImageUrl = publicUrlData.publicUrl;
          }
        } catch (uploadErr) {
          console.warn("Image upload failed (continuing without image):", uploadErr.message);
        }
      }

      const payload = {
        ...formData,
        price: Number(formData.price),
        durationDays: Number(formData.durationDays),
        imageUrl: uploadedImageUrl,
      };

      const url = editingId ? `${API_URL}/tours/${editingId}` : `${API_URL}/tours`;
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (errData.error?.toLowerCase().includes('row-level security')) {
          throw new Error('Failed to save tour: Row-level security policy violation. Ensure the backend is using the service role key.');
        }
        throw new Error(errData.error || 'Failed to save tour.');
      }


      await fetchTours();
      resetForm();
    } catch (err) {
      console.error("Error saving tour:", err.message || err);
      let errorMessage = "Failed to save tour. Please try again.";
      if (err.message && err.message.toLowerCase().includes('bucket not found')) {
        errorMessage = "Failed to upload image: The 'tour-images' storage bucket was not found. Please create it in your Supabase dashboard and make it public.";
      } else if (err.message) {
        errorMessage = `Failed to save tour: ${err.message}`;
      }
      alert(errorMessage);
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
        <button onClick={() => { resetForm(); setIsFormOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-sm transition">
          + Add Tour
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h2 className="text-xl font-semibold mb-4">{editingId ? "Edit Tour" : "Add New Tour"}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tour Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"></textarea>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                <input type="number" name="price" value={formData.price} onChange={handleInputChange} required min="0" className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Days)</label>
                <input type="number" name="durationDays" value={formData.durationDays} onChange={handleInputChange} required min="1" className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tour Image</label>
                <input type="file" accept="image/*" onChange={handleFileChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                {editingId && formData.imageUrl && !imageFile && <p className="text-xs text-gray-500 mt-1">Leave empty to keep current image.</p>}
              </div>
            </div>
            <div className="flex items-center">
              <input type="checkbox" name="active" checked={formData.active} onChange={handleInputChange} id="tour-active" className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
              <label htmlFor="tour-active" className="ml-2 block text-sm text-gray-900">Active</label>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button type="button" onClick={resetForm} className="px-4 py-2 text-gray-600 border rounded-md hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50">{isSubmitting ? "Saving..." : "Save Tour"}</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tours.map((tour) => (
              <tr key={tour.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  {tour.imageUrl || tour.image_url ? (
                    <img src={tour.imageUrl || tour.image_url} alt={tour.name} className="h-10 w-16 object-cover rounded-md border" />
                  ) : (
                    <div className="h-10 w-16 bg-gray-200 rounded-md border flex items-center justify-center text-xs text-gray-400">No Img</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{tour.name}</div>
                  <div className="text-sm text-gray-500 truncate max-w-xs">{tour.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tour.durationDays} Days</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">₹{tour.price}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${tour.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{tour.active ? 'Active' : 'Inactive'}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleEdit(tour)} className="text-blue-600 hover:text-blue-900 mr-4">Edit</button>
                  <button onClick={() => handleDelete(tour.id)} className="text-red-600 hover:text-red-900">Delete</button>
                </td>
              </tr>
            ))}
            {tours.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No tours found. Add one to get started.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}