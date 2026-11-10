// A schema.org JSON-LD block, rendered on the server so it is in the page's initial HTML.
// "<" is escaped so text inside the data can never close the script tag.
export default function JsonLd({ data }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />
}
