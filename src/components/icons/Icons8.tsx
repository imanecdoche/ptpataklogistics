import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

// Icons8 Official Glyph Filled Monochromatic SVGs (currentColor)
export function Icons8Truck({ size = 20, className = '', ...props }: IconProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 50 50"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M 39 12 C 37.894531 12 37 12.894531 37 14 L 37 18 L 33 18 C 31.894531 18 31 18.894531 31 20 L 31 34 C 31 35.105469 31.894531 36 33 36 L 34.128906 36 C 34.566406 33.722656 36.582031 32 39 32 C 41.417969 32 43.433594 33.722656 43.871094 36 L 45 36 C 46.105469 36 47 35.105469 47 34 L 47 26.414063 C 47 25.882813 46.789063 25.375 46.414063 25 L 42 20.585938 C 41.625 20.210938 41.117188 20 40.585938 20 L 39 20 Z M 5 18 C 3.894531 18 3 18.894531 3 20 L 3 34 C 3 35.105469 3.894531 36 5 36 L 10.128906 36 C 10.566406 33.722656 12.582031 32 15 32 C 17.417969 32 19.433594 33.722656 19.871094 36 L 27 36 C 28.105469 36 29 35.105469 29 34 L 29 20 C 29 18.894531 28.105469 18 27 18 Z M 39 22 L 40.585938 22 L 44 25.414063 L 44 28 L 39 28 Z M 15 34 C 13.34375 34 12 35.34375 12 37 C 12 38.65625 13.34375 40 15 40 C 16.65625 40 18 38.65625 18 37 C 18 35.34375 16.65625 34 15 34 Z M 39 34 C 37.34375 34 36 35.34375 36 37 C 36 38.65625 37.34375 40 39 40 C 40.65625 40 42 38.65625 42 37 C 42 35.34375 40.65625 34 39 34 Z" />
    </svg>
  );
}

export function Icons8Mail({ size = 18, className = '', ...props }: IconProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 50 50"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M 6 12 C 4.34375 12 3 13.34375 3 15 L 3 35 C 3 36.65625 4.34375 38 6 38 L 44 38 C 45.65625 38 47 36.65625 47 35 L 47 15 C 47 13.34375 45.65625 12 44 12 Z M 7.414063 14 L 42.585938 14 L 25 28.066406 Z M 5 15.65625 L 18.667969 26.589844 L 5 35.253906 Z M 45 15.65625 L 45 35.253906 L 31.332031 26.589844 Z M 20.25 27.855469 L 25 31.65625 L 29.75 27.855469 L 43.195313 36 L 6.804688 36 Z" />
    </svg>
  );
}

export function Icons8Lock({ size = 18, className = '', ...props }: IconProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 50 50"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M 25 3 C 18.9375 3 14 7.9375 14 14 L 14 19 L 10 19 C 8.34375 19 7 20.34375 7 22 L 7 43 C 7 44.65625 8.34375 46 10 46 L 40 46 C 41.65625 46 43 44.65625 43 43 L 43 22 C 43 20.34375 41.65625 19 40 19 L 36 19 L 36 14 C 36 7.9375 31.0625 3 25 3 Z M 25 6 C 29.4375 6 33 9.5625 33 14 L 33 19 L 17 19 L 17 14 C 17 9.5625 20.5625 6 25 6 Z M 25 28 C 26.65625 28 28 29.34375 28 31 C 28 32.226563 27.269531 33.277344 26.222656 33.742188 L 27 38 L 23 38 L 23.777344 33.742188 C 22.730469 33.277344 22 32.226563 22 31 C 22 29.34375 23.34375 28 25 28 Z" />
    </svg>
  );
}

export function Icons8Eye({ size = 18, className = '', ...props }: IconProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 50 50"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M 25 12 C 13.957031 12 4.679688 18.824219 1.5 25 C 4.679688 31.175781 13.957031 38 25 38 C 36.042969 38 45.320313 31.175781 48.5 25 C 45.320313 18.824219 36.042969 12 25 12 Z M 25 18 C 28.867188 18 32 21.132813 32 25 C 32 28.867188 28.867188 32 25 32 C 21.132813 32 18 28.867188 18 25 C 18 21.132813 21.132813 18 25 18 Z M 25 21 C 22.792969 21 21 22.792969 21 25 C 21 27.207031 22.792969 29 25 29 C 27.207031 29 29 27.207031 29 25 C 29 22.792969 27.207031 21 25 21 Z" />
    </svg>
  );
}

export function Icons8EyeOff({ size = 18, className = '', ...props }: IconProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 50 50"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M 7.707031 6.292969 L 6.292969 7.707031 L 12.828125 14.242188 C 7.394531 17.066406 3.253906 21.433594 1.5 25 C 4.679688 31.175781 13.957031 38 25 38 C 29.800781 38 34.253906 36.621094 37.949219 34.363281 L 42.292969 38.707031 L 43.707031 37.292969 Z M 19.183594 20.597656 L 29.402344 30.816406 C 28.1875 31.554688 26.667969 32 25 32 C 21.132813 32 18 28.867188 18 25 C 18 23.332031 18.445313 21.8125 19.183594 20.597656 Z M 25 12 C 22.953125 12 20.988281 12.355469 19.15625 12.984375 L 22.519531 16.347656 C 23.316406 16.128906 24.144531 16 25 16 C 29.96875 16 34 20.03125 34 25 C 34 25.855469 33.871094 26.683594 33.652344 27.480469 L 36.960938 30.789063 C 41.875 27.671875 45.742188 23.238281 48.5 25 C 45.320313 18.824219 36.042969 12 25 12 Z" />
    </svg>
  );
}

