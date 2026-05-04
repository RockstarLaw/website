export function Checklist({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-2">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-xl border border-white/8 bg-black/15 px-4 py-3 text-slate-200"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}
