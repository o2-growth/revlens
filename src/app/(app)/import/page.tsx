import { Topbar } from "@/components/Topbar";
import { ImportClient } from "./ImportClient";

export default function ImportPage() {
  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <Topbar title="Importar transcrição" subtitle="Cole o texto ou envie um arquivo (.txt/.vtt) — a captura automática do Meet vem depois" />
      <ImportClient />
    </div>
  );
}
