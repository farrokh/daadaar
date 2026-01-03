'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Select, type SelectOption } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { fetchApi } from '@/lib/api';
import { useEffect, useState } from 'react';

interface Organization {
  id: number;
  name: string;
  nameEn: string | null;
}

interface AddOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface CreateOrganizationResponse {
  id: number;
  name: string;
  nameEn: string | null;
  description: string | null;
  descriptionEn: string | null;
  parentId: number | null;
}

/**
 * Modal form for creating a new organization.
 *
 * Presents fields for organization name, English name, descriptions, and an optional parent; validates input, submits the creation request, and manages loading/error states.
 *
 * @param isOpen - Whether the modal is visible
 * @param onClose - Called when the modal is closed or canceled
 * @param onSuccess - Called after an organization is successfully created
 */
export function AddOrganizationModal({ isOpen, onClose, onSuccess }: AddOrganizationModalProps) {
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingOrgs, setFetchingOrgs] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch organizations for parent dropdown
  useEffect(() => {
    if (isOpen) {
      fetchOrganizations();
    }
  }, [isOpen]);

  const fetchOrganizations = async () => {
    setFetchingOrgs(true);
    const response = await fetchApi<{ nodes: Array<{ data: Organization }> }>(
      '/graph/organizations'
    );

    if (response.success && response.data) {
      setOrganizations(response.data.nodes.map(node => node.data));
    }
    setFetchingOrgs(false);
  };

  const resetForm = () => {
    setName('');
    setNameEn('');
    setDescription('');
    setDescriptionEn('');
    setParentId('');
    setErrors({});
    setSubmitError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Organization name is required';
    } else if (name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (name.length > 255) {
      newErrors.name = 'Name must not exceed 255 characters';
    }

    if (nameEn && nameEn.length > 255) {
      newErrors.nameEn = 'English name must not exceed 255 characters';
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

    const response = await fetchApi<CreateOrganizationResponse>('/organizations', {
      method: 'POST',
      body: JSON.stringify({
        name: name.trim(),
        nameEn: nameEn.trim() || null,
        description: description.trim() || null,
        descriptionEn: descriptionEn.trim() || null,
        parentId: parentId ? Number.parseInt(parentId, 10) : null,
      }),
    });

    setLoading(false);

    if (response.success) {
      resetForm();
      onSuccess();
      onClose();
    } else {
      setSubmitError(response.error?.message || 'Failed to create organization');
    }
  };

  const parentOptions: SelectOption[] = organizations.map(org => ({
    value: org.id,
    label: org.nameEn ? `${org.name} (${org.nameEn})` : org.name,
  }));

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New Organization" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {submitError && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Organization Name *"
            placeholder="نام سازمان"
            value={name}
            onChange={e => setName(e.target.value)}
            error={errors.name}
            disabled={loading}
            dir="rtl"
          />

          <Input
            label="Name (English)"
            placeholder="Organization name"
            value={nameEn}
            onChange={e => setNameEn(e.target.value)}
            error={errors.nameEn}
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Textarea
            label="Description"
            placeholder="توضیحات سازمان..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            disabled={loading}
            dir="rtl"
            rows={3}
          />

          <Textarea
            label="Description (English)"
            placeholder="Organization description..."
            value={descriptionEn}
            onChange={e => setDescriptionEn(e.target.value)}
            disabled={loading}
            rows={3}
          />
        </div>

        <Select
          label="Parent Organization"
          placeholder={
            fetchingOrgs ? 'Loading organizations...' : 'Select parent organization (optional)'
          }
          options={parentOptions}
          value={parentId}
          onChange={e => setParentId(e.target.value)}
          disabled={loading || fetchingOrgs}
          helperText="Leave empty for a top-level organization"
        />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="ghost" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  aria-label="Loading"
                  role="img"
                >
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
              'Create Organization'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default AddOrganizationModal;