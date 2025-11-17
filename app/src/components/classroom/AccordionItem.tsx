import React, { type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

type AccordionItemProps = {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
};

function AccordionItem({ title, isOpen, onToggle, children }: AccordionItemProps) {
  return (
    <article className="rounded-3xl bg-transparent">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-3xl bg-[#fff8ec] px-5 py-5 text-left shadow-soft transition-transform duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#ffd331]/40"
        aria-expanded={isOpen}
      >
        <span className="text-lg font-semibold text-ellieGray">{title}</span>
        <ChevronDown
          className={`h-5 w-5 text-ellieGray transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          strokeWidth={2}
        />
      </button>

      <div
        className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ease-in-out ${
          isOpen ? 'grid-rows-[1fr] pt-4' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </article>
  );
}

export default AccordionItem;
