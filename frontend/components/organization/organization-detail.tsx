'use client';

import { AddOrganizationModal } from '@/components/graph/add-organization-modal';
import { AddPersonModal } from '@/components/graph/add-person-modal';
import { MobileMenu } from '@/components/layout/mobile-menu';
import { ShareLinkButton } from '@/components/ui/share-link-button';
import type { Organization } from '@/shared/types';
import { motion } from 'framer-motion';
import { ArrowLeft, Building2, Calendar, ChevronRight, Menu, Network, User } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface OrganizationDetailProps {
  organization: Organization;
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: 'easeOut' },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function OrganizationDetail({ organization }: OrganizationDetailProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('organization');
  const commonT = useTranslations('common');
  const tGraph = useTranslations('graph');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAddOrgModalOpen, setIsAddOrgModalOpen] = useState(false);
  const [isAddPersonModalOpen, setIsAddPersonModalOpen] = useState(false);

  const isRtl = locale === 'fa';
  const name = isRtl ? organization.name : organization.nameEn || organization.name;
  const description = isRtl
    ? organization.description
    : organization.descriptionEn || organization.description;
  const createdDate = new Date(organization.createdAt).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className="min-h-screen pt-20 pb-32 md:pt-32 md:pb-32 px-5 md:px-12 max-w-5xl mx-auto font-sans"
    >
      {/* Header / Breadcrumb */}
      <motion.header variants={fadeInUp} className="mb-12 space-y-8">
        <div className="flex items-center justify-between gap-6 border-b border-foreground/5 pb-4 md:pb-6 relative min-h-[6rem]">
          <div className="flex items-center gap-2 z-10">
            <button
              type="button"
              onClick={() => router.push(`/${locale}`)}
              className="flex items-center gap-2 text-sm font-semibold text-foreground/40 hover:text-foreground transition-all group"
              aria-label={commonT('home')}
            >
              <ArrowLeft
                className={`w-4 h-4 transition-transform group-hover:-translate-x-1 ${isRtl ? 'rotate-180 group-hover:translate-x-1' : ''}`}
              />
              <span className="hidden md:inline">{commonT('home')}</span>
            </button>
          </div>

          {/* Mobile Logo - Centered in Header Row */}
          <div className="absolute left-1/2 -translate-x-1/2 md:hidden">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-foreground/[0.02] to-foreground/[0.08] backdrop-blur-sm flex items-center justify-center shrink-0 border border-foreground/10 shadow-sm overflow-hidden transform"
            >
              {organization.logoUrl ? (
                <img src={organization.logoUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-10 h-10 text-foreground/20" />
              )}
            </motion.div>
          </div>

          {/* Graph Button - Right */}
          <div className="flex items-center gap-2 z-10">
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/${locale}/?view=people&organizationUuid=${organization.shareableUuid}`
                )
              }
              className="w-10 h-10 flex items-center justify-center rounded-full bg-foreground/5 hover:bg-foreground/10 text-accent-primary transition-colors"
              aria-label={commonT('viewPeople')}
            >
              <Network size={20} />
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
          {/* Organization Logo (Desktop Only) */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="hidden md:flex w-24 h-24 md:w-32 md:h-32 rounded-[2rem] bg-gradient-to-br from-foreground/[0.02] to-foreground/[0.08] backdrop-blur-sm items-center justify-center shrink-0 border border-foreground/10 shadow-sm overflow-hidden"
          >
            {organization.logoUrl ? (
              <img src={organization.logoUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-12 h-12 text-foreground/20" />
            )}
          </motion.div>

          <div className="space-y-3">
            <motion.h1
              className={`text-4xl md:text-6xl font-black text-foreground tracking-tight ${isRtl ? 'leading-normal' : 'leading-none'}`}
            >
              {name}
            </motion.h1>
            <div className="flex flex-wrap gap-4 text-xs font-bold uppercase tracking-widest text-foreground/40">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>
                  {t('added_on')} {createdDate}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-16">
        <div className="lg:col-span-8">
          {/* Description */}
          <motion.section variants={fadeInUp} className="space-y-6">
            <h2 className="text-[10px] font-black uppercase text-accent-primary tracking-[0.3em]">
              {t('about')}
            </h2>
            <p className="text-lg md:text-xl leading-relaxed text-foreground/80 font-medium whitespace-pre-wrap">
              {description || t('no_description')}
            </p>
          </motion.section>
        </div>

        {/* Sidebar */}
        <motion.aside variants={fadeInUp} className="lg:col-span-4 space-y-10">
          {organization.parent && (
            <div className="p-8 rounded-[2rem] bg-foreground/[0.03] border border-foreground/5 space-y-6">
              <h3 className="text-[10px] font-black uppercase text-foreground/30 tracking-[0.3em]">
                {t('parent_org')}
              </h3>
              <Link
                href={`/${locale}/org/${organization.parent.shareableUuid}`}
                className="flex items-center gap-4 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-foreground/5 group-hover:bg-accent-primary/10 flex items-center justify-center border border-foreground/10 transition-all group-hover:scale-110">
                  <Building2 className="w-6 h-6 text-foreground/60 group-hover:text-accent-primary transition-colors" />
                </div>
                <div className="min-w-0">
                  <span className="block text-sm font-bold group-hover:text-accent-primary transition-colors truncate">
                    {isRtl
                      ? organization.parent.name
                      : organization.parent.nameEn || organization.parent.name}
                  </span>
                  <span className="text-[10px] font-bold text-foreground/30 uppercase tracking-wider">
                    {commonT('organization')}
                  </span>
                </div>
              </Link>
            </div>
          )}

          {/* Quick Stats */}
          <div className="p-8 rounded-[2rem] border border-foreground/10 space-y-6">
            <div className="space-y-8">
              <div>
                <span className="text-[10px] font-black uppercase text-foreground/30 tracking-[0.3em] block mb-2">
                  {t('sub_organizations')}
                </span>
                <span className="text-4xl font-black text-foreground tracking-tight">
                  {(organization.children || []).length}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-black uppercase text-foreground/30 tracking-[0.3em] block mb-2">
                  {t('members')}
                </span>
                <span className="text-4xl font-black text-foreground tracking-tight">
                  {(organization.members || []).length}
                </span>
              </div>
            </div>
          </div>
        </motion.aside>
      </div>

      {/* Sub-Organizations & Members Grids - Full Width */}
      <div className="space-y-16">
        {/* Sub-Organizations */}
        {organization.children && organization.children.length > 0 && (
          <motion.section variants={fadeInUp} className="space-y-6">
            <h2 className="text-[10px] font-black uppercase text-foreground/30 tracking-[0.3em]">
              {t('sub_organizations')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {organization.children.map(child => (
                <Link
                  href={`/${locale}/org/${child.shareableUuid}`}
                  key={child.id}
                  className="block group"
                >
                  <div className="flex items-center gap-4 p-5 rounded-[1.5rem] bg-foreground/[0.03] border border-foreground/5 hover:bg-foreground/10 transition-all group-hover:-translate-y-1 group-hover:shadow-lg">
                    <div className="w-12 h-12 rounded-xl bg-foreground/10 flex items-center justify-center shrink-0 overflow-hidden border border-foreground/10">
                      {child.logoUrl ? (
                        <img
                          src={child.logoUrl}
                          alt={child.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Building2 className="w-6 h-6 text-foreground/40" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm group-hover:text-accent-primary transition-colors truncate">
                        {isRtl ? child.name : child.nameEn || child.name}
                      </h3>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.section>
        )}

        {/* Members */}
        <motion.section variants={fadeInUp} className="space-y-6">
          <h2 className="text-[10px] font-black uppercase text-foreground/30 tracking-[0.3em]">
            {t('members')}
          </h2>
          {organization.members && organization.members.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {organization.members.map(member => (
                <Link
                  href={`/${locale}/person/${member.shareableUuid}`}
                  key={member.id}
                  className="block group"
                >
                  <div className="flex items-center gap-4 p-5 rounded-[1.5rem] bg-foreground/[0.03] border border-foreground/5 hover:bg-foreground/10 transition-all group-hover:-translate-y-1 group-hover:shadow-lg">
                    <div className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center shrink-0 overflow-hidden border border-foreground/10">
                      {member.profileImageUrl ? (
                        <img
                          src={member.profileImageUrl}
                          alt={member.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-foreground/40" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm group-hover:text-accent-primary transition-colors truncate">
                        {isRtl ? member.fullName : member.fullNameEn || member.fullName}
                      </h3>
                      <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest truncate mt-0.5">
                        {isRtl ? member.roleTitle : member.roleTitleEn || member.roleTitle}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-foreground/40 text-sm font-medium italic">{t('no_members')}</p>
          )}
        </motion.section>
      </div>

      {/* Mobile Floating Action Bar */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 md:hidden w-[90%] max-w-sm pointer-events-none"
      >
        <div className="flex items-center gap-3 bg-white/5 backdrop-blur-lg border border-white/10 p-2 px-4 rounded-full pointer-events-auto liquid-glass">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-transparent hover:bg-foreground/5 transition-colors border-none shadow-none text-foreground/40 hover:text-foreground"
              aria-label={commonT('menu')}
            >
              <Menu size={20} />
            </button>
            <ShareLinkButton
              label=""
              copiedLabel=""
              hideLabelOnMobile
              className="w-10 h-10 flex items-center justify-center rounded-full bg-transparent hover:bg-foreground/5 transition-colors border-none shadow-none"
            />
          </div>

          <div className="w-px h-6 bg-foreground/10" />

          <div className="flex-1 flex justify-center">
            <div className="text-[10px] font-bold text-foreground/20 uppercase tracking-widest">
              {commonT('organization')}
            </div>
          </div>
        </div>
      </motion.div>

      <MobileMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        contentType="organization"
        contentId={organization.id}
        customActions={[
          {
            label: tGraph('add_organization'),
            icon: <Building2 size={20} className="text-foreground/80" />,
            onClick: () => {
              setIsMenuOpen(false);
              setIsAddOrgModalOpen(true);
            },
          },
          {
            label: tGraph('add_person'),
            icon: <User size={20} className="text-foreground/80" />,
            onClick: () => {
              setIsMenuOpen(false);
              setIsAddPersonModalOpen(true);
            },
          },
        ]}
      />

      <AddOrganizationModal
        isOpen={isAddOrgModalOpen}
        onClose={() => setIsAddOrgModalOpen(false)}
        onSuccess={() => {
          setIsAddOrgModalOpen(false);
          router.refresh();
        }}
        defaultParentId={organization.id}
        defaultParentName={name}
      />

      <AddPersonModal
        isOpen={isAddPersonModalOpen}
        onClose={() => setIsAddPersonModalOpen(false)}
        onSuccess={() => {
          setIsAddPersonModalOpen(false);
          router.refresh();
        }}
        organizationId={organization.id}
        organizationName={name}
      />
    </motion.div>
  );
}
