

"use client";

import { useMemo } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { PlusCircle, Package, Users, CalendarClock, Wrench, GanttChartSquare, FileText, PartyPopper } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { isFuture, isWithinInterval, addDays, startOfDay } from 'date-fns';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ElementType; description?: string, href?: string }> = ({ title, value, icon: Icon, description, href }) => {
  const cardContent = (
    <Card className="shadow-lg hover:shadow-primary/20 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
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
  const { equipment, clients, events, rentals, isDataLoaded } = useAppContext();

  const dashboardStats = useMemo(() => {
    if (!isDataLoaded) return { totalEquipment: 0, totalClients: 0, upcomingEvents: 0, maintenanceItems: 0 };
    
    const today = startOfDay(new Date());
    const sevenDaysFromNow = addDays(today, 7);

    const upcomingEventsCount = events.filter(event => {
        const eventStartDate = startOfDay(new Date(event.startDate)); 
        return isFuture(eventStartDate) && 
               isWithinInterval(eventStartDate, { start: today, end: sevenDaysFromNow });
    }).length;

    return {
      totalEquipment: equipment.length,
      totalClients: clients.length,
      upcomingEvents: upcomingEventsCount,
      maintenanceItems: equipment.filter(e => e.status === 'maintenance').length,
    };
  }, [equipment, clients, events, isDataLoaded]);


  if (!isDataLoaded) {
    return (
        <div className="flex flex-col h-screen">
            <AppHeader title="Equipment Dashboard" />
            <div className="flex-grow flex items-center justify-center p-4 md:p-6">
                <p className="text-lg text-muted-foreground">Loading dashboard data...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Dashboard" />
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        
        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Equipment" value={dashboardStats.totalEquipment} icon={Package} href="/inventory" />
          <StatCard title="Total Clients" value={dashboardStats.totalClients} icon={Users} href="/clients" />
          <StatCard title="Upcoming Events" value={dashboardStats.upcomingEvents} icon={CalendarClock} description="In next 7 days" href="/events" />
          <StatCard title="Needs Maintenance" value={dashboardStats.maintenanceItems} icon={Wrench} href="/inventory?status=maintenance" />
        </div>

        <Card className="shadow-xl border-border/60">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started by creating new items or managing your inventory.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Link href="/equipment/new" passHref>
              <Button size="lg" variant="outline" className="w-full h-20 text-base justify-start p-4 hover:bg-primary/5 hover:border-primary">
                <PlusCircle className="mr-3 h-6 w-6 text-primary" /> Add New Equipment
              </Button>
            </Link>
             <Link href="/events" passHref>
               <Button size="lg" variant="outline" className="w-full h-20 text-base justify-start p-4 hover:bg-primary/5 hover:border-primary">
                <PartyPopper className="mr-3 h-6 w-6 text-primary" /> Manage Events
              </Button>
            </Link>
            <Link href="/quotes/new" passHref>
               <Button size="lg" variant="outline" className="w-full h-20 text-base justify-start p-4 hover:bg-primary/5 hover:border-primary">
                <FileText className="mr-3 h-6 w-6 text-primary" /> Create New Quote
              </Button>
            </Link>
          </CardContent>
        </Card>
        
      </div>
    </div>
  );
}
