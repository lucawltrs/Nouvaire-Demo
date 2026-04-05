import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Layers, AlertCircle, Plus, UserPlus, X } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { PageLoader } from '../../../components/ui/PageLoader';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { useAuthStore } from '../../../lib/auth/useAuthStore';
import { ToastContainer, toast } from '../../../lib/toast';
import { groupsApi, type Group, type GroupTeamUser } from '../../../modules/shared/services/groupsApi';
import { teamApi, type TeamMember } from '../../../modules/shared/services/teamApi';

export function GroupsPage() {
  const navigate = useNavigate();
  const { team } = useAuthStore();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // create group modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [formErrors, setFormErrors] = useState<{ name?: string }>({});

  // add member modal
  const [addMemberTarget, setAddMemberTarget] = useState<Group | null>(null);

  // remove member confirm
  const [removeMemberTarget, setRemoveMemberTarget] = useState<{ group: Group; member: GroupTeamUser } | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const fetchGroups = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await groupsApi.list();
      setGroups(data);
    } catch (err) {
      console.error('Failed to fetch groups:', err);
      setError('Failed to load groups. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleOpenCreate = () => {
    setForm({ name: '', description: '' });
    setFormErrors({});
    setIsCreateModalOpen(true);
  };

  const handleCreate = async () => {
    const errors: { name?: string } = {};
    if (!form.name.trim()) errors.name = 'Name is required';
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }
    try {
      setIsSubmitting(true);
      await groupsApi.create({
        name: form.name.trim(),
        ...(form.description.trim() && { description: form.description.trim() }),
      });
      toast.success('Group created successfully');
      setIsCreateModalOpen(false);
      await fetchGroups();
    } catch (err) {
      console.error('Failed to create group:', err);
      toast.error('Failed to create group. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!removeMemberTarget) return;
    try {
      setIsRemoving(true);
      await groupsApi.removeMember(removeMemberTarget.group.id, removeMemberTarget.member.id);
      toast.success('Member removed from group');
      setRemoveMemberTarget(null);
      await fetchGroups();
    } catch (err) {
      console.error('Failed to remove member:', err);
      toast.error('Failed to remove member. Please try again.');
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="space-y-6">
      <ToastContainer />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/settings')}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-slate-700 transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">Groups</h1>
              {team?.team_name && (
                <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-gray-300 border border-slate-600">
                  {team.team_name}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-gray-400">
              {groups.length} group{groups.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <Button onClick={handleOpenCreate} className="flex items-center gap-2">
          <Plus size={16} />
          New Group
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <PageLoader message="Loading groups..." subtitle="Fetching team groups" />
      ) : error ? (
        <Card className="p-6 border border-slate-600">
          <div className="flex items-center gap-3 text-red-400">
            <AlertCircle size={18} />
            <p className="text-sm">{error}</p>
          </div>
        </Card>
      ) : groups.length === 0 ? (
        <Card className="p-10 border border-slate-600 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center">
            <Layers size={22} className="text-brand-primary" />
          </div>
          <p className="text-gray-300 font-medium">No groups yet</p>
          <p className="text-sm text-gray-500">Create your first group to get started.</p>
          <Button onClick={handleOpenCreate} className="mt-2 flex items-center gap-2">
            <Plus size={15} />
            New Group
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {groups.map((group) => (
            <Card key={group.id} className="p-5 border border-slate-600 flex flex-col gap-4">
              {/* Group header */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-brand-primary/10 flex items-center justify-center shrink-0">
                    <Layers size={16} className="text-brand-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-100 truncate">{group.name}</p>
                    {group.description && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{group.description}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setAddMemberTarget(group)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-brand-primary hover:bg-brand-primary/10 transition-all shrink-0"
                  title="Add member"
                >
                  <UserPlus size={15} />
                </button>
              </div>

              {/* Members */}
              {group.team_users.length > 0 ? (
                <ul className="space-y-1.5">
                  {group.team_users.map((tu) => (
                    <li key={tu.id} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg bg-slate-800/60">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-brand-primary/20 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-semibold text-brand-primary">
                            {tu.user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-xs text-gray-300 truncate">{tu.user.name}</span>
                        <span className="text-[10px] text-gray-500 capitalize shrink-0">{tu.role}</span>
                      </div>
                      <button
                        onClick={() => setRemoveMemberTarget({ group, member: tu })}
                        className="p-1 rounded text-gray-600 hover:text-red-400 transition-all shrink-0"
                        title="Remove from group"
                      >
                        <X size={13} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-500 italic">No members yet</p>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Group"
        size="sm"
      >
        <div className="p-4 sm:p-6 space-y-4">
          <Input
            label="Name"
            placeholder="e.g. VIP Users"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            error={formErrors.name}
          />
          <Textarea
            label="Description"
            placeholder="Optional description…"
            rows={3}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Member Modal */}
      <AddMemberModal
        group={addMemberTarget}
        onClose={() => setAddMemberTarget(null)}
        onSaved={fetchGroups}
      />

      {/* Remove Member Confirm Modal */}
      <Modal
        isOpen={!!removeMemberTarget}
        onClose={() => setRemoveMemberTarget(null)}
        title="Remove Member"
        size="sm"
      >
        <div className="p-4 sm:p-6 space-y-4">
          <p className="text-sm text-gray-400">
            Remove <span className="text-gray-200 font-medium">{removeMemberTarget?.member.user.name}</span> from{' '}
            <span className="text-gray-200 font-medium">{removeMemberTarget?.group.name}</span>?
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setRemoveMemberTarget(null)} disabled={isRemoving}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleRemoveMember} disabled={isRemoving}>
              {isRemoving ? 'Removing…' : 'Remove'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Add Member Modal ─────────────────────────────────────────────────────────

interface AddMemberModalProps {
  group: Group | null;
  onClose: () => void;
  onSaved: () => void;
}

function AddMemberModal({ group, onClose, onSaved }: AddMemberModalProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!group) return;
    setSelectedMemberId('');
    setError(null);
    setIsLoadingMembers(true);
    teamApi.getMembers()
      .then(setMembers)
      .catch(() => setError('Failed to load team members.'))
      .finally(() => setIsLoadingMembers(false));
  }, [group]);

  const availableMembers = members.filter(
    (m) => !group?.team_users.some((tu) => tu.id === m.id),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group || !selectedMemberId) {
      setError('Please select a team member.');
      return;
    }
    try {
      setIsSaving(true);
      setError(null);
      await groupsApi.assignMember(group.id, Number(selectedMemberId));
      toast.success('Member added to group');
      onClose();
      onSaved();
    } catch (err) {
      console.error(err);
      setError('Failed to add member. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const memberOptions = availableMembers.map((m) => ({
    value: String(m.id),
    label: m.user.name,
  }));

  return (
    <Modal isOpen={!!group} onClose={onClose} title={`Add Member — ${group?.name}`} size="sm">
      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
        <Select
          label="Team Member"
          options={
            isLoadingMembers
              ? [{ value: '', label: 'Loading…' }]
              : availableMembers.length === 0
              ? [{ value: '', label: 'All members already in group' }]
              : [{ value: '', label: 'Select a member…' }, ...memberOptions]
          }
          value={selectedMemberId}
          onChange={(e) => setSelectedMemberId(e.target.value)}
          disabled={isLoadingMembers || availableMembers.length === 0}
        />

        {error && (
          <p className="text-sm text-red-400 flex items-center gap-1.5">
            <AlertCircle size={14} /> {error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving || !selectedMemberId || isLoadingMembers}>
            {isSaving ? 'Adding…' : 'Add'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
