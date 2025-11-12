import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// PATCH /api/admin/translations/bulk - Bulk approve/reject translations
export async function PATCH(request: NextRequest) {
  try {
    const { ids, action } = await request.json();
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Translation IDs are required' },
        { status: 400 }
      );
    }

    if (!action || !['approve', 'reject', 'review'].includes(action)) {
      return NextResponse.json(
        { error: 'Valid action is required (approve, reject, review)' },
        { status: 400 }
      );
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    switch (action) {
      case 'approve':
        updateData.status = 'approved';
        updateData.needsReview = false;
        break;
      case 'reject':
        updateData.status = 'rejected';
        updateData.needsReview = false;
        break;
      case 'review':
        updateData.needsReview = true;
        updateData.status = 'pending_review';
        break;
    }

    const result = await prisma.translation.updateMany({
      where: {
        id: {
          in: ids,
        },
      },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      updated: result.count,
      message: `${result.count} translation(s) ${action}d successfully`,
    });
  } catch (error) {
    console.error('Bulk update error:', error);
    return NextResponse.json(
      { error: 'Failed to update translations' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/translations/bulk - Bulk delete translations
export async function DELETE(request: NextRequest) {
  try {
    const { ids } = await request.json();
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Translation IDs are required' },
        { status: 400 }
      );
    }

    const result = await prisma.translation.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return NextResponse.json({
      success: true,
      deleted: result.count,
      message: `${result.count} translation(s) deleted successfully`,
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete translations' },
      { status: 500 }
    );
  }
}