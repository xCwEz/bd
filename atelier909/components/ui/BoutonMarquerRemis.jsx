"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BoutonMarquerRemis({ id }) {
  const router = useRouter();
  const [envoi, setEnvoi] = useState(false);

  async function marquer() {
    setEnvoi(true);
    await fetch("/api/admin/commandes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
  }

  return (
    <button type="button" className="admin-bouton" disabled={envoi} onClick={marquer}>
      {envoi ? "…" : "Marquer comme remis"}
    </button>
  );
}
