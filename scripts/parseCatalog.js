const fs = require('fs');

const fileContent = fs.readFileSync('c:/Users/usuario/Documents/SISGO/base_dispositivos.md', 'utf-8');
const lines = fileContent.split('\n').filter(l => l.includes('|'));
if (lines.length < 3) process.exit(0);

const rows = lines.slice(2).map(l => l.split('|').map(s => s.trim()).filter(Boolean));
// columns: id, device_type_id, brand_id, product_line_id, model_id, variant_id, display_name, image_url, is_active, created_at, updated_at, level, sort_order, label

const db = {
  deviceTypes: new Map(), // id -> { name }
  brands: new Map(),      // id -> { device_type_id, name }
  lines: new Map(),       // id -> { brand_id, name }
  models: new Map(),      // id -> { product_line_id, name, image_url }
  variants: new Map()     // id -> { model_id, name, image_url }
};

// Known mappings from observations
db.deviceTypes.set(1, { name: 'Smartphone', code: 'smartphone' });
db.deviceTypes.set(2, { name: 'Tablet', code: 'tablet' });
db.deviceTypes.set(3, { name: 'Smartwatch', code: 'smartwatch' });
db.deviceTypes.set(4, { name: 'Notebook', code: 'notebook' });
db.deviceTypes.set(5, { name: 'Smartwatch', code: 'smartwatch' }); // some had 5

// Known brands
const brandGuesser = (name) => {
  const n = name.toLowerCase();
  if (n.includes('xiaomi') || n.includes('redmi') || n.includes('poco')) return 'Xiaomi';
  if (n.includes('samsung') || n.includes('galaxy')) return 'Samsung';
  if (n.includes('apple') || n.includes('iphone') || n.includes('ipad') || n.includes('mac')) return 'Apple';
  if (n.includes('huawei')) return 'Huawei';
  if (n.includes('lenovo')) return 'Lenovo';
  if (n.includes('motorola') || n.includes('moto')) return 'Motorola';
  if (n.includes('amazfit')) return 'Amazfit';
  if (n.includes('garmin')) return 'Garmin';
  return 'Generico';
};

rows.forEach(r => {
  if (r.length < 8) return;
  const idStr = r[0];
  const dtId = parseInt(r[1]) || null;
  const bId = parseInt(r[2]) || null;
  const plId = parseInt(r[3]) || null;
  const mId = parseInt(r[4]) || null;
  const vId = parseInt(r[5]) || null;
  const dispName = r[6];
  const imageUrl = r[7] !== 'null' ? r[7] : null;

  let inferredType = 'Smartphone';
  let inferredBrand = brandGuesser(dispName);
  let inferredLine = 'Genérica';
  let inferredModel = dispName;

  if (dispName.includes('·')) {
    const parts = dispName.split('·').map(p => p.trim());
    if (parts.length >= 4) {
      inferredType = parts[0];
      inferredBrand = parts[1];
      inferredLine = parts[2];
      inferredModel = parts[3];
    }
  } else {
    // try to strip brand from model
    if (inferredModel.toLowerCase().startsWith(inferredBrand.toLowerCase())) {
       inferredModel = inferredModel.substring(inferredBrand.length).trim();
       if (inferredBrand === 'Samsung' && inferredModel.toLowerCase().startsWith('galaxy')) {
           inferredModel = inferredModel.substring('galaxy'.length).trim();
       }
    }
    // simple line guesser
    if (inferredModel.toLowerCase().startsWith('s ')) inferredLine = 'S Series';
    else if (inferredModel.toLowerCase().startsWith('a ')) inferredLine = 'A Series';
    else if (inferredModel.toLowerCase().startsWith('note ')) inferredLine = 'Note Series';
    else if (inferredBrand === 'Apple') inferredLine = 'iPhone';
    else if (inferredBrand === 'Xiaomi') inferredLine = 'Redmi / Mi';
  }

  if (dtId && !db.deviceTypes.has(dtId)) {
    db.deviceTypes.set(dtId, { name: inferredType, code: inferredType.toLowerCase().replace(/[^a-z0-9]/g, '') });
  }
  
  if (bId && !db.brands.has(bId)) {
    db.brands.set(bId, { device_type_id: dtId || 1, name: inferredBrand });
  }

  if (plId && !db.lines.has(plId)) {
    db.lines.set(plId, { brand_id: bId || 1, name: inferredLine });
  }

  if (mId && !db.models.has(mId)) {
    db.models.set(mId, { product_line_id: plId || 1, name: inferredModel, image_url: imageUrl });
  }

  if (vId && !db.variants.has(vId)) {
    // If we have an image here, let's prefer using it
    if (imageUrl && mId && db.models.has(mId) && !db.models.get(mId).image_url) {
       db.models.get(mId).image_url = imageUrl;
    }
    db.variants.set(vId, { model_id: mId || 1, name: inferredModel + ' Variant', image_url: imageUrl });
  }
});

// Generate SQL
let sql = `-- AUTO GENERATED SEED CATALOG\n\n`;

function escape(str) {
  if (!str) return 'NULL';
  return `'${str.replace(/'/g, "''")}'`;
}

sql += `-- Device Types\n`;
db.deviceTypes.forEach((obj, id) => {
  sql += `INSERT INTO device_types (id, name, code, is_active) VALUES (${id}, ${escape(obj.name)}, ${escape(obj.code)}, true) ON CONFLICT (id) DO NOTHING;\n`;
});

sql += `\n-- Brands\n`;
db.brands.forEach((obj, id) => {
  sql += `INSERT INTO brands (id, device_type_id, name, is_active) VALUES (${id}, ${obj.device_type_id}, ${escape(obj.name)}, true) ON CONFLICT (id) DO NOTHING;\n`;
});

sql += `\n-- Product Lines\n`;
db.lines.forEach((obj, id) => {
  sql += `INSERT INTO product_lines (id, brand_id, name, is_active) VALUES (${id}, ${obj.brand_id}, ${escape(obj.name)}, true) ON CONFLICT (id) DO NOTHING;\n`;
});

sql += `\n-- Models\n`;
db.models.forEach((obj, id) => {
  sql += `INSERT INTO models (id, product_line_id, name, image_url, is_active) VALUES (${id}, ${obj.product_line_id}, ${escape(obj.name)}, ${escape(obj.image_url)}, true) ON CONFLICT (id) DO NOTHING;\n`;
});

sql += `\n-- Variants\n`;
db.variants.forEach((obj, id) => {
  // If variant name is dummy, let's just use the model name
  sql += `INSERT INTO variants (id, model_id, name, image_url, is_active) VALUES (${id}, ${obj.model_id}, ${escape(obj.name.replace(' Variant', ' Base'))}, ${escape(obj.image_url)}, true) ON CONFLICT (id) DO NOTHING;\n`;
});

// Update sequences so inserts don't fail later
sql += `\n-- Update Sequences\n`;
sql += `SELECT setval('device_types_id_seq', (SELECT MAX(id) FROM device_types));\n`;
sql += `SELECT setval('brands_id_seq', (SELECT MAX(id) FROM brands));\n`;
sql += `SELECT setval('product_lines_id_seq', (SELECT MAX(id) FROM product_lines));\n`;
sql += `SELECT setval('models_id_seq', (SELECT MAX(id) FROM models));\n`;
sql += `SELECT setval('variants_id_seq', (SELECT MAX(id) FROM variants));\n`;

fs.writeFileSync('c:/Users/usuario/Documents/SISGO/sisgo-unificado/database/09-seed-catalog.sql', sql);
console.log('SQL script created successfully with ' + db.models.size + ' models.');
