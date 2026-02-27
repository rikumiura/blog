import type { VariantProps } from 'class-variance-authority'
import {
  type buttonVariants,
  Button as ShadcnButton,
} from '@/components/ui/button'

export interface ButtonProps
  extends React.ComponentProps<'button'>,
    VariantProps<typeof buttonVariants> {}

/** Primary UI component for user interaction */
export const Button = ({ variant, size, ...props }: ButtonProps) => {
  return <ShadcnButton variant={variant} size={size} {...props} />
}
