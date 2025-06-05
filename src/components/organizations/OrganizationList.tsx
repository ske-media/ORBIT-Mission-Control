'use client';

import React from 'react';
import { Building2, Mail, Phone, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

interface Organization {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  type: string;
  industry: string;
  website: string;
  notes: string;
  created_at: string;
}

interface OrganizationListProps {
  organizations: Organization[];
  onOrganizationClick: (organization: Organization) => void;
}

export const OrganizationList: React.FC<OrganizationListProps> = ({
  organizations,
  onOrganizationClick,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {organizations.map((org) => (
        <motion.div
          key={org.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-deep-space rounded-xl border border-white/10 p-6 hover:border-nebula-purple/50 transition-colors cursor-pointer"
          onClick={() => onOrganizationClick(org)}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-nebula-purple/20 flex items-center justify-center">
                <Building2 className="text-nebula-purple" size={20} />
              </div>
              <div>
                <h3 className="text-star-white font-medium">{org.name}</h3>
                <p className="text-sm text-moon-gray">{org.type}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {org.email && (
              <div className="flex items-center gap-2 text-sm text-moon-gray">
                <Mail size={14} />
                <span>{org.email}</span>
              </div>
            )}
            {org.phone && (
              <div className="flex items-center gap-2 text-sm text-moon-gray">
                <Phone size={14} />
                <span>{org.phone}</span>
              </div>
            )}
            {org.address && (
              <div className="flex items-center gap-2 text-sm text-moon-gray">
                <MapPin size={14} />
                <span>{org.address}</span>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between text-sm">
              <span className="text-moon-gray">Secteur</span>
              <span className="text-star-white">{org.industry}</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}; 