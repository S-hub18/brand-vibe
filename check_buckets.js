
const { supabaseAdmin } = require('./lib/db/supabase');

async function listBuckets() {
    const { data, error } = await supabaseAdmin.storage.listBuckets();
    if (error) {
        console.error('Error listing buckets:', error);
    } else {
        console.log('Buckets:', data.map(b => b.name));
    }
}

listBuckets();
