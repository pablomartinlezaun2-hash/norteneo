import type { LegalId } from '@/i18n/paths'
import type { LegalDoc } from './types'

/**
 * Legal texts in English (courtesy translation; the Spanish version prevails).
 * PENDING (Pablo): fill in the owner details marked [PENDING: …] and have them reviewed before launch.
 */
export const legalEn: Record<LegalId, LegalDoc> = {
  notice: {
    title: 'Legal notice',
    description: 'Owner details for the NEO Studio website and terms of use, under Spanish Law 34/2002 (LSSI-CE).',
    intro:
      'In compliance with Article 10 of Spanish Law 34/2002 of 11 July on information society services and electronic commerce (LSSI-CE), these are the details of the owner of this website and the terms for using it. This English version is a courtesy translation; the Spanish version prevails.',
    sections: [
      {
        h: 'Website owner',
        body: [
          {
            list: [
              'Owner: [PENDING: company name or full name]',
              'Trading name: NEO Studio',
              'Tax ID (NIF): [PENDING: NIF]',
              'Registered address: [PENDING: address]',
              'Email: {email}',
              'Registry details: [PENDING: Commercial Registry entry, if applicable]',
            ],
          },
        ],
      },
      {
        h: 'Purpose',
        body: [
          'This website presents the creative services of NEO Studio (AI video, AI 3D, signature websites, post-production, social content and mobile cinema) and lets you request a proposal. The information published here is not a binding offer: every commission is set out in a tailored proposal.',
        ],
      },
      {
        h: 'Terms of use',
        body: [
          'Access to the website is free. Anyone using it agrees to do so lawfully, without harming its operation or the rights of NEO Studio or third parties, and to provide truthful information in the contact form.',
        ],
      },
      {
        h: 'Intellectual and industrial property',
        body: [
          'The texts, videos, images, design, code and distinctive signs on this website belong to NEO Studio or to third parties who have authorised their use. Reproducing, distributing, publicly communicating or transforming them without express permission is prohibited, except where the law allows it.',
          'Client websites and pieces are shown as part of the studio’s portfolio. Their brands and content belong to their respective owners.',
          'Pieces labelled “Concept · unofficial” are self-initiated creative exercises: they were not commissioned or approved by any brand and imply no commercial relationship.',
        ],
      },
      {
        h: 'AI-generated content',
        body: [
          'Pieces labelled “AI-generated, directed by NEO” were created with generative AI tools under the creative direction of NEO Studio, which selects, edits and finishes every shot. We say so, so that you always know which imagery is generated.',
        ],
      },
      {
        h: 'Liability',
        body: [
          'NEO Studio strives to keep the information on this website accurate and up to date, but does not guarantee that it is error-free or that the site will always be available. Links to third-party websites are provided for convenience: NEO Studio does not control their content and is not responsible for it.',
        ],
      },
      {
        h: 'Data protection and cookies',
        body: ['How we process your personal data is explained in the {doc:privacy|privacy policy}, and storage in your browser in the {doc:cookies|cookie policy}.'],
      },
      {
        h: 'Governing law',
        body: [
          'This legal notice is governed by Spanish law. Any dispute will be submitted to the courts that have jurisdiction under the applicable rules and, where the user is a consumer, to the courts of their place of residence.',
        ],
      },
    ],
  },

  privacy: {
    title: 'Privacy policy',
    description: 'What data NEO Studio processes through its website, why, for how long, and what your rights are.',
    intro:
      'We treat your data the way we treat a piece of work: only what is needed, and for a clear purpose. This policy explains what data we collect through this website, why, and what your rights are, under Regulation (EU) 2016/679 (GDPR) and Spanish Organic Law 3/2018 on data protection (LOPDGDD). This English version is a courtesy translation; the Spanish version prevails.',
    sections: [
      {
        h: 'Data controller',
        body: [
          {
            list: [
              'Owner: [PENDING: company name or full name]',
              'Trading name: NEO Studio',
              'Tax ID (NIF): [PENDING: NIF]',
              'Registered address: [PENDING: address]',
              'Contact email: {email}',
            ],
          },
        ],
      },
      {
        h: 'What data we process',
        body: [
          'Only what you choose to give us:',
          {
            list: [
              'In the contact form (brief): the services you are interested in, your brand’s name, its website or Instagram profile, its sector, your goal, timeline, approximate budget if you choose to give one, your references, your name, your email, your phone number if you provide it and your preferred contact channel.',
              'If you write to us by email or WhatsApp: the details you include in your message and your address or number.',
            ],
          },
          'Along with the brief, we technically record the website language, the page you sent it from and, where present, the campaign parameters in the address (UTM). We do not ask for special categories of data; please do not include other people’s data without their permission.',
        ],
      },
      {
        h: 'What we use it for',
        body: [
          {
            list: [
              'To handle your request and reply through the channel you prefer.',
              'To prepare and send you a tailored proposal.',
              'To keep in touch if you decide to go ahead with the commission.',
            ],
          },
          'We do not make automated decisions or build profiles with your data, and we will not send you marketing messages without your consent.',
        ],
      },
      {
        h: 'Legal basis',
        body: [
          'Your consent, given when you tick the box in the form (Article 6(1)(a) GDPR), and taking steps at your request before entering into a contract, such as preparing a proposal (Article 6(1)(b) GDPR). You may withdraw your consent at any time, without affecting the lawfulness of earlier processing.',
        ],
      },
      {
        h: 'How long we keep it',
        body: [
          'For as long as the conversation about your project lasts. If we do not end up working together, we delete it within [PENDING: period, e.g. 12 months] of our last contact. If there is a contract, we keep it for the periods required by law, for example for tax and commercial purposes.',
        ],
      },
      {
        h: 'Who we share it with',
        body: [
          'We do not sell or hand over your data. For the website and contact to work, some providers process data on behalf of NEO Studio, with the safeguards of Article 28 GDPR:',
          {
            list: [
              'FormSubmit ({ext:https://formsubmit.co|formsubmit.co}): processes the contact form to forward your message to us by email.',
              'Our email provider, where we receive and answer your messages.',
              'The website hosting provider: [PENDING: confirm provider, e.g. Vercel Inc.].',
              'WhatsApp (Meta Platforms), only if you choose to message us there, under its own terms.',
            ],
          },
          'We may also disclose data to the authorities where the law requires it.',
        ],
      },
      {
        h: 'International transfers',
        body: [
          'Some of these providers may process data outside the European Economic Area. In that case, the transfer relies on a European Commission adequacy decision, such as the EU-US Data Privacy Framework, or on standard contractual clauses approved by the Commission.',
        ],
      },
      {
        h: 'Your rights',
        body: [
          'You can exercise your rights of access, rectification, erasure, objection, restriction of processing and portability at any time by writing to {email} and stating which right you wish to exercise. If you feel we have not handled your request properly, you can lodge a complaint with the Spanish Data Protection Agency ({ext:https://www.aepd.es|aepd.es}).',
        ],
      },
      {
        h: 'Security',
        body: ['We apply appropriate technical and organisational measures to protect your data. The website always runs over an encrypted connection (HTTPS).'],
      },
      {
        h: 'Minors',
        body: ['This website is not aimed at children under 14. If you are under that age, please do not send us your data.'],
      },
      {
        h: 'The form draft, in your browser',
        body: [
          'While you fill in the brief, a draft is saved in your browser’s local storage so you do not lose what you have written. That draft does not leave your device until you press “Send brief”, it is deleted once sent, and you can remove it at any time with “Start over” or from your browser settings. There is more detail in the {doc:cookies|cookie policy}.',
        ],
      },
      {
        h: 'Changes to this policy',
        body: ['If the way we process your data changes, we will update this policy on this page. Last updated: [PENDING: date].'],
      },
    ],
  },

  cookies: {
    title: 'Cookie policy',
    description: 'NEO Studio uses no tracking or advertising cookies. Only strictly necessary storage.',
    intro:
      'This website uses no tracking, advertising or third-party cookies. That is why you will not see a cookie banner: we install nothing that requires your consent.',
    sections: [
      {
        h: 'What cookies are',
        body: [
          'Cookies and similar technologies, such as your browser’s local storage, are small pieces of data that a website saves on your device. Article 22.2 of Spanish Law 34/2002 (LSSI-CE) requires consent to use them, except when they are strictly necessary to provide a service you have requested.',
        ],
      },
      {
        h: 'What we use',
        body: [
          'Only technical storage, needed for features you ask for yourself. It cannot identify or track you:',
          {
            list: [
              'neo-intro (session storage): remembers that you have already seen the logo intro so it does not play again. Deleted when you close the tab.',
              'neo-brief-draft (local storage): keeps a draft of the contact form while you fill it in. Deleted when you send the brief or press “Start over”.',
              'neo-brief-last (session storage): keeps the number of your last brief and your name to show them on the confirmation page. Deleted when you close the tab.',
            ],
          },
        ],
      },
      // Analytics: the site loads none today. If a cookie-free tool is enabled, add a
      // «Cookie-free analytics» section here naming the provider (and in es.ts and the description).
      {
        h: 'Third-party content and links',
        body: [
          'Videos, images and typefaces are served from our own domain: there are no embedded third-party players or services that set cookies. If you follow an external link, such as WhatsApp or our clients’ websites, that site’s policies will apply.',
        ],
      },
      {
        h: 'How to manage it',
        body: [
          'You can delete or block this website’s storage in your browser settings (Chrome, Safari, Firefox or Edge). The website will keep working: you will only lose the form draft, and the intro animation will play again.',
        ],
      },
      {
        h: 'Changes to this policy',
        body: ['If we ever add cookies that require consent, we will ask for it before setting them and update this policy. The full privacy information is in the {doc:privacy|privacy policy}.'],
      },
    ],
  },
}
