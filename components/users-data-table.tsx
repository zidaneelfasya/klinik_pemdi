'use client';

import { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { UserForm } from '@/components/user-form';
import { useUsers } from '@/hooks/useUsers';
import { CreateUserData, UpdateUserData, User } from '@/lib/users-api';
import { Unit, getUnits } from '@/lib/units-api';
import { 
  MoreHorizontal, 
  Plus, 
  Search, 
  UserPlus, 
  Pencil, 
  Trash2,
  Mail,
  Phone,
  Building,
  IdCard
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { SimpleDataTable } from './simple-data-table';


export function UsersDataTable() {
  const {
    users,
    loading,
    error,
    pagination,
    search,
    createUser,
    updateUser,
    deleteUser,
    handlePageChange,
    handleLimitChange,
    handleSearch,
    refresh
  } = useUsers();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [searchInput, setSearchInput] = useState(search);
  const [units, setUnits] = useState<Unit[]>([]);

  useEffect(() => {
    const loadUnits = async () => {
      try {
        const unitsData = await getUnits();
        setUnits(unitsData);
      } catch (error) {
        console.error('Error loading units:', error);
      }
    };

    loadUnits();
  }, []);

  const getUnitName = (unitId: number | null | undefined) => {
    if (!unitId) return null;
    const unit = units.find(u => u.id === unitId);
    return unit?.nama_unit || `Unit ${unitId}`;
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchInput);
  };

  const handleCreateUser = async (data: CreateUserData | UpdateUserData) => {
    return await createUser(data as CreateUserData);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
  };

  const handleDelete = (user: User) => {
    setDeletingUser(user);
  };

  const confirmDelete = async () => {
    if (!deletingUser) return;
    
    await deleteUser(deletingUser.id);
    setDeletingUser(null);
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'full_name',
      header: 'Nama',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex flex-col">
            <span className="font-medium">
              {user.full_name || 'No Name'}
            </span>
            <span className="text-sm text-muted-foreground">
              {user.email}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'nip',
      header: 'NIP',
      cell: ({ row }) => {
        const nip = row.getValue('nip') as string;
        return nip ? (
          <div className="flex items-center gap-1">
            <IdCard className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono text-sm">{nip}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const role = row.original.role as string | undefined;
        const label = role === 'admin' ? 'Admin' : role === 'pic' ? 'PIC' : 'User';
        const variant = role === 'admin' ? 'default' : role === 'pic' ? 'secondary' : 'outline';
        return (
          <Badge variant={variant}>
            {label}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'jabatan',
      header: 'Jabatan',
      cell: ({ row }) => {
        const jabatan = row.getValue('jabatan') as string;
        return jabatan ? (
          <Badge variant="secondary">{jabatan}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: 'satuan_kerja',
      header: 'Satuan Kerja',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex flex-col">
            {user.satuan_kerja && (
              <div className="flex items-center gap-1">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{user.satuan_kerja}</span>
              </div>
            )}
            {user.instansi && (
              <span className="text-xs text-muted-foreground">
                {user.instansi}
              </span>
            )}
            {!user.satuan_kerja && !user.instansi && (
              <span className="text-muted-foreground">-</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'phone',
      header: 'No. Telp',
      cell: ({ row }) => {
        const phone = row.getValue('phone') as string;
        return phone ? (
          <div className="flex items-center gap-1">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{phone}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: 'unit_id',
      header: 'Unit',
      cell: ({ row }) => {
        const unitId = row.getValue('unit_id') as number;
        const unitName = getUnitName(unitId);
        
        return unitName ? (
          <Badge variant="outline" className="text-xs">
            {unitName}
          </Badge>
        ) : (
          <span className="text-muted-foreground">No unit assigned</span>
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => {
        const createdAt = row.getValue('created_at') as string;
        return (
          <span className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
          </span>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const user = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.email || '')}>
                Copy email
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleEdit(user)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit user
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleDelete(user)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete user
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="text-red-600 mb-4">Error loading users: {error}</div>
        <Button onClick={refresh}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage system users and their permissions
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name, email, or NIP..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit">Search</Button>
        {search && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              setSearchInput('');
              handleSearch('');
            }}
          >
            Clear
          </Button>
        )}
      </form>

      {/* Data Table */}
      <SimpleDataTable
        columns={columns}
        data={users}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handleLimitChange}
      />

      {/* Create User Form */}
      <UserForm
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        mode="create"
        onSubmit={handleCreateUser}
      />

      {/* Edit User Form */}
      <UserForm
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
        user={editingUser}
        mode="edit"
        onSubmit={(data) => updateUser(editingUser!.id, data)}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda Yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Pengguna &quot;{deletingUser?.full_name || deletingUser?.email}&quot; dan semua data terkait akan dihapus secara permanen.
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Hapus Pengguna
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
