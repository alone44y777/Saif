import { ENDPOINTS } from '../lib/endpoints.js';

const BRAND = {
  api: 'Pak SMS Bomber',
  devp: 'Sardar Daud Arain',
  powered_by: 'Dark Empire',
};

export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(200).json({
    ok: true,
    branding: BRAND,
    count: ENDPOINTS.length,
    endpoints: ENDPOINTS.map((e) => ({
      id: e.id,
      name: e.name,
      url: e.url,
      variants: e.variants.length,
    })),
  });
}
