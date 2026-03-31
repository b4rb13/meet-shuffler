import { ShuffleIcon } from "@phosphor-icons/react/dist/ssr";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
      <ShuffleIcon className="size-12 text-primary" />
      <h1 className="text-2xl font-semibold tracking-tight">Meet Shuffler</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        A Google Meet add-on that randomizes your standup order. Open this add-on
        from the Activities panel inside a Google Meet call.
      </p>
      <div className="flex flex-col gap-1 text-xs text-muted-foreground/70">
        <p>
          <strong className="text-foreground">/sidepanel</strong> — Add-on side
          panel
        </p>
        <p>
          <strong className="text-foreground">/mainstage</strong> — Shared main
          stage view
        </p>
      </div>
    </div>
  );
}
