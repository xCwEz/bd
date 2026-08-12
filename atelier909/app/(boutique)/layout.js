import TabBar from "@/components/ui/TabBar";
import TelegramInit from "@/components/ui/TelegramInit";

export default function LayoutBoutique({ children }) {
  return (
    <>
      <TelegramInit />
      <div className="coquille">
        <div className="contenu-ecran">{children}</div>
        <TabBar />
      </div>
      <div className="grain-cadre" aria-hidden="true" />
      <div className="balayage-cadre" aria-hidden="true" />
    </>
  );
}
