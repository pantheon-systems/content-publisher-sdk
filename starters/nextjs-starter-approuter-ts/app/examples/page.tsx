import Link from "next/link";
import Layout from "../../components/layout";
import PageHeader from "../../components/page-header";

export default function ExamplesPageTemplate() {
  return (
    <Layout>
      <section className="max-w-screen-3xl mx-auto px-4 pt-16 sm:w-4/5 md:w-3/4 lg:w-4/5 2xl:w-3/4">
        <PageHeader title="Examples" />
        <section className="prose lg:prose-xl my-10 flex flex-col">
          <p>
            <em>
              This page outlines a growing list of common use cases that can be
              used as a reference when building using this starter kit. If you
              don&apos;t need them for your site, feel free to delete the
              `app/examples` directory in your codebase.
            </em>
          </p>
          <ul>
            <li>
              <Link href="/examples/ssg-isr">SSG and ISR</Link> - by default,
              this starter kit is optimized for SSR and Edge Caching on
              Pantheon. This example is provided for cases where Next.js static
              generation options would be beneficial.
            </li>
            <li>
              <Link href="/examples/pagination">Pagination</Link> - by default,
              this starter kit uses infinite scrolling. This example is provided
              for cases where you want to show more traditional pagination
              controls.
            </li>
            <li tabIndex={-1} className="pointer-events-none opacity-30">
              <Link href="/examples/auth-api">API Authorization</Link> -
              confirms that Next.js is able to make authenticated requests to
              Pantheon Content Publisher&apos;s API.
            </li>
            <li tabIndex={-1} className="pointer-events-none opacity-30">
              <Link href="/examples/pagination">Pagination</Link> - a paginated
              list with a large dataset.
            </li>
          </ul>
        </section>
      </section>
    </Layout>
  );
}

export function generateMetadata() {
  return {
    title: "Examples",
    description: "Examples",
  };
}
