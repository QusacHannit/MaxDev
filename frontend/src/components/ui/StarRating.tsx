import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '../../utils/cn';

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: number;
  className?: string;
  interactive?: boolean;
  onChange?: (r: number) => void;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating, max = 5, size = 16, className, interactive, onChange
}) => {
  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={cn(
            i < Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-300',
            interactive && 'cursor-pointer hover:text-amber-400 hover:fill-amber-400 transition-colors'
          )}
          onClick={() => interactive && onChange?.(i + 1)}
        />
      ))}
    </div>
  );
};

export default StarRating;
