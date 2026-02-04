import Link from "next/link"

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-gray-300 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-white font-bold mb-4">REDAS | MISSIONS</h3>
            <p className="text-sm text-gray-400">
              Streamlined Reporting & Document Management for Immigration Attaches
            </p>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-gray-400 hover:text-[#1b7b3c] transition">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/missions" className="text-gray-400 hover:text-[#1b7b3c] transition">
                  Missions
                </Link>
                </li>
                <li>
                <Link href="/services" className="text-gray-400 hover:text-[#1b7b3c] transition">
                  Services
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4">Services</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-gray-400 hover:text-[#1b7b3c] transition">
                  Document Management
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-[#1b7b3c] transition">
                  Reporting
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4">Contact</h3>
            <p className="text-sm text-gray-400">
              Nigeria Immigration Service
              <br />
              Email: info@immigration.gov.ng
              <br />
              Phone: +234 (0) 909 000 0000
            </p>
          </div>
        </div> */}

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-400">
            &copy; {currentYear} Nigeria Immigration Service. All rights reserved.
          </p>
          {/* <div className="flex gap-4 mt-4 md:mt-0 text-sm">
            <a href="#" className="text-gray-400 hover:text-[#1b7b3c] transition">
              Privacy Policy
            </a>
            <a href="#" className="text-gray-400 hover:text-[#1b7b3c] transition">
              Terms of Service
            </a>
          </div> */}
        </div>
      </div>
    </footer>
  )
}
