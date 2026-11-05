import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center bg-[#F8EEE2] px-6 py-24">
      <div className="max-w-md w-full text-center space-y-6">
        <span className="text-xs uppercase tracking-[0.25em] text-[#B58A58] font-medium font-sans">
          ✦ 404 — Page Not Found ✦
        </span>
        <h1 className="font-serif text-5xl sm:text-6xl text-[#541B1B] tracking-tight font-light">
          A Stitch Out of Place
        </h1>
        <p className="text-sm font-sans text-[#3B241C]/80 font-light leading-relaxed">
          The creation or page you are searching for does not exist in our atelier archive, or has been gently moved.
        </p>
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="w-full sm:w-auto px-8 py-3.5 bg-[#541B1B] hover:bg-[#722F37] text-[#FFF9F2] font-sans text-xs uppercase tracking-[0.2em] font-medium rounded-full transition-colors shadow-xs"
          >
            Return to Atelier
          </Link>
          <Link
            href="/products"
            className="w-full sm:w-auto px-8 py-3.5 border border-[#541B1B] hover:bg-[#541B1B] hover:text-[#FFF9F2] text-[#541B1B] font-sans text-xs uppercase tracking-[0.2em] font-medium rounded-full transition-colors"
          >
            Explore Creations
          </Link>
        </div>
      </div>
    </div>
  );
}
