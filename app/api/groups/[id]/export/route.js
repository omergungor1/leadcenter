import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Helper function to escape CSV values
function escapeCSV(value) {
    if (value === null || value === undefined) {
        return '';
    }

    const stringValue = String(value);

    // If value contains comma, quote, or newline, wrap in quotes and escape quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
}

// Generate CSV content
function generateCSV(leads, emailsMap, phonesMap) {
    // CSV Header
    const headers = [
        'name',
        'company',
        'address',
        'city',
        'district',
        'plus_code',
        'phone',
        'website',
        'rating',
        'review_count',
        'business_type',
        'google_maps_url',
        'working_hours',
        'created_at',
        'lead_emails',
        'lead_phones',
    ];

    const rows = [headers.join(',')];

    // CSV Rows
    leads.forEach((lead) => {
        const emails = (emailsMap.get(lead.id) || []).join(',');
        const phones = (phonesMap.get(lead.id) || []).join(',');

        const row = [
            escapeCSV(lead.name || ''),
            escapeCSV(lead.company || ''),
            escapeCSV(lead.address || ''),
            escapeCSV(lead.city || ''),
            escapeCSV(lead.district || ''),
            escapeCSV(lead.plus_code || ''),
            escapeCSV(lead.phone || ''),
            escapeCSV(lead.website || ''),
            lead.rating || '',
            lead.review_count || '',
            escapeCSV(lead.business_type || ''),
            escapeCSV(lead.google_maps_url || ''),
            escapeCSV(JSON.stringify(lead.working_hours) || ''),
            escapeCSV(lead.created_at || ''),
            escapeCSV(emails),
            escapeCSV(phones),
        ];

        rows.push(row.join(','));
    });

    return rows.join('\n');
}

// Generate VCF content
function generateVCF(leads) {
    const vcfCards = [];

    leads.forEach((lead) => {
        const name = (lead.name || '').substring(0, 50);
        const company = (lead.company || '').substring(0, 50);
        const city = lead.city || '';
        const district = lead.district || '';
        const phone = lead.phone || '';

        const vcfCard = [
            'BEGIN:VCARD',
            'VERSION:3.0',
            `N:${company};;;;`,
            `FN:${name} - ${city}, ${district}`,
            `ORG:${company}`,
            phone ? `TEL;TYPE=CELL:${phone}` : '',
            `ADR;TYPE=WORK:;;${district};${city};;;;`,
            'END:VCARD',
        ]
            .filter((line) => line.trim() !== '')
            .join('\n');

        vcfCards.push(vcfCard);
    });

    return vcfCards.join('\n');
}

// Sanitize filename - remove special characters
function sanitizeFilename(filename) {
    return filename
        .replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ\s-]/g, '') // Remove special chars except Turkish chars, spaces, and hyphens
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .replace(/_+/g, '_') // Replace multiple underscores with single
        .trim();
}

// Format date as DD-MM-YYYY
function formatDate(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
}

// Upload file to storage and get signed URL
async function uploadToStorage(supabase, bucket, path, content, contentType) {
    // Convert string to Buffer (Node.js compatible)
    const buffer = Buffer.from(content, 'utf-8');

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, buffer, {
            contentType: contentType,
            upsert: true, // Overwrite if exists
        });

    if (uploadError) {
        throw new Error(`Storage'a yükleme hatası: ${uploadError.message}`);
    }

    // Generate signed URL (valid for 1 year)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 31536000); // 1 year in seconds

    if (signedUrlError) {
        throw new Error(`Signed URL oluşturma hatası: ${signedUrlError.message}`);
    }

    return signedUrlData.signedUrl;
}

