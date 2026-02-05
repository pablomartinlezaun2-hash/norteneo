import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { BookOpen, HelpCircle, MessageCircle, Mail, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SupportSectionProps {}

export const SupportSection = ({}: SupportSectionProps) => {
  const { t, i18n } = useTranslation();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState<'guide' | 'faq' | 'contact' | null>(null);

  const faqQuestions = t('faq.questions', { returnObjects: true }) as Array<{ q: string; a: string }>;
  const guideSteps = t('quickGuide.steps', { returnObjects: true }) as Array<{ title: string; desc: string }>;

  return (
    <div className="space-y-4">
      {/* Quick Guide */}
      <motion.div
        className="gradient-card rounded-xl border border-border overflow-hidden"
        initial={false}
      >
        <button
          onClick={() => setActiveSection(activeSection === 'guide' ? null : 'guide')}
          className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <span className="flex-1 text-left font-medium text-foreground">
            {t('profile.quickGuide')}
          </span>
          {activeSection === 'guide' ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </button>
        
        <AnimatePresence>
          {activeSection === 'guide' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-3">
                {guideSteps.map((step, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full gradient-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{step.title}</h4>
                      <p className="text-sm text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* FAQ */}
      <motion.div
        className="gradient-card rounded-xl border border-border overflow-hidden"
        initial={false}
      >
        <button
          onClick={() => setActiveSection(activeSection === 'faq' ? null : 'faq')}
          className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-cyan-500" />
          </div>
          <span className="flex-1 text-left font-medium text-foreground">
            {t('profile.faq')}
          </span>
          {activeSection === 'faq' ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </button>
        
        <AnimatePresence>
          {activeSection === 'faq' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-2">
                {faqQuestions.map((faq, index) => (
                  <div
                    key={index}
                    className="rounded-xl bg-muted/50 overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                      className="w-full flex items-center gap-2 p-3 text-left"
                    >
                      <span className="flex-1 text-sm font-medium text-foreground">{faq.q}</span>
                      {expandedFaq === index ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      )}
                    </button>
                    
                    <AnimatePresence>
                      {expandedFaq === index && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          className="overflow-hidden"
                        >
                          <p className="px-3 pb-3 text-sm text-muted-foreground">
                            {faq.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Contact */}
      <motion.div
        className="gradient-card rounded-xl border border-border overflow-hidden"
        initial={false}
      >
        <button
          onClick={() => setActiveSection(activeSection === 'contact' ? null : 'contact')}
          className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
            <Mail className="w-5 h-5 text-green-500" />
          </div>
          <span className="flex-1 text-left font-medium text-foreground">
            {t('profile.contact')}
          </span>
          {activeSection === 'contact' ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </button>
        
        <AnimatePresence>
          {activeSection === 'contact' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4">
                <div className="rounded-xl bg-muted/50 p-4 flex items-start gap-3">
                  <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-foreground font-medium mb-1">
                      {t('contact.comingSoon')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t('contact.message')}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
