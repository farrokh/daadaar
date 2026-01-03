'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, type SelectOption } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { fetchApi } from '@/lib/api';

interface Role {
  id: number;
  title: string;
  titleEn: string | null;
}

interface AddPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  organizationId: number;
  organizationName?: string;
}

interface CreateIndividualResponse {
  id: number;
  fullName: string;
  fullNameEn: string | null;
  biography: string | null;
  biographyEn: string | null;
  dateOfBirth: string | null;
}

interface CreateRoleResponse {
  id: number;
  title: string;
  titleEn: string | null;
  organizationId: number;
}

interface RolesResponse {
  id: number;
  title: string;
  titleEn: string | null;
}

export function AddPersonModal({
  isOpen,
  onClose,
  onSuccess,
  organizationId,
  organizationName,
}: AddPersonModalProps) {
  const [fullName, setFullName] = useState('');
  const [fullNameEn, setFullNameEn] = useState('');
  const [biography, setBiography] = useState('');
  const [biographyEn, setBiographyEn] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [roleId, setRoleId] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingRoles, setFetchingRoles] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // New role creation state
  const [isCreatingNewRole, setIsCreatingNewRole] = useState(false);
  const [newRoleTitle, setNewRoleTitle] = useState('');
  const [newRoleTitleEn, setNewRoleTitleEn] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [newRoleDescriptionEn, setNewRoleDescriptionEn] = useState('');

  // Fetch roles for the organization
  useEffect(() => {
    if (isOpen && organizationId) {
      fetchRoles();
    }
  }, [isOpen, organizationId]);

  const fetchRoles = async () => {
    setFetchingRoles(true);
    const response = await fetchApi<RolesResponse[]>(`/organizations/${organizationId}/roles`);
    
    if (response.success && response.data) {
      setRoles(response.data);
    }
    setFetchingRoles(false);
  };

  const resetForm = () => {
    setFullName('');
    setFullNameEn('');
    setBiography('');
    setBiographyEn('');
    setDateOfBirth('');
    setRoleId('');
    setStartDate('');
    setIsCreatingNewRole(false);
    setNewRoleTitle('');
    setNewRoleTitleEn('');
    setNewRoleDescription('');
    setNewRoleDescriptionEn('');
    setErrors({});
    setSubmitError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (fullName.length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    } else if (fullName.length > 255) {
      newErrors.fullName = 'Name must not exceed 255 characters';
    }

    if (fullNameEn && fullNameEn.length > 255) {
      newErrors.fullNameEn = 'English name must not exceed 255 characters';
    }

    // Validate new role if creating one
    if (isCreatingNewRole) {
      if (!newRoleTitle.trim()) {
        newErrors.newRoleTitle = 'Role title is required';
      } else if (newRoleTitle.length < 2) {
        newErrors.newRoleTitle = 'Role title must be at least 2 characters';
      } else if (newRoleTitle.length > 255) {
        newErrors.newRoleTitle = 'Role title must not exceed 255 characters';
      }

      if (newRoleTitleEn && newRoleTitleEn.length > 255) {
        newErrors.newRoleTitleEn = 'English role title must not exceed 255 characters';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) {
      return;
    }

    setLoading(true);

    let finalRoleId: number | null = roleId ? parseInt(roleId, 10) : null;

    // If creating a new role, create it first
    if (isCreatingNewRole && newRoleTitle.trim()) {
      const roleResponse = await fetchApi<CreateRoleResponse>('/roles', {
        method: 'POST',
        body: JSON.stringify({
          organizationId,
          title: newRoleTitle.trim(),
          titleEn: newRoleTitleEn.trim() || null,
          description: newRoleDescription.trim() || null,
          descriptionEn: newRoleDescriptionEn.trim() || null,
        }),
      });

      if (!roleResponse.success || !roleResponse.data) {
        setLoading(false);
        setSubmitError(roleResponse.error?.message || 'Failed to create role');
        return;
      }

      finalRoleId = roleResponse.data.id;
    }

    // Create the individual
    const response = await fetchApi<CreateIndividualResponse>('/individuals', {
      method: 'POST',
      body: JSON.stringify({
        fullName: fullName.trim(),
        fullNameEn: fullNameEn.trim() || null,
        biography: biography.trim() || null,
        biographyEn: biographyEn.trim() || null,
        dateOfBirth: dateOfBirth || null,
        roleId: finalRoleId,
        organizationId,
        startDate: startDate || null,
      }),
    });

    setLoading(false);

    if (response.success) {
      resetForm();
      onSuccess();
      onClose();
    } else {
      setSubmitError(response.error?.message || 'Failed to create person');
    }
  };

  const roleOptions: SelectOption[] = roles.map((role) => ({
    value: role.id,
    label: role.titleEn ? `${role.title} (${role.titleEn})` : role.title,
  }));

  const handleToggleNewRole = () => {
    setIsCreatingNewRole(!isCreatingNewRole);
    if (!isCreatingNewRole) {
      // Switching to new role mode - clear selected role
      setRoleId('');
    } else {
      // Switching back to select mode - clear new role fields
      setNewRoleTitle('');
      setNewRoleTitleEn('');
      setNewRoleDescription('');
      setNewRoleDescriptionEn('');
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title={organizationName ? `Add Person to ${organizationName}` : 'Add New Person'} 
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {submitError && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Full Name *"
            placeholder="نام کامل"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            error={errors.fullName}
            disabled={loading}
            dir="rtl"
          />

          <Input
            label="Name (English)"
            placeholder="Full name"
            value={fullNameEn}
            onChange={(e) => setFullNameEn(e.target.value)}
            error={errors.fullNameEn}
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Textarea
            label="Biography"
            placeholder="بیوگرافی..."
            value={biography}
            onChange={(e) => setBiography(e.target.value)}
            disabled={loading}
            dir="rtl"
            rows={3}
          />

          <Textarea
            label="Biography (English)"
            placeholder="Biography..."
            value={biographyEn}
            onChange={(e) => setBiographyEn(e.target.value)}
            disabled={loading}
            rows={3}
          />
        </div>

        <Input
          label="Date of Birth"
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          disabled={loading}
        />

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Role Assignment (Optional)
            </h3>
            <button
              type="button"
              onClick={handleToggleNewRole}
              disabled={loading}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium disabled:opacity-50"
            >
              {isCreatingNewRole ? '← Select existing role' : '+ Create new role'}
            </button>
          </div>

          {isCreatingNewRole ? (
            /* New Role Creation Form */
            <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Creating new role
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Role Title *"
                  placeholder="عنوان نقش"
                  value={newRoleTitle}
                  onChange={(e) => setNewRoleTitle(e.target.value)}
                  error={errors.newRoleTitle}
                  disabled={loading}
                  dir="rtl"
                />

                <Input
                  label="Title (English)"
                  placeholder="Role title"
                  value={newRoleTitleEn}
                  onChange={(e) => setNewRoleTitleEn(e.target.value)}
                  error={errors.newRoleTitleEn}
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Textarea
                  label="Role Description"
                  placeholder="توضیحات نقش..."
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  disabled={loading}
                  dir="rtl"
                  rows={2}
                />

                <Textarea
                  label="Description (English)"
                  placeholder="Role description..."
                  value={newRoleDescriptionEn}
                  onChange={(e) => setNewRoleDescriptionEn(e.target.value)}
                  disabled={loading}
                  rows={2}
                />
              </div>

              <Input
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={loading}
                helperText="When did they start this role?"
              />
            </div>
          ) : (
            /* Existing Role Selection */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Role"
                placeholder={fetchingRoles ? 'Loading roles...' : 'Select role (optional)'}
                options={roleOptions}
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                disabled={loading || fetchingRoles}
                helperText={roles.length === 0 && !fetchingRoles ? 'No roles exist yet - create one above!' : 'Assign a role in this organization'}
              />

              <Input
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={loading || !roleId}
                helperText="When did they start this role?"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Creating...
              </span>
            ) : (
              'Add Person'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default AddPersonModal;
