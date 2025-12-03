
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkBuckets() {
    console.log('Listing buckets...');
    const { data, error } = await supabaseAdmin.storage.listBuckets();
    if (error) {
        console.error('Error listing buckets:', error);
        return;
    }

    console.log('Buckets:', data.map(b => b.name));

    const bucketName = 'brand-assets';
    const exists = data.find(b => b.name === bucketName);

    if (!exists) {
        console.log(`Creating bucket '${bucketName}'...`);
        const { data: newBucket, error: createError } = await supabaseAdmin.storage.createBucket(bucketName, {
            public: true
        });
        if (createError) {
            console.error('Error creating bucket:', createError);
        } else {
            console.log('Bucket created:', newBucket);
        }
    } else {
        console.log(`Bucket '${bucketName}' already exists.`);
    }
}

checkBuckets();
