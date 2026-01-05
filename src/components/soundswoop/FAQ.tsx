interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "What do you need from me?",
    answer: "Just your track file and a description of your vibe—genre, mood, and any visual references you have in mind. We'll handle the rest and create visuals that match your sound."
  },
  {
    question: "Can you match my genre aesthetic?",
    answer: "Absolutely! We specialize in creating visuals that capture genre-specific aesthetics. Whether it's synthwave, hip-hop, indie, or any other style, we'll match the visual language of your genre."
  },
  {
    question: "What's the turnaround time?",
    answer: "Turnaround varies by package. Cover Swoop and Canvas Swoop typically deliver within 24-48 hours, while Launch Swoop includes priority delivery for faster turnaround. We'll confirm timelines when you request a package."
  },
  {
    question: "How many revisions do I get?",
    answer: "Cover Swoop includes 1 revision, Canvas Swoop includes 1 revision, and Launch Swoop includes revisions as part of the 2-concept album cover process. We want you to love your visuals!"
  },
  {
    question: "Can you do singles and EPs?",
    answer: "Yes! We create visuals for singles, EPs, albums, and any music release. Each package can be customized to your project needs—just let us know what you're launching."
  }
];

export default function FAQ() {
  return (
    <section className="px-4 py-16 md:py-24 bg-gray-900">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-bold mb-10 md:mb-12 text-center">
          Frequently Asked Questions
        </h2>
        
        <div className="space-y-4 md:space-y-5">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-gray-800 rounded-lg p-5 md:p-6 border border-gray-700">
              <h3 className="text-lg md:text-xl font-semibold mb-2 md:mb-3 text-white">{faq.question}</h3>
              <p className="text-sm md:text-base text-gray-400 leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
