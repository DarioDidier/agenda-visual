import React from 'react';
import * as Icons from 'lucide-react';

interface Props {
  name: string;
  className?: string;
  size?: number;
}

export const PictogramIcon: React.FC<Props> = ({ name, className, size = 24 }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComponent = (Icons as any)[name] || Icons.HelpCircle;
  return <IconComponent className={className} size={size} />;
};
