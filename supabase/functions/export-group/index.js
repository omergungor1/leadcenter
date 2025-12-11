// Supabase Edge Function: export-group
// Exports lead groups to CSV and VCF formats

import { serve } from 'https://deno.land/std@0.168.0/http/server.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const BATCH_SIZE = 5000; // Process leads in batches of 5000

serve(async (req) => {
    try {
        // CORS headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        };

        if (req.method === 'OPTIONS') {
            return new Response('ok', { headers: corsHeaders });
        }

        const { group_id, format } = await req.json();

        if (!group_id) {
            return new Response(
                JSON.stringify({ error: 'group_id gerekli' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const validFormats = ['csv', 'vcf', 'all'];
        const requestedFormat = format || 'all';

        if (!validFormats.includes(requestedFormat)) {
            return new Response(
                JSON.stringify({ error: 'Geçersiz format. csv, vcf veya all olmalı' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Initialize Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !supabaseServiceKey) {
            return new Response(
                JSON.stringify({ error: 'Dışa aktarılırken bir hata oluştu. Lütfen daha sonra tekrar deneyin. Hata kodu: SAK002' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Get lead group
        const { data: group, error: groupError } = await supabase
            .from('lead_groups')
            .select('*')
            .eq('id', group_id)
            .single();

        if (groupError || !group) {
            return new Response(
                JSON.stringify({ error: 'Grup bulunamadı' }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Fetch all leads for this group in batches
        let allLeads = [];
        let offset = 0;
        let hasMore = true;

        while (hasMore) {
            const { data: leads, error: leadsError } = await supabase
                .from('leads')
                .select('*')
                .eq('primary_group_id', group_id)
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
            // Fetch emails in batches
            let emailOffset = 0;
            let hasMoreEmails = true;

            while (hasMoreEmails) {
                const { data: emails, error: emailsError } = await supabase
                    .from('lead_emails')
                    .select('lead_id, email')
                    .in('lead_id', leadIds)
                    .range(emailOffset, emailOffset + BATCH_SIZE - 1);

                if (emailsError) {
                    console.error('Emails çekilirken hata:', emailsError);
                    break;
                }

                if (emails && emails.length > 0) {
                    emails.forEach((item) => {
                        if (!emailsMap.has(item.lead_id)) {
                            emailsMap.set(item.lead_id, []);
                        }
                        emailsMap.get(item.lead_id).push(item.email);
                    });

                    emailOffset += BATCH_SIZE;
                    if (emails.length < BATCH_SIZE) {
                        hasMoreEmails = false;
                    }
                } else {
                    hasMoreEmails = false;
                }
            }

            // Fetch phones in batches
            let phoneOffset = 0;
            let hasMorePhones = true;

            while (hasMorePhones) {
                const { data: phones, error: phonesError } = await supabase
                    .from('lead_phones')
                    .select('lead_id, phone')
                    .in('lead_id', leadIds)
                    .range(phoneOffset, phoneOffset + BATCH_SIZE - 1);

                if (phonesError) {
                    console.error('Phones çekilirken hata:', phonesError);
                    break;
                }

                if (phones && phones.length > 0) {
                    phones.forEach((item) => {
                        if (!phonesMap.has(item.lead_id)) {
                            phonesMap.set(item.lead_id, []);
                        }
                        phonesMap.get(item.lead_id).push(item.phone);
                    });

                    phoneOffset += BATCH_SIZE;
                    if (phones.length < BATCH_SIZE) {
                        hasMorePhones = false;
                    }
                } else {
                    hasMorePhones = false;
                }
            }
        }

        const result = {};

        // Generate CSV if requested
        if (requestedFormat === 'csv' || requestedFormat === 'all') {
            const csvContent = generateCSV(allLeads, emailsMap, phonesMap);
            const csvPath = `groups/${group_id}.csv`;
            const csvUrl = await uploadToStorage(supabase, 'exports', csvPath, csvContent, 'text/csv');
            result.csv_url = csvUrl;
        }

        // Generate VCF if requested
        if (requestedFormat === 'vcf' || requestedFormat === 'all') {
            const vcfContent = generateVCF(allLeads);
            const vcfPath = `groups/${group_id}.vcf`;
            const vcfUrl = await uploadToStorage(supabase, 'exports', vcfPath, vcfContent, 'text/vcard');
            result.vcf_url = vcfUrl;
        }

        result.status = 'completed';

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error in export-group function:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Bilinmeyen hata' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});

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

async function uploadToStorage(supabase, bucket, path, content, contentType) {
    // Convert string to Uint8Array for Deno
    const encoder = new TextEncoder();
    const fileData = encoder.encode(content);

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, fileData, {
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
