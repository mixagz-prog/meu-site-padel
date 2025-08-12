export default function Button({ variant = "primary", as = "button", className = "", ...props }) {
  const Comp = as;
  const cls = `btn ${variant === "primary" ? "btn-primary" : variant === "outline" ? "btn-outline" : "btn-ghost"} ${className}`;
  return <Comp className={cls} {...props} />;
}