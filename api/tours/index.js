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
      let query = supabase.from('tours').select('*');
      if (req.query.active) {
        query = query.eq('status', 'active');
      }
      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json(keysToCamel(data));
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const { name, description, destination, duration, price, status, itinerary, included } = req.body;
      const { data, error } = await supabase
        .from('tours')
        .insert([{ name, description, destination, duration, price, status: status || 'active', itinerary, included }])
        .select();
      if (error) throw error;
      return res.status(201).json(keysToCamel(data[0]));
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
  return res.status(405).json({ error: 'Method not allowed' });
};
