'use client';

import React, { useState } from 'react';
import { Search, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  organization_id: string;
  organization_name: string;
  preferred_language: 'FR' | 'EN';
  notes: string;
  created_at: string;
}

interface ContactListProps {
  contacts: Contact[];
  onContactClick: (contact: Contact) => void;
}

export const ContactList: React.FC<ContactListProps> = ({
  contacts,
  onContactClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContacts = contacts.filter(contact => {
    const searchLower = searchQuery.toLowerCase();
    return (
      contact.first_name.toLowerCase().includes(searchLower) ||
      contact.last_name.toLowerCase().includes(searchLower) ||
      contact.organization_name.toLowerCase().includes(searchLower) ||
      contact.phone.includes(searchQuery)
    );
  });

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-moon-gray" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-white/10 rounded-lg bg-deep-space text-star-white placeholder-moon-gray focus:outline-none focus:border-nebula-purple"
          placeholder="Rechercher un contact..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="bg-deep-space rounded-xl border border-white/10 overflow-hidden">
        <table className="min-w-full divide-y divide-white/10">
          <thead className="bg-space-black">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-moon-gray uppercase tracking-wider">
                Contact
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-moon-gray uppercase tracking-wider">
                Entreprise
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-moon-gray uppercase tracking-wider">
                Rôle
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-moon-gray uppercase tracking-wider">
                Téléphone
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-moon-gray uppercase tracking-wider">
                Email
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filteredContacts.map((contact) => (
              <motion.tr
                key={contact.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="hover:bg-space-black/50 cursor-pointer transition-colors"
                onClick={() => onContactClick(contact)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-nebula-purple/20 flex items-center justify-center mr-3">
                      <User className="text-nebula-purple" size={16} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-star-white">
                        {contact.first_name} {contact.last_name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-moon-gray">{contact.organization_name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-moon-gray">{contact.role}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-moon-gray">{contact.phone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-moon-gray">{contact.email}</div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}; 