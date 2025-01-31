export default function Terms() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <p className="text-gray-300 mb-4">Last updated: January 31, 2024</p>
      
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-3">1. Terms</h2>
          <p>By accessing our extension and website, you agree to be bound by these Terms of Service.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">2. Use License</h2>
          <p>Permission is granted to temporarily use the extension for personal, non-commercial use only.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">3. Token Usage</h2>
          <ul className="list-disc pl-6 mt-2">
            <li>Tokens are non-refundable</li>
            <li>Tokens cannot be transferred</li>
            <li>Token purchases are final</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">4. Contact</h2>
          <p>For any questions regarding these terms, please contact:</p>
          <p className="mt-2">Email: buyyav20@gmail.com</p>
        </section>
      </div>
    </div>
  );
} 