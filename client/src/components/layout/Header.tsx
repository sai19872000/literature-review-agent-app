import { Link } from "wouter";

export default function Header() {
  return (
    <header className="bg-primary text-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center">
        <div className="flex items-center mb-4 sm:mb-0">
          <i className="fas fa-book-reader text-2xl mr-3"></i>
          <h1 className="text-xl sm:text-2xl font-serif font-bold">Literature Review Assistant</h1>
        </div>
        <nav>
          <ul className="flex space-x-6">
            <li>
              <Link href="/" className="hover:text-accent transition-colors">
                Home
              </Link>
            </li>
            <li>
              <Link href="/#how-it-works" className="hover:text-accent transition-colors">
                How It Works
              </Link>
            </li>
            <li>
              <Link href="/#about" className="hover:text-accent transition-colors">
                About
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
