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
        const { data: userUnits, error: unitsError } = await supabase
            .from("user_unit_penanggungjawab")
            .select("unit_id")
            .eq("user_id", user.id);

        if (unitsError) {
            console.error('Error fetching user units:', unitsError);
        }

        userUnitIds = userUnits?.map((u) => u.unit_id) || [];

        // Check if user is superadmin (has unit_id = 1)
        isSuperAdmin = userUnitIds.includes(1);

        console.log('Unit Filtered API - User ID:', user.id);
        console.log('Unit Filtered API - User Units:', userUnitIds);
        console.log('Unit Filtered API - Is SuperAdmin:', isSuperAdmin);
        console.log('Unit Filtered API - Units Error:', unitsError);

        // If user has no assigned units and is not superadmin, return empty result
        if (!isSuperAdmin && userUnitIds.length === 0) {
            return NextResponse.json({
                success: true,
                data: [],
                pagination: {
                    total: 0,
                    limit: limit ? parseInt(limit) : 0,
                    offset: offset ? parseInt(offset) : 0,
                    hasNext: false,
                },
                message: "User tidak memiliki unit yang ditugaskan",
            });
        }

        // For superadmin, show all data
        // For non-superadmin, filter by user's units
        let query;
        
        if (isSuperAdmin) {
            console.log('SuperAdmin - showing all data');
            // SuperAdmin gets all data
            query = supabase
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
        } else {
            console.log('Non-SuperAdmin - filtering by user units:', userUnitIds);
            
            // Check if userUnitIds is empty or invalid
            if (userUnitIds.length === 0) {
                console.log('Non-SuperAdmin has no units - returning empty data');
                return NextResponse.json({
                    success: true,
                    data: [],
                    debug: {
                        userUnitIds,
                        isSuperAdmin,
                        totalCount: 0,
                        filteredCount: 0,
                        accessLevel: 'no-units-assigned'
                    },
                    pagination: {
                        total: 0,
                        limit: limit ? parseInt(limit) : 0,
                        offset: offset ? parseInt(offset) : 0,
                        hasNext: false,
                    },
                    message: "User tidak memiliki unit yang ditugaskan",
                });
            }
            
            // Non-SuperAdmin gets only data from their assigned units
            query = supabase
                .from('konsultasi_spbe')
                .select(`
                    *,
                    pic_list:pic_id(
                        id,
                        nama_pic
                    ),
                    konsultasi_unit!inner(
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
                `)
                .in('konsultasi_unit.unit_id', userUnitIds);
        }

        // Apply sorting
        query = query.order(sortBy, { 
            ascending: sortOrder === 'asc',
            nullsFirst: false
        });

        // Apply filters
        if (search) {
            query = query.or(`nama_lengkap.ilike.%${search}%,instansi_organisasi.ilike.%${search}%,asal_kota_kabupaten.ilike.%${search}%,asal_provinsi.ilike.%${search}%,ticket.ilike.%${search}%`);
        }

        if (kategori) {
            const categories = kategori.split(',');
            query = query.in('kategori', categories);
        }

        if (status) {
            const statuses = status.split(',');
            query = query.in('status', statuses);
        }

        // Get total count for pagination with same conditions
        let countQuery;
        
        if (isSuperAdmin) {
            // Count for superadmin
            countQuery = supabase
                .from('konsultasi_spbe')
                .select('*', { count: 'exact', head: true });
        } else {
            // Count for non-superadmin
            countQuery = supabase
                .from('konsultasi_spbe')
                .select('*, konsultasi_unit!inner(unit_id)', { count: 'exact', head: true })
                .in('konsultasi_unit.unit_id', userUnitIds);
        }
        
        // Apply same filters to count query
        if (search) {
            countQuery = countQuery.or(`nama_lengkap.ilike.%${search}%,instansi_organisasi.ilike.%${search}%,asal_kota_kabupaten.ilike.%${search}%,asal_provinsi.ilike.%${search}%,ticket.ilike.%${search}%`);
        }
        if (kategori) {
            const categories = kategori.split(',');
            countQuery = countQuery.in('kategori', categories);
        }
        if (status) {
            const statuses = status.split(',');
            countQuery = countQuery.in('status', statuses);
        }

        const { count: totalCount, error: countError } = await countQuery;
        
        if (countError) {
            console.error('Count query error:', countError);
        }

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
            console.error('Query details:', {
                isSuperAdmin,
                userUnitIds,
                search,
                kategori,
                status,
                unitIds
            });
            return NextResponse.json(
                { error: 'Gagal mengambil data konsultasi', details: error.message },
                { status: 500 }
            );
        }

        console.log('Query executed successfully, data length:', data?.length || 0);

        // Additional filtering by units if specified (for UI filter)
        let filteredData = data;
        
        if (unitIds && filteredData) {
            const units = unitIds.split(',').map(id => parseInt(id));
            
            if (isSuperAdmin) {
                // SuperAdmin can filter by any unit
                filteredData = filteredData.filter(item => 
                    item.konsultasi_unit?.some((ku: any) => units.includes(ku.unit_id))
                );
            } else {
                // Non-SuperAdmin can only filter by their own units
                const allowedUnits = units.filter(unitId => userUnitIds.includes(unitId));
                if (allowedUnits.length > 0) {
                    filteredData = filteredData.filter(item => 
                        item.konsultasi_unit?.some((ku: any) => allowedUnits.includes(ku.unit_id))
                    );
                }
            }
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

        console.log(`Unit Filtered API - Returning ${transformedData?.length || 0} items for ${isSuperAdmin ? 'SuperAdmin' : 'Non-SuperAdmin'}`);

        return NextResponse.json({
            success: true,
            data: transformedData,
            debug: {
                userUnitIds,
                isSuperAdmin,
                totalCount,
                filteredCount: filteredData?.length || 0,
                accessLevel: isSuperAdmin ? 'superadmin' : 'unit-restricted'
            },
            pagination: {
                total: totalCount || 0,
                limit: limit ? parseInt(limit) : filteredData?.length || 0,
                offset: offset ? parseInt(offset) : 0,
                hasNext: totalCount ? (parseInt(offset || '0') + (parseInt(limit || String(totalCount)))) < totalCount : false
            },
            message: `Berhasil mengambil ${filteredData?.length || 0} dari ${totalCount || 0} data konsultasi${!isSuperAdmin ? ' berdasarkan unit yang ditugaskan' : ' (akses penuh)'}`
        });
    } catch (error) {
        console.error("Error in GET /api/v1/konsultasi/unit-filtered:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
