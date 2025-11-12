"use client";

import { useMemo } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { PlusCircle, Package, Users, CalendarClock, Wrench, FileText, PartyPopper } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { isFuture, isWithinInterval, addDays, startOfDay, format, getMonth, getYear, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { RevenueChart, TopClientsChart, TopEquipmentChart } from '@/components/dashboard/AnalyticsCharts';
import { NotificationsSection } from '@/components/dashboard/NotificationsSection';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useTranslate } from '@/contexts/TranslationContext';

const T = ({ text }: { text: string }) => {
  const { translated } = useTranslate(text);
  return <>{translated}</>;
};

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ElementType; description?: string, href?: string }> = ({ title, value, icon: Icon, description, href }) => {
  const { translated: translatedTitle } = useTranslate(title);
  const { translated: translatedDescription } = useTranslate(description || '');

  const cardContent = (
    <Card className="shadow-lg hover:shadow-primary/20 hover:border-primary/30 transition-all duration-300 transform hover:-translate-y-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{translatedTitle}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{translatedDescription}</p>}
      </CardContent>
    </Card>
  );
  
  return href ? <Link href={href}>{cardContent}</Link> : cardContent;
};


export function DashboardContent() {
  const { equipment, clients, events, quotes, rentals, isDataLoaded, currentUser } = useAppContext();
  const isAdmin = currentUser?.role === 'Admin';

  const getPersonalizedGreeting = () => {
    const hour = new Date().getHours();
    let timeGreeting = 'Hello';
    if (hour < 12) timeGreeting = 'Good morning';
    else if (hour < 18) timeGreeting = 'Good afternoon';
    else timeGreeting = 'Good evening';

    const roleMessages = {
      Admin: 'Ready to manage your team?',
      Manager: 'How can we optimize operations today?',
      Technician: 'What equipment needs your expertise?',
      Employee: 'Let\'s check today\'s schedule!',
      Viewer: 'Stay updated with the latest info.'
    };

    return {
      timeGreeting,
      roleMessage: roleMessages[currentUser?.role as keyof typeof roleMessages] || 'Welcome back!'
    };
  };

  const { timeGreeting, roleMessage } = getPersonalizedGreeting();
  const { translated: translatedTimeGreeting } = useTranslate(timeGreeting);
  const { translated: translatedRoleMessage } = useTranslate(roleMessage);

  const analyticsData = useMemo(() => {
    if (!isDataLoaded) return {
      totalEquipment: 0,
      totalClients: 0,
      upcomingEvents: 0,
      maintenanceItems: 0,
      assignedEventsThisWeek: [],
      monthlyRevenue: [],
      topClients: [],
      topEquipment: []
    };

    const today = startOfDay(new Date());
    const sevenDaysFromNow = addDays(today, 7);
    const weekStart = startOfWeek(today);
    const weekEnd = endOfWeek(today);

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

    // Assigned events this week
    const assignedEventsThisWeek = events.filter(event => {
        const eventStartDate = startOfDay(new Date(event.startDate));
        return event.assignedTo === currentUser?.id &&
               isWithinInterval(eventStartDate, { start: weekStart, end: weekEnd });
    });

    return {
      totalEquipment: equipment.length,
      totalClients: clients.length,
      upcomingEvents: upcomingEventsCount,
      maintenanceItems: equipment.filter(e => e.status === 'maintenance').length,
      assignedEventsThisWeek,
      monthlyRevenue,
      topClients,
      topEquipment,
    };
  }, [equipment, clients, events, quotes, rentals, isDataLoaded, currentUser?.id]);


  if (!isDataLoaded) {
    return (
        <div className="flex flex-col min-h-screen">
            <div className="flex-grow flex items-center justify-center p-4 md:p-6">
                <p className="text-lg text-muted-foreground"><T text="Loading dashboard data..." /></p>
            </div>
        </div>
    );
  }

  return (
      <div className="flex flex-col min-h-screen">
          <ErrorBoundary>
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 md:space-y-8">

              {/* Welcome Section (desktop only) */}
              <Card className="hidden lg:block shadow-xl border-border/60 bg-gradient-to-br from-primary/15 via-secondary/10 to-accent/5">
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 md:space-x-6 mb-4 sm:mb-6 md:mb-8">
                    <Avatar className="h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 ring-2 ring-primary/20 mx-auto sm:mx-0">
                      <AvatarImage src={currentUser?.photoUrl} alt={currentUser?.name} />
                      <AvatarFallback className="text-lg">{currentUser?.name?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="text-center sm:text-left">
                      <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{translatedTimeGreeting}, {currentUser?.name}!</h2>
                      <p className="text-muted-foreground text-xs sm:text-sm md:text-base lg:text-lg">{translatedRoleMessage}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                    <div>
                      <NotificationsSection noCard />
                    </div>
                    <div>
                      <div className="p-3 sm:p-4 md:p-6 pb-2">
                        <h3 className="text-base sm:text-lg font-medium"><T text="Your Events This Week" /></h3>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2"><T text="Events assigned to you for the current week." /></p>
                      </div>
                      <div className="p-3 sm:p-4 md:p-6 pt-0">
                        {analyticsData.assignedEventsThisWeek.length > 0 ? (
                          <div className="space-y-4">
                            {analyticsData.assignedEventsThisWeek.map(event => {
                              const client = clients.find(c => c.id === event.clientId);
                              return (
                                <div key={event.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg hover:bg-accent/50 transition-colors space-y-2 sm:space-y-0">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-sm sm:text-base font-semibold truncate">{event.name}</h4>
                                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                                      {client?.name} • {event.location} • {format(new Date(event.startDate), 'MMM dd, yyyy')}
                                    </p>
                                  </div>
                                  <Button asChild variant="outline" size="sm" className="w-full md:w-auto">
                                    <Link href={`/events/${event.id}`}><T text="View Details" /></Link>
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs sm:text-sm text-muted-foreground"><T text="No events assigned this week." /></p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="shadow-xl border-border/60">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl"><T text="Quick Actions" /></CardTitle>
                  <CardDescription className="text-xs sm:text-sm"><T text="Get started by creating new items or managing your inventory." /></CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 p-4 sm:p-6 pt-0">
                  <Button asChild size="lg" variant="outline" className="h-16 sm:h-20 text-sm sm:text-base justify-start p-3 sm:p-4 hover:bg-accent hover:text-accent-foreground">
                    <Link href="/equipment/new">
                      <PlusCircle className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6 text-blue-600 flex-shrink-0" /> <span className="truncate"><T text="Add New Equipment" /></span>
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="h-16 sm:h-20 text-sm sm:text-base justify-start p-3 sm:p-4 hover:bg-accent hover:text-accent-foreground">
                    <Link href="/events">
                      <PartyPopper className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6 text-blue-600 flex-shrink-0" /> <span className="truncate"><T text="Manage Events" /></span>
                    </Link>
                  </Button>
                  {isAdmin && (
                    <Button asChild size="lg" variant="outline" className="h-16 sm:h-20 text-sm sm:text-base justify-start p-3 sm:p-4 hover:bg-accent hover:text-accent-foreground">
                      <Link href="/quotes/new">
                        <FileText className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6 text-blue-600 flex-shrink-0" /> <span className="truncate"><T text="Create New Quote" /></span>
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>

              <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Equipment" value={analyticsData.totalEquipment} icon={Package} href="/inventory" />
                <StatCard title="Total Clients" value={analyticsData.totalClients} icon={Users} href="/clients" />
                <StatCard title="Upcoming Events" value={analyticsData.upcomingEvents} icon={CalendarClock} description="In next 7 days" href="/events" />
                <StatCard title="Needs Maintenance" value={analyticsData.maintenanceItems} icon={Wrench} href="/maintenance" />
              </div>



              {isAdmin && (
                  <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 lg:grid-cols-3">
                      <Card className="col-span-1 lg:col-span-3 shadow-xl">
                          <CardHeader className="p-4 sm:p-6">
                              <CardTitle className="text-lg sm:text-xl"><T text="Monthly Revenue" /></CardTitle>
                              <CardDescription className="text-xs sm:text-sm"><T text="Revenue from accepted quotes over the last 6 months." /></CardDescription>
                          </CardHeader>
                          <CardContent className="pl-0 sm:pl-2 p-4 sm:p-6 pt-0">
                              <RevenueChart data={analyticsData.monthlyRevenue} />
                          </CardContent>
                      </Card>
                      <Card className="col-span-1 lg:col-span-2 shadow-xl">
                          <CardHeader className="p-4 sm:p-6">
                              <CardTitle className="text-lg sm:text-xl"><T text="Top Clients by Revenue" /></CardTitle>
                              <CardDescription className="text-xs sm:text-sm"><T text="Your most valuable clients based on accepted quotes." /></CardDescription>
                          </CardHeader>
                          <CardContent className="pl-0 sm:pl-2 p-4 sm:p-6 pt-0">
                              <TopClientsChart data={analyticsData.topClients} />
                          </CardContent>
                      </Card>
                      <Card className="col-span-1 lg:col-span-1 shadow-xl">
                          <CardHeader className="p-4 sm:p-6">
                              <CardTitle className="text-lg sm:text-xl"><T text="Most Rented Equipment" /></CardTitle>
                              <CardDescription className="text-xs sm:text-sm"><T text="The most popular items in your inventory." /></CardDescription>
                          </CardHeader>
                          <CardContent className="p-4 sm:p-6 pt-0">
                              <TopEquipmentChart data={analyticsData.topEquipment} />
                          </CardContent>
                      </Card>
                  </div>
              )}

            </div>
          </ErrorBoundary>
      </div>
  );
}
