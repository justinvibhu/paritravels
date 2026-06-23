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
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(keysToCamel(data));
    } catch (error) {
      console.error('DRIVER GET ERROR:', error);
      return res.status(500).json({
        success: false,
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
    }
  } else if (req.method === 'POST') {
    try {
      const { name, phone, licenseNumber, experienceYears, status, imageUrl } = req.body;

      const payload = {
        name,
        phone,
        license_number: licenseNumber,
        experience_years: experienceYears,
        status,
        image_url: imageUrl,
      };

      console.log('REQUEST BODY:', req.body);
      console.log('FINAL PAYLOAD:', payload);

      const { data, error } = await supabase
        .from('drivers')
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error('SUPABASE INSERT ERROR:', error);
        throw error;
      }
      return res.status(201).json(keysToCamel(data[0]));
    } catch (error) {
      console.error('DRIVER CREATE ERROR:', error);
      return res.status(500).json({
        success: false,
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
    }
  }
  return res.status(405).json({ error: 'Method not allowed' });
};
