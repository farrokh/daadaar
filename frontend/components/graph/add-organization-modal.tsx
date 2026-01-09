'use client';

import { Button } from '@/components/ui/button';
import { ImageUploader } from '@/components/ui/image-uploader';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { SearchableSelect, type SelectOption } from '@/components/ui/searchable-select';
import { Textarea } from '@/components/ui/textarea';
import { fetchApi } from '@/lib/api';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface Organization {
  id: number;
  name: string;
  nameEn: string | null;
}

interface AddOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultParentId?: number;
  defaultParentName?: string;
}

interface CreateOrganizationResponse {
  id: number;
  name: string;
  nameEn: string | null;
  description: string | null;
  descriptionEn: string | null;
  parentId: number | null;
}

interface OrganizationListResponse {
  organizations: Organization[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function AddOrganizationModal({
  isOpen,
  onClose,
  onSuccess,
  defaultParentId,
  defaultParentName,
}: AddOrganizationModalProps) {
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingOrgs, setFetchingOrgs] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const t = useTranslations('organization');
  const tCommon = useTranslations('common');

  const fetchOrganizations = useCallback(
    async (search: string) => {
      setFetchingOrgs(true);
      const query = new URLSearchParams({
        page: '1',
        limit: '20',
        q: search,
      });

      const response = await fetchApi<OrganizationListResponse>(
        `/organizations?${query.toString()}`
      );

      if (response.success && response.data) {
        const data = response.data;
        if ('organizations' in data) {
          setOrganizations(_prev => {
            // If we have a default parent, ensure we keep it in the list if it's not returned by the API
            // This prevents the label from disappearing when searching
            if (defaultParentId && defaultParentName) {
              const hasDefault = data.organizations.some(o => o.id === defaultParentId);
              if (!hasDefault) {
                return [
                  { id: defaultParentId, name: defaultParentName, nameEn: null },
                  ...data.organizations,
                ];
              }
            }
            return data.organizations;
          });
        }
      }
      setFetchingOrgs(false);
    },
    [defaultParentId, defaultParentName]
  );

  // Handle default parent initialization
  useEffect(() => {
    if (isOpen) {
      if (defaultParentId) {
        setParentId(defaultParentId.toString());
        // We only add it to the list here if we haven't fetched yet,
        // but fetchOrganizations will be called right after anyway.
        // Let's just make sure it's in the initial state so it renders correctly immediately.
        if (defaultParentName) {
          setOrganizations(prev => {
            if (!prev.some(o => o.id === defaultParentId)) {
              return [{ id: defaultParentId, name: defaultParentName, nameEn: null }, ...prev];
            }
            return prev;
          });
        }
      }
      fetchOrganizations('');
    }
  }, [isOpen, fetchOrganizations, defaultParentId, defaultParentName]);

  const resetForm = () => {
    setName('');
    setNameEn('');
    setDescription('');
    setDescriptionEn('');
    setLogoUrl('');
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
      newErrors.name = t('error_name_required');
    } else if (name.length < 2) {
      newErrors.name = t('error_name_min');
    } else if (name.length > 255) {
      newErrors.name = t('error_name_max');
    }

    if (nameEn && nameEn.length > 255) {
      newErrors.nameEn = t('error_name_en_max');
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
        logoUrl: logoUrl || null,
        parentId: parentId ? Number.parseInt(parentId, 10) : null,
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

  const parentOptions: SelectOption[] = useMemo(
    () =>
      organizations.map(org => ({
        value: org.id,
        label: org.nameEn ? `${org.name} (${org.nameEn})` : org.name,
      })),
    [organizations]
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('add_title')} size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {submitError && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={`${t('name')} *`}
            placeholder={t('name_placeholder')}
            value={name}
            onChange={e => setName(e.target.value)}
            error={errors.name}
            disabled={loading}
            dir="rtl"
          />

          <Input
            label={t('name_en')}
            placeholder={t('name_en_placeholder')}
            value={nameEn}
            onChange={e => setNameEn(e.target.value)}
            error={errors.nameEn}
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Textarea
            label={t('description')}
            placeholder={t('description_placeholder')}
            value={description}
            onChange={e => setDescription(e.target.value)}
            disabled={loading}
            dir="rtl"
            rows={3}
          />

          <Textarea
            label={t('description_en')}
            placeholder={t('description_en_placeholder')}
            value={descriptionEn}
            onChange={e => setDescriptionEn(e.target.value)}
            disabled={loading}
            rows={3}
          />
        </div>

        <ImageUploader
          label={t('logo')}
          currentImageUrl={logoUrl}
          onImageUploaded={setLogoUrl}
          disabled={loading}
          helperText={t('logo_helper')}
        />

        <div className="relative z-20">
          <SearchableSelect
            label={t('parent')}
            placeholder={t('parent_placeholder')}
            options={parentOptions}
            value={parentId}
            onChange={value => setParentId(value)}
            onSearch={fetchOrganizations}
            loading={fetchingOrgs}
            disabled={loading}
            helperText={t('parent_helper')}
            emptyMessage={t('no_organizations_found')}
          />
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

export default AddOrganizationModal;
