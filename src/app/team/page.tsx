"use client";

import { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import ProfileCard from '@/components/ProfileCard';
import { User } from '@/types';
import { useTranslate } from '@/contexts/TranslationContext';
import '../../components/ProfileCard.css';
import './team.css';

export default function TeamPage() {
  const { isDataLoaded } = useAppContext();
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Translation hooks
  const { translated: ourTeamText } = useTranslate('Our Team');
  const { translated: noTeamMembersText } = useTranslate('No team members have been configured yet.');
  const { translated: adminCanAddText } = useTranslate('Admin can add team members from the Users page.');
  const { translated: viewProfileText } = useTranslate('View Profile');
  const { translated: activeText } = useTranslate('Active');
  const { translated: inactiveText } = useTranslate('Inactive');

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      console.log('Fetching team members...');
      const response = await fetch('/api/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store', // Ensure fresh data
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const users = await response.json();
        console.log('All users:', users);
        // Filter users who are marked as team members
        const teamUsers = users.filter((user: User) => user.isTeamMember && user.isActive);
        console.log('Team members:', teamUsers);
        setTeamMembers(teamUsers);
      } else {
        console.error('Failed to fetch users - Status:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
      // Set empty array to prevent infinite loading
      setTeamMembers([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isDataLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (teamMembers.length === 0) {
    return (
      <div className="team-page">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">{ourTeamText}</h1>
          <div className="text-center py-12">
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {noTeamMembersText}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              {adminCanAddText}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="team-page">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">{ourTeamText}</h1>
        <div className="team-grid">
          {teamMembers.map((member) => (
            <div key={member.id} className="team-card-container">
              <ProfileCard
                avatarUrl={member.teamCoverPhoto || member.photoUrl || '/images/users/user1.jpg'}
                name={member.name}
                title={member.teamTitle || member.role}
                handle={member.username}
                status={member.isActive ? activeText : inactiveText}
                contactText={viewProfileText}
                enableTilt={true}
                mobileTiltSensitivity={3}
                onContactClick={() => {
                  // Navigate to member profile or contact info
                  console.log('Contact:', member.name);
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
