import React, { useEffect, useMemo, useState } from 'react';
import {
  UserPlus,
  Users,
  Shield,
  MoreVertical,
  Search,
  RefreshCw,
  X,
  Check,
  UserCheck,
  UserX,
  Send,
  Pencil,
} from 'lucide-react';

import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import {
  listTeamMembers,
  listDefaultJobRoles,
  inviteTeamMember,
  updateTeamMember,
  setTeamMemberStatus,
  resendInvitation,
  refreshInvitationStatus,
} from '../../services/teamService.js';

const EMPTY_INVITE = {
  name: '',
  email: '',
  whatsappNumber: '',
  role: 'staff',
  jobRole: 'Staff',
  permissions: [],
};

const STATUS_VARIANTS = {
  active: 'success',
  pending: 'gold',
  inactive: 'neutral',
  expired: 'danger',
};

function getStatus(member) {
  if (!member?.isActive) return 'inactive';

  if (
    member.invitationStatus === 'pending' ||
    member.invitationStatus === 'expired'
  ) {
    return member.invitationStatus;
  }

  return 'active';
}

function statusLabel(status) {
  switch (status) {
    case 'active':
      return 'Active';
    case 'pending':
      return 'Invitation pending';
    case 'expired':
      return 'Invitation expired';
    case 'inactive':
      return 'Inactive';
    default:
      return status;
  }
}

function TeamStatusBadge({ member }) {
  const status = getStatus(member);

  return (
    <Badge variant={STATUS_VARIANTS[status] || 'neutral'}>
      {statusLabel(status)}
    </Badge>
  );
}

