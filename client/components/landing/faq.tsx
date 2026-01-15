"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "What is this Hyperflix platform?",
    answer:
      "We're a free streaming service that brings together movies, shows, sports, and music documentaries. No payment, no subscription required – just instant access to thousands of titles.",
  },
  {
    question: "How much does it cost?",
    answer:
      "It's completely free! We offer access to our entire library without any hidden charges, subscriptions, or paywalls. You can watch unlimited content at no cost.",
  },
  {
    question: "What content is available?",
    answer:
      "We have thousands of titles including popular movies, TV shows, live TV, sports documentaries, AMC series, and music content. Our library is constantly growing with new releases.",
  },
  {
    question: "Can I watch on multiple devices?",
    answer:
      "You can stream on all your favorite devices – smartphones, tablets, laptops, smart TVs, and more.",
  },
  {
    question: "Do I need an account to watch?",
    answer:
      "Yes, creating a free account takes just a moment and gives you a personalized experience, including recommendations and your watch history.",
  },
  {
    question: "Is Hyperflix legal?",
    answer:
      "Absolutely! We operate within legal frameworks and ensure all our content is properly licensed for streaming.",
  },
  {
    question: "Are there any good free movie websites?",
    answer:
      "Yes—Hyperflix provides free streaming inside a secure, legal platform, avoiding the risks of unsafe sites.",
  },
  {
    question: "Which free movie site is safe?",
    answer:
      "Hyperflix is safe and legal—every title is licensed and streamed through secure servers.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="px-4 md:px-8 lg:px-44 py-16">
      <div className="mb-12">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          Frequently Asked Questions
        </h2>
        <p className="text-lg text-muted-foreground">
          Everything you need to know about our streaming service.
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-3">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="bg-card border border-border rounded-xl overflow-hidden transition-all duration-300 hover:border-accent hover:shadow-lg"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-accent/5 transition-colors duration-200"
            >
              <h3 className="text-left font-semibold text-lg text-foreground">
                {faq.question}
              </h3>
              <ChevronDown
                className={`w-5 h-5 text-accent flex-shrink-0 transition-transform duration-300 ${
                  openIndex === index ? "rotate-180" : ""
                }`}
              />
            </button>

            <div
              className={`overflow-hidden transition-all duration-300 ${
                openIndex === index ? "max-h-96" : "max-h-0"
              }`}
            >
              <div className="px-6 py-4 bg-accent/5 border-t border-border">
                <p className="text-muted-foreground leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
