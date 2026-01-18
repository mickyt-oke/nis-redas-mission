"use client"

import Header from "@/components/Header"
import Footer from "@/components/Footer"

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <h1 className="text-4xl font-bold text-primary mb-8">About REDAS</h1>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Mission</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
             To provide the Nigeria Immigration Service with a modern, efficient, and secure platform for managing
                reports and documents across all diplomatic missions and streamlining visa and passport documents archiving processes. </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Vision</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              To establish Nigeria Immigration Service as a leader in digital immigration management through
                innovative technology solutions that enhance citizen experience and strengthen diplomatic operations
                worldwide.
            </p>
          </section>

        <section className="bg-gradient-to-br from-[#1b7b3c] to-[#155730] text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            {[
              { number: "12", label: "Active Missions" },
              { number: "156+", label: "Users" },
              { number: "500+", label: "Applications Processed" },
              { number: "98%", label: "Uptime" },
            ].map((stat, index) => (
              <div key={index}>
                <p className="text-4xl font-bold mb-2">{stat.number}</p>
                <p className="text-gray-100">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

          {/* <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Core Values</h2>
            <ul className="space-y-4">
              <li className="flex gap-4">
                <span className="text-primary font-bold">•</span>
                <div>
                  <h3 className="font-semibold">Excellence</h3>
                  <p className="text-gray-600">We strive for the highest standards in service delivery</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="text-primary font-bold">•</span>
                <div>
                  <h3 className="font-semibold">Integrity</h3>
                  <p className="text-gray-600">We maintain honesty and transparency in all operations</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="text-primary font-bold">•</span>
                <div>
                  <h3 className="font-semibold">Innovation</h3>
                  <p className="text-gray-600">We embrace technology to improve services continuously</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="text-primary font-bold">•</span>
                <div>
                  <h3 className="font-semibold">Customer Focus</h3>
                  <p className="text-gray-600">We prioritize the needs of our service users</p>
                </div>
              </li>
            </ul>
          </section> */}
        </div>
      </main>
      <Footer />
    </>
  )
}
