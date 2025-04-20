"use client"

import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SiteHeader } from "@/components/site-header"

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 py-6 md:py-12">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-4xl space-y-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Link>
              </Button>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
              <p className="text-gray-500 dark:text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>
            </div>
            <div className="space-y-6 text-sm leading-normal">
              <section className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">1. Introduction</h2>
                <p>
                  This Privacy Policy describes how BankIT ("we", "our", or "us") collects, uses, and shares your personal information when you use our services. Your privacy is important to us, and we are committed to protecting your personal information.
                </p>
              </section>
              
              <section className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">2. Information We Collect</h2>
                <p><strong>Personal Information:</strong> We collect information you provide when creating an account, such as your name, email address, phone number, and date of birth.</p>
                <p><strong>Financial Information:</strong> With your consent, we may collect financial information from linked accounts, including account balances, transaction history, and account details.</p>
                <p><strong>Usage Information:</strong> We collect information about how you use our service, including log data, device information, and usage patterns.</p>
                <p><strong>Location Information:</strong> With your permission, we may collect precise location data for fraud prevention and to enhance our services.</p>
              </section>
              
              <section className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">3. How We Use Your Information</h2>
                <p>We use your information to:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process transactions and manage your accounts</li>
                  <li>Verify your identity and prevent fraud</li>
                  <li>Communicate with you about your account and our services</li>
                  <li>Personalize your experience and provide customized content</li>
                  <li>Comply with legal obligations and enforce our terms</li>
                </ul>
              </section>
              
              <section className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">4. Information Sharing</h2>
                <p>We may share your information with:</p>
                <p><strong>Service Providers:</strong> Third-party companies that perform services on our behalf, such as payment processing, data analysis, and customer service.</p>
                <p><strong>Financial Partners:</strong> Banks and financial institutions necessary to provide our services.</p>
                <p><strong>Legal Requirements:</strong> When required by law, subpoena, or similar legal process.</p>
                <p><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets.</p>
                <p>We do not sell your personal information to third parties for marketing purposes.</p>
              </section>
              
              <section className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">5. Data Security</h2>
                <p>
                  We implement appropriate security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. These measures include encryption, access controls, and regular security assessments.
                </p>
                <p>
                  However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.
                </p>
              </section>
              
              <section className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">6. Data Retention</h2>
                <p>
                  We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.
                </p>
              </section>
              
              <section className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">7. Your Rights and Choices</h2>
                <p>Depending on your location, you may have certain rights regarding your personal information, including:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Accessing, correcting, or deleting your personal information</li>
                  <li>Withdrawing consent for certain processing activities</li>
                  <li>Requesting a copy of your personal information</li>
                  <li>Objecting to certain uses of your information</li>
                  <li>Data portability rights</li>
                </ul>
                <p>
                  To exercise these rights, please contact us using the information provided in the "Contact Us" section.
                </p>
              </section>
              
              <section className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">8. Children's Privacy</h2>
                <p>
                  Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
                </p>
              </section>
              
              <section className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">9. Changes to This Privacy Policy</h2>
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new Privacy Policy on our website or through in-app notifications. Your continued use of our services after such modifications constitutes your acceptance of the revised Privacy Policy.
                </p>
              </section>
              
              <section className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">10. Contact Us</h2>
                <p>
                  If you have any questions, concerns, or requests regarding this Privacy Policy or our privacy practices, please contact us at:
                </p>
                <p className="mt-2">
                  <strong>Email:</strong> privacy@bankit.com<br />
                  <strong>Address:</strong> BankIT Privacy Office, 123 Financial Street, New York, NY 10001
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 