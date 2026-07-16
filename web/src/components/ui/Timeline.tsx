import React from 'react';
import { Check, Clock, X, Package, Truck, Inbox } from 'lucide-react';

export type TimelineEvent = {
  id: string;
  status: string;
  description?: string;
  timestamp: string;
  user?: string;
  isCompleted: boolean;
  isCurrent?: boolean;
  isError?: boolean;
};

interface TimelineProps {
  events: TimelineEvent[];
}

const getStatusIcon = (status: string, isError?: boolean) => {
  if (isError || status === 'Cancelled' || status === 'Returned') return <X className="w-4 h-4 text-white" />;
  if (status === 'Draft' || status === 'Pending') return <Clock className="w-4 h-4 text-white" />;
  if (status === 'Picking' || status === 'Ready to Pick') return <Package className="w-4 h-4 text-white" />;
  if (status === 'Dispatched' || status === 'In Transit' || status === 'Ready to Ship') return <Truck className="w-4 h-4 text-white" />;
  if (status === 'Received' || status === 'Partially Received') return <Inbox className="w-4 h-4 text-white" />;
  return <Check className="w-4 h-4 text-white" />;
};

export default function Timeline({ events }: TimelineProps) {
  return (
    <div className="relative pl-6 border-l-2 border-gray-200 dark:border-gray-700 space-y-6 my-4">
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        const colorClass = event.isError 
          ? 'bg-red-500' 
          : event.isCurrent 
            ? 'bg-indigo-600 shadow-[0_0_0_4px_rgba(79,70,229,0.2)]' 
            : event.isCompleted 
              ? 'bg-green-500' 
              : 'bg-gray-300 dark:bg-gray-600';

        return (
          <div key={event.id} className="relative">
            {/* Timeline Dot/Icon */}
            <div className={`absolute -left-[35px] w-8 h-8 rounded-full flex items-center justify-center ${colorClass} transition-colors z-10`}>
              {getStatusIcon(event.status, event.isError)}
            </div>
            
            {/* Content */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 ml-4">
              <div>
                <h4 className={`text-sm font-semibold ${event.isCurrent ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-gray-100'}`}>
                  {event.status}
                </h4>
                {event.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {event.description}
                  </p>
                )}
                {event.user && (
                  <p className="text-xs text-gray-400 mt-2 font-medium">
                    Oleh: {event.user}
                  </p>
                )}
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap mt-2 sm:mt-0">
                {new Date(event.timestamp).toLocaleString('id-ID', {
                  day: 'numeric', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
