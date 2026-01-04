'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Select, type SelectOption } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { fetchApi } from '@/lib/api';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

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

  const t = useTranslations('person');
  const tRole = useTranslations('role');
  const tCommon = useTranslations('common');

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
      newErrors.fullName = t('error_name_required');
    } else if (fullName.length < 2) {
      newErrors.fullName = t('error_name_min');
    } else if (fullName.length > 255) {
      newErrors.fullName = t('error_name_max');
    }

    if (fullNameEn && fullNameEn.length > 255) {
      newErrors.fullNameEn = t('error_name_en_max');
    }

    // Validate new role if creating one
    if (isCreatingNewRole) {
      if (!newRoleTitle.trim()) {
        newErrors.newRoleTitle = tRole('error_title_required');
      } else if (newRoleTitle.length < 2) {
        newErrors.newRoleTitle = tRole('error_title_min');
      } else if (newRoleTitle.length > 255) {
        newErrors.newRoleTitle = tRole('error_title_max');
      }

      if (newRoleTitleEn && newRoleTitleEn.length > 255) {
        newErrors.newRoleTitleEn = tRole('error_title_en_max');
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

    let finalRoleId: number | null = roleId ? Number.parseInt(roleId, 10) : null;

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
        setSubmitError(roleResponse.error?.message || tRole('error_create_failed'));
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
      setSubmitError(response.error?.message || t('error_create_failed'));
    }
  };

  const roleOptions: SelectOption[] = roles.map(role => ({
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
      title={
        organizationName
          ? t('add_to_org_title', { organization: organizationName })
          : t('add_title')
      }
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {submitError && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={`${t('full_name')} *`}
            placeholder={t('full_name_placeholder')}
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            error={errors.fullName}
            disabled={loading}
            dir="rtl"
          />

          <Input
            label={t('full_name_en')}
            placeholder={t('full_name_en_placeholder')}
            value={fullNameEn}
            onChange={e => setFullNameEn(e.target.value)}
            error={errors.fullNameEn}
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Textarea
            label={t('biography')}
            placeholder={t('biography_placeholder')}
            value={biography}
            onChange={e => setBiography(e.target.value)}
            disabled={loading}
            dir="rtl"
            rows={3}
          />

          <Textarea
            label={t('biography_en')}
            placeholder={t('biography_en_placeholder')}
            value={biographyEn}
            onChange={e => setBiographyEn(e.target.value)}
            disabled={loading}
            rows={3}
          />
        </div>

        <Input
          label={t('date_of_birth')}
          type="date"
          value={dateOfBirth}
          onChange={e => setDateOfBirth(e.target.value)}
          disabled={loading}
        />

        <div className="border-t border-foreground/10 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-foreground/60">{t('role_assignment')}</h3>
            <button
              type="button"
              onClick={handleToggleNewRole}
              disabled={loading}
              className="text-sm text-accent-primary hover:opacity-80 font-medium disabled:opacity-50"
            >
              {isCreatingNewRole ? t('select_existing_role') : t('create_new_role')}
            </button>
          </div>

          {isCreatingNewRole ? (
            /* New Role Creation Form */
            <div className="space-y-4 p-4 bg-accent-primary/5 rounded-lg border border-accent-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <svg
                  className="w-4 h-4 text-accent-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  aria-label="Plus icon"
                  role="img"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span className="text-sm font-medium text-accent-primary">
                  {t('creating_new_role')}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={`${tRole('title')} *`}
                  placeholder={tRole('title_placeholder')}
                  value={newRoleTitle}
                  onChange={e => setNewRoleTitle(e.target.value)}
                  error={errors.newRoleTitle}
                  disabled={loading}
                  dir="rtl"
                />

                <Input
                  label={tRole('title_en')}
                  placeholder={tRole('title_en_placeholder')}
                  value={newRoleTitleEn}
                  onChange={e => setNewRoleTitleEn(e.target.value)}
                  error={errors.newRoleTitleEn}
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Textarea
                  label={tRole('description')}
                  placeholder={tRole('description_placeholder')}
                  value={newRoleDescription}
                  onChange={e => setNewRoleDescription(e.target.value)}
                  disabled={loading}
                  dir="rtl"
                  rows={2}
                />

                <Textarea
                  label={tRole('description_en')}
                  placeholder={tRole('description_en_placeholder')}
                  value={newRoleDescriptionEn}
                  onChange={e => setNewRoleDescriptionEn(e.target.value)}
                  disabled={loading}
                  rows={2}
                />
              </div>

              <Input
                label={t('start_date')}
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                disabled={loading}
                helperText={t('start_date_helper')}
              />
            </div>
          ) : (
            /* Existing Role Selection */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label={t('role')}
                placeholder={fetchingRoles ? t('loading_roles') : t('role_placeholder')}
                options={roleOptions}
                value={roleId}
                onChange={e => setRoleId(e.target.value)}
                disabled={loading || fetchingRoles}
                helperText={
                  roles.length === 0 && !fetchingRoles ? t('no_roles_helper') : t('role_helper')
                }
              />

              <Input
                label={t('start_date')}
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                disabled={loading || !roleId}
                helperText={t('start_date_helper')}
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-foreground/10">
          <Button type="button" variant="ghost" onClick={handleClose} disabled={loading}>
            {tCommon('cancel')}
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  aria-label={tCommon('loading')}
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
                {t('creating')}
              </span>
            ) : (
              t('create')
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default AddPersonModal;