function formatDate(date) {
  if (!date) return '—';

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return '—';
  }

  return parsed.toLocaleDateString();
}

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export default function Team() {
  const [members, setMembers] = useState([]);
  const [roles, setRoles] = useState([]);

  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [showInvite, setShowInvite] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const [selectedMember, setSelectedMember] = useState(null);

  const [inviteForm, setInviteForm] = useState(EMPTY_INVITE);
  const [editForm, setEditForm] = useState(null);

  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadMembers = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await listTeamMembers({
        page: 1,
        limit: 50,
      });

      const data = response?.data ?? response;

      setMembers(
        Array.isArray(data)
          ? data
          : Array.isArray(data?.members)
            ? data.members
            : Array.isArray(data?.data)
              ? data.data
              : []
      );
    } catch (err) {
      setError(err.message || 'Unable to load team members');
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      setRolesLoading(true);

      const response = await listDefaultJobRoles();

      const data = response?.data ?? response;

      setRoles(
        Array.isArray(data)
          ? data
          : Array.isArray(data?.roles)
            ? data.roles
            : []
      );
    } catch {
      setRoles([]);
    } finally {
      setRolesLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
    loadRoles();
  }, []);

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return members.filter((member) => {
      const status = getStatus(member);

      const matchesStatus =
        statusFilter === 'all' || status === statusFilter;

      if (!matchesStatus) return false;

      if (!query) return true;

      return [
        member.name,
        member.email,
        member.whatsappNumber,
        member.jobRole,
        member.role,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(query)
        );
    });
  }, [members, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: members.length,
      active: members.filter(
        (member) => getStatus(member) === 'active'
      ).length,
      pending: members.filter(
        (member) => getStatus(member) === 'pending'
      ).length,
      inactive: members.filter(
        (member) => getStatus(member) === 'inactive'
      ).length,
    };
  }, [members]);

  const updateInviteField = (field, value) => {
    setInviteForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const openEdit = (member) => {
    setSelectedMember(member);

    setEditForm({
      name: member.name || '',
      email: member.email || '',
      whatsappNumber: member.whatsappNumber || '',
      role: member.role || 'staff',
      jobRole: member.jobRole || 'Staff',
      permissions: Array.isArray(member.permissions)
        ? member.permissions
        : [],
    });

    setShowEdit(true);
  };

  const togglePermission = (permission) => {
    setEditForm((current) => {
      if (!current) return current;

      const exists = current.permissions.includes(permission);

      return {
        ...current,
        permissions: exists
          ? current.permissions.filter(
              (item) => item !== permission
            )
          : [...current.permissions, permission],
      };
    });
  };

  const applyJobRole = (jobRoleKey) => {
    const selectedRole = roles.find(
      (role) => role.key === jobRoleKey
    );

    if (!selectedRole) return;

    setEditForm((current) => ({
      ...current,
      jobRole: selectedRole.name,
      permissions: Array.isArray(selectedRole.permissions)
        ? selectedRole.permissions
        : [],
    }));
  };

  const invite = async (event) => {
    event.preventDefault();

    if (!inviteForm.name.trim()) {
      setError('Staff name is required');
      return;
    }

    if (!inviteForm.whatsappNumber.trim()) {
      setError('WhatsApp number is required');
      return;
    }

    try {
      setSaving(true);
      setError('');

      await inviteTeamMember({
        ...inviteForm,
        name: inviteForm.name.trim(),
        email: inviteForm.email.trim() || undefined,
        whatsappNumber: inviteForm.whatsappNumber.trim(),
      });

      setShowInvite(false);
      setInviteForm(EMPTY_INVITE);

      await loadMembers();
    } catch (err) {
      setError(err.message || 'Unable to invite team member');
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async (event) => {
    event.preventDefault();

    if (!selectedMember || !editForm) return;

    try {
      setSaving(true);
      setError('');

      await updateTeamMember(selectedMember._id || selectedMember.id, {
        ...editForm,
        name: editForm.name.trim(),
        email: editForm.email.trim() || undefined,
        whatsappNumber: editForm.whatsappNumber.trim(),
      });

      setShowEdit(false);
      setSelectedMember(null);
      setEditForm(null);

      await loadMembers();
    } catch (err) {
      setError(err.message || 'Unable to update team member');
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (member) => {
    const memberId = member._id || member.id;

    if (!memberId) return;

    const nextActive = !member.isActive;

    try {
      setActionLoading(true);
      setError('');

      await setTeamMemberStatus(memberId, {
        isActive: nextActive,
      });

      await loadMembers();
    } catch (err) {
      setError(
        err.message || 'Unable to update team member status'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const resend = async (member) => {
    const memberId = member._id || member.id;

    if (!memberId) return;

    try {
      setActionLoading(true);
      setError('');

      await resendInvitation(memberId);
      await loadMembers();
    } catch (err) {
      setError(
        err.message || 'Unable to resend invitation'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const refreshInvitation = async (member) => {
    const memberId = member._id || member.id;

    if (!memberId) return;

    try {
      setActionLoading(true);
      setError('');

      await refreshInvitationStatus(memberId);
      await loadMembers();
    } catch (err) {
      setError(
        err.message || 'Unable to refresh invitation'
      );
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Team & Users
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage staff, roles and the activities they can perform.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => {
            setError('');
            setInviteForm(EMPTY_INVITE);
            setShowInvite(true);
          }}
        >
          <UserPlus size={17} />
          Add Team Member
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError('')}
            className="shrink-0"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gray-100 p-3">
              <Users size={20} />
            </div>

            <div>
              <p className="text-sm text-gray-500">Total Members</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-3">
              <UserCheck size={20} />
            </div>

            <div>
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-2xl font-bold">{stats.active}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-yellow-100 p-3">
              <Send size={20} />
            </div>

            <div>
              <p className="text-sm text-gray-500">Pending Invites</p>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gray-100 p-3">
              <UserX size={20} />
            </div>

            <div>
              <p className="text-sm text-gray-500">Inactive</p>
              <p className="text-2xl font-bold">{stats.inactive}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, WhatsApp, email or role..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-gray-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="pending">Invitation pending</option>
            <option value="expired">Invitation expired</option>
            <option value="inactive">Inactive</option>
          </select>

          <Button
            type="button"
            variant="secondary"
            onClick={loadMembers}
            disabled={loading}
          >
            <RefreshCw size={17} />
            Refresh
          </Button>
        </div>
      </Card>

      {/* Team table */}
      <Card>
        {loading ? (
          <div className="flex min-h-[220px] items-center justify-center text-sm text-gray-500">
            Loading team members...
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
            <Users size={38} className="mb-3 text-gray-300" />

            <h3 className="font-semibold text-gray-900">
              No team members found
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Add your first staff member to start managing your team.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
                  <th className="px-4 py-3 font-medium">Member</th>
                  <th className="px-4 py-3 font-medium">WhatsApp</th>
                  <th className="px-4 py-3 font-medium">Job Role</th>
                  <th className="px-4 py-3 font-medium">System Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Last Login</th>
                  <th className="px-4 py-3 font-medium text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredMembers.map((member) => {
                  const memberId = member._id || member.id;

                  return (
                    <tr
                      key={memberId}
                      className="border-b border-gray-100 last:border-0"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
                            {getInitials(member.name)}
                          </div>

                          <div>
                            <p className="font-medium text-gray-900">
                              {member.name}
                            </p>

                            <p className="text-xs text-gray-500">
                              {member.email || 'No email'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-gray-700">
                        {member.whatsappNumber || '—'}
                      </td>

                      <td className="px-4 py-4">
                        <span className="font-medium text-gray-900">
                          {member.jobRole || 'Staff'}
                        </span>

                        <p className="mt-1 text-xs text-gray-500">
                          {Array.isArray(member.permissions)
                            ? `${member.permissions.length} activities`
                            : '0 activities'}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <Badge
                          variant={
                            member.role === 'admin'
                              ? 'gold'
                              : 'neutral'
                          }
                        >
                          {member.role || 'staff'}
                        </Badge>
                      </td>

                      <td className="px-4 py-4">
                        <TeamStatusBadge member={member} />
                      </td>

                      <td className="px-4 py-4 text-gray-600">
                        {formatDate(member.lastLoginAt)}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            title="Edit member"
                            onClick={() => openEdit(member)}
                            className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
                          >
                            <Pencil size={16} />
                          </button>

                          {(getStatus(member) === 'pending' ||
                            getStatus(member) === 'expired') && (
                            <button
                              type="button"
                              title="Resend invitation"
                              onClick={() => resend(member)}
                              disabled={actionLoading}
                              className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                            >
                              <Send size={16} />
                            </button>
                          )}

                          {getStatus(member) !== 'active' &&
                            getStatus(member) !== 'pending' && (
                              <button
                                type="button"
                                title="Refresh invitation"
                                onClick={() =>
                                  refreshInvitation(member)
                                }
                                disabled={actionLoading}
                                className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                              >
                                <RefreshCw size={16} />
                              </button>
                            )}

                          <button
                            type="button"
                            title={
                              member.isActive
                                ? 'Deactivate member'
                                : 'Activate member'
                            }
                            onClick={() => changeStatus(member)}
                            disabled={actionLoading}
                            className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                          >
                            {member.isActive ? (
                              <UserX size={16} />
                            ) : (
                              <UserCheck size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold">
                  Add Team Member
                </h2>

                <p className="text-sm text-gray-500">
                  Invite staff using their WhatsApp number.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowInvite(false)}
                className="rounded-lg p-2 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={invite} className="space-y-5 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Full name"
                  value={inviteForm.name}
                  onChange={(event) =>
                    updateInviteField('name', event.target.value)
                  }
                  placeholder="Staff name"
                  required
                />

                <Input
                  label="WhatsApp number"
                  value={inviteForm.whatsappNumber}
                  onChange={(event) =>
                    updateInviteField(
                      'whatsappNumber',
                      event.target.value
                    )
                  }
                  placeholder="08012345678"
                  required
                />

                <Input
                  label="Email (optional)"
                  type="email"
                  value={inviteForm.email}
                  onChange={(event) =>
                    updateInviteField('email', event.target.value)
                  }
                  placeholder="staff@example.com"
                />

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    System role
                  </label>

                  <select
                    value={inviteForm.role}
                    onChange={(event) =>
                      updateInviteField(
                        'role',
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                  >
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Job role
                </label>

                <select
                  value={inviteForm.jobRole}
                  onChange={(event) =>
                    updateInviteField(
                      'jobRole',
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                >
                  <option value="Staff">Staff</option>

                  {roles.map((role) => (
                    <option key={role.key} value={role.name}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center gap-2">
                  <Shield size={18} />
                  <p className="font-medium text-gray-900">
                    Activities
                  </p>
                </div>

                <p className="mt-1 text-sm text-gray-500">
                  The selected job role will determine the initial
                  activities assigned to this staff member.
                </p>
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowInvite(false)}
                >
                  Cancel
                </Button>

                <Button type="submit" disabled={saving}>
                  <Send size={17} />
                  {saving ? 'Creating...' : 'Create Invitation'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {showEdit && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold">
                  Edit Team Member
                </h2>

                <p className="text-sm text-gray-500">
                  Configure the staff member's role and activities.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowEdit(false);
                  setSelectedMember(null);
                  setEditForm(null);
                }}
                className="rounded-lg p-2 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveEdit} className="space-y-6 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Full name"
                  value={editForm.name}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  required
                />

                <Input
                  label="WhatsApp number"
                  value={editForm.whatsappNumber}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      whatsappNumber: event.target.value,
                    }))
                  }
                  required
                />

                <Input
                  label="Email"
                  type="email"
                  value={editForm.email}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                />

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    System role
                  </label>

                  <select
                    value={editForm.role}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        role: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                  >
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Job role
                </label>

                <select
                  value={editForm.jobRole}
                  onChange={(event) => {
                    const selected = roles.find(
                      (role) =>
                        role.name === event.target.value
                    );

                    if (selected) {
                      applyJobRole(selected.key);
                    } else {
                      setEditForm((current) => ({
                        ...current,
                        jobRole: event.target.value,
                      }));
                    }
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                >
                  <option value="Staff">Staff</option>

                  {roles.map((role) => (
                    <option key={role.key} value={role.name}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Activities & Permissions
                    </h3>

                    <p className="text-sm text-gray-500">
                      Choose exactly what this staff member can do.
                    </p>
                  </div>

                  <span className="text-sm font-medium text-gray-600">
                    {editForm.permissions.length} selected
                  </span>
                </div>

                <div className="space-y-4">
                  {rolesLoading ? (
                    <p className="text-sm text-gray-500">
                      Loading available roles...
                    </p>
                  ) : (
                    roles.map((role) => (
                      <div
                        key={role.key}
                        className="rounded-lg border border-gray-200 p-4"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              {role.name}
                            </p>

                            <p className="text-xs text-gray-500">
                              {role.permissions?.length || 0}{' '}
                              default activities
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              applyJobRole(role.key)
                            }
                            className="text-xs font-medium text-gray-700 hover:underline"
                          >
                            Use this role
                          </button>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2">
                          {(role.permissions || []).map(
                            (permission) => {
                              const selected =
                                editForm.permissions.includes(
                                  permission
                                );

                              return (
                                <button
                                  key={permission}
                                  type="button"
                                  onClick={() =>
                                    togglePermission(permission)
                                  }
                                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs ${
                                    selected
                                      ? 'border-gray-900 bg-gray-900 text-white'
                                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  {selected ? (
                                    <Check size={14} />
                                  ) : (
                                    <Shield size={14} />
                                  )}

                                  <span>
                                    {permission}
                                  </span>
                                </button>
                              );
                            }
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowEdit(false);
                    setSelectedMember(null);
                    setEditForm(null);
                  }}
                >
                  Cancel
                </Button>

                <Button type="submit" disabled={saving}>
                  <Check size={17} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}