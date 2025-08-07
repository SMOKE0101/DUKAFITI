import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"

interface ColoredPaymentSliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  thumbs?: number;
  paymentMethods: string[]; // ['cash', 'mpesa', 'debt']
}

const ColoredPaymentSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  ColoredPaymentSliderProps
>(({ className, thumbs = 1, paymentMethods = [], value = [50], ...props }, ref) => {
  // Color mapping for payment methods
  const methodColors = {
    cash: '#10b981', // green-500
    mpesa: '#8b5cf6', // purple-500
    debt: '#ef4444'   // red-500
  };

  // Create color segments based on slider values and payment methods
  const createColorSegments = () => {
    if (paymentMethods.length < 2) return [];
    
    const segments = [];
    const currentValue = Array.isArray(value) ? value : [value];
    
    if (paymentMethods.length === 2) {
      // Two payment methods
      const percentage1 = currentValue[0] || 50;
      const percentage2 = 100 - percentage1;
      
      segments.push({
        method: paymentMethods[0],
        color: methodColors[paymentMethods[0] as keyof typeof methodColors] || '#6b7280',
        width: `${percentage1}%`,
        left: '0%'
      });
      
      segments.push({
        method: paymentMethods[1],
        color: methodColors[paymentMethods[1] as keyof typeof methodColors] || '#6b7280',
        width: `${percentage2}%`,
        left: `${percentage1}%`
      });
    } else if (paymentMethods.length === 3) {
      // Three payment methods
      const percentage1 = currentValue[0] || 33;
      const percentage2 = (currentValue[1] || 67) - percentage1;
      const percentage3 = 100 - (currentValue[1] || 67);
      
      segments.push({
        method: paymentMethods[0],
        color: methodColors[paymentMethods[0] as keyof typeof methodColors] || '#6b7280',
        width: `${percentage1}%`,
        left: '0%'
      });
      
      segments.push({
        method: paymentMethods[1],
        color: methodColors[paymentMethods[1] as keyof typeof methodColors] || '#6b7280',
        width: `${percentage2}%`,
        left: `${percentage1}%`
      });
      
      segments.push({
        method: paymentMethods[2],
        color: methodColors[paymentMethods[2] as keyof typeof methodColors] || '#6b7280',
        width: `${percentage3}%`,
        left: `${percentage1 + percentage2}%`
      });
    }
    
    return segments;
  };

  const colorSegments = createColorSegments();

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      value={value}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-3 w-full grow overflow-hidden rounded-full bg-secondary touch-target">
        {/* Color-coded segments */}
        {colorSegments.map((segment, index) => (
          <div
            key={`${segment.method}-${index}`}
            className="absolute h-full transition-all duration-200"
            style={{
              backgroundColor: segment.color,
              width: segment.width,
              left: segment.left
            }}
          />
        ))}
      </SliderPrimitive.Track>
      
      {Array.from({ length: thumbs }, (_, index) => (
        <SliderPrimitive.Thumb 
          key={index}
          className="block h-6 w-6 rounded-full border-2 border-white bg-white ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 touch-target shadow-lg z-10" 
        />
      ))}
    </SliderPrimitive.Root>
  )
})

ColoredPaymentSlider.displayName = SliderPrimitive.Root.displayName

export { ColoredPaymentSlider }