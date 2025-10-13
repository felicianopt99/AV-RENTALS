import { PrismaClient } from '@prisma/client';
import { addDays, isBefore, differenceInDays } from 'date-fns';

const prisma = new PrismaClient();

// Types for notification data
interface NotificationData {
  userId: string;
  type: string;
  title: string;
  message: string;
  priority?: 'low' | 'medium' | 'high';
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
}

// Create a notification
export async function createNotification(data: NotificationData) {
  return await prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      priority: data.priority || 'medium',
      entityType: data.entityType,
      entityId: data.entityId,
      actionUrl: data.actionUrl,
    },
  });
}

// Generate notifications for upcoming events
export async function generateEventReminders() {
  const now = new Date();
  const oneWeekFromNow = addDays(now, 7);
  const threeDaysFromNow = addDays(now, 3);
  const oneDayFromNow = addDays(now, 1);

  // Get events in the next week
  const upcomingEvents = await prisma.event.findMany({
    where: {
      startDate: {
        gte: now,
        lte: oneWeekFromNow,
      },
      assignedTo: {
        not: null,
      },
    },
    include: {
      client: true,
    },
  });

  for (const event of upcomingEvents) {
    const daysUntil = differenceInDays(event.startDate, now);
    const userId = event.assignedTo!;

    // Check if notification already exists
    const existing = await prisma.notification.findFirst({
      where: {
        userId,
        type: 'event_reminder',
        entityId: event.id,
      },
    });

    if (existing) continue; // Already notified

    let title = '';
    let message = '';
    let priority: 'low' | 'medium' | 'high' = 'medium';

    if (daysUntil <= 1) {
      title = 'Event Tomorrow';
      message = `Event "${event.name}" with ${event.client?.name} starts tomorrow.`;
      priority = 'high';
    } else if (daysUntil <= 3) {
      title = 'Event in 3 Days';
      message = `Event "${event.name}" with ${event.client?.name} starts in 3 days.`;
      priority = 'medium';
    } else {
      title = 'Event in 1 Week';
      message = `Event "${event.name}" with ${event.client?.name} starts in 1 week.`;
      priority = 'low';
    }

    await createNotification({
      userId,
      type: 'event_reminder',
      title,
      message,
      priority,
      entityType: 'Event',
      entityId: event.id,
      actionUrl: `/events/${event.id}`,
    });
  }
}

// Generate notifications for overbooking conflicts
export async function generateConflictAlerts() {
  // Get all rentals
  const rentals = await prisma.rental.findMany({
    include: {
      event: true,
      equipment: true,
    },
  });

  // Calculate daily usage
  const dailyUsage: Record<string, Record<string, number>> = {};

  for (const rental of rentals) {
    if (!rental.event) continue;
    const start = rental.event.startDate;
    const end = rental.event.endDate;
    const current = new Date(start);

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      if (!dailyUsage[dateStr]) dailyUsage[dateStr] = {};
      if (!dailyUsage[dateStr][rental.equipmentId]) dailyUsage[dateStr][rental.equipmentId] = 0;
      dailyUsage[dateStr][rental.equipmentId] += rental.quantityRented;
      current.setDate(current.getDate() + 1);
    }
  }

  // Check for conflicts
  for (const [dateStr, equipmentUsage] of Object.entries(dailyUsage)) {
    for (const [equipmentId, rented] of Object.entries(equipmentUsage)) {
      const equipment = await prisma.equipmentItem.findUnique({
        where: { id: equipmentId },
      });
      if (!equipment) continue;

      if (rented > equipment.quantity) {
        // Notify admins
        const admins = await prisma.user.findMany({
          where: { role: 'Admin' },
        });

        for (const admin of admins) {
          // Check if already notified
          const existing = await prisma.notification.findFirst({
            where: {
              userId: admin.id,
              type: 'conflict_alert',
              entityId: equipmentId,
              createdAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
              },
            },
          });

          if (!existing) {
            await createNotification({
              userId: admin.id,
              type: 'conflict_alert',
              title: 'Equipment Overbooking Conflict',
              message: `${equipment.name} is overbooked on ${dateStr}. Rented: ${rented}, Available: ${equipment.quantity}`,
              priority: 'high',
              entityType: 'Equipment',
              entityId: equipmentId,
              actionUrl: `/inventory`,
            });
          }
        }
      }
    }
  }
}