// Official Google Identity 'G' Icon (Google Brand Guidelines)
export function OfficialGoogleIcon({ size = 18, className = '', ...props }: IconProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

// Official Monochromatic Google Glyph (Simple Icons)
export function OfficialGoogleMonochromeIcon({ size = 18, className = '', ...props }: IconProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
    </svg>
  );
}


export function Icons8Logout({ size = 18, className = '', ...props }: IconProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 50 50"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M 12 7 C 9.242188 7 7 9.242188 7 12 L 7 38 C 7 40.757813 9.242188 43 12 43 L 26 43 C 28.757813 43 31 40.757813 31 38 L 31 35 L 27 35 L 27 38 C 27 38.554688 26.554688 39 26 39 L 12 39 C 11.445313 39 11 38.554688 11 38 L 11 12 C 11 11.445313 11.445313 11 12 11 L 26 11 C 26.554688 11 27 11.445313 27 12 L 27 15 L 31 15 L 31 12 C 31 9.242188 28.757813 7 26 7 Z M 35.292969 17.292969 L 33.878906 18.707031 L 39.171875 24 L 18 24 L 18 26 L 39.171875 26 L 33.878906 31.292969 L 35.292969 32.707031 L 42.585938 25.414063 C 42.8125 25.1875 42.941406 24.878906 42.941406 24.558594 C 42.941406 24.238281 42.8125 23.929688 42.585938 23.703125 L 35.292969 16.414063 Z" />
    </svg>
  );
}

export function Icons8Wallet({ size = 18, className = '', ...props }: IconProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 50 50"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M 10 9 C 7.242188 9 5 11.242188 5 14 L 5 36 C 5 38.757813 7.242188 41 10 41 L 40 41 C 42.757813 41 45 38.757813 45 36 L 45 32 L 34 32 C 30.691406 32 28 29.308594 28 26 C 28 22.691406 30.691406 20 34 20 L 45 20 L 45 14 C 45 11.242188 42.757813 9 40 9 Z M 34 22 L 45 22 L 45 30 L 34 30 C 31.792969 30 30 28.207031 30 26 C 30 23.792969 31.792969 22 34 22 Z M 36 24 C 34.894531 24 34 24.894531 34 26 C 34 27.105469 34.894531 28 36 28 C 37.105469 28 38 27.105469 38 26 C 38 24.894531 37.105469 24 36 24 Z" />
    </svg>
  );
}

export function Icons8BarChart({ size = 18, className = '', ...props }: IconProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 50 50"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M 7 5 L 7 43 L 45 43 L 45 39 L 11 39 L 11 5 Z M 16 23 L 16 35 L 22 35 L 22 23 Z M 26 13 L 26 35 L 32 35 L 32 13 Z M 36 7 L 36 35 L 42 35 L 42 7 Z" />
    </svg>
  );
}

export function Icons8Layers({ size = 18, className = '', ...props }: IconProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 50 50"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M 25 5 L 4 15.5 L 25 26 L 46 15.5 Z M 4 23.5 L 7.427734 25.214844 L 25 34 L 42.572266 25.214844 L 46 23.5 L 46 25.5 L 25 36 L 4 25.5 Z M 4 31.5 L 7.427734 33.214844 L 25 42 L 42.572266 33.214844 L 46 31.5 L 46 33.5 L 25 44 L 4 33.5 Z" />
    </svg>
  );
}

export function Icons8Menu({ size = 20, className = '', ...props }: IconProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 50 50"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M 5 8 C 3.894531 8 3 8.894531 3 10 C 3 11.105469 3.894531 12 5 12 L 45 12 C 46.105469 12 47 11.105469 47 10 C 47 8.894531 46.105469 8 45 8 Z M 5 23 C 3.894531 23 3 23.894531 3 25 C 3 26.105469 3.894531 27 5 27 L 45 27 C 46.105469 27 47 26.105469 47 25 C 47 23.894531 46.105469 23 45 23 Z M 5 38 C 3.894531 38 3 38.894531 3 40 C 3 41.105469 3.894531 42 5 42 L 45 42 C 46.105469 42 47 41.105469 47 40 C 47 38.894531 46.105469 38 45 38 Z" />
    </svg>
  );
}

export function Icons8Close({ size = 20, className = '', ...props }: IconProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 50 50"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M 9.15625 6.3125 L 6.3125 9.15625 L 22.15625 25 L 6.3125 40.84375 L 9.15625 43.6875 L 25 27.84375 L 40.84375 43.6875 L 43.6875 40.84375 L 27.84375 25 L 43.6875 9.15625 L 40.84375 6.3125 L 25 22.15625 Z" />
    </svg>
  );
}
