export function Checklist({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-2">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}
