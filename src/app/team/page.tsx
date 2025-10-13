"use client";

import { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import ProfileCard from '@/components/ProfileCard';
import '../../components/ProfileCard.css';

interface TeamMember {
  id: string;
  name: string;
  title: string;
  handle: string;
  status: string;
  avatarUrl: string;
  contactText: string;
}

const sampleTeamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'John Doe',
    title: 'Manager',
    handle: 'johndoe',
    status: 'Active',
    avatarUrl: '/images/users/user1.jpg',
    contactText: 'Contact',
  },
  {
    id: '2',
    name: 'Jane Smith',
    title: 'Technician',
    handle: 'janesmith',
    status: 'Active',
    avatarUrl: '/images/users/user1.jpg',
    contactText: 'Contact',
  },
  {
    id: '3',
    name: 'Bob Johnson',
    title: 'Employee',
    handle: 'bobjohnson',
    status: 'Active',
    avatarUrl: '/images/users/user1.jpg',
    contactText: 'Contact',
  },
];

export default function TeamPage() {
  const { isDataLoaded } = useAppContext();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(sampleTeamMembers);

  useEffect(() => {
    // In a real app, fetch team members from API
    // For now, using sample data
  }, []);

  if (!isDataLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Our Team</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {teamMembers.map((member) => (
          <div key={member.id} className="flex justify-center">
            <ProfileCard
              avatarUrl={member.avatarUrl}
              name={member.name}
              title={member.title}
              handle={member.handle}
              status={member.status}
              contactText={member.contactText}
              enableTilt={true}
              mobileTiltSensitivity={3}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
