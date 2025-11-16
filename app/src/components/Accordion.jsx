import React from 'react';

const Accordion = ({ children, className = '' }) => {
  return <div className={`space-y-4 ${className}`.trim()}>{children}</div>;
};

const AccordionItem = ({ children }) => <article className="rounded-3xl bg-white shadow-soft">{children}</article>;

const AccordionHeader = ({ children, onClick, isOpen, accentColor = 'bg-white' }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-3xl px-6 py-5 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd331]/60 ${accentColor}`.trim()}
      aria-expanded={isOpen}
    >
      {children}
      <span className="text-2xl font-semibold text-ellieGray">{isOpen ? '−' : '+'}</span>
    </button>
  );
};

const AccordionBody = ({ isOpen, children }) => {
  return (
    <div className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ease-in-out ${
      isOpen ? 'grid-rows-[1fr] border-t border-[#f5f5f0]' : 'grid-rows-[0fr]'
    }`}
    >
      <div className="space-y-4 overflow-hidden bg-[#fffdf6] px-6 py-5">{children}</div>
    </div>
  );
};

Accordion.Item = AccordionItem;
Accordion.Header = AccordionHeader;
Accordion.Body = AccordionBody;

export { AccordionItem, AccordionHeader, AccordionBody };
export default Accordion;
