
import React from 'react';

interface SkeletonProps {
  className?: string;
  count?: number;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = "h-4 w-full", count = 1 }) => {
  return (
    <div className="space-y-3 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`skeleton rounded-2xl ${className}`} />
      ))}
    </div>
  );
};

export const CardSkeleton = () => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
    <div className="flex justify-between items-start">
      <Skeleton className="h-14 w-14 rounded-2xl" />
      <Skeleton className="h-6 w-16" />
    </div>
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-8 w-1/2" />
  </div>
);

export const TableSkeleton = () => (
  <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="px-8 py-6 border-b border-slate-50 flex items-center justify-between gap-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
    ))}
  </div>
);

export default Skeleton;
