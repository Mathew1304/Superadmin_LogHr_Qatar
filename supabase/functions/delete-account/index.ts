import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Create a Supabase client with the Auth context of the user calling the function
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // 2. Check if the caller is a Super Admin
        const { data: { user } } = await supabaseClient.auth.getUser()

        if (!user) {
            throw new Error('Unauthorized')
        }

        // Check user profile for super_admin role
        const { data: profile } = await supabaseClient
            .from('user_profiles')
            .select('role')
            .eq('user_id', user.id)
            .single()

        if (profile?.role !== 'super_admin') {
            throw new Error('Unauthorized: Only Super Admins can perform this action')
        }

        // 3. Get the organization ID from the request body
        let organizationId;
        try {
            const body = await req.json();
            organizationId = body.organizationId;
            console.log('Received request body:', body);
        } catch (e) {
            console.error('Failed to parse request body:', e);
            throw new Error('Invalid request body');
        }

        if (!organizationId) {
            throw new Error('Organization ID is required')
        }

        const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY');
        if (!serviceRoleKey) {
            console.error('Service Role Key is missing in environment variables');
            throw new Error('Server misconfiguration: Service Role Key is missing');
        }

        // 4. Create a Supabase Admin client (Service Role) to perform the deletions
        // WARNING: This client bypasses RLS. Use with extreme caution.
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            serviceRoleKey
        )

        // 5. Find the organization to verify it exists and get the owner if possible
        // Note: We'll delete strictly by ID to ensure safety
        const { data: org, error: orgError } = await supabaseAdmin
            .from('organizations')
            .select('id, name')
            .eq('id', organizationId)
            .single()

        if (orgError) {
            console.error('Database Error fetching organization:', orgError);
            throw new Error(`Database Error: ${orgError.message}`);
        }

        if (!org) {
            console.error(`Organization not found with ID: ${organizationId}`);
            throw new Error('Organization not found');
        }

        console.log(`Deleting organization: ${org.name} (${org.id})`)

        // 6. Find all users associated with this organization (to delete their Auth accounts)
        // Assuming users are linked via user_profiles.current_organization_id
        const { data: users, error: usersError } = await supabaseAdmin
            .from('user_profiles')
            .select('user_id')
            .eq('current_organization_id', organizationId)

        if (usersError) {
            console.error('Error finding linked users:', usersError)
            // Continue anyway to try and delete the org? Better to fail safely if we can't clean up users.
        }

        // 7. Loop through and delete authentication accounts
        if (users && users.length > 0) {
            for (const u of users) {
                if (u.user_id) {
                    console.log(`Deleting Auth user: ${u.user_id}`)
                    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(
                        u.user_id
                    )

                    if (deleteAuthError) {
                        console.error(`Failed to delete auth user ${u.user_id}:`, deleteAuthError)
                        // We log but continue, ensuring we try to clean up as much as possible
                    }
                }
            }
        }

        // 8. Delete the organization (Cascade should handle profiles, but let's be explicit if needed)
        // Deleting the org is the final step
        const { error: deleteOrgError } = await supabaseAdmin
            .from('organizations')
            .delete()
            .eq('id', organizationId)

        if (deleteOrgError) {
            throw deleteOrgError
        }

        return new Response(
            JSON.stringify({ message: 'Organization and associated accounts deleted successfully' }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        console.error('Edge Function Error:', error.message)
        return new Response(
            JSON.stringify({
                error: error.message,
                details: 'Check Supabase Function Logs for more info'
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
