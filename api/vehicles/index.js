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
  if (req.method === 'GET') {
    try {
      let query = supabase.from('vehicles').select('*');
      if (req.query.status) {
        query = query.eq('status', req.query.status);
      }
      const originFilter = typeof req.query.origin === 'string' ? req.query.origin.trim() : '';
      const destinationFilter = typeof req.query.destination === 'string' ? req.query.destination.trim() : '';

      if (originFilter) {
        query = query.ilike('origin', `%${originFilter}%`);
      }
      if (destinationFilter) {
        query = query.ilike('destination', `%${destinationFilter}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json(keysToCamel(data));
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const { name, vehicleNumber, vehicle_number, type, capacity, pricePerDay, price, status, imageUrl, category, ac, features, rating, reviews, origin, destination } = req.body;
      const vehicleNo = vehicleNumber || vehicle_number;
      if (!vehicleNo) {
        return res.status(400).json({ error: 'Vehicle number is required.' });
      }
      const { data, error } = await supabase
        .from('vehicles')
        .insert([{ 
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
          origin,
          destination
        }])
        .select();
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Vehicle created but could not be retrieved. Check RLS policies.');
      }
      return res.status(201).json(keysToCamel(data[0]));
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
  return res.status(405).json({ error: 'Method not allowed' });
};
