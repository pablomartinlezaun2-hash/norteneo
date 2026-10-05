/**
 * Documentos legales (plantillas para España: LSSI-CE, RGPD y LOPDGDD).
 *
 * Marcado dentro de los textos:
 *  - [PENDIENTE: …] / [PENDING: …] → dato del titular que falta; se resalta en la página.
 *  - {email}                        → site.email (o un marcador pendiente si no existe).
 *  - {doc:privacy|texto}            → enlace a otro documento legal (privacy · notice · cookies).
 *  - {ext:https://…|texto}          → enlace externo (pestaña nueva).
 */
export type LegalBlock = string | { list: string[] }

export type LegalSection = { h: string; body: LegalBlock[] }

export type LegalDoc = {
  title: string
  /** Descripción para <meta> */
  description: string
  intro: string
  sections: LegalSection[]
}
