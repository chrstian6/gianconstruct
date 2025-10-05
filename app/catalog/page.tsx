// app/catalog/page.tsx
import PublicCatalog from "@/components/public/catalog/PublicCatalog";
import LoginModal from "@/components/public/LoginModal";
import SignUpModal from "@/components/public/SignUpModal";
import { Navbar } from "@/components/public/Navbar";
export default function CatalogPage() {
  return (
    <main className="container mx-auto py-8">
      <div className="fixed top-0 left-0 w-full z-50 bg-white shadow-none">
        <Navbar />
      </div>
      <PublicCatalog />
      {/* Add the modal components here */}
      <LoginModal />
      <SignUpModal />
    </main>
  );
}
