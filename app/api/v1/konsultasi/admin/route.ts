import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const supabase = await createClient();

    // Get search parameters
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Filter parameters
    const search = searchParams.get("search");
    const kategori = searchParams.get("kategori");
    const status = searchParams.get("status");
    const unitIds = searchParams.get("units");

    try {
        let userUnitIds: number[] = [];
        let isSuperAdmin = false;

        // Always get user's units to determine access level
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json(
                { error: 'User not authenticated' },
                { status: 401 }
            );
        }

        // Get user's assigned units
        const { data: userUnits } = await supabase
            .from("user_unit_penanggungjawab")
            .select("unit_id")
            .eq("user_id", user.id);

        userUnitIds = userUnits?.map((u) => u.unit_id) || [];

        // Check if user is superadmin (has unit_id = 1)
        isSuperAdmin = userUnitIds.includes(1);

        console.log('Admin API - User Units:', userUnitIds);
        console.log('Admin API - Is SuperAdmin:', isSuperAdmin);

        // Only allow access for superadmin
        if (!isSuperAdmin) {
            return NextResponse.json(
                { error: 'Access denied. SuperAdmin privileges required.' },
                { status: 403 }
            );
        }

        console.log('SuperAdmin confirmed - showing all data');
        
        // SuperAdmin gets all data without restrictions
        let query = supabase
            .from('konsultasi_spbe')
            .select(`
                *,
                pic_list:pic_id(
                    id,
                    nama_pic
                ),
                konsultasi_unit(
                    konsultasi_id,
                    unit_id,
                    unit_penanggungjawab(
                        id,
                        nama_unit,
                        nama_pic
                    )
                ),
                konsultasi_topik(
                    konsultasi_id,
                    topik_id,
                    topik_konsultasi(
                        id,
                        nama_topik
                    )
                )
            `);

        // Apply sorting
        query = query.order(sortBy, { 
            ascending: sortOrder === 'asc',
            nullsFirst: false
        });

        // Apply filters
        if (search) {
            query = query.or(`nama_lengkap.ilike.%${search}%,instansi_organisasi.ilike.%${search}%,asal_kota_kabupaten.ilike.%${search}%,asal_provinsi.ilike.%${search}%,ticket.ilike.%${search}%,jabatan.ilike.%${search}%`);
        }

        if (kategori) {
            const categories = kategori.split(',');
            query = query.in('kategori', categories);
        }

        if (status) {
            const statuses = status.split(',');
            query = query.in('status', statuses);
        }

        // Get total count for pagination
        let countQuery = supabase
            .from('konsultasi_spbe')
            .select('*', { count: 'exact', head: true });
        
        // Apply same filters to count query
        if (search) {
            countQuery = countQuery.or(`nama_lengkap.ilike.%${search}%,instansi_organisasi.ilike.%${search}%,asal_kota_kabupaten.ilike.%${search}%,asal_provinsi.ilike.%${search}%,ticket.ilike.%${search}%,jabatan.ilike.%${search}%`);
        }
        if (kategori) {
            const categories = kategori.split(',');
            countQuery = countQuery.in('kategori', categories);
        }
        if (status) {
            const statuses = status.split(',');
            countQuery = countQuery.in('status', statuses);
        }

        const { count: totalCount } = await countQuery;

        // Apply pagination
        if (limit) {
            query = query.limit(parseInt(limit));
        }
        
        if (offset && limit) {
            query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Supabase query error:', error);
            return NextResponse.json(
                { error: 'Gagal mengambil data konsultasi', details: error.message },
                { status: 500 }
            );
        }

        // Additional filtering by units if specified (for UI filter)
        let filteredData = data;
        
        if (unitIds && filteredData) {
            const units = unitIds.split(',').map(id => parseInt(id));
            filteredData = filteredData.filter(item => 
                item.konsultasi_unit?.some((ku: any) => units.includes(ku.unit_id))
            );
        }

        // Transform data untuk format yang lebih mudah digunakan
        const transformedData = filteredData?.map(item => ({
            ...item,
            // Flatten PIC data
            pic_name: item.pic_list?.nama_pic || null,
            
            // Transform unit data menjadi array yang lebih simple
            units: item.konsultasi_unit?.map((ku: any) => ({
                unit_id: ku.unit_id,
                unit_name: ku.unit_penanggungjawab?.nama_unit || null,
                unit_pic_name: ku.unit_penanggungjawab?.nama_pic || null
            })) || [],
            
            // Transform topik data menjadi array yang lebih simple
            topics: item.konsultasi_topik?.map((kt: any) => ({
                topik_id: kt.topik_id,
                topik_name: kt.topik_konsultasi?.nama_topik || null
            })) || [],
            
            // Remove nested objects untuk cleaner response
            pic_list: undefined,
            konsultasi_unit: undefined,
            konsultasi_topik: undefined
        }));

        console.log(`Admin API - Returning ${transformedData?.length || 0} items for SuperAdmin`);

        return NextResponse.json({
            success: true,
            data: transformedData,
            debug: {
                userUnitIds,
                isSuperAdmin: true,
                totalCount,
                filteredCount: filteredData?.length || 0,
                accessLevel: 'superadmin-full-access'
            },
            pagination: {
                total: totalCount || 0,
                limit: limit ? parseInt(limit) : filteredData?.length || 0,
                offset: offset ? parseInt(offset) : 0,
                hasNext: totalCount ? (parseInt(offset || '0') + (parseInt(limit || String(totalCount)))) < totalCount : false
            },
            message: `Berhasil mengambil ${filteredData?.length || 0} dari ${totalCount || 0} data konsultasi (akses SuperAdmin penuh)`
        });
    } catch (error) {
        console.error("Error in GET /api/v1/konsultasi/admin:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