export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const format = searchParams.get('format'); // 'csv' or 'vcf'

        if (!format || !['csv', 'vcf'].includes(format)) {
            return NextResponse.json({ error: 'Geçersiz format' }, { status: 400 });
        }

        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                cookies: {
                    get(name) {
                        return cookieStore.get(name)?.value;
                    },
                },
            }
        );

        // Get authenticated user
        const {
            data: { user: authUser },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !authUser) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        // Get user ID from users table
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('auth_id', authUser.id)
            .single();

        if (userError || !userData) {
            return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
        }

        // Get lead group
        const { data: group, error: groupError } = await supabase
            .from('lead_groups')
            .select('*')
            .eq('id', id)
            .eq('user_id', userData.id)
            .single();

        if (groupError || !group) {
            return NextResponse.json({ error: 'Grup bulunamadı' }, { status: 404 });
        }

        const urlField = format === 'csv' ? 'csv_url' : 'vcf_url';
        const createdAtField = format === 'csv' ? 'csv_created_at' : 'vcf_created_at';
        const fileUrl = group[urlField];
        const fileCreated = group[createdAtField];
        const exportStatus = group.export_status;

        // Check if file exists and status
        if (fileUrl && fileCreated) {
            const fileDate = new Date(fileCreated);
            const groupDate = new Date(group.updated_at);

            if (fileDate >= groupDate && (exportStatus === 'completed' || !exportStatus)) {
                // File is up to date and ready
                return NextResponse.json({
                    status: 'completed',
                    downloadUrl: fileUrl,
                    createdAt: fileCreated,
                });
            }
        }

        // Check if processing
        if (exportStatus === 'processing') {
            return NextResponse.json({
                status: 'processing',
            });
        }

        // No file or outdated
        return NextResponse.json({
            status: 'pending',
        });
    } catch (error) {
        console.error('Error in GET /api/groups/[id]/export:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}

export async function POST(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { format } = body; // 'csv' or 'vcf'

        if (!format || !['csv', 'vcf'].includes(format)) {
            return NextResponse.json({ error: 'Geçersiz format' }, { status: 400 });
        }

        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                cookies: {
                    get(name) {
                        return cookieStore.get(name)?.value;
                    },
                },
            }
        );

        // Get authenticated user
        const {
            data: { user: authUser },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !authUser) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        // Get user ID from users table
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('auth_id', authUser.id)
            .single();

        if (userError || !userData) {
            return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
        }

        // Get lead group
        const { data: group, error: groupError } = await supabase
            .from('lead_groups')
            .select('*')
            .eq('id', id)
            .eq('user_id', userData.id)
            .single();

        if (groupError || !group) {
            return NextResponse.json({ error: 'Grup bulunamadı' }, { status: 404 });
        }

        const urlField = format === 'csv' ? 'csv_url' : 'vcf_url';
        const createdAtField = format === 'csv' ? 'csv_created_at' : 'vcf_created_at';
        const fileUrl = group[urlField];
        const fileCreated = group[createdAtField];
        const groupUpdated = group.updated_at;

        // Check if file exists and is up to date
        if (fileUrl && fileCreated) {
            const fileDate = new Date(fileCreated);
            const groupDate = new Date(groupUpdated);

            if (fileDate >= groupDate && (group.export_status === 'completed' || !group.export_status)) {
                // File is up to date, return existing URL
                return NextResponse.json({
                    status: 'completed',
                    downloadUrl: fileUrl,
                    createdAt: fileCreated,
                });
            }
        }

        // Update export status to processing
        await supabase
            .from('lead_groups')
            .update({
                export_status: 'processing',
            })
            .eq('id', id);

        try {
            // Use authenticated user's client for storage operations
            // Storage policies allow users to upload their own files
            // No service role key needed - RLS policies handle security

            // Fetch all leads for this group in batches
            const BATCH_SIZE = 5000;
            let allLeads = [];
            let offset = 0;
            let hasMore = true;

            while (hasMore) {
                const { data: leads, error: leadsError } = await supabase
                    .from('leads')
                    .select('*')
                    .eq('primary_group_id', id)
                    .order('created_at', { ascending: true })
                    .range(offset, offset + BATCH_SIZE - 1);

                if (leadsError) {
                    throw new Error(`Leads çekilirken hata: ${leadsError.message}`);
                }

                if (leads && leads.length > 0) {
                    allLeads = allLeads.concat(leads);
                    offset += BATCH_SIZE;

                    if (leads.length < BATCH_SIZE) {
                        hasMore = false;
                    }
                } else {
                    hasMore = false;
                }
            }

            // Fetch emails and phones for all leads
            const leadIds = allLeads.map((lead) => lead.id);
            const emailsMap = new Map();
            const phonesMap = new Map();

            if (leadIds.length > 0) {
                // Fetch emails in batches (Supabase .in() supports up to 1000 items)
                const EMAIL_BATCH_SIZE = 1000;
                for (let i = 0; i < leadIds.length; i += EMAIL_BATCH_SIZE) {
                    const batchIds = leadIds.slice(i, i + EMAIL_BATCH_SIZE);

                    const { data: emails, error: emailsError } = await supabase
                        .from('lead_emails')
                        .select('lead_id, email')
                        .in('lead_id', batchIds);

                    if (emailsError) {
                        console.error('Emails çekilirken hata:', emailsError);
                        continue;
                    }

                    if (emails && emails.length > 0) {
                        emails.forEach((item) => {
                            if (!emailsMap.has(item.lead_id)) {
                                emailsMap.set(item.lead_id, []);
                            }
                            emailsMap.get(item.lead_id).push(item.email);
                        });
                    }
                }

                // Fetch phones in batches
                const PHONE_BATCH_SIZE = 1000;
                for (let i = 0; i < leadIds.length; i += PHONE_BATCH_SIZE) {
                    const batchIds = leadIds.slice(i, i + PHONE_BATCH_SIZE);

                    const { data: phones, error: phonesError } = await supabase
                        .from('lead_phones')
                        .select('lead_id, phone')
                        .in('lead_id', batchIds);

                    if (phonesError) {
                        console.error('Phones çekilirken hata:', phonesError);
                        continue;
                    }

                    if (phones && phones.length > 0) {
                        phones.forEach((item) => {
                            if (!phonesMap.has(item.lead_id)) {
                                phonesMap.set(item.lead_id, []);
                            }
                            phonesMap.get(item.lead_id).push(item.phone);
                        });
                    }
                }
            }

            let downloadUrl = null;
            const updateData = {
                export_status: 'completed',
            };

            // Create filename with group name and date
            // Path format: groups/{group_id}/{filename} - required for RLS policies
            const sanitizedGroupName = sanitizeFilename(group.name);
            const dateStr = formatDate(new Date());
            const fileExtension = format === 'csv' ? 'csv' : 'vcf';
            const filename = `${sanitizedGroupName}_${dateStr}.${fileExtension}`;
            const filePath = `groups/${id}/${filename}`;

            // Generate CSV if requested
            if (format === 'csv') {
                const csvContent = generateCSV(allLeads, emailsMap, phonesMap);
                const csvUrl = await uploadToStorage(supabase, 'exports', filePath, csvContent, 'text/csv');
                updateData.csv_url = csvUrl;
                updateData.csv_created_at = new Date().toISOString();
                downloadUrl = csvUrl;
            }

            // Generate VCF if requested
            if (format === 'vcf') {
                const vcfContent = generateVCF(allLeads);
                const vcfUrl = await uploadToStorage(supabase, 'exports', filePath, vcfContent, 'text/vcard');
                updateData.vcf_url = vcfUrl;
                updateData.vcf_created_at = new Date().toISOString();
                downloadUrl = vcfUrl;
            }

            // Update lead_groups with URLs
            await supabase.from('lead_groups').update(updateData).eq('id', id);

            return NextResponse.json({
                status: 'completed',
                downloadUrl: downloadUrl,
                createdAt: new Date().toISOString(),
            });
        } catch (error) {
            console.error('Error generating export:', error);

            // Update status to error
            await supabase
                .from('lead_groups')
                .update({
                    export_status: 'error',
                })
                .eq('id', id);

            return NextResponse.json(
                { error: error.message || 'Dosya oluşturulurken hata oluştu', status: 'error' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Error in POST /api/groups/[id]/export:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}
