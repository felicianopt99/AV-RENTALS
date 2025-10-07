

"use client";

import { useMemo } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { PlusCircle, Package, Users, CalendarClock, Wrench, FileText, PartyPopper } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { isFuture, isWithinInterval, addDays, startOfDay, format, getMonth, getYear, subMonths } from 'date-fns';
import { RevenueChart, TopClientsChart, TopEquipmentChart } from '@/components/dashboard/AnalyticsCharts';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ElementType; description?: string, href?: string }> = ({ title, value, icon: Icon, description, href }) => {
  const cardContent = (
    <Card className="shadow-lg hover:shadow-primary/20 hover:border-primary/30 transition-all duration-300 transform hover:-translate-y-1">
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
  const { equipment, clients, events, quotes, rentals, isDataLoaded } = useAppContext();

  const analyticsData = useMemo(() => {
    if (!isDataLoaded) return { 
      totalEquipment: 0, 
      totalClients: 0, 
      upcomingEvents: 0, 
      maintenanceItems: 0,
      monthlyRevenue: [],
      topClients: [],
      topEquipment: []
    };
    
    const today = startOfDay(new Date());
    const sevenDaysFromNow = addDays(today, 7);

    const upcomingEventsCount = events.filter(event => {
        const eventStartDate = startOfDay(new Date(event.startDate)); 
        return isFuture(eventStartDate) && 
               isWithinInterval(eventStartDate, { start: today, end: sevenDaysFromNow });
    }).length;

    const acceptedQuotes = quotes.filter(q => q.status === 'Accepted');

    // Monthly Revenue (last 6 months)
    const monthlyRevenue: { month: string; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
        const date = subMonths(today, i);
        const month = getMonth(date);
        const year = getYear(date);
        
        const revenue = acceptedQuotes
            .filter(q => getMonth(new Date(q.createdAt)) === month && getYear(new Date(q.createdAt)) === year)
            .reduce((sum, q) => sum + q.totalAmount, 0);

        monthlyRevenue.push({ month: format(date, 'MMM'), revenue });
    }

    // Top 5 Clients
    const clientRevenue: { [id: string]: { name: string; revenue: number } } = {};
    acceptedQuotes.forEach(q => {
        if (q.clientId) {
            const client = clients.find(c => c.id === q.clientId);
            if(client) {
                if (!clientRevenue[client.id]) {
                    clientRevenue[client.id] = { name: client.name, revenue: 0 };
                }
                clientRevenue[client.id].revenue += q.totalAmount;
            }
        }
    });
    const topClients = Object.values(clientRevenue)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

    // Top 5 Equipment
    const equipmentRentalCount: { [id: string]: { name: string; count: number } } = {};
    rentals.forEach(r => {
        const eq = equipment.find(e => e.id === r.equipmentId);
        if (eq) {
            if (!equipmentRentalCount[eq.id]) {
                equipmentRentalCount[eq.id] = { name: eq.name, count: 0 };
            }
            equipmentRentalCount[eq.id].count += r.quantityRented;
        }
    });
    const topEquipment = Object.values(equipmentRentalCount)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    return {
      totalEquipment: equipment.length,
      totalClients: clients.length,
      upcomingEvents: upcomingEventsCount,
      maintenanceItems: equipment.filter(e => e.status === 'maintenance').length,
      monthlyRevenue,
      topClients,
      topEquipment,
    };
  }, [equipment, clients, events, quotes, rentals, isDataLoaded]);


  if (!isDataLoaded) {
    return (
        <div className="flex flex-col h-screen">
            <AppHeader title="Dashboard" />
            <div className="flex-grow flex items-center justify-center p-4 md:p-6">
                <p className="text-lg text-muted-foreground">Loading dashboard data...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Dashboard" />
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8">
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Equipment" value={analyticsData.totalEquipment} icon={Package} href="/inventory" />
          <StatCard title="Total Clients" value={analyticsData.totalClients} icon={Users} href="/clients" />
          <StatCard title="Upcoming Events" value={analyticsData.upcomingEvents} icon={CalendarClock} description="In next 7 days" href="/events" />
          <StatCard title="Needs Maintenance" value={analyticsData.maintenanceItems} icon={Wrench} href="/maintenance" />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="lg:col-span-3 shadow-xl">
                <CardHeader>
                    <CardTitle>Monthly Revenue</CardTitle>
                    <CardDescription>Revenue from accepted quotes over the last 6 months.</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                    <RevenueChart data={analyticsData.monthlyRevenue} />
                </CardContent>
            </Card>
            <Card className="lg:col-span-2 shadow-xl">
                <CardHeader>
                    <CardTitle>Top Clients by Revenue</CardTitle>
                    <CardDescription>Your most valuable clients based on accepted quotes.</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                    <TopClientsChart data={analyticsData.topClients} />
                </CardContent>
            </Card>
            <Card className="shadow-xl">
                <CardHeader>
                    <CardTitle>Most Rented Equipment</CardTitle>
                    <CardDescription>The most popular items in your inventory.</CardDescription>
                </CardHeader>
                <CardContent>
                    <TopEquipmentChart data={analyticsData.topEquipment} />
                </CardContent>
            </Card>
        </div>

        <Card className="shadow-xl border-border/60">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started by creating new items or managing your inventory.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Link href="/equipment/new" passHref>
              <Button size="lg" variant="outline" className="w-full h-20 text-base justify-start p-4 hover:bg-accent hover:text-accent-foreground">
                <PlusCircle className="mr-3 h-6 w-6 text-primary" /> Add New Equipment
              </Button>
            </Link>
             <Link href="/events" passHref>
               <Button size="lg" variant="outline" className="w-full h-20 text-base justify-start p-4 hover:bg-accent hover:text-accent-foreground">
                <PartyPopper className="mr-3 h-6 w-6 text-primary" /> Manage Events
              </Button>
            </Link>
            <Link href="/quotes/new" passHref>
               <Button size="lg" variant="outline" className="w-full h-20 text-base justify-start p-4 hover:bg-accent hover:text-accent-foreground">
                <FileText className="mr-3 h-6 w-6 text-primary" /> Create New Quote
              </Button>
            </Link>
          </CardContent>
        </Card>
        
      </div>
    </div>
  );
}
