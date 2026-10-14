/**
 * Automation script to restore products from backup JSON
 * Usage: node scripts/restore-products-backup.cjs
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.resolve('D:/AaaS/.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value.trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const backupFile = path.resolve('D:/AaaS/supabase/products_backup_before_simplification.json');
  if (!fs.existsSync(backupFile)) {
    console.error('Backup file not found:', backupFile);
    process.exit(1);
  }

  const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
  console.log(`Found ${backupData.length} products in backup.`);

  for (const product of backupData) {
    console.log(`Restoring product "${product.name}" (${product.id})...`);
    const { error } = await supabase
      .from('products')
      .update(product)
      .eq('id', product.id);

    if (error) {
      console.error(`Failed to restore ${product.id}:`, error.message);
    } else {
      console.log(`Successfully restored product ${product.id}`);
    }
  }
}

main().catch(console.error);
