'use client';

import { Tab } from '@headlessui/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { OrganizationList } from '@/components/organizations/OrganizationList';
import { ContactList } from '@/components/contacts/ContactList';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function ClientPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'individus') {
      setSelectedIndex(1);
    }
  }, [searchParams]);

  const handleTabChange = (index: number) => {
    const newTab = index === 0 ? 'entreprises' : 'individus';
    router.push(`/clients?tab=${newTab}`, { scroll: false });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">CRM</h1>
            <p className="mt-2 text-sm text-gray-700">
              Gérez vos entreprises et contacts clients
            </p>
          </div>
        </div>

        <div className="mt-8">
          <Tab.Group selectedIndex={selectedIndex} onChange={handleTabChange}>
            <Tab.List className="flex space-x-1 rounded-xl bg-white p-1 shadow-sm">
              <Tab
                className={({ selected }) =>
                  classNames(
                    'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                    'ring-white ring-opacity-60 ring-offset-2 focus:outline-none',
                    selected
                      ? 'bg-orbit-600 text-white shadow'
                      : 'text-gray-700 hover:bg-gray-100'
                  )
                }
              >
                Entreprises
              </Tab>
              <Tab
                className={({ selected }) =>
                  classNames(
                    'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                    'ring-white ring-opacity-60 ring-offset-2 focus:outline-none',
                    selected
                      ? 'bg-orbit-600 text-white shadow'
                      : 'text-gray-700 hover:bg-gray-100'
                  )
                }
              >
                Individus
              </Tab>
            </Tab.List>
            <Tab.Panels className="mt-4">
              <Tab.Panel>
                <OrganizationList />
              </Tab.Panel>
              <Tab.Panel>
                <ContactList />
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>

      {/* Bouton flottant d'ajout */}
      <button
        type="button"
        className="fixed bottom-8 right-8 inline-flex items-center rounded-full bg-orbit-600 p-3 text-white shadow-sm hover:bg-orbit-500 focus:outline-none focus:ring-2 focus:ring-orbit-500 focus:ring-offset-2"
        onClick={() => {
          if (selectedIndex === 0) {
            router.push('/organizations/new');
          } else {
            router.push('/contacts/new');
          }
        }}
      >
        <PlusIcon className="h-6 w-6" aria-hidden="true" />
      </button>
    </div>
  );
} 