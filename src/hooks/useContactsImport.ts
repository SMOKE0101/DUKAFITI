import { useState, useCallback } from 'react';
import { useToast } from './use-toast';

export interface ContactData {
  id: string;
  name: string;
  phone: string;
  email?: string;
  selected: boolean;
}

export interface ImportedCustomerData {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalPurchases: number;
  outstandingDebt: number;
  creditLimit: number;
  riskRating: 'low' | 'medium' | 'high';
}

export const useContactsImport = () => {
  const [contacts, setContacts] = useState<ContactData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const requestContactsPermission = useCallback(async (): Promise<boolean> => {
    try {
      // Check if we're in a supported environment
      if (!('contacts' in navigator) && !('ContactsManager' in window)) {
        console.log('Contacts API not supported, using mock data for demo');
        return true; // Allow mock data for demo
      }

      // For now, we'll use mock data since Contacts API is limited
      return true;
    } catch (error) {
      console.error('Error requesting contacts permission:', error);
      setError('Failed to access contacts');
      return false;
    }
  }, []);

  const loadContacts = useCallback(async (): Promise<ContactData[]> => {
    setLoading(true);
    setError(null);

    try {
      // Check permission first
      const hasPermission = await requestContactsPermission();
      if (!hasPermission) {
        return [];
      }

      // Since the Contacts API is not widely supported, we'll use mock data
      // In a real implementation, you would use the Contacts API or Capacitor Contacts plugin
      const mockContacts: ContactData[] = [
        {
          id: '1',
          name: 'John Doe',
          phone: '+254701234567',
          email: 'john.doe@example.com',
          selected: false,
        },
        {
          id: '2',
          name: 'Jane Smith',
          phone: '+254708765432',
          email: 'jane.smith@example.com',
          selected: false,
        },
        {
          id: '3',
          name: 'Mike Johnson',
          phone: '+254703456789',
          selected: false,
        },
        {
          id: '4',
          name: 'Sarah Wilson',
          phone: '+254709876543',
          email: 'sarah.wilson@example.com',
          selected: false,
        },
        {
          id: '5',
          name: 'David Brown',
          phone: '+254702345678',
          selected: false,
        },
        {
          id: '6',
          name: 'Emily Davis',
          phone: '+254707890123',
          email: 'emily.davis@example.com',
          selected: false,
        },
        {
          id: '7',
          name: 'Robert Miller',
          phone: '+254704567890',
          selected: false,
        },
        {
          id: '8',
          name: 'Lisa Anderson',
          phone: '+254709012345',
          email: 'lisa.anderson@example.com',
          selected: false,
        },
      ];

      setContacts(mockContacts);
      return mockContacts;
    } catch (error) {
      console.error('Error loading contacts:', error);
      setError('Failed to load contacts');
      toast({
        title: "Error",
        description: "Failed to load contacts. Please try again.",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [requestContactsPermission, toast]);

  const toggleContactSelection = useCallback((contactId: string) => {
    setContacts(prev => 
      prev.map(contact => 
        contact.id === contactId 
          ? { ...contact, selected: !contact.selected }
          : contact
      )
    );
  }, []);

  const selectAllContacts = useCallback((selected: boolean) => {
    setContacts(prev => 
      prev.map(contact => ({ ...contact, selected }))
    );
  }, []);

  const getSelectedContacts = useCallback((): ContactData[] => {
    return contacts.filter(contact => contact.selected);
  }, [contacts]);

  const convertContactsToCustomers = useCallback((selectedContacts: ContactData[]): ImportedCustomerData[] => {
    return selectedContacts.map(contact => ({
      name: contact.name,
      phone: contact.phone,
      email: contact.email || null,
      address: null,
      totalPurchases: 0,
      outstandingDebt: 0,
      creditLimit: 1000, // Default credit limit
      riskRating: 'low' as const,
    }));
  }, []);

  return {
    contacts,
    loading,
    error,
    loadContacts,
    toggleContactSelection,
    selectAllContacts,
    getSelectedContacts,
    convertContactsToCustomers,
  };
};