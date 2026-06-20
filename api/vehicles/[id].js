import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const toCamel = (s) => s.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
const isObject = (o) => o === Object(o) && !Array.isArray(o) && typeof o !== 'function';

const keysToCamel = (o) => {
  if (isObject(o)) {
    const n = {};
    Object.keys(o).forEach((k) => {
      n[toCamel(k)] = keysToCamel(o[k]);
    });
    return n;
  }
  if (Array.isArray(o)) {
    return o.map((i) => keysToCamel(i));
  }
  return o;
};

export default async (req, res) => {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', id)
        .single();
      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Vehicle not found' });
        }
        throw error;
      }
      if (!data) return res.status(404).json({ error: 'Vehicle not found' });
      return res.status(200).json(keysToCamel(data));
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'PUT') {
    try {
      const { name, vehicleNumber, vehicle_number, type, capacity, pricePerDay, price, status, imageUrl, category, ac, features, rating, reviews } = req.body;
      const vehicleNo = vehicleNumber || vehicle_number;
      if (!vehicleNo) {
        return res.status(400).json({ error: 'Vehicle number is required.' });
      }
      const updatePayload = {
        name,
        vehicleNumber: vehicleNo,
        type,
        capacity,
        pricePerDay: pricePerDay || price,
        status: status || 'active',
        imageUrl,
        category,
        ac,
        features,
        rating,
        reviews,
      };
      const { data, error } = await supabase
        .from('vehicles')
        .update(updatePayload)
        .eq('id', id)
        .select();
      if (error) throw error;
      if (!data || data.length === 0) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }
      return res.status(200).json(keysToCamel(data[0]));
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { data: vehicle, error: fetchError } = await supabase
        .from('vehicles')
        .select('image_url')
        .eq('id', id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (vehicle && vehicle.image_url) {
        try {
          const urlParts = vehicle.image_url.split('/');
          const fileName = urlParts[urlParts.length - 1];
          if (fileName) {
            await supabase.storage.from('vehicle-images').remove([fileName]);
          }
        } catch (storageErr) {
          console.error('Storage deletion error:', storageErr);
        }
      }

      const { error: deleteError } = await supabase.from('vehicles').delete().eq('id', id);
      if (deleteError) throw deleteError;

      return res.status(200).json({ message: 'Vehicle deleted successfully' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
  return res.status(405).json({ error: 'Method not allowed' });
};
