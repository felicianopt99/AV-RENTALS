"use client";

import { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { PlusCircle, Package, Users, CalendarClock, Wrench, FileText, PartyPopper } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { isFuture } from 'date-fns';
import { FloatingActionButton } from '@/components/ui/FloatingActionButton';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ElementType; description?: string, href?: string }> = ({ title, value, icon: Icon, description, href }) => {
  const cardContent = (
    <Card className="shadow-sm hover:shadow-md hover:border-border/50 transition-all duration-200 transform hover:-translate-y-0.5 bg-card/50 border-border/30">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
  
  return href ? <Link href={href}>{cardContent}</Link> : cardContent;
};


export default function DashboardPage() {
  const { equipment, clients, events, quotes, rentals, isDataLoaded, user } = useAppContext();
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);

  const analyticsData = useMemo(() => {
    if (!isDataLoaded) return { 
      totalEquipment: 0, 
      totalClients: 0, 
      upcomingEvents: 0, 
      totalRentals: 0,
    };

    return {
      totalEquipment: equipment.length,
      totalClients: clients.length,
      upcomingEvents: events.filter(event => isFuture(new Date(event.date))).length,
      totalRentals: rentals.length,
    };
  }, [equipment, clients, events, rentals, isDataLoaded]);

  useEffect(() => {
    const handleScroll = () => {
      setIsHeaderCollapsed(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isDataLoaded) {
    return (
        <div className="flex flex-col min-h-screen">
            <AppHeader title="Dashboard" />
            <div className="flex-grow flex items-center justify-center p-4 md:p-6">
                <p className="text-lg text-muted-foreground">Loading dashboard data...</p>
            </div>
        </div>
    );
  }

  return (
      <div className="flex flex-col h-full">
          <AppHeader title="Dashboard" className={isHeaderCollapsed ? 'collapsed' : ''}>
            <h1 className="text-xl font-bold">Welcome, {user?.name || 'User'}!</h1>
          </AppHeader>
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8">
            
            {/* Quick Access Cards */}
            <div className="grid grid-cols-2 gap-4 p-4">
              <StatCard title="Equipment" value={analyticsData.totalEquipment} icon={Package} href="/equipment" />
              <StatCard title="Clients" value={analyticsData.totalClients} icon={Users} href="/clients" />
              <StatCard title="Events" value={analyticsData.upcomingEvents} icon={CalendarClock} href="/events" />
              <StatCard title="Rentals" value={analyticsData.totalRentals} icon={FileText} href="/rentals" />
            </div>

            {/* Floating Action Button */}
            <FloatingActionButton icon={PlusCircle} onClick={() => alert('New Rental')} />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="lg:col-span-3 shadow-xl">
                    <CardHeader>
                        <CardTitle>Monthly Revenue</CardTitle>
                        <CardDescription>Revenue from accepted quotes over the last 6 months.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        {/* <RevenueChart data={analyticsData.monthlyRevenue} /> */}
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2 shadow-xl">
                    <CardHeader>
                        <CardTitle>Top Clients by Revenue</CardTitle>
                        <CardDescription>Your most valuable clients based on accepted quotes.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        {/* <TopClientsChart data={analyticsData.topClients} /> */}
                    </CardContent>
                </Card>
                <Card className="shadow-xl">
                    <CardHeader>
                        <CardTitle>Most Rented Equipment</CardTitle>
                        <CardDescription>The most popular items in your inventory.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* <TopEquipmentChart data={analyticsData.topEquipment} /> */}
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-xl border-border/60">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Get started by creating new items or managing your inventory.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <Button asChild size="lg" variant="outline" className="w-full h-20 text-base justify-start p-4 hover:bg-accent hover:text-accent-foreground">
                  <Link href="/equipment/new">
                    <PlusCircle className="mr-3 h-6 w-6 text-primary" /> Add New Equipment
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="w-full h-20 text-base justify-start p-4 hover:bg-accent hover:text-accent-foreground">
                  <Link href="/events">
                    <PartyPopper className="mr-3 h-6 w-6 text-primary" /> Manage Events
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="w-full h-20 text-base justify-start p-4 hover:bg-accent hover:text-accent-foreground">
                  <Link href="/quotes/new">
                    <FileText className="mr-3 h-6 w-6 text-primary" /> Create New Quote
                  </Link>
                </Button>
              </CardContent>
            </Card>
            
          </div>
      </div>
  );
}
