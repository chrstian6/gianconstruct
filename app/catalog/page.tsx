// app/catalog/page.tsx
import PublicCatalog from "@/components/public/catalog/PublicCatalog";
import LoginModal from "@/components/public/LoginModal";
import SignUpModal from "@/components/public/SignUpModal";
import { Navbar } from "@/components/public/Navbar";
export default function CatalogPage() {
  return (
    <>
      <Navbar />
      <main className="container mx-auto py-8">
        <div className="text-center mb-5 pt-5">
          <h1 className="text-4xl tracking-tight font-semibold text-[var(--orange)]">
            Explore Design Catalog
          </h1>
          <p className="text-md tracking-tight text-gray-500">
            Our collection of modern home designs tailored to your lifestyle
          </p>
        </div>
        <PublicCatalog />
        {/* Add the modal components here */}
        <LoginModal />
        <SignUpModal />
      </main>
    </>
  );
}