// Generate notifications for maintenance due
export async function generateMaintenanceAlerts() {
  const maintenanceItems = await prisma.equipmentItem.findMany({
    where: { status: 'maintenance' },
  });

  for (const item of maintenanceItems) {
    // Notify technicians
    const technicians = await prisma.user.findMany({
      where: { role: 'Technician' },
    });

    for (const tech of technicians) {
      const existing = await prisma.notification.findFirst({
        where: {
          userId: tech.id,
          type: 'maintenance_due',
          entityId: item.id,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      });

      if (!existing) {
        await createNotification({
          userId: tech.id,
          type: 'maintenance_due',
          title: 'Equipment Needs Maintenance',
          message: `${item.name} is marked for maintenance.`,
          priority: 'medium',
          entityType: 'Equipment',
          entityId: item.id,
          actionUrl: `/maintenance`,
        });
      }
    }
  }
}

// Generate notifications for rental prep status changes
export async function generatePrepStatusAlerts() {
  // This would be called when prep status changes
  // For now, placeholder
}

// Generate notifications for overdue rentals
export async function generateOverdueAlerts() {
  const now = new Date();
  const overdueRentals = await prisma.rental.findMany({
    include: {
      event: true,
      equipment: true,
    },
    where: {
      event: {
        endDate: {
          lt: now,
        },
      },
      prepStatus: {
        not: 'checked-in',
      },
    },
  });

  for (const rental of overdueRentals) {
    if (!rental.event) continue;

    // Notify assigned user
    if (rental.event.assignedTo) {
      const existing = await prisma.notification.findFirst({
        where: {
          userId: rental.event.assignedTo,
          type: 'overdue_return',
          entityId: rental.id,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      });

      if (!existing) {
        await createNotification({
          userId: rental.event.assignedTo,
          type: 'overdue_return',
          title: 'Overdue Equipment Return',
          message: `${rental.equipment.name} from event "${rental.event.name}" is overdue for return.`,
          priority: 'high',
          entityType: 'Rental',
          entityId: rental.id,
          actionUrl: `/rentals/${rental.id}`,
        });
      }
    }
  }
}

// Generate notifications for low stock
export async function generateLowStockAlerts() {
  const equipment = await prisma.equipmentItem.findMany();

  for (const item of equipment) {
    const available = item.quantity;
    if (available <= 1) { // Low stock threshold
      const admins = await prisma.user.findMany({
        where: { role: 'Admin' },
      });

      for (const admin of admins) {
        const existing = await prisma.notification.findFirst({
          where: {
            userId: admin.id,
            type: 'low_stock',
            entityId: item.id,
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
        });

        if (!existing) {
          await createNotification({
            userId: admin.id,
            type: 'low_stock',
            title: 'Low Equipment Stock',
            message: `${item.name} has only ${available} units available.`,
            priority: 'medium',
            entityType: 'Equipment',
            entityId: item.id,
            actionUrl: `/inventory`,
          });
        }
      }
    }
  }
}

// Generate notifications for equipment status changes
export async function generateEquipmentStatusAlerts(equipmentId: string, oldStatus: string, newStatus: string) {
  if (oldStatus === newStatus) return;

  const equipment = await prisma.equipmentItem.findUnique({
    where: { id: equipmentId },
  });
  if (!equipment) return;

  const admins = await prisma.user.findMany({
    where: { role: 'Admin' },
  });

  for (const admin of admins) {
    await createNotification({
      userId: admin.id,
      type: 'equipment_status_change',
      title: 'Equipment Status Changed',
      message: `${equipment.name} status changed from ${oldStatus} to ${newStatus}.`,
      priority: 'low',
      entityType: 'Equipment',
      entityId: equipmentId,
      actionUrl: `/equipment/${equipmentId}`,
    });
  }
}

// Generate notifications for new equipment
export async function generateNewEquipmentAlerts(equipmentId: string) {
  const equipment = await prisma.equipmentItem.findUnique({
    where: { id: equipmentId },
  });
  if (!equipment) return;

  const admins = await prisma.user.findMany({
    where: { role: 'Admin' },
  });

  for (const admin of admins) {
    await createNotification({
      userId: admin.id,
      type: 'new_equipment',
      title: 'New Equipment Added',
      message: `${equipment.name} has been added to inventory.`,
      priority: 'low',
      entityType: 'Equipment',
      entityId: equipmentId,
      actionUrl: `/equipment/${equipmentId}`,
    });
  }
}

// Main function to run all generators
export async function generateAllNotifications() {
  try {
    await generateEventReminders();
    await generateConflictAlerts();
    await generateMaintenanceAlerts();
    await generateOverdueAlerts();
    await generateLowStockAlerts();
    console.log('Notifications generated successfully');
  } catch (error) {
    console.error('Error generating notifications:', error);
  }
}
