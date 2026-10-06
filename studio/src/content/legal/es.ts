import type { LegalId } from '@/i18n/paths'
import type { LegalDoc } from './types'

/**
 * Textos legales en español. PENDIENTE (Pablo): completar los datos del titular marcados
 * como [PENDIENTE: …] y revisar con un asesor antes de publicar.
 */
export const legalEs: Record<LegalId, LegalDoc> = {
  notice: {
    title: 'Aviso legal',
    description: 'Datos del titular de la web de NEO Studio y condiciones de uso, conforme a la LSSI-CE.',
    intro:
      'En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de servicios de la sociedad de la información y de comercio electrónico (LSSI-CE), estos son los datos del titular de este sitio web y las condiciones para usarlo.',
    sections: [
      {
        h: 'Titular del sitio web',
        body: [
          {
            list: [
              'Titular: [PENDIENTE: razón social o nombre y apellidos]',
              'Nombre comercial: NEO Studio',
              'NIF: [PENDIENTE: NIF]',
              'Domicilio: [PENDIENTE: domicilio]',
              'Email: {email}',
              'Datos registrales: [PENDIENTE: inscripción en el Registro Mercantil, si aplica]',
            ],
          },
        ],
      },
      {
        h: 'Objeto',
        body: [
          'Este sitio web presenta los servicios creativos de NEO Studio (vídeo y 3D con inteligencia artificial, webs de autor, postproducción, contenido para redes y cine con tu móvil) y permite solicitar una propuesta. La información publicada no constituye una oferta vinculante: cada encargo se concreta en una propuesta a medida.',
        ],
      },
      {
        h: 'Condiciones de uso',
        body: [
          'El acceso a la web es libre y gratuito. Quien la utiliza se compromete a hacerlo de forma lícita, sin dañar su funcionamiento ni los derechos de NEO Studio o de terceros, y a facilitar datos veraces en el formulario de contacto.',
        ],
      },
      {
        h: 'Propiedad intelectual e industrial',
        body: [
          'Los textos, vídeos, imágenes, diseño, código y signos distintivos de esta web pertenecen a NEO Studio o a terceros que han autorizado su uso. Queda prohibida su reproducción, distribución, comunicación pública o transformación sin autorización expresa, salvo en los casos permitidos por la ley.',
          'Las webs y piezas de clientes se muestran como parte del portfolio del estudio. Sus marcas y contenidos pertenecen a sus respectivos titulares.',
          'Las piezas marcadas como «Concepto · no oficial» son ejercicios creativos propios: no han sido encargadas ni aprobadas por ninguna marca y no implican relación comercial alguna.',
        ],
      },
      {
        h: 'Contenido generado con inteligencia artificial',
        body: [
          'Las piezas etiquetadas «Generado con IA, dirigido por NEO» se han creado con herramientas de inteligencia artificial generativa bajo la dirección creativa de NEO Studio, que selecciona, monta y termina cada plano. Lo indicamos para que sepas en todo momento qué imagen es generada.',
        ],
      },
      {
        h: 'Responsabilidad',
        body: [
          'NEO Studio procura que la información de la web sea correcta y esté actualizada, pero no garantiza la ausencia de errores ni la disponibilidad ininterrumpida del sitio. Los enlaces a webs de terceros se ofrecen por comodidad: NEO Studio no controla sus contenidos ni responde de ellos.',
        ],
      },
      {
        h: 'Protección de datos y cookies',
        body: ['El tratamiento de tus datos personales se explica en la {doc:privacy|política de privacidad}, y el almacenamiento en tu navegador, en la {doc:cookies|política de cookies}.'],
      },
      {
        h: 'Legislación aplicable',
        body: [
          'Este aviso legal se rige por la legislación española. Cualquier controversia se someterá a los juzgados y tribunales que correspondan conforme a la normativa aplicable y, cuando el usuario sea consumidor, a los de su domicilio.',
        ],
      },
    ],
  },

  privacy: {
    title: 'Política de privacidad',
    description: 'Qué datos trata NEO Studio a través de su web, para qué, durante cuánto tiempo y cuáles son tus derechos.',
    intro:
      'Tratamos tus datos como tratamos una pieza: solo lo necesario y con un fin claro. Esta política explica qué datos recogemos a través de esta web, para qué y cuáles son tus derechos, conforme al Reglamento (UE) 2016/679 (RGPD) y a la Ley Orgánica 3/2018 de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD).',
    sections: [
      {
        h: 'Responsable del tratamiento',
        body: [
          {
            list: [
              'Titular: [PENDIENTE: razón social o nombre y apellidos]',
              'Nombre comercial: NEO Studio',
              'NIF: [PENDIENTE: NIF]',
              'Domicilio: [PENDIENTE: domicilio]',
              'Email de contacto: {email}',
            ],
          },
        ],
      },
      {
        h: 'Qué datos tratamos',
        body: [
          'Solo los que nos facilitas voluntariamente:',
          {
            list: [
              'En el formulario de contacto (brief): los servicios que te interesan, el nombre de tu marca, su web o perfil de Instagram, el sector, el objetivo, el plazo, la inversión orientativa si decides indicarla, tus referencias, tu nombre, tu email, tu teléfono si lo indicas y el canal de contacto que prefieres.',
              'Si nos escribes por email o por WhatsApp: los datos que incluyas en el mensaje y tu dirección o número.',
            ],
          },
          'Junto al brief se registran, de forma técnica, el idioma de la web, la página desde la que lo envías y, si existen, los parámetros de campaña de la dirección (UTM). No pedimos categorías especiales de datos; te rogamos que no incluyas datos de terceros sin su permiso.',
        ],
      },
      {
        h: 'Para qué los usamos',
        body: [
          {
            list: [
              'Atender tu solicitud y responderte por el canal que prefieras.',
              'Preparar y enviarte una propuesta a medida.',
              'Mantener la comunicación si decides seguir adelante con el encargo.',
            ],
          },
          'No tomamos decisiones automatizadas ni elaboramos perfiles con tus datos, y no te enviaremos comunicaciones comerciales sin tu consentimiento.',
        ],
      },
      {
        h: 'Base legal',
        body: [
          'Tu consentimiento, que nos das al marcar la casilla del formulario (artículo 6.1.a del RGPD), y la aplicación, a petición tuya, de medidas precontractuales como la elaboración de una propuesta (artículo 6.1.b del RGPD). Puedes retirar tu consentimiento en cualquier momento, sin que ello afecte a la licitud del tratamiento anterior.',
        ],
      },
      {
        h: 'Cuánto tiempo los conservamos',
        body: [
          'Mientras dure la conversación sobre tu proyecto. Si no llegamos a trabajar juntos, los suprimimos en un plazo máximo de [PENDIENTE: plazo, p. ej. 12 meses] desde el último contacto. Si hay relación contractual, los conservamos durante los plazos que exija la ley, por ejemplo en materia fiscal y mercantil.',
        ],
      },
      {
        h: 'Con quién los compartimos',
        body: [
          'No vendemos ni cedemos tus datos. Para que la web y el contacto funcionen, algunos proveedores los tratan por cuenta de NEO Studio, con las garantías del artículo 28 del RGPD:',
          {
            list: [
              'FormSubmit ({ext:https://formsubmit.co|formsubmit.co}): procesa el formulario de contacto para reenviarnos tu mensaje por email.',
              'Nuestro proveedor de correo electrónico, donde recibimos y respondemos tus mensajes.',
              'El proveedor de alojamiento de la web: [PENDIENTE: confirmar proveedor, p. ej. Vercel Inc.].',
              'WhatsApp (Meta Platforms), solo si decides escribirnos por ese canal, conforme a sus propias condiciones.',
            ],
          },
          'También podremos comunicar datos a las autoridades cuando una ley lo exija.',
        ],
      },
      {
        h: 'Transferencias internacionales',
        body: [
          'Algunos de estos proveedores pueden tratar datos fuera del Espacio Económico Europeo. En ese caso, la transferencia se ampara en una decisión de adecuación de la Comisión Europea, como el Marco de Privacidad de Datos UE-EE. UU., o en cláusulas contractuales tipo aprobadas por la Comisión.',
        ],
      },
      {
        h: 'Tus derechos',
        body: [
          'Puedes ejercer en cualquier momento tus derechos de acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad escribiendo a {email} e indicando qué derecho quieres ejercer. Si consideras que no hemos atendido bien tu solicitud, puedes reclamar ante la Agencia Española de Protección de Datos ({ext:https://www.aepd.es|aepd.es}).',
        ],
      },
      {
        h: 'Seguridad',
        body: ['Aplicamos medidas técnicas y organizativas adecuadas para proteger tus datos. La web funciona siempre bajo conexión cifrada (HTTPS).'],
      },
      {
        h: 'Menores de edad',
        body: ['Esta web no está dirigida a menores de 14 años. Si no has cumplido esa edad, no nos envíes tus datos.'],
      },
      {
        h: 'El borrador del formulario, en tu navegador',
        body: [
          'Mientras rellenas el brief, se guarda un borrador en el almacenamiento local de tu navegador para que no pierdas lo escrito. Ese borrador no sale de tu dispositivo hasta que pulsas «Enviar brief», se borra al enviarlo y puedes eliminarlo cuando quieras con «Empezar de cero» o desde los ajustes del navegador. Tienes más detalle en la {doc:cookies|política de cookies}.',
        ],
      },
      {
        h: 'Cambios en esta política',
        body: ['Si cambia la forma en que tratamos tus datos, actualizaremos esta política en esta misma página. Última actualización: [PENDIENTE: fecha].'],
      },
    ],
  },

  cookies: {
    title: 'Política de cookies',
    description: 'NEO Studio no usa cookies de seguimiento ni publicitarias. Solo almacenamiento técnico necesario.',
    intro:
      'Esta web no usa cookies de seguimiento, publicitarias ni de terceros. Por eso no verás un banner de cookies: no instalamos nada que requiera tu consentimiento.',
    sections: [
      {
        h: 'Qué son las cookies',
        body: [
          'Las cookies y las tecnologías similares, como el almacenamiento local del navegador, son pequeños datos que una web guarda en tu dispositivo. El artículo 22.2 de la LSSI-CE exige pedir consentimiento para usarlas, salvo cuando son estrictamente necesarias para prestar un servicio que tú has solicitado.',
        ],
      },
      {
        h: 'Qué usamos',
        body: [
          'Solo almacenamiento técnico, necesario para funciones que tú mismo pides. No sirve para identificarte ni para seguirte:',
          {
            list: [
              'neo-intro (almacenamiento de sesión): recuerda que ya has visto la animación de entrada del logo para no repetirla. Se borra al cerrar la pestaña.',
              'neo-brief-draft (almacenamiento local): guarda el borrador del formulario de contacto mientras lo rellenas. Se borra al enviar el brief o al pulsar «Empezar de cero».',
              'neo-brief-last (almacenamiento de sesión): guarda el número de tu último brief y tu nombre para mostrarlos en la página de confirmación. Se borra al cerrar la pestaña.',
            ],
          },
        ],
      },
      // Analítica: la web no carga ninguna hoy. Si se activa una herramienta sin cookies, añadir aquí
      // la sección «Analítica sin cookies» con el nombre del proveedor (y en en.ts y la description).
      {
        h: 'Contenidos y enlaces de terceros',
        body: [
          'Los vídeos, las imágenes y las fuentes tipográficas se sirven desde nuestro propio dominio: no hay reproductores ni servicios de terceros incrustados que instalen cookies. Si sigues un enlace externo, como WhatsApp o las webs de nuestros clientes, se aplicarán las políticas de ese sitio.',
        ],
      },
      {
        h: 'Cómo gestionarlo',
        body: [
          'Puedes borrar o bloquear el almacenamiento de esta web desde la configuración de tu navegador (Chrome, Safari, Firefox o Edge). La web seguirá funcionando: solo perderás el borrador del formulario y la animación de entrada volverá a verse.',
        ],
      },
      {
        h: 'Cambios en esta política',
        body: ['Si en el futuro incorporamos cookies que requieran consentimiento, te lo pediremos antes de instalarlas y actualizaremos esta política. Tienes toda la información sobre el tratamiento de tus datos en la {doc:privacy|política de privacidad}.'],
      },
    ],
  },
}
