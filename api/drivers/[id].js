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

  if (req.method === 'PUT') {
    try {
      const { name, mobile, licenseNumber, experienceYears, status, imageUrl } = req.body;
      const { data, error } = await supabase
        .from('drivers')
        .update({ name, mobile, licenseNumber, experienceYears, status, imageUrl })
        .eq('id', id)
        .select();
      if (error) throw error;
      if (!data || data.length === 0) return res.status(404).json({ error: 'Driver not found' });
      return res.status(200).json(keysToCamel(data[0]));
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { data: driver, error: fetchError } = await supabase.from('drivers').select('image_url').eq('id', id).single();
      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      if (driver && driver.image_url) {
        try {
          const fileName = driver.image_url.split('/').pop();
          if (fileName) await supabase.storage.from('driver-images').remove([fileName]);
        } catch (e) {
          console.error('Storage delete error:', e);
        }
      }

      const { error: deleteError } = await supabase.from('drivers').delete().eq('id', id);
      if (deleteError) throw deleteError;
      return res.status(200).json({ message: 'Driver deleted successfully' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
  return res.status(405).json({ error: 'Method not allowed' });
};
