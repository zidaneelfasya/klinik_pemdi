import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Helper function to check if user is admin (has unit_id = 1)
async function checkIsAdmin(supabase: any, userId: string): Promise<boolean> {
  try {
    const { data: userUnits, error } = await supabase
      .from('user_unit_penanggungjawab')
      .select('unit_id')
      .eq('user_id', userId);
    
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

// GET endpoint untuk mengambil user tertentu
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await context.params;
    
    // Check user authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Tidak terautentikasi' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const isAdmin = await checkIsAdmin(supabase, user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Akses ditolak - Hanya admin yang dapat mengakses' },
        { status: 403 }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (profileError) {
      console.error('Error fetching user:', profileError);
      return NextResponse.json(
        { error: 'Pengguna tidak ditemukan' },
        { status: 404 }
      );
    }

    // Get unit assignment for this user (single unit)
    const { data: unitAssignment, error: unitsError } = await supabase
      .from('user_unit_penanggungjawab')
      .select('unit_id')
      .eq('user_id', id)
      .single();

    if (unitsError && unitsError.code !== 'PGRST116') {
      console.error('Error fetching unit assignment:', unitsError);
    }

    // Transform data to include unit_id (single unit)
    const transformedUser = {
      ...profile,
      unit_id: unitAssignment?.unit_id || null
    };

    return NextResponse.json({
      success: true,
      data: transformedUser
    });

  } catch (error) {
    console.error('Error in GET /api/v1/users/[id]:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// PUT endpoint untuk mengupdate user
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await context.params;
    
    // Check user authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Tidak terautentikasi' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const isAdmin = await checkIsAdmin(supabase, user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Akses ditolak - Hanya admin yang dapat mengakses' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { full_name, phone, email, password, nip, jabatan, satuan_kerja, instansi, unit_id } = body;

    // Update profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name,
        phone,
        email,
        nip,
        jabatan,
        satuan_kerja,
        instansi,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating user:', updateError);
      return NextResponse.json(
        { error: 'Gagal memperbarui pengguna' },
        { status: 500 }
      );
    }

    // If email was changed, update it in auth.users too
    if (email) {
      const { error: authUpdateError } = await supabase.auth.admin.updateUserById(id, {
        email
      });

      if (authUpdateError) {
        console.error('Error updating auth email:', authUpdateError);
        // Continue anyway, profile was updated
      }
    }

    // If password was provided, update it in auth
    if (password && password.length >= 6) {
      const { error: passwordUpdateError } = await supabase.auth.admin.updateUserById(id, {
        password
      });

      if (passwordUpdateError) {
        console.error('Error updating auth password:', passwordUpdateError);
        return NextResponse.json(
          { error: 'Gagal mengubah password. Pastikan password minimal 6 karakter.' },
          { status: 500 }
        );
      }
    }

    // Handle unit assignment
    if (unit_id !== undefined) {
      // First, delete existing assignment
      const { error: deleteError } = await supabase
        .from('user_unit_penanggungjawab')
        .delete()
        .eq('user_id', id);

      if (deleteError) {
        console.error('Error deleting existing unit assignment:', deleteError);
      }

      // Then, create new assignment if unit_id is provided
      if (unit_id) {
        const { error: insertError } = await supabase
          .from('user_unit_penanggungjawab')
          .insert({
            user_id: id,
            unit_id: unit_id
          });

        if (insertError) {
          console.error('Error creating new unit assignment:', insertError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: { ...updatedProfile, unit_id: unit_id || null },
      message: 'Pengguna berhasil diperbarui'
    });

  } catch (error) {
    console.error('Error in PUT /api/v1/users/[id]:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// DELETE endpoint untuk menghapus user
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await context.params;
    
    // Check user authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Tidak terautentikasi' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const isAdmin = await checkIsAdmin(supabase, user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Akses ditolak - Hanya admin yang dapat mengakses' },
        { status: 403 }
      );
    }

    // Hapus dulu assignment unit agar tidak konflik FK, lalu hapus dari auth
    const { error: deleteUnitError } = await supabase
      .from('user_unit_penanggungjawab')
      .delete()
      .eq('user_id', id);

    if (deleteUnitError) {
      console.error('Error deleting user unit assignment:', deleteUnitError);
    }

    // Hapus profile (tidak otomatis terhapus saat auth user dihapus)
    const { error: deleteProfileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (deleteProfileError) {
      console.error('Error deleting profile:', deleteProfileError);
      return NextResponse.json(
        { error: 'Gagal menghapus data pengguna' },
        { status: 500 }
      );
    }

    // Hapus dari auth
    const { error: deleteError } = await supabase.auth.admin.deleteUser(id);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return NextResponse.json(
        { error: 'Gagal menghapus pengguna' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Pengguna berhasil dihapus'
    });

  } catch (error) {
    console.error('Error in DELETE /api/v1/users/[id]:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
