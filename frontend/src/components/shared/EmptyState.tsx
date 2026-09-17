import { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export default function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-4">
      {icon && <div className="mb-4 text-gray-400">{icon}</div>}
      <h3 className="text-lg font-semibold text-gray-900 mb-2 dark:text-gray-100">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto dark:text-gray-400">{description}</p>
      {action}
    </div>
  );
}