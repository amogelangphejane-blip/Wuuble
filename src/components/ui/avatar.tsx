import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, src, alt, onError, onLoad, ...props }, ref) => {
  const [imageError, setImageError] = React.useState(false)
  const [imageLoaded, setImageLoaded] = React.useState(false)

  // Reset error state when src changes
  React.useEffect(() => {
    if (src) {
      setImageError(false)
      setImageLoaded(false)
    } else {
      // If no src, consider it as an error to show fallback
      setImageError(true)
    }
  }, [src])

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.warn('Avatar image failed to load:', src)
    setImageError(true)
    onError?.(e)
  }

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.log('Avatar image loaded successfully:', src)
    setImageLoaded(true)
    setImageError(false)
    onLoad?.(e)
  }

  // Don't render image if there's no src, empty src, or error occurred
  // This will allow the fallback to show
  if (!src || src.trim() === '' || imageError) {
    return null
  }

  return (
    <AvatarPrimitive.Image
      ref={ref}
      className={cn("aspect-square h-full w-full object-cover", className)}
      src={src}
      alt={alt}
      onError={handleError}
      onLoad={handleLoad}
      {...props}
    />
  )
})
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
