type Props = {
  name: string;
  online?: boolean;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

export function Avatar({ name, online = false, size = "md" }: Props) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <span className={`avatar relative inline-flex ${sizes[size]} shrink-0 items-center justify-center rounded-xl font-semibold`}>
      {initials || "U"}
      <span
        className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 ${online ? "presence-dot" : "presence-dot-offline"}`}
        style={{ borderColor: "var(--surface)" }}
      />
    </span>
  );
}
