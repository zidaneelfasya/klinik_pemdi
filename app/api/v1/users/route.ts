import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
 
// Helper function to check if user is admin (has unit_id = 1)
async function checkIsAdmin(supabase: any, userId: string): Promise<boolean> {
  try {
    const { data: userUnits, error } = await supabase
      .from('user_unit_penanggungjawab')
      .select('unit_id')
      .eq('user_id', userId);
    console.log('User Units:', userUnits);
    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
    
    // Check if user has superadmin unit (unit_id = 1)
    return userUnits?.some((unit: any) => unit.unit_id === 1) || false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// GET endpoint untuk mengambil semua users
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check user authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const isAdmin = await checkIsAdmin(supabase, user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    // First, get ALL profiles with pagination and search
    // Service role key bypasses RLS, so we get all users, not just logged-in user
    let profilesQuery = supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        phone,
        email,
        nip,
        jabatan,
        satuan_kerja,
        instansi,
        role,
        created_at,
        updated_at
      `);

    // Add search filter if provided
    if (search) {
      profilesQuery = profilesQuery.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,nip.ilike.%${search}%`);
    }

    // Get total count for pagination (with search filter if applicable)
    let countQuery = supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    if (search) {
      countQuery = countQuery.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,nip.ilike.%${search}%`);
    }
    
    const { count } = await countQuery;

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: profiles, error: profilesError } = await profilesQuery
      .range(from, to)
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    // Get unit assignments for all users
    const userIds = profiles?.map(profile => profile.id) || [];
    let userUnits: any[] = [];

    if (userIds.length > 0) {
      const { data: unitAssignments, error: unitsError } = await supabase
        .from('user_unit_penanggungjawab')
        .select('user_id, unit_id')
        .in('user_id', userIds);

      if (unitsError) {
        console.error('Error fetching unit assignments:', unitsError);
      } else {
        userUnits = unitAssignments || [];
      }
    }

    // Transform data to include unit_id (single unit)
    const transformedUsers = profiles?.map(user => {
      const userUnit = userUnits.find(unit => unit.user_id === user.id);
      return {
        ...user,
        unit_id: userUnit?.unit_id || null
      };
    }) || [];

    return NextResponse.json({
      success: true,
      data: transformedUsers,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Error in GET /api/v1/users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST endpoint untuk membuat user baru
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check user authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const isAdmin = await checkIsAdmin(supabase, user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, password, role, full_name, phone, nip, jabatan, satuan_kerja, instansi, unit_id } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Create user with Supabase Auth (Admin API)
    const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Auto-confirm email for admin-created users
    });

    if (createUserError) {
      console.error('Error creating user:', createUserError);
      return NextResponse.json(
        { error: createUserError.message },
        { status: 400 }
      );
    }

    // Role untuk akses: user | pic | admin. Default 'user' agar bisa login; admin perlu role 'admin' untuk akses panel admin
    const profileRole = role === 'admin' || role === 'pic' ? role : 'user';

    // Create profile - using insert since we're creating a new user
    // Service role key should bypass RLS policies
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: newUser.user.id,
        full_name,
        phone,
        email,
        nip,
        jabatan,
        satuan_kerja,
        instansi,
        role: profileRole,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (profileError) {
      console.error('Error creating profile:', profileError);
      // Try to clean up the created user
      await supabase.auth.admin.deleteUser(newUser.user.id);
      return NextResponse.json(
        { error: 'Failed to create user profile: ' + profileError.message },
        { status: 500 }
      );
    }

    // Create unit assignment if provided
    if (unit_id) {
      const { error: unitError } = await supabase
        .from('user_unit_penanggungjawab')
        .insert({
          user_id: newUser.user.id,
          unit_id: unit_id
        });

      if (unitError) {
        console.error('Error creating unit assignment:', unitError);
        // Note: We don't rollback here as the user is already created
        // You might want to handle this differently
      }
    }

    return NextResponse.json({
      success: true,
      data: { ...profile, unit_id: unit_id || null },
      message: 'User created successfully'
    });

  } catch (error) {
    console.error('Error in POST /api/v1/users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
