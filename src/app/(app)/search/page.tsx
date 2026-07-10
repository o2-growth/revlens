import { Suspense } from "react";
import { Topbar } from "@/components/Topbar";
import { SearchClient } from "./SearchClient";

export default function SearchPage() {
  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <Topbar title="Busca" subtitle="Encontre qualquer trecho, em qualquer call" />
      <Suspense>
        <SearchClient />
      </Suspense>
    </div>
  );
}
