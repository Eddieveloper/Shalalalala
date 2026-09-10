import React, { useEffect, useState } from 'react';

const quotes = [
  { text: 'The future depends entirely on what each of us does every day.', author: 'Gloria Steinem' },
  { text: 'It is never too late to be what you might have been.', author: 'George Eliot' },
  { text: 'No feeling is final.', author: 'Rainer Maria Rilke' },
  { text: 'The only journey is the one within.', author: 'Rainer Maria Rilke' },
  { text: 'Act as if what you do makes a difference. It does.', author: 'William James' },
];

export const DailyQuote: React.FC = () => {
  const [index, setIndex] = useState(() => new Date().getDate() % quotes.length);

  useEffect(() => {
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % quotes.length), 60 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  const quote = quotes[index];
  return (
    <section className="daily-quote" aria-label="Daily quote">
      <span className="quote-mark" aria-hidden="true">“</span>
      <blockquote>{quote.text}</blockquote>
      <cite>— {quote.author}</cite>
    </section>
  );
};