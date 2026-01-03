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

    const response = await fetchApi<CreateIndividualResponse>('/individuals', {
      method: 'POST',
      body: JSON.stringify({
        fullName: fullName.trim(),
        fullNameEn: fullNameEn.trim() || null,
        biography: biography.trim() || null,
        biographyEn: biographyEn.trim() || null,
        dateOfBirth: dateOfBirth || null,
        roleId: roleId ? parseInt(roleId, 10) : null,
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
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Role Assignment (Optional)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Role"
              placeholder={fetchingRoles ? 'Loading roles...' : 'Select role (optional)'}
              options={roleOptions}
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              disabled={loading || fetchingRoles}
              helperText="Assign a role in this organization"
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

