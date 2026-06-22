import React, { useState, useEffect } from "react";
import { getSponsors, addSponsor, updateSponsor, deleteSponsor } from "../supabase/db";

export default function SponsorsManagement() {
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState(null);

  const initialForm = {
    title: "",
    description: "",
    imageUrl: "",
    link: "",
    active: true,
  };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    fetchSponsors();
  }, []);

  const fetchSponsors = async () => {
    try {
      setLoading(true);
      const data = await getSponsors();
      setSponsors(data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching sponsors:", err);
      setError("Failed to load sponsor list.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(initialForm);
    setEditingSponsor(null);
    setIsFormOpen(false);
    setIsSubmitting(false);
  };

  const handleEdit = (sponsor) => {
    setEditingSponsor(sponsor);
    setFormData({
      title: sponsor.title || "",
      description: sponsor.description || "",
      imageUrl: sponsor.imageUrl || "",
      link: sponsor.link || "",
      active: sponsor.active !== undefined ? sponsor.active : true,
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (sponsor) => {
    if (!window.confirm(`Delete sponsor ${sponsor.title}?`)) return;
    try {
      await deleteSponsor(sponsor.id?.toString?.() || sponsor.id);
      setSponsors(sponsors.filter((item) => item.id !== sponsor.id));
    } catch (err) {
      console.error("Failed to delete sponsor:", err);
      alert("Could not delete sponsor.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert("Sponsor title is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingSponsor) {
        await updateSponsor(editingSponsor.id?.toString?.() || editingSponsor.id, formData);
      } else {
        await addSponsor(formData);
      }
      await fetchSponsors();
      resetForm();
    } catch (err) {
      console.error("Error saving sponsor:", err);
      alert("Failed to save sponsor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-gray-600">Loading sponsors...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sponsor Ads Management</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage sponsored cards shown on the public home page.</p>
        </div>
        <button
          onClick={() => { setIsFormOpen(true); setEditingSponsor(null); setFormData(initialForm); }}
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
        >
          + Add Sponsor
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{editingSponsor ? "Edit Sponsor" : "Add New Sponsor"}</h2>
              <p className="text-sm text-gray-500">Sponsors with active status appear on the homepage.</p>
            </div>
            <button onClick={resetForm} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Title</span>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Link</span>
              <input
                type="url"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
                placeholder="https://"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-gray-700">Image URL</span>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
                placeholder="https://images.example.com/logo.png"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-gray-700">Description</span>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
                rows={4}
              />
            </label>

            <div className="flex items-center gap-3 md:col-span-2">
              <input
                id="sponsor-active"
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="sponsor-active" className="text-sm text-gray-700">Show this sponsor on the home page</label>
            </div>

            <div className="md:col-span-2 flex flex-wrap gap-3 justify-end">
              <button type="button" onClick={resetForm} className="rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                {isSubmitting ? "Saving..." : "Save Sponsor"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Campaigns</h2>
          <span className="text-sm text-gray-500">{sponsors.length} sponsor{ sponsors.length === 1 ? "" : "s" }</span>
        </div>

        <div className="divide-y divide-gray-100">
          {sponsors.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No sponsors have been created yet.</div>
          ) : sponsors.map((sponsor) => (
            <div key={sponsor.id} className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <div className="w-20 h-20 flex-none overflow-hidden rounded-3xl bg-slate-100 border border-gray-200">
                  <img
                    src={sponsor.imageUrl || "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=320&h=320&fit=crop&auto=format"}
                    alt={sponsor.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{sponsor.title}</h3>
                  <p className="text-sm text-gray-500">{sponsor.description || "No description provided."}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span className={`inline-flex rounded-full px-2.5 py-1 ${sponsor.active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                      {sponsor.active ? "Active" : "Inactive"}
                    </span>
                    {sponsor.link && (
                      <a href={sponsor.link} target="_blank" rel="noreferrer" className="text-sky-600 hover:text-sky-700">
                        Visit link
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => handleEdit(sponsor)} className="rounded-md border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50">
                  Edit
                </button>
                <button onClick={() => handleDelete(sponsor)} className="rounded-md border border-red-600 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
