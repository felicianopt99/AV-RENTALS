// src/components/quotes/QuotePDFTemplate.tsx
"use client";

import React from 'react';
import { format } from 'date-fns';
import type { Quote } from '@/types';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface QuotePDFTemplateProps {
  quote: Quote;
  className?: string;
}

export function QuotePDFTemplate({ quote, className = "" }: QuotePDFTemplateProps) {
  // Calculate totals for display
  const subtotal = quote.subTotal || 0;
  const discountAmount = quote.discountType === 'percentage' 
    ? (subtotal * (quote.discountAmount / 100))
    : quote.discountAmount;
  const discountedSubtotal = subtotal - discountAmount;
  const taxAmount = quote.taxAmount || 0;
  const totalAmount = quote.totalAmount || 0;

  return (
    <div id="quote-pdf-template" className={`bg-white text-gray-900 max-w-4xl mx-auto ${className}`}>
      {/* Header Section */}
      <div className="mb-8 pb-6 border-b-2 border-gray-200">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">QUOTE</h1>
            <div className="text-sm text-gray-600 space-y-1">
              <p className="font-semibold text-gray-900">{quote.quoteNumber}</p>
              <p>Date: {format(new Date(), 'MMMM d, yyyy')}</p>
              <p>Valid Until: {format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'MMMM d, yyyy')}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-gray-900 mb-4">AV RENTALS</div>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Professional AV Equipment Rental</p>
              <p>info@av-rentals.com</p>
              <p>+1 (555) 123-4567</p>
              <p>www.av-rentals.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quote Information */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{quote.name}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Client Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3 border-b border-gray-200 pb-1">Client Information</h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Name:</span> {quote.clientName}</p>
              {quote.clientEmail && <p><span className="font-medium">Email:</span> {quote.clientEmail}</p>}
              {quote.clientPhone && <p><span className="font-medium">Phone:</span> {quote.clientPhone}</p>}
              {quote.clientAddress && <p><span className="font-medium">Address:</span> {quote.clientAddress}</p>}
            </div>
          </div>

          {/* Event Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3 border-b border-gray-200 pb-1">Event Details</h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Location:</span> {quote.location}</p>
              <p><span className="font-medium">Start Date:</span> {format(new Date(quote.startDate), 'MMMM d, yyyy')}</p>
              <p><span className="font-medium">End Date:</span> {format(new Date(quote.endDate), 'MMMM d, yyyy')}</p>
              <p><span className="font-medium">Duration:</span> {Math.ceil((new Date(quote.endDate).getTime() - new Date(quote.startDate).getTime()) / (1000 * 60 * 60 * 24))} day(s)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Equipment Items */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4 border-b border-gray-200 pb-1">Equipment & Services</h3>
        <div className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Item</th>
                <th className="text-center py-3 px-2 font-medium text-gray-900">Qty</th>
                <th className="text-right py-3 px-2 font-medium text-gray-900">Rate/Day</th>
                <th className="text-center py-3 px-2 font-medium text-gray-900">Days</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900">Total</th>
              </tr>
            </thead>
            <tbody>
              {quote.items.map((item, index) => (
                <tr key={item.id || index} className="border-b border-gray-100 hover:bg-gray-25">
                  <td className="py-3 px-4 text-gray-900">{item.equipmentName || 'Equipment Item'}</td>
                  <td className="py-3 px-2 text-center text-gray-700">{item.quantity || 1}</td>
                  <td className="py-3 px-2 text-right text-gray-700">€{(item.unitPrice || 0).toFixed(2)}</td>
                  <td className="py-3 px-2 text-center text-gray-700">{item.days || 1}</td>
                  <td className="py-3 px-4 text-right font-medium text-gray-900">€{item.lineTotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="mb-8">
        <div className="flex justify-end">
          <div className="w-full max-w-sm">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Subtotal:</span>
                  <span className="font-medium text-gray-900">€{subtotal.toFixed(2)}</span>
                </div>
                
                {quote.discountAmount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>
                      Discount {quote.discountType === 'percentage' 
                        ? `(${quote.discountAmount}%):` 
                        : ':'
                      }
                    </span>
                    <span>-€{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-700">Net Amount:</span>
                  <span className="font-medium text-gray-900">€{discountedSubtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-700">Tax ({((quote.taxRate || 0) * 100).toFixed(1)}%):</span>
                  <span className="font-medium text-gray-900">€{taxAmount.toFixed(2)}</span>
                </div>
                
                <Separator className="my-2" />
                
                <div className="flex justify-between text-lg">
                  <span className="font-semibold text-gray-900">Total Amount:</span>
                  <span className="font-bold text-gray-900">€{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes Section */}
      {quote.notes && (
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-3 border-b border-gray-200 pb-1">Additional Notes</h3>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{quote.notes}</p>
          </div>
        </div>
      )}

      {/* Terms and Conditions */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-3 border-b border-gray-200 pb-1">Terms & Conditions</h3>
        <div className="text-xs text-gray-600 space-y-2">
          <p>• Equipment must be returned in the same condition as received.</p>
          <p>• Client is responsible for any damage or loss during rental period.</p>
          <p>• Payment is due within 30 days of invoice date.</p>
          <p>• Cancellations must be made 48 hours in advance.</p>
          <p>• Setup and breakdown services are available upon request.</p>
          <p>• This quote is valid for 30 days from the date issued.</p>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-6 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-600 mb-2">
          Thank you for considering AV Rentals for your event needs!
        </p>
        <p className="text-xs text-gray-500">
          For questions about this quote, please contact us at info@av-rentals.com or +1 (555) 123-4567
        </p>
      </div>
    </div>
  );
}