import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - AV Rentals',
  description: 'Sign in to access your AV Rentals account',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Simple layout without navigation for login page
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}