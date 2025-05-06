import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-primary text-white mt-20">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h4 className="font-serif text-lg font-bold mb-4">Literature Review Assistant</h4>
            <p className="text-sm">An AI-powered research tool to generate comprehensive literature reviews and properly formatted citations using the Perplexity Sonar API.</p>
          </div>
          <div>
            <h4 className="font-serif text-lg font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/#how-it-works" className="text-gray-300 hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-300 hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-300 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-300 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-serif text-lg font-bold mb-4">Contact</h4>
            <ul className="space-y-2">
              <li className="flex items-center">
                <i className="fas fa-envelope mr-2"></i>
                <a
                  href="mailto:support@literaturereview.ai"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  support@literaturereview.ai
                </a>
              </li>
              <li className="flex items-center">
                <i className="fas fa-globe mr-2"></i>
                <a
                  href="#"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  www.literaturereview.ai
                </a>
              </li>
            </ul>
            <div className="mt-4 flex space-x-4">
              <a
                href="#"
                className="text-gray-300 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <i className="fab fa-twitter text-xl"></i>
              </a>
              <a
                href="#"
                className="text-gray-300 hover:text-white transition-colors"
                aria-label="LinkedIn"
              >
                <i className="fab fa-linkedin text-xl"></i>
              </a>
              <a
                href="#"
                className="text-gray-300 hover:text-white transition-colors"
                aria-label="GitHub"
              >
                <i className="fab fa-github text-xl"></i>
              </a>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-700 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Literature Review Assistant. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
