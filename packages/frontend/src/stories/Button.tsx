import {
  Button as ShadcnButton,
  type buttonVariants,
} from '@/components/ui/button'
import type { VariantProps } from 'class-variance-authority'

export interface ButtonProps
  extends React.ComponentProps<'button'>,
    VariantProps<typeof buttonVariants> {}

/** Primary UI component for user interaction */
export const Button = ({ variant, size, ...props }: ButtonProps) => {
  return <ShadcnButton variant={variant} size={size} {...props} />
}
