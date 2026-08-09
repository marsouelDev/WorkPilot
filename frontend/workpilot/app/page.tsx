import Footer from "./components/landing/Footer";
import Header from "./components/landing/Nav";
export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="pt-20">
        <h1 className="text-5xl text-red-600">Bonjour</h1>
      </main>

      <Footer />
    </div>
  );
}
