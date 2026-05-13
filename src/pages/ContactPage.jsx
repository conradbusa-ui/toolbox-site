export default function ContactPage() {
  return (
    <div className="container">
      <div className="info-page">
        <h1>Contact Us</h1>
        <span className="updated">We typically respond within 1–2 business days.</span>

        <p>
          Have a question, found a bug, or want to suggest a new tool? We'd love to hear from you. ToolBox is
          built to be useful, and your feedback directly shapes what gets added or improved next.
        </p>

        <h2>Email</h2>
        <p>
          The best way to reach us is by email:{' '}
          <a href="mailto:conradbusa@gmail.com" style={{ fontWeight: 600 }}>conradbusa@gmail.com</a>
        </p>

        <h2>What to Include</h2>
        <ul>
          <li>Which tool you're referring to</li>
          <li>A clear description of the issue or suggestion</li>
          <li>Your browser and operating system (for bug reports)</li>
          <li>Any relevant input that caused unexpected behaviour</li>
        </ul>

        <h2>Feature Requests</h2>
        <p>
          We're always looking to expand ToolBox with new utilities. If there's a browser-based tool you find
          yourself needing regularly — especially one that handles plain text, data formatting, or simple
          calculations — let us know and we may build it.
        </p>

        <h2>Bug Reports</h2>
        <p>
          If a tool produces incorrect output or breaks on a particular input, please send us the input (or a
          representative sample) so we can reproduce and fix it. We take accuracy seriously, especially for tools
          like the age calculator and JSON formatter.
        </p>

        <h2>Response Time</h2>
        <p>
          We aim to reply to all messages within one to two business days. For simple questions about tool
          functionality the answer is often in the description on each tool page.
        </p>
      </div>
    </div>
  );
}
