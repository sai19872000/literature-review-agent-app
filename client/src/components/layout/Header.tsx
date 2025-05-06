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
              <Link href="/">
                <a className="hover:text-accent transition-colors">Home</a>
              </Link>
            </li>
            <li>
              <Link href="/#how-it-works">
                <a className="hover:text-accent transition-colors">How It Works</a>
              </Link>
            </li>
            <li>
              <Link href="/#about">
                <a className="hover:text-accent transition-colors">About</a>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
