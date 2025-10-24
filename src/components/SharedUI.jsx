// Shared UI components used across all feature pages
import { ArrowLeft } from 'lucide-react'

// Button component with consistent styling
export function Button({ className = '', variant, size, disabled, ...props }) {
  const base = "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 disabled:opacity-60 disabled:cursor-not-allowed";
  const variants = {
    default: "bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg hover:shadow-xl",
    secondary: "bg-white text-black hover:bg-white/90 shadow-lg hover:shadow-xl",
    outline: "border border-white/20 text-white hover:bg-white/5 hover:border-white/30",
    ghost: "bg-transparent text-white/80 hover:text-white hover:bg-white/5",
    danger: "bg-red-500 hover:bg-red-400 text-white shadow-lg hover:shadow-xl",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2",
    lg: "px-5 py-2.5 text-base"
  };
  const v = variants[variant || "default"];
  const s = sizes[size || "md"];
  return <button disabled={disabled} className={`${base} ${v} ${s} ${className}`} {...props} />;
}

// Card components
export function Card({ className = '', ...props }) {
  return <div className={`rounded-2xl border bg-white/5 border-white/10 ${className}`} {...props} />
}
export function CardHeader({ className = '', ...props }) {
  return <div className={`px-6 pt-6 ${className}`} {...props} />
}
export function CardTitle({ className = '', ...props }) {
  return <div className={`text-lg font-semibold text-white ${className}`} {...props} />
}
export function CardContent({ className = '', ...props }) {
  return <div className={`px-6 pb-6 ${className}`} {...props} />
}

// Standard page header with back button
export function PageHeader({ title, description, onBack }) {
  return (
    <div className="mb-8">
      <Button
        variant="outline"
        size="sm"
        onClick={onBack}
        className="mb-4 hover:scale-105"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Control Panel
      </Button>
      <h1 className="text-3xl md:text-4xl font-bold text-white">{title}</h1>
      {description && (
        <p className="text-white/70 mt-2 text-sm md:text-base">{description}</p>
      )}
    </div>
  );
}

// Standard page container
export function PageContainer({ children }) {
  return (
    <section className="relative z-10 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </section>
  );
}

// Input field with consistent styling
export function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white placeholder-white/50 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all ${className}`}
      {...props}
    />
  );
}

// Textarea with consistent styling
export function Textarea({ className = '', ...props }) {
  return (
    <textarea
      className={`w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white placeholder-white/50 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all resize-none ${className}`}
      {...props}
    />
  );
}

// Select dropdown with consistent styling
export function Select({ className = '', children, ...props }) {
  return (
    <select
      className={`w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

// Label with consistent styling
export function Label({ className = '', ...props }) {
  return (
    <label className={`block text-sm text-white/70 mb-1 ${className}`} {...props} />
  );
}
